import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Image, Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateCredentials } from '../../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { COLORS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LinkWalletScreen({ navigation, route }) {
    const isSetup = route?.params?.isSetup || false;
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const { user, token } = useSelector(state => state.auth);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'primary',
        onConfirm: () => { }
    });

    const handleLinkWallet = async () => {
        if (phone.length < 10) return;
        setLoading(true);
        try {
            const response = await api.post('/auth/link-phone', {
                phoneNumber: phone
            });

            const updatedUser = response.data.user;

            // Update AsyncStorage
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

            // Update Redux - assuming authSlice has an update handler
            dispatch(updateCredentials({ user: updatedUser }));

            setAlertConfig({
                visible: true,
                title: 'Wallet Created!',
                message: 'Your Laro Wallet is now active. You can start sending and receiving coins.',
                type: 'success',
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    if (isSetup) {
                        navigation.navigate('Main');
                    }
                }
            });

        } catch (error) {
            console.error('[LINK WALLET ERROR]', error.response?.data || error.message);
            setAlertConfig({
                visible: true,
                title: 'Link Failed',
                message: error.response?.data?.message || 'Could not link your phone number. It might be used by another account.',
                type: 'destructive',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} bounces={false}>

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="wallet-plus" size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>Activate Your Laro Wallet</Text>
                    <Text style={styles.subtitle}>
                        Link your mobile number to send and receive Laro Coins instantly.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <View style={styles.prefixBox}>
                            <Text style={styles.prefixText}>+91</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Mobile Number"
                            placeholderTextColor="#999"
                            keyboardType="number-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={setPhone}
                            autoFocus
                        />
                    </View>

                    <Text style={styles.infoText}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#666" /> This number will be used for your secure transactions.
                    </Text>

                    <TouchableOpacity
                        style={[styles.primaryButton, phone.length === 10 && styles.primaryButtonActive]}
                        onPress={handleLinkWallet}
                        disabled={phone.length < 10 || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Create Wallet</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipLink}
                        onPress={() => navigation.navigate(isSetup ? 'Main' : 'Home')}
                    >
                        <Text style={styles.skipLinkText}>{isSetup ? 'Step over for now' : 'Maybe Later'}</Text>
                    </TouchableOpacity>
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
    scroll: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 60, alignItems: 'center' },

    header: { alignItems: 'center', marginBottom: 40 },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.secondary,
        marginBottom: 24
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1c1c1c',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20
    },

    form: { width: '100%' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 64,
        marginBottom: 12,
        backgroundColor: '#fcfcfc'
    },
    prefixBox: {
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: '#eee',
        marginRight: 16
    },
    prefixText: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1c' },
    input: { flex: 1, fontSize: 18, color: '#1c1c1c', fontWeight: '600' },

    infoText: {
        fontSize: 13,
        color: '#888',
        marginBottom: 35,
        textAlign: 'center'
    },

    primaryButton: {
        backgroundColor: '#e0e0e0',
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    primaryButtonActive: { backgroundColor: COLORS.primary },
    primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    skipLink: { padding: 15, alignItems: 'center' },
    skipLinkText: { color: '#888', fontSize: 14, fontWeight: '600' }
});
