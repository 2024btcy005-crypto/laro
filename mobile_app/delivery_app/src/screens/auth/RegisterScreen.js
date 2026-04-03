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

export default function RegisterScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !phoneNumber || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                phoneNumber,
                password,
                role: 'delivery' // Explicitly set role for partner app
            });

            await AsyncStorage.setItem('deliveryToken', response.data.token);
            await AsyncStorage.setItem('deliveryPartner', JSON.stringify(response.data));

            // Navigate to Setup screen instead of Home
            navigation.replace('PartnerSetup');
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            if (message.includes('already exists') || message.includes('already in use')) {
                Alert.alert(
                    'Account Exists',
                    'You already have an account with Laro. Please log in with your existing details to become a partner.',
                    [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                Alert.alert('Error', message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Join as Partner</Text>
                    <Text style={styles.subtitle}>Start your journey with Laro</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="phone-portrait-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.registerButtonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.loginLink}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLinkText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { flexGrow: 1, padding: 30 },
    backButton: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
        marginBottom: 30, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
    },
    header: { marginBottom: 40 },
    title: { fontSize: 32, fontWeight: '900', color: COLORS.black, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: COLORS.gray, marginTop: 8, fontWeight: '600' },
    form: { width: '100%' },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.white, borderRadius: 18,
        paddingHorizontal: 18, marginBottom: 20, height: 60,
        borderWidth: 1, borderColor: COLORS.lightGray,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: COLORS.black, fontWeight: '600' },
    registerButton: {
        backgroundColor: COLORS.primary, height: 65, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', marginTop: 15,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3, shadowRadius: 15, elevation: 12
    },
    registerButtonText: { color: COLORS.white, fontSize: 19, fontWeight: '900', letterSpacing: 0.8 },
    loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
    loginText: { color: COLORS.gray, fontWeight: '600' },
    loginLinkText: { color: COLORS.primary, fontWeight: '800' }
});
