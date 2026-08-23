import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Animated, Platform, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../theme';

const { width } = Dimensions.get('window');

export default function StreakScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [userSummary, setUserSummary] = useState(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchStreakData();

        // Pulsing Flame Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const fetchStreakData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/user-summary').catch(() => api.get('/orders/summary'));
            if (res && res.data) {
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

    const heroBgColor = isDarkMode ? '#0f172a' : '#f0fdf4';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={heroBgColor} />

            <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 20 }} showsVerticalScrollIndicator={false}>
                {/* Top Section Hero Backdrop (Matching Home & Food Screen) */}
                <View style={[styles.heroHeaderSection, { backgroundColor: heroBgColor, paddingTop: Math.max(insets.top, 16) + 8 }]}>
                    {/* Navigation Header Row */}
                    <View style={styles.topHeaderNavRow}>
                        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
                        </TouchableOpacity>
                        <View style={styles.topTitleBadge}>
                            <Ionicons name="sparkles" size={14} color="#056f36" />
                            <Text style={styles.topTitleBadgeText}>LARO STREAKS</Text>
                        </View>
                        <View style={{ width: 42 }} />
                    </View>

                    {/* Main Title & Calligraphy Subtitle with Swoosh */}
                    <View style={styles.heroTextWrapper}>
                        <Text style={[styles.heroTitleText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                            CAMPUS STREAKS
                        </Text>
                        <Text style={styles.heroCalligraphySubText}>
                            Order Daily, Unlock Epic Perks
                        </Text>
                        <View style={styles.curvedSwooshWrapper}>
                            <Svg width={170} height={15} viewBox="0 0 170 15" fill="none">
                                <Path
                                    d="M 4,5 Q 85,1 165,6 C 171,7 167,13 140,13"
                                    stroke="#056f36"
                                    strokeWidth={2.2}
                                    strokeLinecap="round"
                                />
                            </Svg>
                        </View>
                    </View>

                    {/* Hero Streak Flame Display Card */}
                    <View style={[styles.heroStreakCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#dcfce7' }]}>
                        <Animated.View style={[styles.flameCircle, { transform: [{ scale: pulseAnim }] }]}>
                            <MaterialCommunityIcons name="fire" size={46} color="#ea580c" />
                        </Animated.View>
                        <Text style={styles.heroStreakCount}>{currentStreak} Days</Text>
                        <Text style={styles.heroStreakLabel}>ACTIVE ORDERING STREAK</Text>

                        {/* Personal Best Badge */}
                        <View style={styles.personalBestPill}>
                            <Ionicons name="trophy" size={14} color="#ffffff" style={{ marginRight: 5 }} />
                            <Text style={styles.personalBestText}>Personal Best: {longestStreak} Days</Text>
                        </View>

                        <Text style={[styles.heroDescription, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                            {currentStreak > 0
                                ? `Keep your streak alive! Order daily to reach Day ${currentMilestoneBlock * 10} and earn +${nextMilestoneCoins} Laro Coins.`
                                : 'Order daily to start your streak and unlock progressive Laro Wallet Coin bonuses every 10 days!'}
                        </Text>
                    </View>
                </View>

                {/* Soft Edge Blend Transition Strip where Green meets White */}
                <View style={{ height: 26, width: '100%', backgroundColor: colors.background }}>
                    <Svg width="100%" height={26} preserveAspectRatio="none">
                        <Defs>
                            <LinearGradient id="streakEdgeBlend" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={heroBgColor} stopOpacity="1" />
                                <Stop offset="100%" stopColor={colors.background} stopOpacity="1" />
                            </LinearGradient>
                        </Defs>
                        <Rect width="100%" height={26} fill="url(#streakEdgeBlend)" />
                    </Svg>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentBody}>
                    {loading ? (
                        <View style={styles.centerLoading}>
                            <ActivityIndicator size="large" color="#056f36" />
                            <Text style={[styles.loadingText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>Loading streak data...</Text>
                        </View>
                    ) : (
                        <View>
                            {/* Quick Stats Grid */}
                            <View style={styles.statsRow}>
                                <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                                    <Text style={styles.statNumber}>+{nextMilestoneCoins} Ł</Text>
                                    <Text style={styles.statLabel}>Next Milestone</Text>
                                </View>
                                <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                                    <Text style={styles.statNumber}>{daysLeftForNext} Days</Text>
                                    <Text style={styles.statLabel}>Until Bonus</Text>
                                </View>
                                <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                                    <Text style={styles.statNumber}>{totalStreakCoins} Ł</Text>
                                    <Text style={styles.statLabel}>Total Coins</Text>
                                </View>
                            </View>

                            {/* Progress Bar Section */}
                            <View style={[styles.progressCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                                <View style={styles.progressCardHeader}>
                                    <Text style={[styles.progressTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Milestone Progress</Text>
                                    <Text style={styles.progressPercent}>{daysInCurrentBlock} / 10 Days</Text>
                                </View>
                                <View style={styles.trackBackground}>
                                    <View style={[styles.trackFill, { width: `${(daysInCurrentBlock / 10) * 100}%` }]} />
                                </View>
                                <Text style={styles.progressSubtext}>
                                    {10 - daysInCurrentBlock} more daily order(s) needed to claim +{nextMilestoneCoins} Laro Wallet Coins!
                                </Text>
                            </View>

                            {/* 10-Day Milestone Reward Roadmap */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <MaterialCommunityIcons name="trophy-award" size={22} color="#056f36" />
                                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#0f172a', marginBottom: 0 }]}>10-Day Milestone Roadmap</Text>
                            </View>

                            <View style={styles.milestonesList}>
                                {milestones.map((m, index) => {
                                    const isReached = currentStreak >= m.day;
                                    const isNext = !isReached && currentStreak < m.day && (index === 0 || currentStreak >= milestones[index - 1].day);

                                    return (
                                        <View
                                            key={m.day}
                                            style={[
                                                styles.milestoneItem,
                                                { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' },
                                                isReached && styles.milestoneItemReached,
                                                isNext && styles.milestoneItemNext
                                            ]}
                                        >
                                            <View style={[styles.milestoneIconBox, isReached && styles.milestoneIconBoxReached]}>
                                                {isReached ? (
                                                    <Ionicons name="checkmark-circle" size={24} color="#056f36" />
                                                ) : (
                                                    <MaterialCommunityIcons name="gift-outline" size={22} color={isNext ? '#056f36' : '#94a3b8'} />
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.milestoneDayText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Day {m.day} Milestone</Text>
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
                            <View style={[styles.rulesCard, { backgroundColor: isDarkMode ? '#1e293b' : '#f0fdf4', borderColor: isDarkMode ? '#334155' : '#bbf7d0' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                    <MaterialCommunityIcons name="fire" size={20} color="#ea580c" />
                                    <Text style={styles.rulesTitle}>How Campus Streaks Work</Text>
                                </View>
                                <View style={styles.ruleRow}>
                                    <Text style={styles.ruleBullet}>•</Text>
                                    <Text style={[styles.ruleText, { color: isDarkMode ? '#cbd5e1' : '#334155' }]}>Place at least 1 food or grocery order every day to maintain your streak.</Text>
                                </View>
                                <View style={styles.ruleRow}>
                                    <Text style={styles.ruleBullet}>•</Text>
                                    <Text style={[styles.ruleText, { color: isDarkMode ? '#cbd5e1' : '#334155' }]}>Every 10 streak days (10, 20, 30 days...), bonus Laro Coins are credited automatically to your wallet.</Text>
                                </View>
                                <View style={styles.ruleRow}>
                                    <Text style={styles.ruleBullet}>•</Text>
                                    <Text style={[styles.ruleText, { color: isDarkMode ? '#cbd5e1' : '#334155' }]}>Missing a day will reset your current streak back to Day 1.</Text>
                                </View>
                            </View>

                            {/* Order Now Action CTA */}
                            <TouchableOpacity
                                style={styles.orderNowBtn}
                                onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.orderNowBtnText}>Keep Streak Alive • Order Now</Text>
                                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerLoading: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '700',
    },
    heroHeaderSection: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    topHeaderNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    topTitleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    topTitleBadgeText: {
        color: '#056f36',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    heroTextWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    heroTitleText: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.6,
        textAlign: 'center',
    },
    heroCalligraphySubText: {
        fontSize: 24,
        fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'cursive' }),
        color: '#056f36',
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    curvedSwooshWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    heroStreakCard: {
        borderRadius: 24,
        padding: 22,
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginHorizontal: 4,
    },
    flameCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#ffedd5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    heroStreakCount: {
        fontSize: 38,
        fontWeight: '900',
        color: '#ea580c',
        letterSpacing: -1,
    },
    heroStreakLabel: {
        fontSize: 11.5,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginTop: 2,
        marginBottom: 14,
    },
    personalBestPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#056f36',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        marginBottom: 14,
    },
    personalBestText: {
        color: '#ffffff',
        fontSize: 12.5,
        fontWeight: '800',
    },
    heroDescription: {
        fontSize: 13.5,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 20,
    },
    contentBody: {
        paddingHorizontal: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 16,
        fontWeight: '900',
        color: '#056f36',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },
    progressCard: {
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 22,
    },
    progressCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    progressPercent: {
        fontSize: 13,
        fontWeight: '900',
        color: '#056f36',
    },
    trackBackground: {
        height: 10,
        backgroundColor: '#e2e8f0',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 10,
    },
    trackFill: {
        height: '100%',
        backgroundColor: '#056f36',
        borderRadius: 5,
    },
    progressSubtext: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#64748b',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 14,
    },
    milestonesList: {
        gap: 10,
        marginBottom: 24,
    },
    milestoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        gap: 12,
    },
    milestoneItemReached: {
        borderColor: '#bbf7d0',
    },
    milestoneItemNext: {
        borderColor: '#056f36',
        borderWidth: 1.5,
    },
    milestoneIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    milestoneIconBoxReached: {
        backgroundColor: '#dcfce7',
    },
    milestoneDayText: {
        fontSize: 14.5,
        fontWeight: '800',
    },
    milestoneCoinsText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#056f36',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusBadgeDone: {
        backgroundColor: '#dcfce7',
    },
    statusBadgeActive: {
        backgroundColor: '#fef3c7',
    },
    statusBadgeLocked: {
        backgroundColor: '#f1f5f9',
    },
    statusBadgeText: {
        fontSize: 10.5,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statusBadgeTextDone: {
        color: '#056f36',
    },
    statusBadgeTextActive: {
        color: '#d97706',
    },
    statusBadgeTextLocked: {
        color: '#94a3b8',
    },
    rulesCard: {
        padding: 18,
        borderRadius: 20,
        borderWidth: 1.5,
        marginBottom: 20,
    },
    rulesTitle: {
        fontSize: 15.5,
        fontWeight: '800',
        color: '#056f36',
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    ruleBullet: {
        fontSize: 16,
        color: '#056f36',
        marginRight: 8,
        marginTop: -2,
    },
    ruleText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    orderNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#056f36',
        paddingVertical: 15,
        borderRadius: 24,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    orderNowBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '900',
    },
});
