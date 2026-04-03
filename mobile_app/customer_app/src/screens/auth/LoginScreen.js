import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { signIn } from '../../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
    const { colors, isDarkMode } = useTheme();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
        // Validation
        if (!email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters');
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
                : { email, password, name, phoneNumber: phone };

            console.log(`[AUTH] Calling ${endpoint} for ${email}...`);
            const response = await api.post(endpoint, payload);

            const { token, id, name: userName, phoneNumber, role } = response.data;
            const userData = { id, name: userName, email, phoneNumber, role };

            // Success! Save session
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            // Check if user has addresses and phone
            const addressKey = `@user_addresses_${id}`;
            const storedAddresses = await AsyncStorage.getItem(addressKey);
            const addressCount = storedAddresses ? JSON.parse(storedAddresses).length : 0;
            const hasPhone = !!userData.phoneNumber;

            dispatch(signIn({ user: userData, token }));

            console.log('[AUTH] Success! Logged in as:', userName);

            setTimeout(() => {
                if (addressCount === 0) {
                    navigation.navigate('AddressBook', { isSetup: true });
                } else if (!hasPhone) {
                    navigation.navigate('LinkWallet', { isSetup: true });
                }
            }, 100);
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

    const handleSkip = async () => {
        const guestData = { id: 'guest', name: 'Guest User', role: 'customer', email: 'guest@laro.app' };
        const guestToken = 'guest_session_token';

        await AsyncStorage.setItem('userToken', guestToken);
        await AsyncStorage.setItem('userData', JSON.stringify(guestData));

        // Check if guest has addresses
        const addressKey = `@user_addresses_guest`;
        const storedAddresses = await AsyncStorage.getItem(addressKey);
        const addressCount = storedAddresses ? JSON.parse(storedAddresses).length : 0;

        dispatch(signIn({ user: guestData, token: guestToken }));
        console.log('[AUTH] Entering as Guest');

        setTimeout(() => {
            if (addressCount === 0) {
                navigation.navigate('AddressBook', { isSetup: true });
            } else {
                // Guests usually don't link wallets immediately, but we can offer it 
                // However, for guest, we usually just go to Home if address exists
            }
        }, 100);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
                {/* Hero section */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000' }}
                        style={styles.heroImage}
                    />
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Card */}
                <View style={[styles.bottomCard, { backgroundColor: colors.white }]}>
                    <Text style={[styles.title, { color: colors.black }]}>
                        {isLoginMode ? 'Welcome Back to Laro' : 'Create Your Account'}
                    </Text>

                    <View style={styles.formContainer}>
                        {!isLoginMode && (
                            <View style={styles.inputWrapper}>
                                <Text style={[styles.inputLabel, { color: colors.gray }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.black }]}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.gray + '80'}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        )}

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Email Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.black }]}
                                placeholder="name@example.com"
                                placeholderTextColor={colors.gray + '80'}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        {!isLoginMode && (
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="10-digit number"
                                    placeholderTextColor="#999"
                                    keyboardType="number-pad"
                                    maxLength={10}
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                        )}

                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Password</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.black }]}
                                placeholder="Minimum 6 characters"
                                placeholderTextColor={colors.gray + '80'}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {isLoginMode ? 'Sign In' : 'Create Account'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toggleContainer}
                            onPress={() => setIsLoginMode(!isLoginMode)}
                        >
                            <Text style={[styles.toggleText, { color: colors.gray }]}>
                                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                                <Text style={styles.toggleHighlight}>
                                    {isLoginMode ? 'Sign Up' : 'Log In'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.termsText}>
                        By continuing, you agree to our <Text style={styles.termsLink}>Terms</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                </View>
            </ScrollView>

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    scroll: { flexGrow: 1, backgroundColor: COLORS.black },

    heroContainer: { height: 350, width: '100%', position: 'relative' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.9 },
    skipButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    skipText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

    bottomCard: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, paddingHorizontal: 25, paddingTop: 35, paddingBottom: 40 },

    title: { fontSize: 24, fontWeight: '900', color: '#1c1c1c', textAlign: 'left', marginBottom: 25, width: '100%' },

    formContainer: { width: '100%' },
    inputWrapper: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { borderWidth: 1.5, borderColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 16, height: 54, fontSize: 16, color: '#1c1c1c', fontWeight: '500', backgroundColor: '#fafafa' },

    primaryButton: { backgroundColor: COLORS.primary, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 20, width: '100%', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    toggleContainer: { alignItems: 'center', paddingVertical: 10 },
    toggleText: { fontSize: 14, color: '#666' },
    toggleHighlight: { color: COLORS.primary, fontWeight: 'bold' },

    termsText: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 18, marginTop: 25, paddingHorizontal: 10 },
    termsLink: { color: COLORS.primary, fontWeight: '600' }
});

