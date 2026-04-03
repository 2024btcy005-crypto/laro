import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            if (response.data.role !== 'delivery') {
                if (response.data.role === 'customer') {
                    Alert.alert(
                        'Existing Account',
                        'You have a Laro customer account. Would you like to use this account to become a Delivery Partner?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Join as Partner',
                                onPress: async () => {
                                    setLoading(true);
                                    try {
                                        // Use the register endpoint to upgrade since it now handles role switching
                                        const upgradeRes = await api.post('/auth/register', {
                                            email: response.data.email,
                                            password: password,
                                            name: response.data.name,
                                            role: 'delivery'
                                        });

                                        await AsyncStorage.setItem('deliveryToken', upgradeRes.data.token);
                                        await AsyncStorage.setItem('deliveryPartner', JSON.stringify(upgradeRes.data));
                                        navigation.replace('PartnerSetup');
                                    } catch (err) {
                                        Alert.alert('Error', 'Failed to upgrade account. Please try registering as a new partner.');
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    Alert.alert('Access Denied', 'This app is only for delivery partners.');
                }
                setLoading(false);
                return;
            }

            await AsyncStorage.setItem('deliveryToken', response.data.token);

            const partnerProfile = response.data.user || response.data;
            await AsyncStorage.setItem('deliveryPartner', JSON.stringify(partnerProfile));

            if (!partnerProfile.universityId) {
                navigation.replace('PartnerSetup');
            } else {
                navigation.replace('Main');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            Alert.alert('Login Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}>
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.white, borderColor: colors.lightGray }]}>
                        <Ionicons name="bicycle" size={60} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.black }]}>Laro Partner</Text>
                    <Text style={[styles.subtitle, { color: colors.gray }]}>Deliver more, earn more</Text>
                </View>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.white, borderColor: colors.lightGray }]}>
                        <Ionicons name="mail-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.black }]}
                            placeholder="Email Address"
                            placeholderTextColor={colors.gray + '80'}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.white, borderColor: colors.lightGray }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.black }]}
                            placeholder="Password"
                            placeholderTextColor={colors.gray + '80'}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <View style={styles.registerLink}>
                        <Text style={[styles.registerText, { color: colors.gray }]}>New to Laro? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={[styles.registerLinkText, { color: colors.primary }]}>Join as Partner</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { flexGrow: 1, padding: 30, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 55 },
    logoContainer: {
        width: 110, height: 110, borderRadius: 36,
        backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
        marginBottom: 24, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 12,
        borderWidth: 2, borderColor: COLORS.lightGray
    },
    title: { fontSize: 34, fontWeight: '900', color: COLORS.black, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: COLORS.gray, marginTop: 8, fontWeight: '600' },
    form: { width: '100%' },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.white, borderRadius: 18,
        paddingHorizontal: 18, marginBottom: 20, height: 60,
        borderWidth: 1, borderColor: COLORS.lightGray,
        shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: COLORS.black, fontWeight: '600' },
    loginButton: {
        backgroundColor: COLORS.primary, height: 65, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', marginTop: 15,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3, shadowRadius: 15, elevation: 12
    },
    loginButtonText: { color: COLORS.white, fontSize: 19, fontWeight: '900', letterSpacing: 0.8 },
    forgotPassword: { alignItems: 'center', marginTop: 25 },
    forgotPasswordText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
    registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 35 },
    registerText: { color: COLORS.gray, fontWeight: '600' },
    registerLinkText: { color: COLORS.primary, fontWeight: '800' }
});
