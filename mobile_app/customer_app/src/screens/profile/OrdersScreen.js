import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Image, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import { orderAPI } from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OrdersScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past'
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
                setOrders([]);
                return;
            }

            const formattedOrders = response.data.map(order => {
                try {
                    return {
                        id: (order.id || '').toString(),
                        store: order.shop?.name || 'Laro Store',
                        storeCategory: order.shop?.category || 'Cafe & Grill',
                        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        }) : 'Date N/A',
                        total: `${CONSTANTS.CURRENCY}${parseFloat(order.totalAmount || 0).toFixed(2)}`,
                        status: order.status || 'placed',
                        statusLabel: formatStatus(order.status || 'placed'),
                        items: order.items?.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ') || 'No items listed',
                        itemCount: order.items?.reduce((acc, curr) => acc + (curr.quantity || 1), 0) || 0
                    };
                } catch (e) {
                    return null;
                }
            }).filter(Boolean);
            setOrders(formattedOrders);
        } catch (error) {
            console.error('[Orders] Fetch error:', error.message);
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

    const handleDeletePress = (order) => {
        setAlertConfig({
            visible: true,
            title: 'Delete Order?',
            message: `Are you sure you want to remove this order from history?`,
            orderId: order.id,
            onConfirm: () => confirmDelete(order.id)
        });
    };

    const confirmDelete = async (orderId) => {
        try {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            await orderAPI.deleteOrder(orderId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            alert('Failed to delete order');
        }
    };

    const getProgressValue = (status) => {
        switch (status) {
            case 'placed': return 0.2;
            case 'accepted': return 0.5;
            case 'out_for_delivery': return 0.8;
            default: return 0.5;
        }
    };

    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

    const renderOrderItem = ({ item }) => {
        const isLive = item.status !== 'delivered' && item.status !== 'cancelled';

        if (isLive) {
            const progress = getProgressValue(item.status);
            return (
                <View style={[styles.liveCard, { borderColor: '#eef5ee' }]}>
                    <View style={styles.liveCardHeader}>
                        <View style={styles.liveStoreInfo}>
                            <View style={styles.storeIconWrapper}>
                                <Ionicons name="cafe" size={22} color="#fff" />
                            </View>
                            <View style={styles.storeTextWrapper}>
                                <Text style={styles.liveStoreName}>{item.store}</Text>
                                <Text style={styles.liveStoreSub}>{item.storeCategory} • {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}</Text>
                                <View style={styles.liveStatusRow}>
                                    <View style={styles.greenDot} />
                                    <Text style={styles.liveStatusText}>{item.statusLabel}</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.livePrice}>{item.total}</Text>
                    </View>

                    {/* Progress Tracker */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressBarWrapper}>
                            <View style={styles.progressTrackBackground} />
                            <View style={[styles.progressTrackActive, { width: `${progress * 100}%` }]} />
                            <View style={[styles.progressIndicatorCircle, { left: `${progress * 100}%` }]} />
                        </View>
                        <View style={styles.progressLabelRow}>
                            <Text style={[styles.progressLabel, progress >= 0.2 && styles.activeProgressLabel]}>Ordered</Text>
                            <Text style={[styles.progressLabel, progress >= 0.5 && styles.activeProgressLabel]}>Preparing</Text>
                            <Text style={[styles.progressLabel, progress >= 0.8 && styles.activeProgressLabel]}>Arriving</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.trackButton}
                        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                    >
                        <Ionicons name="map" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.trackButtonText}>Track Order</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Past Order Item
        return (
            <TouchableOpacity style={styles.pastCard} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
                <View style={styles.pastCardHeader}>
                    <View style={styles.pastStoreInfo}>
                        <View style={styles.pastStoreIcon}>
                            <Ionicons name="receipt-outline" size={20} color="#666" />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.pastStoreName}>{item.store}</Text>
                            <Text style={styles.pastStoreSub}>{item.date} • {item.total}</Text>
                        </View>
                    </View>
                    <Text style={[styles.pastStatus, item.status === 'cancelled' ? styles.statusCancelled : styles.statusDelivered]}>
                        {item.statusLabel}
                    </Text>
                </View>
                <Text style={styles.pastItems} numberOfLines={1}>{item.items}</Text>
                <View style={styles.pastActions}>
                    <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
                        <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePress(item)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fcfdfc" />
            
            {/* Custom Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Orders</Text>
            </View>

            {/* Custom Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'active' && styles.activeTabButton]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'past' && styles.activeTabButton]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past</Text>
                </TouchableOpacity>
            </View>

            {/* Content list */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#056f36" />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'active' ? activeOrders : pastOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#056f36" />
                    }
                    ListHeaderComponent={
                        activeTab === 'active' && activeOrders.length > 0 ? (
                            <Text style={styles.sectionTitle}>Live Status</Text>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="receipt-outline" size={60} color="#056f36" />
                            </View>
                            <Text style={styles.emptyTitle}>No orders found</Text>
                            <Text style={styles.emptySub}>
                                {activeTab === 'active' 
                                    ? "You don't have any active orders right now. Order something tasty to get started!" 
                                    : "You haven't placed any orders in the past."}
                            </Text>
                            <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')}>
                                <Text style={styles.shopBtnText}>Browse Shop</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
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
    container: { flex: 1, backgroundColor: '#fcfdfc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fcfdfc',
    },
    menuBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#111' },
    profileBtn: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#edf2ed',
        backgroundColor: '#fcfdfc',
        paddingHorizontal: 10,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#056f36',
    },
    tabText: { fontSize: 16, fontWeight: '700', color: '#666' },
    activeTabText: { color: '#056f36' },

    listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 15 },
    
    liveCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 20,
    },
    liveCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    liveStoreInfo: { flexDirection: 'row', flex: 1 },
    storeIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#34d399',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storeTextWrapper: { marginLeft: 12, flex: 1 },
    liveStoreName: { fontSize: 16, fontWeight: '900', color: '#111' },
    liveStoreSub: { fontSize: 13, color: '#666', marginTop: 2 },
    liveStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#056f36', marginRight: 6 },
    liveStatusText: { fontSize: 13, fontWeight: '700', color: '#056f36' },
    livePrice: { fontSize: 16, fontWeight: '900', color: '#056f36' },

    progressSection: { marginVertical: 20 },
    progressBarWrapper: { height: 6, backgroundColor: '#edf2ed', borderRadius: 3, position: 'relative', overflow: 'visible', marginHorizontal: 10 },
    progressTrackBackground: { ...StyleSheet.absoluteFillObject },
    progressTrackActive: { height: '100%', backgroundColor: '#50e3c2', borderRadius: 3 },
    progressIndicatorCircle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#056f36',
        position: 'absolute',
        top: -4,
        marginLeft: -7,
        borderWidth: 2,
        borderColor: '#fff',
    },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    progressLabel: { fontSize: 11, fontWeight: '700', color: '#999' },
    activeProgressLabel: { color: '#056f36' },

    trackButton: {
        backgroundColor: '#056f36',
        borderRadius: 12,
        height: 48,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    pastCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f0f4f0',
        marginBottom: 15,
    },
    pastCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pastStoreInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    pastStoreIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f4f0', justifyContent: 'center', alignItems: 'center' },
    pastStoreName: { fontSize: 15, fontWeight: '800', color: '#111' },
    pastStoreSub: { fontSize: 12, color: '#666', marginTop: 1 },
    pastStatus: { fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
    statusDelivered: { backgroundColor: '#edf5ed', color: '#056f36' },
    statusCancelled: { backgroundColor: '#fef2f2', color: '#ef4444' },
    pastItems: { fontSize: 13, color: '#666', marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#f7faf7', paddingBottom: 12 },
    pastActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
    viewDetailsBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f0f4f0', borderRadius: 8 },
    viewDetailsText: { fontSize: 12, fontWeight: '700', color: '#056f36' },
    deleteBtn: { padding: 4 },

    emptyContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#edf5ed', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 24, paddingHorizontal: 10 },
    shopBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#056f36', borderRadius: 12 },
    shopBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' }
});
