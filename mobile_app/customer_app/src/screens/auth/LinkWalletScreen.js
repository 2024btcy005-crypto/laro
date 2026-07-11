import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Dimensions, StatusBar
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
    const { user } = useSelector(state => state.auth);

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

            // Update Redux state
            dispatch(updateCredentials({ user: updatedUser }));

            setAlertConfig({
                visible: true,
                title: 'Wallet Created!',
                message: 'Your Laro Wallet is now active. You can start sending and receiving coins.',
                type: 'success',
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    if (isSetup) {
                        navigation.replace('UniversitySelection', { isSetup: true });
                    } else {
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
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />
            <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
                
                {/* Step indicator during setup */}
                {isSetup && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: '#e6ede6', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#056f36', fontWeight: '800' }}>Step 1 of 3 — Link Wallet</Text>
                    </View>
                )}

                {/* Center Top Illustration Area */}
                <View style={styles.illustrationWrapper}>
                    {/* Floating Secure Tag */}
                    <View style={styles.secureTag}>
                        <Ionicons name="flash" size={12} color="#ff6633" />
                        <Text style={styles.secureTagText}>Secure</Text>
                    </View>

                    {/* Dotted Green Tag */}
                    <View style={styles.instantTag}>
                        <Ionicons name="leaf" size={12} color="#056f36" />
                        <Text style={styles.instantTagText}>Instant</Text>
                    </View>

                    {/* White Rounded Square Box */}
                    <View style={styles.whiteWalletIconBox}>
                        <MaterialCommunityIcons name="wallet" size={54} color="#056f36" />
                        <View style={styles.plusOverlayCircle}>
                            <Ionicons name="add" size={16} color="#fff" />
                        </View>
                    </View>
                </View>

                {/* Text Labels Section */}
                <Text style={styles.titleText}>Link Your Laro Wallet</Text>
                <Text style={styles.descText}>
                    Connect your student credential to enable one-tap campus payments and exclusive student rewards.
                </Text>

                {/* Card input panel */}
                <View style={styles.cardInputPanel}>
                    <Text style={styles.mobileNumberLabel}>Mobile Number</Text>
                    
                    <View style={styles.inputsRow}>
                        {/* Dropdown element */}
                        <View style={styles.dropdownInput}>
                            <Text style={styles.dropdownText}>IN +91</Text>
                            <Ionicons name="chevron-down" size={14} color="#555" style={{ marginLeft: 4 }} />
                        </View>

                        {/* Phone Input element */}
                        <View style={styles.textInputBox}>
                            <Ionicons name="call-outline" size={18} color="#666" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.phoneTextInput}
                                placeholder="(555) 000-0000"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>
                    </View>

                    {/* Link Wallet Action Button */}
                    <TouchableOpacity
                        style={[styles.linkWalletBtn, phone.length === 10 && styles.linkWalletBtnActive, loading && { opacity: 0.7 }]}
                        onPress={handleLinkWallet}
                        disabled={phone.length < 10 || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <View style={styles.btnRow}>
                                <Ionicons name="link-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.linkWalletBtnText}>Link Wallet</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Bottom Skip Link */}
                <TouchableOpacity
                    style={styles.skipBtn}
                    onPress={() => {
                        if (isSetup) {
                            navigation.replace('UniversitySelection', { isSetup: true });
                        } else {
                            navigation.navigate('Main');
                        }
                    }}
                >
                    <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>

                {/* Footer details */}
                <View style={styles.footerDetails}>
                    <Ionicons name="shield-checkmark" size={14} color="#27c96c" style={{ marginRight: 4 }} />
                    <Text style={styles.footerDetailsText}>Secured by Campus Network</Text>
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
    container: { flex: 1, backgroundColor: '#f2f7f2' }, // Soft green-beige background matching wallet theme
    scroll: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 50, alignItems: 'center', justifyContent: 'center' },

    // Illustration styles
    illustrationWrapper: {
        width: 220,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 20
    },
    whiteWalletIconBox: {
        width: 140,
        height: 140,
        borderRadius: 36,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3
    },
    plusOverlayCircle: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#27c96c',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    secureTag: {
        position: 'absolute',
        top: 15,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebe3', // Light orange
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4
    },
    secureTagText: { color: '#ff6633', fontSize: 11, fontWeight: '850' },
    instantTag: {
        position: 'absolute',
        bottom: 25,
        left: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6ede6', // Light green
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4
    },
    instantTagText: { color: '#056f36', fontSize: 11, fontWeight: '850' },

    // Titles
    titleText: { fontSize: 22, fontWeight: '950', color: '#111', textAlign: 'center', marginBottom: 10 },
    descText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, paddingHorizontal: 15, marginBottom: 25 },

    // Card Input Styles
    cardInputPanel: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 20
    },
    mobileNumberLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#666',
        marginBottom: 10,
        letterSpacing: 0.5
    },
    inputsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20
    },
    dropdownInput: {
        backgroundColor: '#f2f7f2',
        borderRadius: 14,
        width: 85,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e6ede6'
    },
    dropdownText: { fontSize: 14, fontWeight: '800', color: '#111' },
    textInputBox: {
        flex: 1,
        backgroundColor: '#f2f7f2',
        borderRadius: 14,
        height: 50,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e6ede6'
    },
    phoneTextInput: { flex: 1, fontSize: 14, color: '#111', fontWeight: '800' },

    linkWalletBtn: {
        backgroundColor: '#ccd6cc', // Inactive light green
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    linkWalletBtnActive: { backgroundColor: '#056f36' },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    linkWalletBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    // Bottom action link
    skipBtn: { padding: 12, alignItems: 'center', marginBottom: 25 },
    skipBtnText: { fontSize: 14, fontWeight: '800', color: '#056f36' },

    // Footer details
    footerDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
        marginBottom: 20
    },
    footerDetailsText: { fontSize: 12, color: '#666', fontWeight: '600' }
});
