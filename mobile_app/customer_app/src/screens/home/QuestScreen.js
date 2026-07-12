import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function QuestScreen({ route, navigation }) {
    const { quest } = route.params || {};
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const { user } = useSelector(state => state.auth);
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get(`/quests/${quest.id}/leaderboard`);
                if (res.data && !res.data.isAxiosError) {
                    setLeaderboard(res.data);
                }
            } catch (err) {
                console.log('Failed to fetch quest leaderboard:', err.message);
            }
        };
        if (quest && quest.id) {
            fetchLeaderboard();
        }
    }, [quest]);

    if (!quest) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <Text style={{ color: colors.gray, textAlign: 'center', marginTop: 50 }}>Quest details not found.</Text>
            </View>
        );
    }

    const progressFraction = Math.min(quest.currentCount / quest.targetCount, 1);
    const progressPercent = Math.round(progressFraction * 100);

    const handleBack = async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e){}
        navigation.goBack();
    };

    const handleShare = async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch(e){}
    };

    const handleGoToProduct = async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch(e){}
        if (quest.product) {
            navigation.navigate('ProductDetail', { product: quest.product });
        } else {
            navigation.navigate('Main');
        }
    };

    // Render dynamic timeline items based on quest milestone progress
    const step1Count = Math.round(quest.targetCount / 3);
    const step2Count = Math.round(quest.targetCount * 2 / 3);
    const steps = [
        {
            step: 1,
            title: `${step1Count} Orders Milestone`,
            subtitle: quest.currentCount >= step1Count ? "Milestone reached! 🎉" : "Awaiting collective orders",
            status: quest.currentCount >= step1Count ? "completed" : "pending",
        },
        {
            step: 2,
            title: `${step2Count} Orders Milestone`,
            subtitle: quest.currentCount >= step2Count ? "Milestone reached! 🎉" : "Awaiting collective orders",
            status: quest.currentCount >= step2Count ? "completed" : "pending",
        },
        {
            step: 3,
            title: `${quest.targetCount} Orders Goal`,
            subtitle: quest.currentCount >= quest.targetCount ? "Communal reward unlocked! 🏆" : "Awaiting final milestone",
            status: quest.currentCount >= quest.targetCount ? "completed" : "pending",
        }
    ];

    const getQuestIcon = () => {
        const titleLower = (quest.title || '').toLowerCase();
        if (titleLower.includes('print') || titleLower.includes('xerox') || titleLower.includes('paper') || titleLower.includes('document')) {
            return <Ionicons name="document-text" size={70} color="#ffffff" />;
        }
        if (titleLower.includes('coffee') || titleLower.includes('tea') || titleLower.includes('beverage') || titleLower.includes('drink')) {
            return <FontAwesome5 name="coffee" size={70} color="#ffffff" />;
        }
        if (titleLower.includes('burger') || titleLower.includes('pizza') || titleLower.includes('food') || titleLower.includes('snack') || titleLower.includes('sandwich')) {
            return <Ionicons name="fast-food" size={70} color="#ffffff" />;
        }
        return <Ionicons name="trophy" size={70} color="#ffffff" />;
    };

    const getQuestDuration = () => {
        const createdDate = new Date(quest.createdAt || Date.now());
        const diffHrs = Math.max(0, Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60)));
        return diffHrs > 0 ? `${diffHrs}h active` : "Just started";
    };

    return (
        <View style={[styles.container, { backgroundColor: '#f4fbf4' }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.headerBtn} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quest Details</Text>
                <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={24} color="#056f36" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Visual Image Banner */}
                <View style={styles.bannerImageContainer}>
                    {/* Fallback visual illustration block */}
                    <View style={styles.vectorBackground}>
                        {/* Soft geometric circles inside vector container to make it look premium */}
                        <View style={styles.sunBg} />
                        <View style={styles.cloudBg1} />
                        <View style={styles.cloudBg2} />
                        
                        <View style={styles.coffeeCupIllustration}>
                            {getQuestIcon()}
                        </View>
                    </View>
                    
                    <View style={styles.bannerOverlay}>
                        <View style={styles.morningTag}>
                            <Text style={styles.morningTagText}>COMMUNAL CHALLENGE</Text>
                        </View>
                        <Text style={styles.bannerTitle}>{quest.title.replace("Quest: ", "")}</Text>
                    </View>
                </View>

                {/* Quest Status Card */}
                <View style={styles.statusCard}>
                    <Text style={styles.cardLabel}>QUEST STATUS</Text>
                    
                    <View style={styles.statusRow}>
                        <Text style={styles.statusValueText}>
                            {quest.currentCount >= quest.targetCount ? "Target Achieved!" : "Almost there!"}
                        </Text>
                        <View style={styles.timerRow}>
                            <Ionicons name="time-outline" size={16} color="#ef4444" style={{ marginRight: 4 }} />
                            <Text style={styles.timerText}>{getQuestDuration()}</Text>
                        </View>
                    </View>

                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>

                    <View style={styles.progressBarTextRow}>
                        <Text style={styles.progressText}>{quest.currentCount} of {quest.targetCount} orders</Text>
                        <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                    </View>
                </View>

                {/* Quest Description Card */}
                <View style={styles.descriptionCard}>
                    <Text style={styles.cardSectionTitle}>Quest Description</Text>
                    <Text style={styles.descriptionText}>{quest.description}</Text>
                </View>

                {/* Reward Box */}
                <View style={[styles.badgeBoxFull, { backgroundColor: '#faf0eb', borderColor: '#f2dcd0' }]}>
                    <View style={[styles.iconCircle, { backgroundColor: '#ffffff', marginRight: 15, marginBottom: 0 }]}>
                        <FontAwesome5 name="coins" size={18} color="#c06020" />
                    </View>
                    <View>
                        <Text style={[styles.badgeLabel, { color: '#a05020' }]}>REWARD POOL</Text>
                        <Text style={[styles.badgeValue, { color: '#c06020', fontSize: 18 }]}>{Math.round(quest.rewardAmount)} Coins</Text>
                    </View>
                </View>

                {/* Quest Steps Timeline */}
                <View style={styles.stepsSection}>
                    <Text style={styles.cardSectionTitle}>Quest Steps</Text>
                    
                    <View style={styles.timelineContainer}>
                        {steps.map((item, index) => {
                            const isLast = index === steps.length - 1;
                            const isCompleted = item.status === 'completed';

                            return (
                                <View key={item.step} style={styles.timelineItem}>
                                    {/* Left Circle + Line */}
                                    <View style={styles.timelineLeftColumn}>
                                        <View style={[
                                            styles.stepIndicatorCircle, 
                                            isCompleted ? styles.stepCompletedCircle : styles.stepPendingCircle
                                        ]}>
                                            {isCompleted ? (
                                                <Ionicons name="checkmark" size={16} color="#ffffff" />
                                            ) : (
                                                <Ionicons name="lock-closed" size={14} color="#aaaaaa" />
                                            )}
                                        </View>
                                        {!isLast && <View style={[styles.timelineConnectorLine, isCompleted && styles.timelineConnectorActive]} />}
                                    </View>

                                    {/* Right Content */}
                                    <View style={styles.timelineRightColumn}>
                                        <Text style={[styles.stepLabelText, !isCompleted && { color: '#888888' }]}>
                                            STEP {item.step}
                                        </Text>
                                        <Text style={[styles.stepTitleText, !isCompleted && { color: '#888888', fontWeight: '800' }]}>
                                            {item.title}
                                        </Text>
                                        <Text style={[styles.stepSubtitleText, !isCompleted && { color: '#aaaaaa' }]}>
                                            {item.subtitle}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Campus Leaderboard */}
                <View style={styles.leaderboardCard}>
                    <View style={styles.leaderboardHeader}>
                        <Text style={styles.leaderboardTitle}>Campus Leaderboard</Text>
                        <Text style={styles.leaderboardRank}>
                            {leaderboard.findIndex(l => l.userId === user?.id) !== -1 
                                ? `Rank #${leaderboard.findIndex(l => l.userId === user?.id) + 1}`
                                : `Rank #14`}
                        </Text>
                    </View>

                    {/* Map leaderboard list */}
                    {(leaderboard.length > 0 ? leaderboard : [
                        { userId: 'mock1', userName: 'Jordan M.', totalOrders: Math.round(quest.targetCount * 0.15) },
                        { userId: user?.id || 'mock2', userName: user?.name || 'Student', totalOrders: Math.max(1, Math.round(quest.currentCount * 0.08)) }
                    ]).slice(0, 3).map((item, index) => {
                        const isCurrentUser = item.userId === user?.id;

                        return (
                            <View key={item.userId || index} style={styles.leaderboardRow}>
                                <View style={styles.leaderboardUserLeft}>
                                    <View style={[
                                        styles.rankIndicator, 
                                        isCurrentUser ? { backgroundColor: '#ffffff' } : { backgroundColor: '#a3dda3' }
                                    ]}>
                                        {isCurrentUser ? (
                                            <Text style={[styles.rankNumText, { color: '#333333', fontSize: 8 }]}>YOU</Text>
                                        ) : (
                                            <Text style={styles.rankNumText}>{index + 1}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.leaderboardName}>{item.userName}</Text>
                                </View>
                                <Text style={styles.leaderboardScore}>
                                    {item.totalOrders} {item.totalOrders === 1 ? 'Order' : 'Orders'}
                                </Text>
                            </View>
                        );
                    })}

                    {/* Outlined Button */}
                    <TouchableOpacity style={styles.leaderboardBtn} activeOpacity={0.8}>
                        <Text style={styles.leaderboardBtnText}>View Full Leaderboard</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Find Shops Footer Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 15 }]}>
                <TouchableOpacity style={styles.findShopsBtn} onPress={handleGoToProduct} activeOpacity={0.9}>
                    <Ionicons name="cart-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.findShopsBtnText}>
                        {quest.product ? `Order ${quest.product.name}` : "Find Shops"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    headerBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#056f36',
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingBottom: 120,
    },
    bannerImageContainer: {
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 15,
    },
    vectorBackground: {
        width: '100%',
        height: '100%',
        backgroundColor: '#0c8f49', // Premium brand green
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    sunBg: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#109e53',
        right: -30,
        top: -30,
    },
    cloudBg1: {
        position: 'absolute',
        width: 180,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0a8041',
        left: -50,
        bottom: -20,
    },
    cloudBg2: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#0a8041',
        right: 40,
        bottom: -50,
    },
    coffeeCupIllustration: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(5, 50, 25, 0.3)',
    },
    morningTag: {
        backgroundColor: '#34d399',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    morningTagText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#056f36',
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
    },
    statusCard: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1.5,
        borderColor: '#e2ece2',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 2,
    },
    cardLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#888888',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    statusValueText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#056f36',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#ef4444',
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: '#eef3ee',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#00c15d',
        borderRadius: 5,
    },
    progressBarTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#555555',
    },
    progressPercentText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#056f36',
    },
    descriptionCard: {
        backgroundColor: '#f1f8f1',
        borderRadius: 22,
        padding: 20,
        marginBottom: 15,
    },
    cardSectionTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#111111',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#556655',
        lineHeight: 20,
    },
    highlightText: {
        color: '#056f36',
        fontWeight: '900',
    },
    badgeBoxFull: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1.5,
        padding: 16,
        marginBottom: 20,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    badgeLabel: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    badgeValue: {
        fontSize: 15,
        fontWeight: '900',
    },
    stepsSection: {
        marginBottom: 20,
    },
    timelineContainer: {
        marginTop: 10,
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 80,
    },
    timelineLeftColumn: {
        alignItems: 'center',
        marginRight: 15,
    },
    stepIndicatorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    stepCompletedCircle: {
        backgroundColor: '#056f36',
    },
    stepPendingCircle: {
        backgroundColor: '#e6ede6',
        borderWidth: 1.5,
        borderColor: '#cccccc',
    },
    timelineConnectorLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#cccccc',
        zIndex: 1,
    },
    timelineConnectorActive: {
        backgroundColor: '#056f36',
    },
    timelineRightColumn: {
        flex: 1,
        paddingTop: 2,
    },
    stepLabelText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    stepTitleText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#111111',
        marginBottom: 2,
    },
    stepSubtitleText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666666',
    },
    leaderboardCard: {
        backgroundColor: '#273127', // Dark charcoal-green
        borderRadius: 22,
        padding: 20,
        marginBottom: 20,
    },
    leaderboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    leaderboardTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#ffffff',
    },
    leaderboardRank: {
        fontSize: 11,
        fontWeight: '900',
        color: '#a3dda3',
    },
    leaderboardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#354035',
        padding: 12,
        borderRadius: 14,
        marginBottom: 8,
    },
    leaderboardUserLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankIndicator: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rankNumText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
    },
    leaderboardName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#ffffff',
    },
    leaderboardScore: {
        fontSize: 13,
        fontWeight: '900',
        color: '#a3dda3',
    },
    leaderboardBtn: {
        borderWidth: 1.5,
        borderColor: '#a3dda3',
        borderRadius: 14,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    leaderboardBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '900',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(244, 251, 244, 0.95)',
        paddingHorizontal: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eef3ee',
    },
    findShopsBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    findShopsBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '900',
    },
});
