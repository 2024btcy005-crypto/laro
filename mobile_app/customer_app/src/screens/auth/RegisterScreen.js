import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { signIn } from '../../store/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useRoute } from '@react-navigation/native';
import { ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';

export default function RegisterScreen({ navigation }) {
    const route = useRoute();
    const { phoneNumber: initialPhone } = route.params || {};

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'primary',
        onConfirm: () => { }
    });

    const handleRegister = async () => {
        if (!name || !email) return;
        setLoading(true);
        try {
            const response = await api.post('/auth/register', {
                phoneNumber: initialPhone,
                name,
                email, // Optional in our DB schema maybe, but we'll send it
                role: 'customer'
            });

            const { token, id, name: userName, phoneNumber, role } = response.data;
            const userData = { id, name: userName, phoneNumber, role };

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            dispatch(signIn({ user: userData, token }));
        } catch (error) {
            console.error('[REGISTER ERROR]', error.response?.data || error.message);
            setAlertConfig({
                visible: true,
                title: 'Registration Failed',
                message: error.response?.data?.message || 'We could not create your account. Please check your details and try again.',
                type: 'destructive',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={{ fontSize: 24, padding: 10 }}>←</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Sign up</Text>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, (name && email) && styles.primaryButtonActive]}
                            onPress={handleRegister}
                            disabled={!name || !email || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.orContainer}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>or</Text>
                            <View style={styles.line} />
                        </View>

                        <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#DB4437' }]}>
                            <Text style={[styles.socialButtonText, { color: '#fff' }]}>G</Text>
                            <Text style={[styles.socialButtonText, { color: '#fff', marginLeft: 10 }]}>Sign up with Google</Text>
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
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: { flexGrow: 1, padding: 20 },
    backButton: { marginLeft: -10, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 30 },
    form: { flex: 1 },
    inputWrapper: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, marginBottom: 15, backgroundColor: '#fafafa' },
    input: { height: 55, paddingHorizontal: 15, fontSize: 16, color: '#333' },
    primaryButton: { backgroundColor: '#e0e0e0', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 25 },
    primaryButtonActive: { backgroundColor: COLORS.primary },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    orContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    line: { flex: 1, height: 1, backgroundColor: '#eee' },
    orText: { marginHorizontal: 10, color: '#999', fontSize: 13 },
    socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd', height: 55, borderRadius: 12 },
    socialIcon: { width: 22, height: 22, marginRight: 12 },
    socialButtonText: { fontSize: 16, color: '#333', fontWeight: '500' },
});
