import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, Image, 
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { useDispatch } from 'react-redux';
import { signIn } from '../../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);
    const [secureConfirm, setSecureConfirm] = useState(true);

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
            Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
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

            console.log(`[AUTH] Calling ${endpoint} for ${email}...`);
            const response = await api.post(endpoint, payload);

            const { token, id, name: userName, phoneNumber, role } = response.data;
            const userData = { id, name: userName, email, phoneNumber, role };

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            // Pass setupPending:true for new registrations so App.js routes to LinkWallet
            dispatch(signIn({ user: userData, token, setupPending: !isLoginMode }));

            console.log('[AUTH] Success! Logged in as:', userName);
            // SetupRedirectScreen handles routing:
            //   - New registrations (laro_setup_pending=true) → LinkWallet setup flow
            //   - Normal logins → Main
        } catch (error) {
            console.error('[AUTH ERROR]', error.response?.data || error.message);
            const msg = error.response?.data?.message || 'Something went wrong. Please check your credentials and try again.';
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

    const handleGoogleLogin = () => {
        Alert.alert('Service Unavailable', "Google Sign-In service isn't available right now. Sorry!");
    };

    const handleSkip = async () => {
        const guestData = { id: 'guest', name: 'Guest User', role: 'customer', email: 'guest@laro.app' };
        const guestToken = 'guest_session_token';

        await AsyncStorage.setItem('userToken', guestToken);
        await AsyncStorage.setItem('userData', JSON.stringify(guestData));

        dispatch(signIn({ user: guestData, token: guestToken }));
        console.log('[AUTH] Entering as Guest');
        // SetupRedirectScreen will route to Main for guest users
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
                    
                    {/* Zippit Mascot/Logo header icon */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBgSquare}>
                            <Image 
                                source={{ uri: 'https://img.icons8.com/color/96/lightning-bolt.png' }} 
                                style={styles.logoImage} 
                            />
                        </View>
                    </View>

                    {/* Titles */}
                    <Text style={styles.welcomeTitle}>
                        {isLoginMode ? 'Welcome Back' : 'Create Account'}
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                        {isLoginMode 
                            ? 'Log in to continue to campus delivery.' 
                            : 'Sign up to get fast campus deliveries.'
                        }
                    </Text>

                    {/* Form inputs */}
                    <View style={styles.formContainer}>
                        
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
                                    placeholder="student@university.edu"
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

                        {/* Login Primary Action Button */}
                        <TouchableOpacity 
                            style={styles.loginBtn} 
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.loginBtnContent}>
                                    <Text style={styles.loginBtnText}>
                                        {isLoginMode ? 'Login' : 'Sign Up'}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Divider OR */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign In Button */}
                        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
                            <Ionicons name="logo-google" size={16} color="#056f36" style={{ marginRight: 10 }} />
                            <Text style={styles.googleBtnText}>Sign in with your Google</Text>
                        </TouchableOpacity>

                        {/* Toggle login / signup */}
                        <TouchableOpacity 
                            style={styles.toggleTextContainer}
                            onPress={() => setIsLoginMode(p => !p)}
                        >
                            <Text style={styles.toggleNormalText}>
                                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                                <Text style={styles.toggleHighlightText}>
                                    {isLoginMode ? 'Sign Up' : 'Login'}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                    </View>

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
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 40,
        alignItems: 'center'
    },
    
    // Logo styling
    logoContainer: {
        marginBottom: 25,
        alignItems: 'center'
    },
    logoBgSquare: {
        width: 60,
        height: 60,
        backgroundColor: '#fff',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2
    },
    logoImage: {
        width: 32,
        height: 32,
        resizeMode: 'contain'
    },

    welcomeTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#056f36',
        textAlign: 'center',
        marginBottom: 8
    },
    welcomeSubtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        fontWeight: '650',
        marginBottom: 35
    },

    formContainer: {
        width: '100%'
    },
    inputWrapper: {
        marginBottom: 20
    },
    passwordHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#056f36',
        textTransform: 'uppercase',
        letterSpacing: 0.3
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
        borderRadius: 16,
        height: 52,
        paddingHorizontal: 16
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#111'
    },

    // Login Action button
    loginBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    loginBtnContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '850'
    },

    // OR Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25
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
        marginHorizontal: 15
    },

    // Google Login button
    googleBtn: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e6ede6',
        borderRadius: 16,
        height: 52,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25
    },
    googleBtnText: {
        color: '#056f36',
        fontSize: 14,
        fontWeight: '850'
    },

    // Toggle row
    toggleTextContainer: {
        alignItems: 'center',
        paddingVertical: 10
    },
    toggleNormalText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#555'
    },
    toggleHighlightText: {
        color: '#056f36',
        fontWeight: '900'
    }
});
