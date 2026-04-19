import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Animated, Dimensions, Modal, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { walletAPI } from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import Confetti from '../../components/Confetti';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

// ─── Premium Success Screen ───────────────────────────────────────────────
function SuccessScreen({ successState, recipientInitial, onBack, colors, isDarkMode }) {
    const pulse1 = useRef(new Animated.Value(1)).current;
    const pulse2 = useRef(new Animated.Value(1)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in content
        Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();

        // Infinite pulse rings
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

            {/* Dark background layers */}
            <View style={ss.bgCircle1} />
            <View style={ss.bgCircle2} />

            <Animated.View style={[ss.content, { opacity: fadeIn }]}>

                {/* Pulse rings + coin icon */}
                <View style={ss.iconWrapper}>
                    <Animated.View style={[ss.pulseRing, ss.pulseRing1, { transform: [{ scale: pulse1 }] }]} />
                    <Animated.View style={[ss.pulseRing, ss.pulseRing2, { transform: [{ scale: pulse2 }] }]} />
                    <View style={ss.coinCircle}>
                        <Text style={ss.coinSymbol}>Ł</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={ss.heading}>Sent!</Text>
                <Text style={ss.amountLabel}>{successState.amount} Laro Coins</Text>

                {/* Arrow divider */}
                <View style={ss.arrowRow}>
                    <View style={ss.arrowLine} />
                    <MaterialCommunityIcons name="arrow-right-circle" size={28} color="rgba(255,255,255,0.3)" />
                    <View style={ss.arrowLine} />
                </View>

                {/* Recipient chip */}
                <View style={ss.recipientRow}>
                    <View style={ss.recipientBubble}>
                        <Text style={ss.recipientInitial}>{recipientInitial}</Text>
                    </View>
                    <View>
                        <Text style={ss.recipientTo}>To</Text>
                        <Text style={ss.recipientName}>{successState.name}</Text>
                    </View>
                </View>

                {/* Subtext */}
                <Text style={ss.note}>Coins delivered instantly ✦</Text>
            </Animated.View>

            {/* Bottom CTA */}
            <View style={ss.bottomBar}>
                <TouchableOpacity style={ss.backBtn} onPress={onBack} activeOpacity={0.85}>
                    <Ionicons name="arrow-back" size={18} color="#1a1a2e" />
                    <Text style={ss.backBtnText}>Back to Wallet</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const ss = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0a0a14' },
    bgCircle1: {
        position: 'absolute', width: 400, height: 400, borderRadius: 200,
        backgroundColor: '#1e1b4b', top: -120, right: -120, opacity: 0.6
    },
    bgCircle2: {
        position: 'absolute', width: 300, height: 300, borderRadius: 150,
        backgroundColor: '#14532d', bottom: 80, left: -100, opacity: 0.4
    },
    content: {
        flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30,
    },
    iconWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    pulseRing: {
        position: 'absolute', width: 150, height: 150, borderRadius: 75,
        borderWidth: 2
    },
    pulseRing1: { borderColor: 'rgba(74, 222, 128, 0.3)' },
    pulseRing2: { borderColor: 'rgba(74, 222, 128, 0.15)' },
    coinCircle: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: '#15803d',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#4ade80', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
    },
    coinSymbol: { fontSize: 48, fontWeight: '900', color: '#fff' },

    heading: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
    amountLabel: { fontSize: 18, color: '#4ade80', fontWeight: '800', marginTop: 4, marginBottom: 24 },

    arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, width: '80%' },
    arrowLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

    recipientRow: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24,
        paddingHorizontal: 20, paddingVertical: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24, width: '100%'
    },
    recipientBubble: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#818cf8', alignItems: 'center', justifyContent: 'center'
    },
    recipientInitial: { color: '#fff', fontSize: 22, fontWeight: '900' },
    recipientTo: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    recipientName: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 },

    note: { color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

    bottomBar: {
        paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)'
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 50,
    },
    backBtnText: { color: '#1a1a2e', fontSize: 16, fontWeight: '900' },
});
// ──────────────────────────────────────────────────────────────────────────────

export default function SendCoinsScreen({ navigation, route }) {
    const { colors, isDarkMode } = useTheme();
    const currentBalance = route.params?.balance || 0;

    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState(null);
    const [findLoading, setFindLoading] = useState(false);
    const [findError, setFindError] = useState('');
    const [sending, setSending] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [successState, setSuccessState] = useState(null);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const scanned = useRef(false);
    const [recentRecipients, setRecentRecipients] = useState([]);
    const [recentLoading, setRecentLoading] = useState(false);


    const playSuccessSound = async () => {
        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://cdn.freesound.org/previews/131/131660_2398403-lq.mp3' },
                { shouldPlay: true, volume: 1.0 }
            );
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) sound.unloadAsync();
            });
        } catch (e) {
            console.log('Sound load error (non-critical):', e.message);
        }
    };

    useEffect(() => {
        fetchRecentRecipients();
    }, []);

    const fetchRecentRecipients = async () => {
        try {
            setRecentLoading(true);
            const res = await walletAPI.getRecentRecipients();
            setRecentRecipients(res.data);
        } catch (err) {
            console.error('[RECENT] Error fetching:', err);
        } finally {
            setRecentLoading(false);
        }
    };


    const handleBarcodeScanned = (scanningResult) => {
        if (scanned.current || !scanningResult.data) return;
        scanned.current = true;

        try {
            const { data } = scanningResult;
            // QR contains the 10-digit phone number
            const scannedPhone = String(data).replace(/[^0-9]/g, '').slice(-10);

            if (scannedPhone.length === 10) {
                setScannerVisible(false);
                setPhone(scannedPhone);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                // If scanned something else, reset and allow another scan
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

    // Auto-fetch when 10 digits are entered
    useEffect(() => {
        if (phone.trim().length !== 10) {
            setRecipient(null);
            setFindError('');
            return;
        }
        const timer = setTimeout(() => {
            handleFindUser();
        }, 600); // 600ms debounce
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
            setFindError(err.response?.data?.message || 'User not found');
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
            // 1. Haptic immediately
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // 2. Sound starts playing
            await playSuccessSound();
            // 3. Short pause so the chime is heard before confetti bursts
            await new Promise(r => setTimeout(r, 400));
            // 4. Now show success + confetti
            setSuccessState({ name: recipient.name, amount: parseInt(amount), newBalance: res.data.newBalance });
            fetchRecentRecipients(); // Refresh list after successful send
        } catch (err) {
            setFindError(err.response?.data?.message || 'Transfer failed. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setSending(false);
        }
    };

    const amountNum = parseInt(amount) || 0;
    const canSend = recipient && amountNum >= 1 && amountNum <= currentBalance;

    // --- Success Screen ---
    if (successState) {
        return (
            <SuccessScreen
                successState={successState}
                recipientInitial={successState.name.charAt(0).toUpperCase()}
                onBack={() => navigation.goBack()}
                colors={colors}
                isDarkMode={isDarkMode}
            />
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDarkMode ? colors.background : '#f8f9fa' }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Send Coins</Text>
                <TouchableOpacity style={[styles.scanHeaderBtn, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }]} onPress={openScanner}>
                    <MaterialCommunityIcons name="qrcode-scan" size={22} color={colors.black} />
                </TouchableOpacity>
            </View>

            {/* QR Scanner Modal */}
            <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.scannerRoot}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={handleBarcodeScanned}
                    />
                    {/* Overlay */}
                    <View style={styles.scanOverlay}>
                        <View style={styles.scanTopBar}>
                            <TouchableOpacity style={styles.scanCloseBtn} onPress={() => setScannerVisible(false)}>
                                <Ionicons name="close" size={26} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.scanTitle}>Scan QR Code</Text>
                            <View style={{ width: 44 }} />
                        </View>
                        <View style={styles.scanFrame}>
                            {/* Corner marks */}
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                        <Text style={styles.scanHint}>Point at a Laro QR code to send coins</Text>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    {/* Balance Chip */}
                    <View style={[styles.balanceChip, { backgroundColor: isDarkMode ? colors.white : COLORS.background, borderColor: isDarkMode ? colors.border : COLORS.secondary }]}>
                        <MaterialCommunityIcons name="wallet-outline" size={18} color={COLORS.primary} />
                        <Text style={[styles.balanceChipText, { color: colors.black }]}>Balance: <Text style={{ color: COLORS.primary, fontWeight: '900' }}>Ł {currentBalance}</Text></Text>
                    </View>

                    {/* Recent Recipients */}
                    {!recipient && recentRecipients.length > 0 && (
                        <View style={{ marginBottom: 25 }}>
                            <Text style={[styles.sectionLabel, { color: colors.gray }]}>RECENT CONTACTS</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                                {recentRecipients.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.recentItem}
                                        onPress={() => setPhone(item.phoneNumber)}
                                    >
                                        <View style={[styles.recentAvatar, { backgroundColor: colors.white, borderColor: colors.border }]}>
                                            <Text style={styles.recentAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                        <Text style={[styles.recentName, { color: colors.black }]} numberOfLines={1}>{item.name.split(' ')[0]}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}


                    {/* Phone Lookup */}
                    <Text style={[styles.sectionLabel, { color: colors.gray }]}>RECIPIENT PHONE NUMBER</Text>
                    <View style={styles.phoneRow}>
                        <View style={[styles.prefixBox, { backgroundColor: isDarkMode ? colors.white : '#f1f5f9', borderColor: colors.border }]}>
                            <Text style={[styles.prefixText, { color: colors.gray }]}>+91</Text>
                        </View>
                        <TextInput
                            style={[styles.phoneInput, { backgroundColor: colors.white, borderColor: colors.border, color: colors.black }]}
                            placeholder="Enter phone number"
                            placeholderTextColor={colors.gray}
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={t => setPhone(t.replace(/[^0-9]/g, ''))}
                        />
                        {/* Auto-fetch status indicator */}
                        <View style={styles.findBtn}>
                            {findLoading
                                ? <ActivityIndicator color="#fff" size="small" />
                                : recipient
                                    ? <Ionicons name="checkmark" size={20} color="#fff" />
                                    : <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
                            }
                        </View>
                    </View>

                    {/* Recipient Card */}
                    {recipient && (
                        <View style={styles.recipientCard}>
                            <View style={styles.recipientAvatar}>
                                <Text style={styles.recipientAvatarText}>{recipient.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View>
                                <Text style={styles.recipientName}>{recipient.name}</Text>
                                <Text style={styles.recipientPhone}>+91 {phone}</Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={22} color="#15803d" style={{ marginLeft: 'auto' }} />
                        </View>
                    )}

                    {/* Error */}
                    {findError ? (
                        <View style={styles.errorBanner}>
                            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                            <Text style={styles.errorText}>{findError}</Text>
                        </View>
                    ) : null}

                    {/* Amount Input */}
                    {recipient && (
                        <>
                            <Text style={[styles.sectionLabel, { marginTop: 24, color: colors.gray }]}>AMOUNT TO SEND</Text>
                            <View style={[styles.amountRow, { backgroundColor: colors.white, borderColor: isDarkMode ? colors.border : COLORS.secondary }]}>
                                <Text style={styles.amountSymbol}>Ł</Text>
                                <TextInput
                                    style={[styles.amountInput, { color: colors.black }]}
                                    placeholder="0"
                                    placeholderTextColor={colors.gray}
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={t => setAmount(t.replace(/[^0-9]/g, ''))}
                                />
                            </View>

                            {/* Quick amount chips */}
                            <View style={styles.quickAmounts}>
                                {[5, 10, 25, 50].map(v => (
                                    <TouchableOpacity
                                        key={v}
                                        style={[styles.quickChip, { backgroundColor: isDarkMode ? colors.white : '#f1f5f9', borderColor: colors.border }, amount === String(v) && [styles.quickChipActive, { backgroundColor: isDarkMode ? '#1e1b4b' : COLORS.background, borderColor: COLORS.primary }]]}
                                        onPress={() => setAmount(String(v))}
                                    >
                                        <Text style={[styles.quickChipText, { color: colors.gray }, amount === String(v) && styles.quickChipTextActive]}>Ł {v}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {amountNum > currentBalance && (
                                <Text style={styles.insufficientText}>⚠️  Insufficient balance</Text>
                            )}
                        </>
                    )}

                    {/* Send Button */}
                    <TouchableOpacity
                        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                        disabled={!canSend || sending}
                        onPress={() => setAlertVisible(true)}
                    >
                        {sending
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name="paper-plane-outline" size={20} color="#fff" />
                                <Text style={styles.sendBtnText}>Send {amountNum > 0 ? `Ł ${amountNum}` : 'Coins'}</Text>
                            </>
                        }
                    </TouchableOpacity>

                    <Text style={[styles.noteText, { color: colors.gray }]}>Transfers are instant and cannot be reversed.</Text>
                </ScrollView>
            </KeyboardAvoidingView>

            <LaroAlert
                visible={alertVisible}
                title="Confirm Transfer"
                message={`Send Ł ${amountNum} to ${recipient?.name}?`}
                type="default"
                confirmText="Send"
                onConfirm={handleSend}
                onCancel={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff'
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.5 },

    content: { padding: 20, paddingBottom: 100 },

    balanceChip: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.background, paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, alignSelf: 'flex-start', marginBottom: 30,
        borderWidth: 1, borderColor: COLORS.secondary
    },
    balanceChipText: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },

    sectionLabel: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 10 },

    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    prefixBox: {
        paddingHorizontal: 14, paddingVertical: 15, backgroundColor: '#f1f5f9',
        borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0'
    },
    prefixText: { fontSize: 15, fontWeight: '800', color: '#475569' },
    phoneInput: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
        borderColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 15,
        fontSize: 16, fontWeight: '700', color: '#1a1a2e'
    },
    scanHeaderBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center'
    },
    // QR Scanner
    scannerRoot: { flex: 1, backgroundColor: '#000' },
    scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60 },
    scanTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20 },
    scanCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    scanTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
    scanFrame: {
        width: 240, height: 240, borderRadius: 20,
        borderWidth: 0, position: 'relative', alignItems: 'center', justifyContent: 'center'
    },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: '#fff', borderWidth: 3 },
    cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
    cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
    cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
    cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
    scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 40 },

    findBtn: {
        backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 15,
        borderRadius: 16, minWidth: 50, alignItems: 'center', justifyContent: 'center'
    },
    findBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },

    recipientCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#f0fdf4',
        borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 5
    },
    recipientAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#15803d', justifyContent: 'center', alignItems: 'center'
    },
    recipientAvatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
    recipientName: { fontSize: 15, fontWeight: '900', color: '#14532d' },
    recipientPhone: { fontSize: 12, color: '#4ade80', fontWeight: '600', marginTop: 2 },

    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2',
        padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#fecaca'
    },
    errorText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },

    amountRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 20, borderWidth: 2, borderColor: COLORS.secondary,
        paddingHorizontal: 20, paddingVertical: 8, marginBottom: 15
    },
    amountSymbol: { fontSize: 28, fontWeight: '900', color: COLORS.primary, marginRight: 10 },
    amountInput: { flex: 1, fontSize: 40, fontWeight: '900', color: '#1a1a2e' },

    quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    quickChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0'
    },
    quickChipActive: { backgroundColor: COLORS.background, borderColor: COLORS.primary },
    quickChipText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
    quickChipTextActive: { color: COLORS.primary },

    insufficientText: { color: '#dc2626', fontSize: 13, fontWeight: '700', marginBottom: 10 },

    sendBtn: {
        backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 24,
        marginTop: 30, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 15, elevation: 10
    },
    sendBtnDisabled: { backgroundColor: '#e2e8f0', shadowOpacity: 0 },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    noteText: { textAlign: 'center', color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 15 },

    // Success state
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    successIconBg: {
        width: 120, height: 120, borderRadius: 60, backgroundColor: '#f0fdf4',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24
    },
    successTitle: { fontSize: 28, fontWeight: '900', color: '#1a1a2e', marginBottom: 10 },
    successSub: { fontSize: 15, color: '#64748b', textAlign: 'center', fontWeight: '600', lineHeight: 22 },
    successAccent: { color: '#15803d', fontWeight: '900' },
    newBalanceCard: {
        backgroundColor: '#1a1a2e', borderRadius: 24, padding: 24, width: '100%',
        alignItems: 'center', marginVertical: 30
    },
    newBalanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    newBalanceValue: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 8 },
    doneBtn: {
        backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 50,
        borderRadius: 50, width: '100%', alignItems: 'center'
    },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    recentScroll: { gap: 15, paddingRight: 20 },
    recentItem: { alignItems: 'center', width: 65 },
    recentAvatar: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        marginBottom: 8
    },
    recentAvatarText: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
    recentName: { fontSize: 12, fontWeight: '700', color: '#475569', textAlign: 'center' }
});
