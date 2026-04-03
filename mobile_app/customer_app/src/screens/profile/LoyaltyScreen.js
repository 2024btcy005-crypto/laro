import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import { orderAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

const TIER_CONFIG = [
    { level: 'Learner', min: 0, next: 100, color: '#94a3b8', icon: 'book-open-variant', perks: ['Standard Laro Support', 'Birthday Rewards'] },
    { level: 'Explorer', min: 100, next: 300, color: '#3b82f6', icon: 'compass-outline', perks: ['Priority Delivery', 'Explorer Badge', 'Early Shop Access'] },
    { level: 'Pro', min: 300, next: 1000, color: '#8b5cf6', icon: 'shield-star-outline', perks: ['Zero Handling Fee', 'Mystery Munchies Access', 'Pro Support'] },
    { level: 'Legend', min: 1000, next: Infinity, color: '#fbbf24', icon: 'crown-outline', perks: ['5% Permanent Medicine Discount', 'Flash Support', 'Exclusive Gold Profile', 'VIP Event Invites'] }
];

export default function LoyaltyScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const [stats, setStats] = React.useState({ loyaltyPoints: 0, loyaltyLevel: 'Learner' });
    const [loading, setLoading] = React.useState(true);
    const progressAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        fetchLoyaltyData();
    }, []);

    const fetchLoyaltyData = async () => {
        try {
            const res = await orderAPI.getUserSummary();
            setStats(res.data);

            // Calculate progress for animation
            const currentTier = TIER_CONFIG.find(t => t.level === res.data.loyaltyLevel) || TIER_CONFIG[0];
            if (currentTier.level !== 'Legend') {
                const totalInTier = currentTier.next - currentTier.min;
                const progressInTier = res.data.loyaltyPoints - currentTier.min;
                const percentage = Math.min(Math.max(progressInTier / totalInTier, 0), 1);

                Animated.timing(progressAnim, {
                    toValue: percentage,
                    duration: 1500,
                    useNativeDriver: false,
                }).start();
            }
        } catch (err) {
            console.error('Failed to fetch loyalty:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentTier = TIER_CONFIG.find(t => t.level === stats.loyaltyLevel) || TIER_CONFIG[0];
    const nextTier = TIER_CONFIG[TIER_CONFIG.indexOf(currentTier) + 1];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDarkMode ? colors.background : '#f8f9fa' }]}>
                    <Ionicons name="chevron-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Laro Milestones</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Points Card */}
                <View style={[styles.mainCard, { backgroundColor: colors.white, borderColor: isDarkMode ? colors.border : currentTier.color + '40' }]}>
                    <View style={[styles.tierIconContainer, { backgroundColor: currentTier.color + '15' }]}>
                        <MaterialCommunityIcons name={currentTier.icon} size={40} color={currentTier.color} />
                    </View>
                    <Text style={[styles.currentLevelLabel, { color: colors.gray }]}>Laro {stats.loyaltyLevel}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={[styles.pointsValue, { color: COLORS.primary }]}>{stats.loyaltyPoints || 0}</Text>
                        <Text style={[styles.pointsLabel, { fontSize: 24, textTransform: 'none', color: colors.gray }]}>{CONSTANTS.LOYALTY_SYMBOL}</Text>
                    </View>
                    <Text style={[styles.pointsLabel, { color: colors.gray }]}>TOTAL TIER PROGRESS</Text>

                    <TouchableOpacity
                        style={styles.walletShortcut}
                        onPress={() => navigation.navigate('LaroCurrency')}
                    >
                        <MaterialCommunityIcons name="star-circle" size={18} color={COLORS.primary} />
                        <Text style={styles.walletShortcutText}>View Laro Wallet (Ł {stats.laroCurrency || 0})</Text>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                    </TouchableOpacity>

                    {currentTier.level !== 'Legend' && nextTier ? (
                        <View style={styles.progressSection}>
                            <View style={styles.progressInfo}>
                                <Text style={[styles.progressText, { color: colors.gray }]}>Next: Laro {nextTier.level}</Text>
                                <Text style={[styles.progressText, { color: colors.gray }]}>{nextTier.min - (stats.loyaltyPoints || 0)} more {CONSTANTS.LOYALTY_SYMBOL}</Text>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }]}>
                                <Animated.View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            backgroundColor: currentTier.color,
                                            width: progressAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%']
                                            })
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.legendStatus, { backgroundColor: '#fef3c7' }]}>
                            <MaterialIcons name="workspace-premium" size={20} color="#fbbf24" />
                            <Text style={styles.legendStatusText}>Maximum Level Reached</Text>
                        </View>
                    )}
                </View>

                {/* perks Section */}
                <Text style={[styles.sectionTitle, { color: colors.gray }]}>YOUR BENEFITS</Text>
                <View style={styles.perksContainer}>
                    {currentTier.perks.map((perk, index) => (
                        <View key={index} style={styles.perkRow}>
                            <View style={[styles.perkDot, { backgroundColor: currentTier.color }]} />
                            <Text style={styles.perkText}>{perk}</Text>
                        </View>
                    ))}
                </View>

                {/* Tier Roadmap */}
                <Text style={[styles.sectionTitle, { color: colors.gray }]}>MILESTONE ROADMAP</Text>
                {TIER_CONFIG.map((tier, index) => (
                    <View key={index} style={[styles.tierCard, { backgroundColor: colors.white, borderColor: colors.border }, stats.loyaltyLevel === tier.level && [styles.activeTierCard, { backgroundColor: isDarkMode ? '#1e1b4b' : '#f0f9ff' }]]}>
                        <View style={[styles.tierCardIcon, { backgroundColor: tier.color + '10' }]}>
                            <MaterialCommunityIcons name={tier.icon} size={24} color={tier.color} />
                        </View>
                        <View style={styles.tierCardInfo}>
                            <Text style={[styles.tierCardLevel, { color: colors.black }]}>Laro {tier.level}</Text>
                            <Text style={[styles.tierCardThreshold, { color: colors.gray }]}>{tier.min === 0 ? 'Welcome Tier' : `${tier.min}+ ${CONSTANTS.LOYALTY_SYMBOL}`}</Text>
                        </View>
                        {stats.loyaltyPoints >= tier.min ? (
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                        ) : (
                            <Ionicons name="lock-closed-outline" size={20} color={colors.gray} />
                        )}
                    </View>
                ))}

                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? colors.white : '#f8fafc' }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.gray} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.infoBoxText, { color: colors.gray }]}>• Earn 1 {CONSTANTS.LOYALTY_SYMBOL} for every ₹10 spent (Tier Progress)</Text>
                        <Text style={[styles.infoBoxText, { color: colors.gray }]}>• Earn 1 Ł for every ₹20 spent (Spendable Balance)</Text>
                        <Text style={[styles.infoBoxText, { color: colors.gray }]}>Pay for orders using your {CONSTANTS.CURRENCY_NAME} balance at Checkout.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.5 },
    scrollContent: { padding: 20, paddingBottom: 100 },

    mainCard: { backgroundColor: '#fff', borderRadius: 32, padding: 30, alignItems: 'center', marginBottom: 30, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.05, shadowRadius: 25, elevation: 8 },
    tierIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    currentLevelLabel: { fontSize: 16, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
    pointsValue: { fontSize: 56, fontWeight: '900', color: '#1a1a2e', marginTop: -5 },
    pointsLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 10 },
    walletShortcut: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.background,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 14,
        marginTop: 10,
        borderWidth: 1,
        borderColor: COLORS.secondary
    },
    walletShortcutText: { fontSize: 13, color: COLORS.primary, fontWeight: '800' },

    progressSection: { width: '100%', marginTop: 25 },
    progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
    progressBarBg: { width: '100%', height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 5 },

    legendStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 20 },
    legendStatusText: { color: '#92400e', fontSize: 14, fontWeight: '800' },

    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },

    perksContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#f1f5f9' },
    perkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    perkDot: { width: 6, height: 6, borderRadius: 3, marginRight: 12 },
    perkText: { fontSize: 15, color: '#334155', fontWeight: '600' },

    tierCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 22, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    activeTierCard: { borderColor: COLORS.primary, backgroundColor: '#f0f9ff', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    tierCardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    tierCardInfo: { flex: 1 },
    tierCardLevel: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
    tierCardThreshold: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },

    infoBox: { flexDirection: 'row', gap: 12, backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, marginTop: 20 },
    infoBoxText: { flex: 1, fontSize: 13, color: '#64748b', fontWeight: '500', lineHeight: 18 }
});
