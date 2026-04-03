import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';

export default function MyQRScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { user } = useSelector(state => state.auth);
    const phone = user?.phoneNumber || '';
    const name = user?.name || 'Laro User';

    // Free QR code API — no native deps needed
    const qrUrl = phone
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${phone}&color=4a0020&bgcolor=ffffff&margin=10`
        : null;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Send me Laro Coins! My number: +91 ${phone}`,
                title: 'My Laro QR',
            });
        } catch (e) { /* ignore */ }
    };

    return (
        <View style={[styles.root, { backgroundColor: isDarkMode ? '#1a0010' : '#4a0020' }]}>
            <StatusBar barStyle="light-content" backgroundColor={isDarkMode ? "#1a0010" : "#4a0020"} />

            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My QR Code</Text>
                    <TouchableOpacity style={styles.shareIconBtn} onPress={handleShare}>
                        <Ionicons name="share-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Card */}
                <View style={[styles.card, { backgroundColor: colors.white }]}>
                    <View style={styles.brandRow}>
                        <MaterialCommunityIcons name="star-circle" size={20} color={isDarkMode ? '#f472b6' : '#be185d'} />
                        <Text style={[styles.brandText, { color: isDarkMode ? '#f472b6' : '#be185d' }]}>LARO PAY</Text>
                    </View>

                    {/* QR Code via API */}
                    <View style={[styles.qrWrapper, { backgroundColor: '#fff', borderColor: colors.border }]}>
                        {qrUrl ? (
                            <Image
                                source={{ uri: qrUrl }}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <Text style={{ color: colors.gray, fontSize: 13 }}>No phone on file</Text>
                        )}
                    </View>

                    {/* User info */}
                    <View style={styles.avatarRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={[styles.userName, { color: colors.black }]}>{name}</Text>
                            <Text style={[styles.userPhone, { color: colors.gray }]}>+91 {phone}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.hint, { color: colors.gray }]}>Scan this code to send Laro Coins</Text>
                </View>

                {/* Share button */}
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.white }]} onPress={handleShare} activeOpacity={0.85}>
                    <Ionicons name="share-social-outline" size={20} color={colors.black} />
                    <Text style={[styles.shareBtnText, { color: colors.black }]}>Share My QR</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1a0010' },
    orb1: {
        position: 'absolute', width: 350, height: 350, borderRadius: 175,
        backgroundColor: '#831843', top: -100, right: -100, opacity: 0.7
    },
    orb2: {
        position: 'absolute', width: 250, height: 250, borderRadius: 125,
        backgroundColor: '#9d174d', bottom: 100, left: -80, opacity: 0.45
    },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14
    },
    closeBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    shareIconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center'
    },
    card: {
        marginHorizontal: 24, backgroundColor: '#ffffff',
        borderRadius: 32, padding: 28, alignItems: 'center', marginTop: 20,
        shadowColor: '#f472b6', shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.35, shadowRadius: 30, elevation: 20
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    brandText: { fontSize: 13, fontWeight: '900', color: '#f472b6', letterSpacing: 2 },
    qrWrapper: {
        width: 220, height: 220, padding: 8, backgroundColor: '#fff', borderRadius: 16,
        borderWidth: 2, borderColor: '#f1f5f9', marginBottom: 24,
        alignItems: 'center', justifyContent: 'center'
    },
    qrImage: { width: 200, height: 200 },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'flex-start', marginBottom: 20 },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#be185d', alignItems: 'center', justifyContent: 'center'
    },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
    userName: { fontSize: 16, fontWeight: '900', color: '#1a1a2e' },
    userPhone: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
    divider: { width: '100%', height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },
    hint: { fontSize: 12, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.3 },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#fff', marginHorizontal: 24, marginTop: 24,
        paddingVertical: 16, borderRadius: 50
    },
    shareBtnText: { fontSize: 16, fontWeight: '900', color: '#1a1a2e' },
});
