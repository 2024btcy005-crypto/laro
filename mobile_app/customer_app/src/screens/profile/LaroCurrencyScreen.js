import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Animated, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import { orderAPI } from '../../services/api';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

export default function LaroCurrencyScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const [stats, setStats] = useState({ laroCurrency: 0 });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchData = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else if (!history.length) setLoading(true);

            // Fetch stats first as they are critical
            try {
                const statsRes = await orderAPI.getUserSummary();
                setStats(statsRes.data);
            } catch (statsErr) {
                console.error('Stats fetch failed:', statsErr.message);
            }

            // Fetch history separately so it doesn't block the screen
            try {
                const historyRes = await orderAPI.getHistory();
                setHistory(historyRes.data || []);
            } catch (historyErr) {
                console.error('History fetch failed:', historyErr.response?.data || historyErr.message);
            }

        } catch (err) {
            console.error('General fetch error:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        fetchData(true);
    };

    const renderFeature = (icon, title, desc) => (
        <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
                <Ionicons name={icon} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDesc}>{desc}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: isDarkMode ? colors.background : '#f8f9fa' }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Laro Wallet</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* Wallet Card */}
                <Animated.View style={[styles.walletCard, { opacity: fadeAnim }]}>
                    <View style={styles.walletGlow} />
                    <View style={styles.walletHeader}>
                        <View style={styles.walletBrand}>
                            <MaterialCommunityIcons name="star-circle" size={24} color="#fff" />
                            <Text style={styles.walletBrandText}>LARO COINS</Text>
                        </View>
                        <MaterialIcons name="contactless" size={24} color="rgba(255,255,255,0.4)" />
                    </View>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Available Balance</Text>
                        <View style={styles.balanceRow}>
                            <Text style={styles.currencySymbol}>Ł</Text>
                            <Text style={styles.balanceValue}>{stats.laroCurrency || 0}</Text>
                        </View>
                    </View>

                    <View style={styles.walletFooter}>
                        <Text style={styles.walletFooterText}>Valid across all Laro partners</Text>
                        <View style={styles.chipContainer}>
                            <View style={styles.chip} />
                        </View>
                    </View>
                </Animated.View>

                {/* Quick Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('Main', { screen: 'Home' });
                        }}
                    >
                        <View style={[styles.actionIconBg, { backgroundColor: isDarkMode ? '#1e293b' : '#e0f2fe' }]}>
                            <Ionicons name="cart" size={20} color={isDarkMode ? '#38bdf8' : '#0369a1'} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.gray }]}>Shop Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('SendCoins', { balance: stats.laroCurrency || 0 });
                        }}
                    >
                        <View style={[styles.actionIconBg, { backgroundColor: isDarkMode ? '#422006' : '#fef9c3' }]}>
                            <MaterialCommunityIcons name="send-circle-outline" size={22} color={isDarkMode ? '#facc15' : '#b45309'} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.gray }]}>Send</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('MyQR');
                        }}
                    >
                        <View style={[styles.actionIconBg, { backgroundColor: isDarkMode ? '#2e1065' : '#ede9fe' }]}>
                            <MaterialCommunityIcons name="qrcode" size={22} color={isDarkMode ? '#a78bfa' : '#6d28d9'} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.gray }]}>My QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => fetchData()}
                    >
                        <View style={[styles.actionIconBg, { backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4' }]}>
                            <Ionicons name="refresh" size={20} color={isDarkMode ? '#4ade80' : '#15803d'} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.gray }]}>Refresh</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Loyalty')}
                    >
                        <View style={[styles.actionIconBg, { backgroundColor: isDarkMode ? '#500724' : '#fdf2f8' }]}>
                            <Ionicons name="trophy" size={20} color={isDarkMode ? '#f472b6' : '#be185d'} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.gray }]}>My Status</Text>
                    </TouchableOpacity>
                </View>

                {/* Transaction History */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.black }]}>Recent Transactions</Text>
                </View>

                <View style={[styles.historyCard, { backgroundColor: colors.white, borderColor: colors.border }, history && history.length === 0 && { paddingVertical: 40 }]}>
                    {history && history.length > 0 ? (
                        history.map((item, index) => (
                            <View key={item.id}>
                                <TouchableOpacity
                                    style={styles.transactionRow}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        navigation.navigate('TransactionDetail', { transaction: item });
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.transactionIcon, { backgroundColor: isDarkMode ? (item.type === 'credit' ? '#064e3b' : colors.background) : (item.type === 'credit' ? '#f0fdf4' : '#f8fafc') }]}>
                                        <MaterialCommunityIcons
                                            name={item.type === 'credit' ? "plus-circle-outline" : "minus-circle-outline"}
                                            size={22}
                                            color={item.type === 'credit' ? (isDarkMode ? "#4ade80" : "#15803d") : colors.gray}
                                        />
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <Text style={[styles.transactionDesc, { color: colors.black }]} numberOfLines={1}>{item.description}</Text>
                                        <Text style={[styles.transactionDate, { color: colors.gray }]}>
                                            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.transactionAmount, { color: item.type === 'credit' ? (isDarkMode ? "#4ade80" : "#15803d") : colors.black }]}>
                                            {item.type === 'credit' ? '+' : '-'}{item.amount} Ł
                                        </Text>
                                        <Text style={[styles.balanceSnap, { color: colors.gray }]}>Bal: {item.balanceAfter} Ł</Text>
                                    </View>
                                </TouchableOpacity>
                                {index < history.length - 1 && <View style={[styles.guideDivider, { backgroundColor: colors.border }]} />}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyHistory}>
                            <View style={styles.emptyIconContainer}>
                                <MaterialCommunityIcons name="wallet-membership" size={40} color="#cbd5e1" />
                            </View>
                            <Text style={styles.emptyHistoryText}>No transactions found</Text>
                            <Text style={styles.emptyHistorySub}>Your Ł movements will appear here</Text>
                        </View>
                    )}
                </View>

                {/* Perks Banner */}
                <TouchableOpacity
                    style={styles.perksBanner}
                    onPress={() => navigation.navigate('Loyalty')}
                >
                    <View>
                        <Text style={styles.perksBannerTitle}>Want more coins?</Text>
                        <Text style={styles.perksBannerSub}>Upgrade your tier to unlock exclusive milestones.</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.footerText}>Terms & Conditions apply • Laro Wallet v1.0</Text>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff'
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.5 },

    scrollContent: { padding: 20, paddingBottom: 100 },

    walletCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 30,
        padding: 25,
        height: 220,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#1a1a2e',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 30
    },
    walletGlow: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: COLORS.primary,
        opacity: 0.2
    },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    walletBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    walletBrandText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2 },

    balanceContainer: { flex: 1 },
    balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    currencySymbol: { color: COLORS.primary, fontSize: 32, fontWeight: '900' },
    balanceValue: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1 },

    walletFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    walletFooterText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
    chipContainer: { width: 45, height: 35, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    chip: { width: 30, height: 20, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },

    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
    actionButton: { alignItems: 'center', gap: 8 },
    actionIconBg: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { fontSize: 12, fontWeight: '800', color: '#64748b' },

    sectionHeader: { marginBottom: 15, paddingLeft: 5 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.5 },

    guideCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 30 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 10 },
    featureIconContainer: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    featureTextContainer: { flex: 1 },
    guideDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
    historyCard: { backgroundColor: '#fff', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 30 },
    transactionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    transactionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    transactionInfo: { flex: 1 },
    transactionDesc: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
    transactionDate: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
    transactionAmount: { fontSize: 15, fontWeight: '900' },
    balanceSnap: { fontSize: 10, color: '#94a3b8', fontWeight: '500', marginTop: 1 },
    emptyHistory: { alignItems: 'center', justifyContent: 'center' },
    emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    emptyHistoryText: { fontSize: 16, color: '#1e293b', fontWeight: '900' },
    emptyHistorySub: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 4 },

    perksBanner: {
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        padding: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    perksBannerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
    perksBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 4 },

    footerText: { textAlign: 'center', color: '#94a3b8', fontSize: 11, fontWeight: '700', paddingVertical: 10 }
});
