import React, { useState, useRef } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, Image, 
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Dimensions, Animated 
} from 'react-native';
import { useDispatch } from 'react-redux';
import { signIn } from '../../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);
    const [secureConfirm, setSecureConfirm] = useState(true);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const formFadeAnim = useRef(new Animated.Value(1)).current;

    const switchMode = (toLogin) => {
        if (isLoginMode === toLogin) return;
        Haptics.selectionAsync();

        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: toLogin ? 0 : 1,
                tension: 68,
                friction: 9,
                useNativeDriver: false,
            }),
            Animated.sequence([
                Animated.timing(formFadeAnim, {
                    toValue: 0.4,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(formFadeAnim, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        setIsLoginMode(toLogin);
    };

    const dispatch = useDispatch();
    const navigation = useNavigation();

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'primary',
        onConfirm: () => { }
    });

    const handleLogin = async () => {
        if (!email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters');
            return;
        }
        if (!isLoginMode && password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }
        if (!isLoginMode && !name) {
            Alert.alert('Missing Name', 'Please enter your full name');
            return;
        }

        setLoading(true);
        try {
            const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
            const payload = isLoginMode
                ? { email, password }
                : { email, password, name, role: 'customer' };

            const response = await api.post(endpoint, payload);
            const { token, id, name: userName, phoneNumber, role } = response.data;
            const userData = { id, name: userName, email, phoneNumber, role };

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            dispatch(signIn({ user: userData, token, setupPending: !isLoginMode }));
        } catch (error) {
            const msg = error.response?.data?.message || 'Something went wrong. Please check your credentials.';
            setAlertConfig({
                visible: true,
                title: isLoginMode ? 'Login Failed' : 'Account Error',
                message: msg,
                type: 'destructive',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Branding */}
                    <View style={styles.headerHero}>
                        <View style={styles.logoCircleWrapper}>
                            <Ionicons name="flash" size={30} color="#056f36" />
                        </View>
                        <Text style={styles.brandTitleText}>LARO</Text>
                        <View style={styles.speedBadge}>
                            <Ionicons name="sparkles" size={10} color="#056f36" />
                            <Text style={styles.speedBadgeText}>10-MIN CAMPUS EXPRESS</Text>
                        </View>
                    </View>

                    {/* Mode Segmented Selector with Smooth Spring Sliding Pill */}
                    <View style={styles.modeSegmentContainer}>
                        <Animated.View
                            style={[
                                styles.animatedModePill,
                                {
                                    left: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['1%', '50.5%'],
                                    }),
                                },
                            ]}
                        />
                        <TouchableOpacity
                            style={styles.modeTab}
                            onPress={() => switchMode(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.modeTabText, 
                                isLoginMode && styles.modeTabTextActive
                            ]}>Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modeTab}
                            onPress={() => switchMode(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.modeTabText, 
                                !isLoginMode && styles.modeTabTextActive
                            ]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Elevated Animated Form Card */}
                    <Animated.View 
                        style={[
                            styles.formCard,
                            {
                                opacity: formFadeAnim,
                                transform: [
                                    {
                                        translateY: formFadeAnim.interpolate({
                                            inputRange: [0.4, 1],
                                            outputRange: [8, 0],
                                        })
                                    }
                                ]
                            }
                        ]}
                    >
                        <Text style={styles.welcomeTitle}>
                            {isLoginMode ? 'Welcome Back 👋' : 'Create Account 🚀'}
                        </Text>
                        <Text style={styles.welcomeSubtitle}>
                            {isLoginMode 
                                ? 'Log in to continue to campus delivery.' 
                                : 'Sign up to get fast campus deliveries.'
                            }
                        </Text>

                        {!isLoginMode && (
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <View style={styles.inputFieldBox}>
                                    <Ionicons name="person-outline" size={18} color="#666" style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Alex Thompson"
                                        placeholderTextColor="#999"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>
                        )}

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputFieldBox}>
                                <Ionicons name="mail-outline" size={18} color="#666" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Email"
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <View style={styles.passwordHeaderRow}>
                                <Text style={styles.inputLabel}>Password</Text>
                                {isLoginMode && (
                                    <TouchableOpacity>
                                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.inputFieldBox}>
                                <Ionicons name="lock-closed-outline" size={18} color="#666" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="••••••••"
                                    placeholderTextColor="#999"
                                    secureTextEntry={secureText}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setSecureText(p => !p)}>
                                    <Ionicons 
                                        name={secureText ? "eye-outline" : "eye-off-outline"} 
                                        size={18} 
                                        color="#666" 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {!isLoginMode && (
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Confirm Password</Text>
                                <View style={styles.inputFieldBox}>
                                    <Ionicons name="shield-checkmark-outline" size={18} color="#666" style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="••••••••"
                                        placeholderTextColor="#999"
                                        secureTextEntry={secureConfirm}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                    <TouchableOpacity onPress={() => setSecureConfirm(p => !p)}>
                                        <Ionicons
                                            name={secureConfirm ? "eye-outline" : "eye-off-outline"}
                                            size={18}
                                            color="#666"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Login Button */}
                        <TouchableOpacity 
                            style={styles.loginBtn} 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                handleLogin();
                            }}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.loginBtnContent}>
                                    <Text style={styles.loginBtnText}>
                                        {isLoginMode ? 'Login' : 'Sign Up'}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        alignItems: 'center'
    },
    
    headerHero: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoCircleWrapper: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e6ede6',
        elevation: 3,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        marginBottom: 8,
    },
    brandTitleText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 1.5,
    },
    speedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e6ede6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 4,
    },
    speedBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.5,
    },

    modeSegmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#e6ede6',
        borderRadius: 16,
        padding: 4,
        width: '100%',
        marginBottom: 20,
        position: 'relative',
        height: 48,
    },
    animatedModePill: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        width: '48.5%',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    modeTab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        zIndex: 2,
    },
    modeTabActive: {},
    modeTabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
    },
    modeTabTextActive: {
        color: '#056f36',
        fontWeight: '900',
    },

    formCard: {
        width: '100%',
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#e6ede6',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#056f36',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    welcomeSubtitle: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        marginBottom: 20,
        lineHeight: 18,
    },

    formContainer: {
        width: '100%'
    },
    inputWrapper: {
        marginBottom: 16
    },
    passwordHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    forgotPasswordText: {
        fontSize: 11,
        fontWeight: '850',
        color: '#056f36'
    },
    inputFieldBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e6ede6',
        borderRadius: 14,
        height: 50,
        paddingHorizontal: 14
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#111'
    },

    loginBtn: {
        backgroundColor: '#056f36',
        borderRadius: 14,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    loginBtnContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800'
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e6ede6'
    },
    dividerText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#bbb',
        marginHorizontal: 12
    },

    googleBtn: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e6ede6',
        borderRadius: 14,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleBtnText: {
        color: '#056f36',
        fontSize: 14,
        fontWeight: '850'
    }
});
