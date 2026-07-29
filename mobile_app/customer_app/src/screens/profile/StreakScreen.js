import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Image, Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, CONSTANTS } from '../../theme';

export default function StreakScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [userSummary, setUserSummary] = useState(null);

    useEffect(() => {
        fetchStreakData();
    }, []);

    const fetchStreakData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/user-summary');
            if (res.data) {
                setUserSummary(res.data);
            } else {
                setUserSummary({ currentStreak: 0, longestStreak: 0, totalStreakCoins: 0 });
            }
        } catch (err) {
            console.warn('[StreakScreen] Failed to load streak summary:', err.message);
            setUserSummary({ currentStreak: 0, longestStreak: 0, totalStreakCoins: 0 });
        } finally {
            setLoading(false);
        }
    };

    const currentStreak = userSummary?.currentStreak || 0;
    const longestStreak = userSummary?.longestStreak || 0;
    const totalStreakCoins = userSummary?.totalStreakCoins || 0;
    const daysInCurrentBlock = currentStreak % 10;
    const daysLeftForNext = 10 - daysInCurrentBlock;
    const currentMilestoneBlock = Math.floor(currentStreak / 10) + 1;
    const nextMilestoneCoins = currentMilestoneBlock * 10;

    const milestones = [
        { day: 10, coins: 10 },
        { day: 20, coins: 20 },
        { day: 30, coins: 30 },
        { day: 40, coins: 40 },
        { day: 50, coins: 50 },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f8fafc' }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Top Bar Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={colors.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🔥 Ordering Streak</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#ff6b00" />
                    <Text style={{ marginTop: 12, color: '#666', fontWeight: '700' }}>Loading streak data...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Hero Streak Flame Card */}
                    <View style={styles.heroCard}>
                        <View style={styles.flameCircle}>
                            <Text style={{ fontSize: 52 }}>🔥</Text>
                        </View>
                        <Text style={styles.heroStreakCount}>{currentStreak} Days</Text>
                        <Text style={styles.heroStreakLabel}>ACTIVE ORDERING STREAK</Text>

                        {/* Subtext */}
                        <View style={styles.heroPill}>
                            <Ionicons name="trophy-outline" size={14} color="#fff" />
                            <Text style={styles.heroPillText}>Personal Best: {longestStreak} Days</Text>
                        </View>

                        <Text style={styles.heroDescription}>
                            {currentStreak > 0
                                ? `Keep your streak alive! Order daily to reach Day ${currentMilestoneBlock * 10} and earn +${nextMilestoneCoins} Laro Coins.`
                                : 'Order daily to start your streak and unlock progressive Laro Coin bonuses every 10 days!'}
                        </Text>
                    </View>

                    {/* Quick Stats Grid */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>+{nextMilestoneCoins} Ł</Text>
                            <Text style={styles.statLabel}>Next Milestone Bonus</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{daysLeftForNext} Days</Text>
                            <Text style={styles.statLabel}>Until Next Bonus</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{totalStreakCoins} Ł</Text>
                            <Text style={styles.statLabel}>Total Coins Won</Text>
                        </View>
                    </View>

                    {/* Progress Bar Section */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressCardHeader}>
                            <Text style={styles.progressTitle}>Milestone Progress</Text>
                            <Text style={styles.progressPercent}>{daysInCurrentBlock} / 10 Days</Text>
                        </View>
                        <View style={styles.trackBackground}>
                            <View style={[styles.trackFill, { width: `${(daysInCurrentBlock / 10) * 100}%` }]} />
                        </View>
                        <Text style={styles.progressSubtext}>
                            {10 - daysInCurrentBlock} more daily order(s) needed to claim +{nextMilestoneCoins} Laro Coins!
                        </Text>
                    </View>

                    {/* 10-Day Milestone Reward Roadmap */}
                    <Text style={styles.sectionTitle}>🏆 10-Day Milestone Roadmap</Text>
                    
                    <View style={styles.milestonesList}>
                        {milestones.map((m, index) => {
                            const isReached = currentStreak >= m.day;
                            const isNext = !isReached && currentStreak < m.day && (index === 0 || currentStreak >= milestones[index - 1].day);

                            return (
                                <View key={m.day} style={[styles.milestoneItem, isReached && styles.milestoneItemReached, isNext && styles.milestoneItemNext]}>
                                    <View style={[styles.milestoneIconBox, isReached && styles.milestoneIconBoxReached]}>
                                        {isReached ? (
                                            <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                                        ) : (
                                            <Text style={{ fontSize: 20 }}>🎁</Text>
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.milestoneDayText}>Day {m.day} Milestone</Text>
                                        <Text style={styles.milestoneCoinsText}>+{m.coins} Laro Wallet Coins</Text>
                                    </View>
                                    <View style={[styles.statusBadge, isReached ? styles.statusBadgeDone : (isNext ? styles.statusBadgeActive : styles.statusBadgeLocked)]}>
                                        <Text style={[styles.statusBadgeText, isReached ? styles.statusBadgeTextDone : (isNext ? styles.statusBadgeTextActive : styles.statusBadgeTextLocked)]}>
                                            {isReached ? 'CLAIMED' : (isNext ? 'IN PROGRESS' : 'LOCKED')}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Streak Rules Card */}
                    <View style={styles.rulesCard}>
                        <Text style={styles.rulesTitle}>🔥 Streak Rules</Text>
                        <View style={styles.ruleRow}>
                            <Text style={styles.ruleBullet}>•</Text>
                            <Text style={styles.ruleText}>Place at least 1 food or grocery order every day to maintain your streak.</Text>
                        </View>
                        <View style={styles.ruleRow}>
                            <Text style={styles.ruleBullet}>•</Text>
                            <Text style={styles.ruleText}>Every 10 streak days (10, 20, 30 days...), bonus Laro Coins are credited automatically to your wallet.</Text>
                        </View>
                        <View style={styles.ruleRow}>
                            <Text style={styles.ruleBullet}>•</Text>
                            <Text style={styles.ruleText}>Missing a day will reset your current streak back to Day 1.</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.orderNowBtn} onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.orderNowBtnText}>Keep Streak Alive • Order Now</Text>
                    </TouchableOpacity>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justify: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    heroCard: {
        backgroundColor: '#fff4eb',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#ffd8be',
        shadowColor: '#ff6b00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 16,
    },
    flameCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ffe4d1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    heroStreakCount: {
        fontSize: 36,
        fontWeight: '900',
        color: '#d94600',
    },
    heroStreakLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#994d00',
        letterSpacing: 1,
        marginBottom: 10,
    },
    heroPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ff6b00',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 14,
    },
    heroPillText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    heroDescription: {
        fontSize: 13,
        color: '#7c3a00',
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statNumber: {
        fontSize: 16,
        fontWeight: '900',
        color: '#d94600',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        marginTop: 2,
        textAlign: 'center',
    },
    progressCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    progressCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    progressPercent: {
        fontSize: 13,
        fontWeight: '900',
        color: '#d94600',
    },
    trackBackground: {
        height: 10,
        backgroundColor: '#ffe4d6',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
    },
    trackFill: {
        height: '100%',
        backgroundColor: '#ff6b00',
        borderRadius: 5,
    },
    progressSubtext: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 12,
    },
    milestonesList: {
        gap: 10,
        marginBottom: 20,
    },
    milestoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    milestoneItemReached: {
        borderColor: '#bbf7d0',
        backgroundColor: '#f0fdf4',
    },
    milestoneItemNext: {
        borderColor: '#ffedd5',
        backgroundColor: '#fff7ed',
    },
    milestoneIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    milestoneIconBoxReached: {
        backgroundColor: '#dcfce7',
    },
    milestoneDayText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
    },
    milestoneCoinsText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ea580c',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeDone: {
        backgroundColor: '#dcfce7',
    },
    statusBadgeActive: {
        backgroundColor: '#ffedd5',
    },
    statusBadgeLocked: {
        backgroundColor: '#f1f5f9',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    statusBadgeTextDone: {
        color: '#16a34a',
    },
    statusBadgeTextActive: {
        color: '#ea580c',
    },
    statusBadgeTextLocked: {
        color: '#94a3b8',
    },
    rulesCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 24,
    },
    rulesTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 10,
    },
    ruleRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 6,
    },
    ruleBullet: {
        color: '#ff6b00',
        fontWeight: '900',
        fontSize: 14,
    },
    ruleText: {
        flex: 1,
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
        lineHeight: 16,
    },
    orderNowBtn: {
        backgroundColor: '#ff6b00',
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#ff6b00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    orderNowBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
});
