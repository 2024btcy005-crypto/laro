import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    SafeAreaView, ActivityIndicator, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/api';
import { COLORS } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function DeliveryHistoryScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/delivery/history');
            setHistory(response.data);
        } catch (error) {
            console.error('[FETCH HISTORY ERROR]', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const renderHistoryItem = ({ item }) => {
        const orderDate = new Date(item.deliveredAt || item.updatedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return (
            <View style={[styles.historyCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.shopContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '10' }]}>
                            <Ionicons name="storefront" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.shopName, { color: colors.black }]}>{item.order?.shop?.name || 'Unknown Shop'}</Text>
                            <Text style={[styles.orderDate, { color: colors.gray }]}>{orderDate}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.cardInfo}>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color={colors.gray} />
                        <Text style={[styles.infoText, { color: colors.gray }]} numberOfLines={1}>{item.order?.deliveryAddress}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="receipt-outline" size={16} color={colors.gray} />
                        <Text style={[styles.infoText, { color: colors.gray }]}>Order #{item.orderId.substring(0, 8).toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: colors.border }]}>
                        <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                        <Text style={[styles.statusText, { color: colors.gray }]}>DELIVERED</Text>
                    </View>
                    <Text style={[styles.orderAmount, { color: colors.black }]}>Total: ₹{parseFloat(item.order?.totalAmount || 0).toFixed(2)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.border }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Delivery History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.gray }]}>Fetching your history...</Text>
                </View>
            ) : history.length === 0 ? (
                <View style={styles.centered}>
                    <View style={[styles.emptyIconBox, { backgroundColor: colors.white }]}>
                        <MaterialCommunityIcons name="history" size={64} color={colors.border} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.black }]}>No Deliveries Yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.gray }]}>Your completed deliveries will appear here.</Text>
                    <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.secondary }]} onPress={fetchHistory}>
                        <Text style={[styles.refreshButtonText, { color: colors.white }]}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderHistoryItem}
                    contentContainerStyle={styles.list}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900'
    },
    list: {
        padding: 20
    },
    historyCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    shopContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    },
    shopName: {
        fontSize: 16,
        fontWeight: '900'
    },
    orderDate: {
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600'
    },
    divider: {
        height: 1,
        marginVertical: 16
    },
    cardInfo: {
        gap: 10
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    orderAmount: {
        fontSize: 15,
        fontWeight: '800'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '700'
    },
    emptyIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900'
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
        fontWeight: '600'
    },
    refreshButton: {
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16
    },
    refreshButtonText: {
        fontWeight: '900',
        fontSize: 16
    }
});
