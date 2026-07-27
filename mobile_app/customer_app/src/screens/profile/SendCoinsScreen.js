import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Animated, Dimensions, Modal, StatusBar, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { walletAPI } from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import Confetti from '../../components/Confetti';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import LaroScannerOverlay from '../../components/LaroScannerOverlay';

const { width } = Dimensions.get('window');

// ─── Success Screen ───────────────────────────────────────────────
function SuccessScreen({ successState, recipientInitial, onBack }) {
    const pulse1 = useRef(new Animated.Value(1)).current;
    const pulse2 = useRef(new Animated.Value(1)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();

        const createPulse = (anim, delay) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: true }),
                ])
            ).start();

        createPulse(pulse1, 0);
        createPulse(pulse2, 450);
    }, []);

    return (
        <View style={ss.root}>
            <Confetti />
            <View style={ss.bgCircle1} />
            <View style={ss.bgCircle2} />

            <Animated.View style={[ss.content, { opacity: fadeIn }]}>
                <View style={ss.iconWrapper}>
                    <Animated.View style={[ss.pulseRing, ss.pulseRing1, { transform: [{ scale: pulse1 }] }]} />
                    <Animated.View style={[ss.pulseRing, ss.pulseRing2, { transform: [{ scale: pulse2 }] }]} />
                    <View style={ss.coinCircle}>
                        <Text style={ss.coinSymbol}>Ł</Text>
                    </View>
                </View>

                <Text style={ss.heading}>Transfer Successful!</Text>
                <Text style={ss.amountLabel}>{successState.amount} Laro Coins</Text>

                <View style={ss.recipientRow}>
                    <View style={ss.recipientBubble}>
                        <Text style={ss.recipientInitial}>{recipientInitial}</Text>
                    </View>
                    <View>
                        <Text style={ss.recipientTo}>Transferred to</Text>
                        <Text style={ss.recipientName}>{successState.name}</Text>
                    </View>
                </View>

                <Text style={ss.note}>Coins credited instantly ✦</Text>
            </Animated.View>

            <View style={ss.bottomBar}>
                <TouchableOpacity style={ss.backBtn} onPress={onBack} activeOpacity={0.85}>
                    <Ionicons name="arrow-back" size={18} color="#006d33" />
                    <Text style={ss.backBtnText}>Done & Return to Wallet</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const ss = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#006d33', justifyContent: 'center' },
    bgCircle1: {
        position: 'absolute', width: 400, height: 400, borderRadius: 200,
        backgroundColor: 'rgba(255,255,255,0.05)', top: -120, right: -120
    },
    bgCircle2: {
        position: 'absolute', width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.05)', bottom: 80, left: -100
    },
    content: { alignItems: 'center', paddingHorizontal: 30 },
    iconWrapper: { position: 'relative', width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    pulseRing: { position: 'absolute', borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
    pulseRing1: { width: 100, height: 100 },
    pulseRing2: { width: 100, height: 100 },
    coinCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    coinSymbol: { fontSize: 40, fontWeight: '900', color: '#006d33' },
    heading: { fontSize: 26, fontWeight: '900', color: '#ffffff', marginBottom: 6 },
    amountLabel: { fontSize: 32, fontWeight: '900', color: '#43d174', marginBottom: 24 },
    recipientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, width: '100%', gap: 14, marginBottom: 16 },
    recipientBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
    recipientInitial: { fontSize: 20, fontWeight: '900', color: '#006d33' },
    recipientTo: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    recipientName: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
    note: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 8 },
    bottomBar: { position: 'absolute', bottom: 40, left: 20, right: 20 },
    backBtn: { backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 3 },
    backBtnText: { fontSize: 15, fontWeight: '800', color: '#006d33' }
});

export default function SendCoinsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const user = useSelector(state => state.auth.user);
    const [balance, setBalance] = useState(user?.laroCurrency || 0);

    const [phone, setPhone] = useState('');
    const [recipient, setRecipient] = useState(null);
    const [findLoading, setFindLoading] = useState(false);
    const [findError, setFindError] = useState('');

    const [amount, setAmount] = useState('');
    const [sending, setSending] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [successState, setSuccessState] = useState(null);

    const [recentRecipients, setRecentRecipients] = useState([]);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [scannerVisible, setScannerVisible] = useState(false);
    const [torch, setTorch] = useState(false);
    const scanned = useRef(false);

    const playSuccessSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' },
                { shouldPlay: true }
            );
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                    await sound.unloadAsync();
                }
            });
        } catch (error) {
            console.log('Audio playback error:', error);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const balRes = await walletAPI.getBalance();
                if (balRes.data) {
                    const fetchedBal = balRes.data.balance ?? balRes.data.laroCurrency ?? balRes.data.user?.laroCurrency;
                    if (fetchedBal !== undefined) {
                        setBalance(fetchedBal);
                    }
                }

                const res = await walletAPI.getRecentRecipients();
                if (res.data) {
                    setRecentRecipients(res.data);
                }
            } catch (err) {
                console.error('[SendCoins] Failed to load data:', err.message);
            }
        };
        loadInitialData();
    }, []);

    const handleBarcodeScanned = (scanningResult) => {
        if (scanned.current || !scanningResult.data) return;
        scanned.current = true;

        try {
            const { data } = scanningResult;
            const scannedPhone = String(data).replace(/[^0-9]/g, '').slice(-10);

            if (scannedPhone.length === 10) {
                setScannerVisible(false);
                setPhone(scannedPhone);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                scanned.current = false;
            }
        } catch (error) {
            console.error('[QR] Scan error:', error);
            scanned.current = false;
        }
    };

    const openScanner = async () => {
        if (!cameraPermission?.granted) {
            const result = await requestCameraPermission();
            if (!result.granted) {
                setFindError('Camera permission is required to scan QR codes');
                return;
            }
        }
        scanned.current = false;
        setScannerVisible(true);
    };

    useEffect(() => {
        if (phone.trim().length !== 10) {
            setRecipient(null);
            setFindError('');
            return;
        }
        const timer = setTimeout(() => {
            handleFindUser();
        }, 500);
        return () => clearTimeout(timer);
    }, [phone]);

    const handleFindUser = async () => {
        if (phone.trim().length < 10) {
            setFindError('Enter a valid 10-digit phone number');
            return;
        }
        setFindLoading(true);
        setFindError('');
        setRecipient(null);
        try {
            const res = await walletAPI.findUser(phone.trim());
            setRecipient(res.data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            setFindError('User not found in system');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setFindLoading(false);
        }
    };

    const handleSend = async () => {
        setAlertVisible(false);
        setSending(true);
        try {
            const res = await walletAPI.transfer({ recipientPhone: phone.trim(), amount: parseInt(amount) });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await playSuccessSound();
            await new Promise(r => setTimeout(r, 300));
            setSuccessState({ name: recipient.name, amount: parseInt(amount), newBalance: res.data.newBalance });
        } catch (err) {
            setFindError(err.response?.data?.message || 'Transfer failed. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setSending(false);
        }
    };

    const amountNum = parseInt(amount) || 0;
    const canSend = recipient && amountNum >= 1 && amountNum <= balance;

    if (successState) {
        return (
            <SuccessScreen
                successState={successState}
                recipientInitial={successState.name.charAt(0).toUpperCase()}
                onBack={() => navigation.goBack()}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => {
                    if (recipient) {
                        setRecipient(null);
                        setAmount('');
                    } else {
                        navigation.goBack();
                    }
                }}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {recipient ? 'Transfer Laro Coins' : 'Send Coins'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* QR Scanner Modal */}
            <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.scannerRoot}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={handleBarcodeScanned}
                        enableTorch={torch}
                    />
                    <LaroScannerOverlay
                        onScannerClose={() => setScannerVisible(false)}
                        isTorchOn={torch}
                        onTorchToggle={() => setTorch(prev => !prev)}
                        recentRecipients={recentRecipients}
                        currentBalance={balance}
                        userPhone={user?.phoneNumber}
                        onRecipientPress={(item) => {
                            setPhone(item.phoneNumber);
                            setScannerVisible(false);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }}
                    />
                </View>
            </Modal>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                {recipient ? (
                    /* ─── GOOGLE PAY STYLE DEDICATED PAYMENT SCREEN ─── */
                    <View style={styles.paymentScreenContainer}>
                        {/* Centered Recipient Avatar & Name */}
                        <View style={styles.payRecipientHeader}>
                            {recipient.avatarUrl || recipient.avatar ? (
                                <Image source={{ uri: recipient.avatarUrl || recipient.avatar }} style={styles.payAvatar} />
                            ) : (
                                <View style={styles.payAvatarPlaceholder}>
                                    <Text style={styles.payAvatarInitial}>{recipient.name ? recipient.name.charAt(0).toUpperCase() : '?'}</Text>
                                </View>
                            )}
                            <Text style={styles.payPayingToLabel}>PAYING TO</Text>
                            <Text style={styles.payRecipientName}>{recipient.name}</Text>
                            <Text style={styles.payRecipientPhone}>+91 {phone}</Text>
                        </View>

                        {/* Hero Money Entry Stage */}
                        <View style={styles.payAmountStage}>
                            <View style={styles.payInputRow}>
                                <Text style={styles.payCurrencySymbol}>Ł</Text>
                                <TextInput
                                    style={styles.payAmountInput}
                                    placeholder="0"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={t => setAmount(t.replace(/[^0-9]/g, ''))}
                                    autoFocus={true}
                                />
                            </View>
                            <Text style={styles.payBalanceSubtext}>
                                Available Balance: <Text style={{ fontWeight: '800', color: '#006d33' }}>{balance} Ł</Text>
                            </Text>
                        </View>

                        {/* Quick Preset Amount Pills */}
                        <View style={styles.payPresetRow}>
                            {[50, 100, 200, 500].map(val => (
                                <TouchableOpacity
                                    key={val}
                                    style={styles.payPresetPill}
                                    onPress={() => {
                                        setAmount(String(val));
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <Text style={styles.payPresetText}>+{val}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.payPresetPill, { backgroundColor: '#e6f7ed', borderColor: '#006d33' }]}
                                onPress={() => {
                                    setAmount(String(balance));
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Text style={[styles.payPresetText, { color: '#006d33' }]}>MAX ({balance})</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Floating Action Pay Button */}
                        <View style={[styles.payBottomCtaContainer, { paddingBottom: insets.bottom + 16 }]}>
                            <TouchableOpacity
                                style={[styles.payCtaBtn, { backgroundColor: canSend ? '#006d33' : '#cbd5e1' }]}
                                disabled={!canSend || sending}
                                onPress={() => setAlertVisible(true)}
                            >
                                {sending ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.payCtaBtnText}>
                                        {canSend ? `Pay ${amountNum} Laro Coins ➔` : 'Enter Valid Amount'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    /* ─── INITIAL SEARCH & RECENT CONTACTS SCREEN ─── */
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {/* Balance Card */}
                        <View style={styles.balanceBigCard}>
                            <View style={styles.balanceCardTopRow}>
                                <Ionicons name="wallet-outline" size={18} color="rgba(255, 255, 255, 0.9)" style={{ marginRight: 6 }} />
                                <Text style={styles.balanceCardLabelText}>AVAILABLE LARO BALANCE</Text>
                            </View>
                            <Text style={styles.balanceCardAmtText}>{balance} Ł</Text>
                            <Text style={styles.balanceCardFooterText}>Use these coins to pay instantly for any food or Xerox order!</Text>
                        </View>

                        {/* Search Field */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="call-outline" size={20} color="#94a3b8" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Enter 10-digit phone number"
                                placeholderTextColor="#94a3b8"
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={phone}
                                onChangeText={t => setPhone(t.replace(/[^0-9]/g, ''))}
                            />
                            {findLoading && <ActivityIndicator size="small" color="#006d33" />}
                        </View>

                        {/* Scan QR Button */}
                        <TouchableOpacity style={styles.scanCtaBtn} onPress={openScanner}>
                            <Ionicons name="qr-code-outline" size={20} color="#006d33" style={{ marginRight: 8 }} />
                            <Text style={styles.scanCtaText}>Scan QR Code to Pay</Text>
                        </TouchableOpacity>

                        {/* Recent Contacts List */}
                        {recentRecipients.length > 0 && (
                            <View sx={{ mt: 2 }}>
                                <Text style={styles.sectionTitle}>Recent Transfers</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                                    {recentRecipients.map((item) => (
                                        <TouchableOpacity
                                            key={item.id || item._id}
                                            style={styles.recentItem}
                                            onPress={() => setPhone(item.phoneNumber)}
                                        >
                                            <View style={styles.recentAvatarCircle}>
                                                {item.avatarUrl || item.avatar ? (
                                                    <Image source={{ uri: item.avatarUrl || item.avatar }} style={styles.recentAvatarImg} />
                                                ) : (
                                                    <View style={styles.recentAvatarFallback}>
                                                        <Text style={styles.recentAvatarFallbackText}>
                                                            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.recentNameText} numberOfLines={1}>{item.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {findError ? (
                            <View style={styles.errorCard}>
                                <Ionicons name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                                <Text style={styles.errorText}>{findError}</Text>
                            </View>
                        ) : null}
                    </ScrollView>
                )}
            </KeyboardAvoidingView>

            <LaroAlert
                visible={alertVisible}
                title="Confirm Payment"
                message={`Transfer ${amountNum} Laro Coins to ${recipient?.name}?`}
                type="default"
                confirmText="Confirm & Pay"
                onConfirm={handleSend}
                onCancel={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justify: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    scrollContent: { padding: 20 },

    // Balance Card
    balanceBigCard: {
        backgroundColor: '#006d33',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#006d33',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3
    },
    balanceCardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    balanceCardLabelText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.8 },
    balanceCardAmtText: { fontSize: 32, fontWeight: '900', color: '#ffffff', marginBottom: 4 },
    balanceCardFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

    // Search Field
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 54,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16
    },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },

    // Scan QR Button
    scanCtaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        height: 52,
        borderWidth: 1.5,
        borderColor: '#006d33',
        marginBottom: 24
    },
    scanCtaText: { fontSize: 15, fontWeight: '800', color: '#006d33' },

    // Recent Section
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
    recentScroll: { paddingBottom: 10 },
    recentItem: { alignItems: 'center', marginRight: 18, width: 64 },
    recentAvatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e6f7ed', padding: 2, borderWidth: 1.5, borderColor: '#38c567' },
    recentAvatarImg: { width: '100%', height: '100%', borderRadius: 26 },
    recentAvatarFallback: { width: '100%', height: '100%', borderRadius: 26, backgroundColor: '#e6f7ed', justifyContent: 'center', alignItems: 'center' },
    recentAvatarFallbackText: { fontSize: 18, fontWeight: '900', color: '#006d33' },
    recentNameText: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 6, textAlign: 'center' },

    // Error Card
    errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 12, padding: 12, marginTop: 10 },
    errorText: { fontSize: 13, color: '#ef4444', fontWeight: '700' },

    // ─── DEDICATED GOOGLE PAY STYLE PAYMENT SCREEN ───
    paymentScreenContainer: { flex: 1, padding: 24, justifyContent: 'space-between' },
    payRecipientHeader: { alignItems: 'center', marginTop: 10 },
    payAvatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
    payAvatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e6f7ed', borderWidth: 2, borderColor: '#38c567', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    payAvatarInitial: { fontSize: 30, fontWeight: '900', color: '#006d33' },
    payPayingToLabel: { fontSize: 10, fontWeight: '900', color: '#006d33', letterSpacing: 1, marginBottom: 4 },
    payRecipientName: { fontSize: 22, fontWeight: '900', color: '#111827' },
    payRecipientPhone: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginTop: 2 },

    // Hero Stage
    payAmountStage: { alignItems: 'center', marginVertical: 30 },
    payInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    payCurrencySymbol: { fontSize: 48, fontWeight: '900', color: '#006d33', marginRight: 8 },
    payAmountInput: { fontSize: 56, fontWeight: '900', color: '#111827', minWidth: 100, textAlign: 'center', padding: 0 },
    payBalanceSubtext: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginTop: 12 },

    // Preset Pills
    payPresetRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20 },
    payPresetPill: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
    payPresetText: { fontSize: 13, fontWeight: '800', color: '#334155' },

    // Bottom CTA
    payBottomCtaContainer: { width: '100%' },
    payCtaBtn: { width: '100%', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    payCtaBtnText: { fontSize: 17, fontWeight: '900', color: '#ffffff' },

    scannerRoot: { flex: 1, backgroundColor: '#000' }
});
