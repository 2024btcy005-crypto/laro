import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import { orderAPI } from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'react-native';

export default function OrdersScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => { },
        orderId: null
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            console.log('[Orders] Fetching orders...');
            const response = await orderAPI.getMyOrders();

            if (!response.data || !Array.isArray(response.data)) {
                console.warn('[Orders] Unexpected API response format:', response.data);
                setOrders([]);
                return;
            }

            console.log(`[Orders] Received ${response.data.length} orders`);

            // Format API response to match UI requirements
            const formattedOrders = response.data.map(order => {
                try {
                    return {
                        id: (order.id || '').toString(),
                        store: order.shop?.name || 'Laro Store',
                        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        }) : 'Date N/A',
                        total: `${CONSTANTS.CURRENCY}${parseFloat(order.totalAmount || 0).toFixed(2)}`,
                        status: formatStatus(order.status || 'placed'),
                        items: order.items?.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ') || 'No items listed'
                    };
                } catch (e) {
                    console.error('[Orders] Error formatting individual order:', e, order);
                    return null;
                }
            }).filter(Boolean);
            setOrders(formattedOrders);
        } catch (error) {
            console.error('[Orders] Fetch error:', error.message);
            if (error.response) {
                console.error('[Orders] Response error:', error.response.status, error.response.data);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            case 'placed': return 'Placed';
            case 'accepted': return 'Accepted';
            case 'out_for_delivery': return 'Out for Delivery';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusStyle = (status) => {
        const isDelivered = status === 'Delivered';
        const isNegative = status === 'Cancelled';

        return {
            fontSize: 12,
            fontWeight: '900',
            color: isDelivered ? '#24963f' : (isNegative ? '#fa3e4a' : COLORS.primary),
            backgroundColor: isDarkMode ? (isDelivered ? '#064e3b' : (isNegative ? '#450a0a' : '#1e1b4b')) : (isDelivered ? '#eaf6ef' : (isNegative ? '#fff0f1' : `${COLORS.primary}10`)),
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            overflow: 'hidden'
        };
    };

    const handleViewDetail = (orderId) => {
        navigation.navigate('OrderDetail', { orderId });
    };

    const handleDeletePress = (order) => {
        setAlertConfig({
            visible: true,
            title: 'Delete Order?',
            message: `Are you sure you want to remove this order from your history? this action cannot be undone.`,
            orderId: order.id,
            onConfirm: () => confirmDelete(order.id)
        });
    };

    const confirmDelete = async (orderId) => {
        try {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            await orderAPI.deleteOrder(orderId); // Note: Need to verify if deleteOrder exists or add it
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            console.error('[DELETE ORDER ERROR]', error);
            alert('Failed to delete order');
        }
    };

    const renderOrderItem = ({ item }) => {
        const isActive = item.status !== 'Delivered' && item.status !== 'Cancelled';

        return (
            <TouchableOpacity style={[styles.orderCard, { backgroundColor: colors.white, borderColor: colors.border }]} onPress={() => handleViewDetail(item.id)}>
                <View style={styles.orderHeader}>
                    <View style={[styles.storeAvatar, { backgroundColor: isDarkMode ? colors.background : `${COLORS.primary}05` }]}>
                        <Ionicons name="business" size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.restaurantName, { color: colors.black }]}>{item.store}</Text>
                        <Text style={[styles.orderDate, { color: colors.gray }]}>{item.date} • {item.total}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={getStatusStyle(item.status)}>{item.status}</Text>
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeletePress(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="trash-outline" size={18} color="#fa3e4a" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.itemsRow}>
                    <Ionicons name="basket-outline" size={14} color={colors.gray} style={{ marginRight: 6 }} />
                    <Text style={[styles.orderItems, { color: colors.gray }]} numberOfLines={1}>{item.items}</Text>
                </View>

                <View style={[styles.orderActions, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.reorderButton, isActive && { backgroundColor: isDarkMode ? colors.background : '#1a1a2e' }]}
                        onPress={() => handleViewDetail(item.id)}
                    >
                        <Text style={styles.reorderText}>{isActive ? 'Track Order' : 'View Details'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.helpButton, { backgroundColor: isDarkMode ? colors.background : '#f8f9fa', borderColor: colors.border }]}>
                        <Text style={[styles.helpText, { color: colors.black }]}>Help</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
                <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={26} color={colors.black} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.black }]}>Your Orders</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[styles.loadingText, { color: colors.gray }]}>Fetching your orders...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={26} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Your Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            {orders.length > 0 ? (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                    }
                />
            ) : (
                <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? colors.white : `${COLORS.primary}05` }]}>
                        <Ionicons name="receipt-outline" size={80} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.black }]}>No orders yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.gray }]}>Look like you haven't placed any orders yet. Let's find something delicious!</Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                    >
                        <Text style={styles.browseButtonText}>Go Shopping</Text>
                    </TouchableOpacity>
                </View>
            )}

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type="destructive"
                confirmText="Delete"
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#666', fontWeight: '600' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#1c1c1c', letterSpacing: -0.5 },

    listContent: { padding: 15, paddingBottom: 40 },
    orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f5f5f5' },
    orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    storeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${COLORS.primary}05`, justifyContent: 'center', alignItems: 'center' },
    restaurantName: { fontSize: 15, fontWeight: '900', color: '#1c1c1c', marginBottom: 2 },
    orderDate: { fontSize: 12, color: '#888', fontWeight: '500' },
    itemsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    orderItems: { fontSize: 13, color: '#666', fontWeight: '500' },

    orderActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f8f8f8', paddingTop: 15, gap: 12 },
    reorderButton: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    reorderText: { color: '#fff', fontWeight: '900', fontSize: 14 },
    helpButton: { flex: 1, backgroundColor: '#f8f9fa', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    helpText: { color: '#1c1c1c', fontWeight: 'bold', fontSize: 14 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
    emptyIconContainer: { width: 150, height: 150, borderRadius: 75, backgroundColor: `${COLORS.primary}05`, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a2e', marginBottom: 12, textAlign: 'center' },
    emptySubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, marginBottom: 35 },
    browseButton: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
    browseButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    deleteBtn: {
        marginTop: 8,
        padding: 4,
    }
});
