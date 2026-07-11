import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Animated, Dimensions, RefreshControl, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { orderAPI } from '../../services/api';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

export default function LaroCurrencyScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { user } = useSelector(state => state.auth);
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

            // Fetch stats
            try {
                const statsRes = await orderAPI.getUserSummary();
                setStats(statsRes.data);
            } catch (statsErr) {
                console.error('Stats fetch failed:', statsErr.message);
            }

            // Fetch history
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN').format(value || 0);
    };

    const formatTransactionDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Get specific transaction icon and styling
    const getTxIconDetails = (desc = '', type = 'credit') => {
        const lowerDesc = desc.toLowerCase();
        if (lowerDesc.includes('reward') || lowerDesc.includes('order')) {
            return {
                name: 'bag-handle',
                bg: '#e8f5e9',
                color: '#2e7d32'
            };
        } else if (lowerDesc.includes('referral') || lowerDesc.includes('bonus')) {
            return {
                name: 'person-add',
                bg: '#e8f5e9',
                color: '#2e7d32'
            };
        } else if (lowerDesc.includes('coffee') || lowerDesc.includes('cafe') || lowerDesc.includes('food') || lowerDesc.includes('redeem')) {
            return {
                name: 'cafe',
                bg: '#ffebe3',
                color: '#ff6633'
            };
        } else if (lowerDesc.includes('check-in') || lowerDesc.includes('daily')) {
            return {
                name: 'log-in',
                bg: '#e8f5e9',
                color: '#2e7d32'
            };
        }
        return {
            name: type === 'credit' ? 'arrow-down' : 'arrow-up',
            bg: type === 'credit' ? '#e8f5e9' : '#f0f4f0',
            color: type === 'credit' ? '#2e7d32' : '#666'
        };
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')}
                >
                    <Ionicons name="chevron-back" size={24} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Laro Currency</Text>
                <TouchableOpacity style={styles.headerWalletIcon} onPress={() => navigation.navigate('Loyalty')}>
                    <Ionicons name="wallet-outline" size={22} color="#056f36" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#056f36"
                    />
                }
            >
                {/* Wallet Card */}
                <Animated.View style={[styles.walletCard, { opacity: fadeAnim }]}>
                    {/* Tiny dotted grid simulation absolute overlay */}
                    <View style={styles.cardPatternOverlay} />

                    <View style={styles.walletHeader}>
                        <View style={styles.logoRow}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="sync" size={16} color="#056f36" />
                            </View>
                            <Text style={styles.logoText}>Laro</Text>
                        </View>
                    </View>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
                        <Text style={styles.balanceValue}>
                            {formatCurrency(stats.laroCurrency)} <Text style={styles.balanceCoinsText}>Coins</Text>
                        </Text>
                    </View>

                    <View style={styles.walletFooter}>
                        <View style={styles.footerCol}>
                            <Text style={styles.footerLabel}>CARD HOLDER</Text>
                            <Text style={styles.footerValue} numberOfLines={1}>{user?.name || 'Guest User'}</Text>
                        </View>
                        <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
                            <Text style={styles.footerLabel}>MOBILE NUMBER</Text>
                            <Text style={styles.footerValue}>{user?.phoneNumber || '+91 98765 43210'}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Quick Actions Panel */}
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('SendCoins', { balance: stats.laroCurrency || 0 });
                        }}
                    >
                        <View style={styles.quickActionIconWrapperGreen}>
                            <Ionicons name="paper-plane-outline" size={20} color="#056f36" style={{ transform: [{ rotate: '45deg' }] }} />
                        </View>
                        <Text style={styles.quickActionLabel}>Send</Text>
                    </TouchableOpacity>

                    <View style={styles.actionDividerLine} />

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('MyQR');
                        }}
                    >
                        <View style={styles.quickActionIconWrapperOrange}>
                            <Ionicons name="qr-code-outline" size={20} color="#ff6633" />
                        </View>
                        <Text style={styles.quickActionLabel}>My QR</Text>
                    </TouchableOpacity>
                </View>

                {/* Transaction History Header */}
                <Text style={styles.sectionTitle}>Transaction History</Text>

                {/* History List */}
                <View style={styles.historyListContainer}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#056f36" style={{ marginVertical: 30 }} />
                    ) : history && history.length > 0 ? (
                        history.slice(0, 5).map((item, idx) => {
                            const iconDetail = getTxIconDetails(item.description, item.type);
                            const isCredit = item.type === 'credit';
                            
                            return (
                                <View key={item.id} style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}>
                                    <View style={[styles.historyIconCircle, { backgroundColor: iconDetail.bg }]}>
                                        <Ionicons name={iconDetail.name} size={18} color={iconDetail.color} />
                                    </View>
                                    
                                    <View style={styles.historyDetailsCol}>
                                        <Text style={styles.historyDescText} numberOfLines={1}>{item.description}</Text>
                                        <Text style={styles.historyDateText}>{formatTransactionDate(item.createdAt)}</Text>
                                    </View>
                                    
                                    <Text style={[styles.historyAmountText, isCredit ? styles.amountCredit : styles.amountDebit]}>
                                        {isCredit ? '+' : '-'}{item.amount}
                                    </Text>
                                </View>
                            );
                        })
                    ) : (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Ionicons name="file-tray-outline" size={40} color="#ccc" />
                            <Text style={{ color: '#999', fontSize: 13, marginTop: 10, fontWeight: '700' }}>No transactions yet</Text>
                        </View>
                    )}
                </View>

                {/* View Full History Button */}
                <TouchableOpacity 
                    style={styles.viewFullHistoryBtn}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // Navigate to full list or open details page
                        Alert.alert('History', 'Full transaction logs are synced with your backend portal.');
                    }}
                >
                    <Text style={styles.viewFullHistoryText}>View Full History</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#ffffff'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#056f36' },
    headerWalletIcon: { padding: 4 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },

    walletCard: {
        backgroundColor: '#045e2d', // Deep green gradient start
        borderRadius: 24,
        padding: 24,
        height: 200,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#045e2d',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 6,
        marginBottom: 20,
        justifyContent: 'space-between'
    },
    cardPatternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 24,
        borderStyle: 'dashed'
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    logoCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900'
    },

    balanceContainer: {
        marginTop: 10
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 1.5
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: '950',
        color: '#ffffff',
        marginTop: 4
    },
    balanceCoinsText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)'
    },

    walletFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 14
    },
    footerCol: {
        flex: 1
    },
    footerLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 1
    },
    footerValue: {
        fontSize: 12,
        fontWeight: '900',
        color: '#ffffff',
        marginTop: 3
    },

    // Quick actions panel
    quickActionsContainer: {
        backgroundColor: '#f2f7f2', // Light beige-green banner background
        borderRadius: 20,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#e6ede6'
    },
    quickActionBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
    },
    quickActionIconWrapperGreen: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#e6ede6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d0dcd0'
    },
    quickActionIconWrapperOrange: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#ffebe3',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffd0bc'
    },
    quickActionLabel: {
        fontSize: 14,
        fontWeight: '850',
        color: '#111'
    },
    actionDividerLine: {
        width: 1,
        height: 30,
        backgroundColor: '#d0dcd0'
    },

    // Transaction history
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111',
        marginBottom: 16
    },
    historyListContainer: {
        borderWidth: 1,
        borderColor: '#f0f4f0',
        borderRadius: 22,
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        marginBottom: 20
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15
    },
    historyRowBorder: {
        borderTopWidth: 1,
        borderTopColor: '#f7faf7'
    },
    historyIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center'
    },
    historyDetailsCol: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center'
    },
    historyDescText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#111'
    },
    historyDateText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        marginTop: 2
    },
    historyAmountText: {
        fontSize: 14,
        fontWeight: '900'
    },
    amountCredit: { color: '#2e7d32' },
    amountDebit: { color: '#ef4444' },

    viewFullHistoryBtn: {
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 5
    },
    viewFullHistoryText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#056f36'
    }
});
