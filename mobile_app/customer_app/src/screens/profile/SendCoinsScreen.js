import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Animated, Dimensions, Modal, StatusBar, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { walletAPI, orderAPI } from '../../services/api';
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

                <Text style={ss.heading}>Sent!</Text>
                <Text style={ss.amountLabel}>{successState.amount} Laro Coins</Text>

                <View style={ss.arrowRow}>
                    <View style={ss.arrowLine} />
                    <MaterialCommunityIcons name="arrow-right-circle" size={28} color="rgba(255,255,255,0.3)" />
                    <View style={ss.arrowLine} />
                </View>

                <View style={ss.recipientRow}>
                    <View style={ss.recipientBubble}>
                        <Text style={ss.recipientInitial}>{recipientInitial}</Text>
                    </View>
                    <View>
                        <Text style={ss.recipientTo}>To</Text>
                        <Text style={ss.recipientName}>{successState.name}</Text>
                    </View>
                </View>

                <Text style={ss.note}>Coins delivered instantly ✦</Text>
            </Animated.View>

            <View style={ss.bottomBar}>
                <TouchableOpacity style={ss.backBtn} onPress={onBack} activeOpacity={0.85}>
                    <Ionicons name="arrow-back" size={18} color="#056f36" />
                    <Text style={ss.backBtnText}>Back to Wallet</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const ss = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#056f36', justifyContent: 'center' },
    bgCircle1: {
        position: 'absolute', width: 400, height: 400, borderRadius: 200,
        backgroundColor: 'rgba(255,255,255,0.05)', top: -120, right: -120
    },
    bgCircle2: {
        position: 'absolute', width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.05)', bottom: 80, left: -100
    },
    content: {
        flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30,
    },
    iconWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    pulseRing: {
        position: 'absolute', width: 150, height: 150, borderRadius: 75,
        borderWidth: 2
    },
    pulseRing1: { borderColor: 'rgba(255, 255, 255, 0.3)' },
    pulseRing2: { borderColor: 'rgba(255, 255, 255, 0.15)' },
    coinCircle: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#fff', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
    },
    coinSymbol: { fontSize: 48, fontWeight: '900', color: '#056f36' },

    heading: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
    amountLabel: { fontSize: 18, color: '#fff', fontWeight: '850', marginTop: 4, marginBottom: 24, opacity: 0.9 },

    arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, width: '80%' },
    arrowLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

    recipientRow: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24,
        paddingHorizontal: 20, paddingVertical: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 24, width: '100%'
    },
    recipientBubble: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'
    },
    recipientInitial: { color: '#056f36', fontSize: 22, fontWeight: '900' },
    recipientTo: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    recipientName: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 },

    note: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

    bottomBar: {
        paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 50,
    },
    backBtnText: { color: '#056f36', fontSize: 16, fontWeight: '900' },
});

export default function SendCoinsScreen({ navigation, route }) {
    const { colors, isDarkMode } = useTheme();
    const { user } = useSelector(state => state.auth);
    const insets = useSafeAreaInsets();
    
    // Live Balance State
    const [balance, setBalance] = useState(route.params?.balance || 0);

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
    const [torch, setTorch] = useState(false);

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

    // Load Live Balance and Recipient stats
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Fetch stats/balance
                const statsRes = await orderAPI.getUserSummary();
                if (statsRes.data && statsRes.data.laroCurrency !== undefined) {
                    setBalance(statsRes.data.laroCurrency);
                }

                // Fetch recent recipients
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

    // Auto-fetch recipient
    useEffect(() => {
        if (phone.trim().length !== 10) {
            setRecipient(null);
            setFindError('');
            return;
        }
        const timer = setTimeout(() => {
            handleFindUser();
        }, 600);
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
            await new Promise(r => setTimeout(r, 400));
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
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={22} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Send Coins</Text>
                <View style={{ width: 28 }} />
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
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    
                    {/* Big Balance Card on Top */}
                    <View style={styles.balanceBigCard}>
                        <View style={styles.balanceCardTopRow}>
                            <Ionicons name="wallet" size={18} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 6 }} />
                            <Text style={styles.balanceCardLabelText}>AVAILABLE LARO BALANCE</Text>
                        </View>
                        <Text style={styles.balanceCardAmtText}>{balance} Ł</Text>
                        <Text style={styles.balanceCardFooterText}>Use these coins to pay instantly for any food or Xerox order!</Text>
                    </View>

                    {/* Search Field */}
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name, ID or phone number"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={t => setPhone(t.replace(/[^0-9]/g, ''))}
                        />
                    </View>

                    {/* Scan QR Button */}
                    <TouchableOpacity style={styles.scanCtaBtn} onPress={openScanner}>
                        <Ionicons name="qr-code-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.scanCtaText}>Scan QR Code</Text>
                    </TouchableOpacity>

                    {/* Recent Contacts List */}
                    {recentRecipients.length > 0 && (
                        <>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Recent</Text>
                                <TouchableOpacity>
                                    <Text style={styles.viewAllText}>View All</Text>
                                </TouchableOpacity>
                            </View>

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
                        </>
                    )}

                    {/* Recipient Details display if matches */}
                    {recipient && (
                        <View style={styles.recipientFoundCard}>
                            <Image source={{ uri: recipient.avatarUrl || recipient.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80' }} style={styles.foundAvatar} />
                            <View style={styles.foundDetails}>
                                <Text style={styles.foundName}>{recipient.name}</Text>
                                <Text style={styles.foundPhone}>+91 {phone}</Text>
                            </View>
                            
                            {/* Amount entry block overlay */}
                            <View style={styles.amountLookupCol}>
                                <TextInput
                                    style={styles.amountInputInline}
                                    placeholder="Amount"
                                    placeholderTextColor="#bbb"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={t => setAmount(t.replace(/[^0-9]/g, ''))}
                                    autoFocus={true}
                                />
                            </View>
                        </View>
                    )}

                    {findError ? (
                        <View style={styles.errorCard}>
                            <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                            <Text style={styles.errorText}>{findError}</Text>
                        </View>
                    ) : null}

                    {/* Promotion Box */}
                    <View style={styles.promoContainer}>
                        <Text style={styles.promoTitle}>More student features coming soon</Text>
                        <Text style={styles.promoDesc}>
                            We're working on new ways to help you connect with your campus community. Stay tuned for updates!
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Inline Confirm Send button if canSend */}
            {canSend && (
                <View style={[styles.bottomStickySendBar, { paddingBottom: insets.bottom + 10 }]}>
                    <TouchableOpacity 
                        style={styles.sendCtaBtn}
                        onPress={() => setAlertVisible(true)}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.sendCtaText}>Confirm Transfer of {amount} Laro</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <LaroAlert
                visible={alertVisible}
                title="Confirm Transfer"
                message={`Send ${amountNum} Laro to ${recipient?.name}?`}
                type="default"
                confirmText="Send"
                onConfirm={handleSend}
                onCancel={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#f2f7f2'
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#056f36' },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    // Big Balance Card on Top
    balanceBigCard: {
        backgroundColor: '#056f36',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8
    },
    balanceCardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    balanceCardLabelText: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 0.8
    },
    balanceCardAmtText: {
        fontSize: 38,
        fontWeight: '950',
        color: '#fff',
        marginBottom: 10
    },
    balanceCardFooterText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.75)',
        fontWeight: '700',
        lineHeight: 16
    },

    // Search Box Input
    searchContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e6ede6',
        paddingHorizontal: 16,
        height: 52,
        justifyContent: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1
    },
    searchInput: { fontSize: 14, fontWeight: '750', color: '#111' },

    // Scan QR Button
    scanCtaBtn: {
        backgroundColor: '#27c96c',
        borderRadius: 16,
        height: 52,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#27c96c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    scanCtaText: { color: '#fff', fontSize: 14, fontWeight: '850' },

    // Sections Header
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    sectionTitle: { fontSize: 16, fontWeight: '950', color: '#111' },
    viewAllText: { fontSize: 13, fontWeight: '900', color: '#056f36' },

    // Recent horizontal contacts
    recentScroll: { paddingBottom: 15 },
    recentItem: {
        alignItems: 'center',
        marginRight: 20,
        width: 65
    },
    recentAvatarCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 2,
        borderColor: '#27c96c',
        padding: 2,
        backgroundColor: '#fff'
    },
    recentAvatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 27
    },
    recentAvatarFallback: {
        width: '100%',
        height: '100%',
        borderRadius: 27,
        backgroundColor: '#f2f7f2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    recentAvatarFallbackText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#056f36'
    },
    recentNameText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#666',
        marginTop: 6,
        textAlign: 'center'
    },

    // Found User Card
    recipientFoundCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1,
        marginBottom: 20
    },
    foundAvatar: { width: 44, height: 44, borderRadius: 22 },
    foundDetails: { flex: 1, marginLeft: 12 },
    foundName: { fontSize: 14, fontWeight: '900', color: '#111' },
    foundPhone: { fontSize: 11, color: '#666', fontWeight: '650', marginTop: 2 },
    amountLookupCol: { width: 80 },
    amountInputInline: {
        fontSize: 16,
        fontWeight: '900',
        color: '#056f36',
        borderBottomWidth: 1.5,
        borderColor: '#056f36',
        textAlign: 'center',
        paddingVertical: 4
    },

    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fdf2f2',
        borderRadius: 12,
        padding: 10,
        marginBottom: 15
    },
    errorText: { fontSize: 12, color: '#ef4444', fontWeight: '750' },

    // Promotion box
    promoContainer: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1,
        marginTop: 10,
        marginBottom: 40
    },
    promoTitle: { fontSize: 15, fontWeight: '900', color: '#111', marginBottom: 8 },
    promoDesc: { fontSize: 13, color: '#666', lineHeight: 20, fontWeight: '650' },

    // QR scanner
    scannerRoot: { flex: 1, backgroundColor: '#000' },

    // Sticky Bottom confirmation
    bottomStickySendBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f4f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 10
    },
    sendCtaBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendCtaText: { color: '#fff', fontSize: 14, fontWeight: '850' }
});
