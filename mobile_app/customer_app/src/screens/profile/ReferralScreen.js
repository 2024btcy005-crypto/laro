import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Share, Clipboard, ActivityIndicator, RefreshControl, StatusBar, Dimensions, Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { referralAPI } from '../../services/api';
import LaroToast from '../../components/LaroToast';
import { ReferralScreenSkeleton } from '../../components/SkeletonLoader';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ReferralScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const user = useSelector(state => state.auth.user);

    const defaultCode = user?.referralCode || (user?.id ? `LARO-${user.id.substring(0, 5).toUpperCase()}` : 'LARO-STUDENT');

    const [stats, setStats] = useState({
        referralCode: defaultCode,
        totalFriendsReferred: 0,
        completedReferralsCount: 0,
        totalEarnedCoins: 0,
        shareMessage: `Hey! 🍔🛵 Join me on Laro campus delivery app!\n\nUse my referral code:\n👉 *${defaultCode}* 👈\n\nBoth of us win *up to 50 Laro Coins (5-50 Ł)* credited automatically when you place your 1st order! 🎉`,
        friendsList: []
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchReferralStats();
    }, []);

    const fetchReferralStats = async () => {
        try {
            const res = await referralAPI.getStats();
            if (res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.log('[REFERRAL SCREEN] Syncing with client code:', defaultCode);
            setStats(prev => ({
                ...prev,
                referralCode: defaultCode,
                shareMessage: `Hey! 🍔🛵 Join me on Laro campus delivery app!\n\nUse my referral code:\n👉 *${defaultCode}* 👈\n\nBoth of us win *up to 50 Laro Coins (5-50 Ł)* credited automatically when you place your 1st order! 🎉`
            }));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCopyCode = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Clipboard.setString(stats.referralCode);
        setToastMessage(`Referral code ${stats.referralCode} copied!`);
        setToastVisible(true);
    };

    const handleShareWhatsApp = async () => {
        Haptics.selectionAsync();
        try {
            await Share.share({
                message: stats.shareMessage
            });
        } catch (err) {
            console.error('[SHARE ERROR]', err);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0b1329' : '#f4f8f5' }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0b1329' : '#f4f8f5'} />
            <LaroToast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />

            {/* Top Custom Header */}
            <View style={[styles.header, { backgroundColor: isDarkMode ? '#0b1329' : '#f4f8f5', borderBottomColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Refer & Earn</Text>
                <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
                    <Ionicons name="cart-outline" size={24} color="#056f36" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ReferralScreenSkeleton />
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReferralStats(); }} tintColor="#056f36" />
                    }
                >
                    {/* Ultra Flagship Emerald Glassmorphism Card */}
                    <View style={styles.heroCard}>
                        {/* Ambient Glowing Orbs */}
                        <View style={styles.glowOrb1} />
                        <View style={styles.glowOrb2} />

                        <View style={styles.heroHeaderRow}>
                            <View style={styles.rewardTagPill}>
                                <Ionicons name="sparkles" size={14} color="#056f36" />
                                <Text style={styles.rewardTagText}>DUAL REWARD PROGRAM</Text>
                            </View>
                            <View style={styles.giftIconBadge}>
                                <Ionicons name="gift" size={26} color="#ffffff" />
                            </View>
                        </View>

                        <Text style={styles.heroTitle}>Invite Friends & Win Up to 50 Ł</Text>
                        <Text style={styles.heroSub}>
                            Share your unique referral code with campus friends. Both of you win <Text style={{ fontWeight: '900', color: '#ffffff' }}>up to 50 Laro Coins (5 Ł - 50 Ł)</Text> automatically on their 1st delivered order!
                        </Text>

                        {/* Dual Reward Split Pod Row */}
                        <View style={styles.dualRewardRow}>
                            <View style={styles.rewardPodItem}>
                                <Text style={styles.rewardPodLabel}>YOU GET</Text>
                                <Text style={styles.rewardPodValue}>5 - 50 Ł</Text>
                            </View>

                            <View style={styles.rewardDividerDot}>
                                <Ionicons name="add-circle" size={18} color="rgba(255,255,255,0.7)" />
                            </View>

                            <View style={styles.rewardPodItem}>
                                <Text style={styles.rewardPodLabel}>FRIEND GETS</Text>
                                <Text style={styles.rewardPodValue}>5 - 50 Ł</Text>
                            </View>
                        </View>
                    </View>

                    {/* VIP Pass Ticket Referral Code Box */}
                    <View style={[styles.ticketContainer, { backgroundColor: isDarkMode ? '#172036' : '#ffffff', borderColor: isDarkMode ? '#283654' : '#e2e8f0' }]}>
                        {/* Ticket Cutouts */}
                        <View style={[styles.leftNotch, { backgroundColor: isDarkMode ? '#0b1329' : '#f4f8f5' }]} />
                        <View style={[styles.rightNotch, { backgroundColor: isDarkMode ? '#0b1329' : '#f4f8f5' }]} />

                        <Text style={styles.ticketLabel}>YOUR REFERRAL CODE PASS</Text>

                        <View style={styles.codeDisplayRow}>
                            <View style={styles.codeBox}>
                                <Text style={styles.codeText}>{stats.referralCode}</Text>
                            </View>

                            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode} activeOpacity={0.82}>
                                <Ionicons name="copy-outline" size={18} color="#056f36" />
                                <Text style={styles.copyBtnText}>Copy</Text>
                            </TouchableOpacity>
                        </View>

                        {/* WhatsApp Share Button */}
                        <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsApp} activeOpacity={0.88}>
                            <Ionicons name="logo-whatsapp" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.whatsappBtnText}>Share via WhatsApp</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Metrics Stat Counter Pods */}
                    <View style={styles.statsGrid}>
                        <View style={[styles.statPodCard, { backgroundColor: isDarkMode ? '#172036' : '#ffffff', borderColor: isDarkMode ? '#283654' : '#e2e8f0' }]}>
                            <View style={styles.statIconCircle}>
                                <Ionicons name="people" size={20} color="#056f36" />
                            </View>
                            <Text style={[styles.statValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{stats.totalFriendsReferred}</Text>
                            <Text style={styles.statTitle}>Friends Invited</Text>
                        </View>

                        <View style={[styles.statPodCard, { backgroundColor: isDarkMode ? '#172036' : '#ffffff', borderColor: isDarkMode ? '#283654' : '#e2e8f0' }]}>
                            <View style={[styles.statIconCircle, { backgroundColor: '#fdf4ff' }]}>
                                <MaterialCommunityIcons name="star-circle" size={22} color="#a855f7" />
                            </View>
                            <Text style={[styles.statValue, { color: '#056f36' }]}>+{stats.totalEarnedCoins} Ł</Text>
                            <Text style={styles.statLabelText}>Total Coins Earned</Text>
                        </View>
                    </View>

                    {/* Interactive 3-Step Flow */}
                    <View style={[styles.stepCard, { backgroundColor: isDarkMode ? '#172036' : '#ffffff', borderColor: isDarkMode ? '#283654' : '#e2e8f0' }]}>
                        <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>How Referral Rewards Work</Text>

                        <View style={styles.stepRow}>
                            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.stepHeading, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Send Your Referral Code</Text>
                                <Text style={styles.stepDescription}>Share your code with hostel roommates or friends via WhatsApp.</Text>
                            </View>
                        </View>

                        <View style={styles.connectorLine} />

                        <View style={styles.stepRow}>
                            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.stepHeading, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Friend Completes 1st Order</Text>
                                <Text style={styles.stepDescription}>Friend enters code at sign up & places their first delivered campus order.</Text>
                            </View>
                        </View>

                        <View style={styles.connectorLine} />

                        <View style={styles.stepRow}>
                            <View style={[styles.stepBadge, { backgroundColor: '#056f36' }]}><Ionicons name="checkmark" size={16} color="#fff" /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.stepHeading, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Both Win Up to 50 Laro Coins!</Text>
                                <Text style={styles.stepDescription}>Coins (5 Ł - 50 Ł) credited automatically to both wallets upon order delivery 🎉</Text>
                            </View>
                        </View>
                    </View>

                    {/* Friends History List */}
                    <View style={{ marginTop: 24 }}>
                        <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#0f172a', marginBottom: 12 }]}>
                            Invited Friends ({stats.friendsList.length})
                        </Text>

                        {stats.friendsList.length === 0 ? (
                            <View style={[styles.emptyCard, { backgroundColor: isDarkMode ? '#172036' : '#ffffff', borderColor: isDarkMode ? '#283654' : '#e2e8f0' }]}>
                                <Ionicons name="people-circle-outline" size={48} color="#94a3b8" />
                                <Text style={[styles.emptyTitleText, { color: isDarkMode ? '#cbd5e1' : '#334155' }]}>No friends invited yet</Text>
                                <Text style={styles.emptySubText}>Share your code with classmates to start earning Laro Coins together!</Text>
                            </View>
                        ) : (
                            stats.friendsList.map((friend) => (
                                <View
                                    key={friend.id}
                                    style={[styles.friendItemCard, { backgroundColor: isDarkMode ? '#172036' : '#ffffff', borderColor: isDarkMode ? '#283654' : '#e2e8f0' }]}
                                >
                                    <View style={styles.avatarBubble}>
                                        <Text style={styles.avatarBubbleText}>{friend.name.charAt(0).toUpperCase()}</Text>
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.friendNameText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{friend.name}</Text>
                                        <Text style={styles.friendDateText}>Joined {new Date(friend.joinedAt).toLocaleDateString()}</Text>
                                    </View>

                                    {friend.status === 'completed' ? (
                                        <View style={styles.completedPill}>
                                            <Ionicons name="checkmark-circle" size={14} color="#056f36" style={{ marginRight: 3 }} />
                                            <Text style={styles.completedPillText}>+5 Ł Earned</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.pendingPill}>
                                            <MaterialCommunityIcons name="clock-outline" size={14} color="#d97706" style={{ marginRight: 3 }} />
                                            <Text style={styles.pendingPillText}>Pending 1st Order</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    cartBtn: {
        padding: 6,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
    },
    heroCard: {
        backgroundColor: '#056f36',
        borderRadius: 24,
        padding: 22,
        marginBottom: 18,
        position: 'relative',
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    glowOrb1: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: -50,
        right: -40,
    },
    glowOrb2: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        bottom: -40,
        left: -30,
    },
    heroHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    rewardTagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 6,
    },
    rewardTagText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.5,
    },
    giftIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    dualRewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
        borderRadius: 16,
        padding: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    rewardPodItem: {
        flex: 1,
        alignItems: 'center',
    },
    rewardPodLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    rewardPodValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#ffffff',
    },
    rewardDividerDot: {
        paddingHorizontal: 8,
    },
    heroTitle: {
        fontSize: 21,
        fontWeight: '900',
        color: '#ffffff',
        marginBottom: 8,
        lineHeight: 28,
    },
    heroSub: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.88)',
        lineHeight: 19,
    },
    ticketContainer: {
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        marginBottom: 18,
        position: 'relative',
    },
    leftNotch: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        top: '50%',
        left: -11,
        marginTop: -10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    rightNotch: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        top: '50%',
        right: -11,
        marginTop: -10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    ticketLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#056f36',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    codeDisplayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    codeBox: {
        flex: 1,
        backgroundColor: '#f0fdf4',
        borderWidth: 2,
        borderColor: '#056f36',
        borderStyle: 'dashed',
        borderRadius: 16,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeText: {
        fontSize: 19,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 2.5,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#edf7f0',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        paddingHorizontal: 18,
        height: 52,
        borderRadius: 16,
        gap: 6,
    },
    copyBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#056f36',
    },
    whatsappBtn: {
        backgroundColor: '#25D366',
        borderRadius: 16,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    whatsappBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#ffffff',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 18,
    },
    statPodCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#edf7f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 2,
    },
    statTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    statLabelText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    stepCard: {
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 16,
    },
    stepRow: {
        flexDirection: 'row',
        gap: 14,
        alignItems: 'flex-start',
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepBadgeText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '900',
    },
    stepHeading: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 2,
    },
    stepDescription: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 16,
    },
    connectorLine: {
        width: 2,
        height: 16,
        backgroundColor: '#cbd5e1',
        marginLeft: 13,
        marginVertical: 4,
    },
    emptyCard: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        alignItems: 'center',
    },
    emptyTitleText: {
        fontSize: 15,
        fontWeight: '800',
        marginTop: 10,
        marginBottom: 4,
    },
    emptySubText: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 17,
    },
    friendItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 10,
        gap: 12,
    },
    avatarBubble: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#056f36',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarBubbleText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
    },
    friendNameText: {
        fontSize: 14,
        fontWeight: '800',
    },
    friendDateText: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    completedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    completedPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#056f36',
    },
    pendingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    pendingPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#d97706',
    },
});
