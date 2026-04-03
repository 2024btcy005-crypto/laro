import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Switch, SafeAreaView, ActivityIndicator, Alert, Modal, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/api';
import { COLORS } from '../theme';
import LaroAlert from '../components/LaroAlert';
import { useTheme } from '../context/ThemeContext';

// Real-time API data will replace these
const mockPendingOrders = [];

export default function PartnerHomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'active'
    const [isOnline, setIsOnline] = useState(true);
    const [orders, setOrders] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        confirmType: 'primary',
        onConfirm: () => { }
    });

    const [stats, setStats] = useState({ earnings: 0 });
    const [universities, setUniversities] = useState([]);
    const [showUniModal, setShowUniModal] = useState(false);
    const [selectingUni, setSelectingUni] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshAll = async () => {
        if (isOnline) {
            try {
                const [availRes, activeRes, statsRes] = await Promise.all([
                    api.get('/delivery/available-orders'),
                    api.get('/delivery/active-orders'),
                    api.get('/delivery/stats')
                ]);

                // ... (formattedAvail and formattedActive logic remains same but I'll update the whole block)
                // Format Available
                const formattedAvail = availRes.data.map(order => ({
                    id: order.id,
                    shopName: order.shop?.name || 'Unknown Shop',
                    customerName: order.customer?.name || 'Guest User',
                    customerPhone: order.customer?.phoneNumber || 'N/A',
                    shopAddress: order.shop?.address || 'Shop Address N/A',
                    deliveryAddress: order.deliveryAddress,
                    totalAmount: order.totalAmount,
                    paymentMethod: order.paymentMethod,
                    distance: 'Nearby',
                    items: order.items?.map(i => ({
                        id: i.id,
                        name: i.product?.name || 'Unknown Item',
                        quantity: i.quantity,
                        price: i.priceAtTime
                    })) || []
                }));
                setOrders(formattedAvail);

                // Format Active
                const formattedActive = activeRes.data.map(item => ({
                    id: item.order.id,
                    shopName: item.order.shop?.name || 'Unknown Shop',
                    customerName: item.order.customer?.name || 'Guest User',
                    customerPhone: item.order.customer?.phoneNumber || 'N/A',
                    shopAddress: item.order.shop?.address || 'Shop Address N/A',
                    deliveryAddress: item.order.deliveryAddress,
                    totalAmount: item.order.totalAmount,
                    paymentMethod: item.order.paymentMethod,
                    status: item.status,
                    distance: 'Ongoing',
                    items: item.order.items?.map(i => ({
                        id: i.id,
                        name: i.product?.name || 'Unknown Item',
                        quantity: i.quantity,
                        price: i.priceAtTime
                    })) || []
                }));
                setActiveOrders(formattedActive);

                // Stats
                setStats(statsRes.data);

                // Check if University is selected for the partner
                if (!statsRes.data.universityId && !showUniModal) {
                    try {
                        const uniRes = await api.get('/universities');
                        setUniversities(uniRes.data);
                        setShowUniModal(true);
                    } catch (e) {
                        console.error('Failed to fetch universities', e);
                    }
                } else if (statsRes.data.universityId && showUniModal) {
                    setShowUniModal(false);
                }

            } catch (error) {
                console.error('[PARTNER REFRESH ERROR]', error.response?.data || error.message);
            }
        } else {
            setOrders([]);
            setActiveOrders([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        let interval;

        if (isOnline) {
            setLoading(true);
            refreshAll();
            interval = setInterval(refreshAll, 5000);
        } else {
            setOrders([]);
            setActiveOrders([]);
            setLoading(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOnline, refreshTrigger]);

    const handleAcceptOrder = (order) => {
        setAlertConfig({
            visible: true,
            title: 'Accept Delivery?',
            message: `Do you want to accept the delivery for ${order.shopName} to ${order.deliveryAddress}?`,
            confirmType: 'primary',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                try {
                    setLoading(true);
                    await api.post(`/delivery/orders/${order.id}/accept`);
                    const activeRes = await api.get('/delivery/active-orders');
                    const formattedActive = activeRes.data.map(item => ({
                        id: item.order.id,
                        shopName: item.order.shop?.name || 'Unknown Shop',
                        customerName: item.order.customer?.name || 'Guest User',
                        customerPhone: item.order.customer?.phoneNumber || 'N/A',
                        shopAddress: item.order.shop?.address || 'Shop Address N/A',
                        deliveryAddress: item.order.deliveryAddress,
                        totalAmount: item.order.totalAmount,
                        status: item.status,
                        distance: 'Ongoing',
                        items: item.order.items?.map(i => ({
                            id: i.id,
                            name: i.product?.name || 'Unknown Item',
                            quantity: i.quantity,
                            price: i.priceAtTime
                        })) || []
                    }));
                    setActiveOrders(formattedActive);
                    setOrders(prev => prev.filter(o => o.id !== order.id));

                    // Show success alert
                    setTimeout(() => {
                        setAlertConfig({
                            visible: true,
                            title: 'Order Accepted!',
                            message: 'Good luck with your delivery. You can track it in the Active tab.',
                            confirmType: 'success',
                            confirmText: 'Awesome',
                            onConfirm: () => {
                                setAlertConfig(prev => ({ ...prev, visible: false }));
                                setActiveTab('active');
                            }
                        });
                    }, 500);
                } catch (error) {
                    console.error('[ACCEPT ORDER ERROR]', error.response?.data || error.message);
                    Alert.alert('Error', error.response?.data?.message || 'Could not accept order.');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleViewOrder = (order) => {
        // Ensure the order object has the deliveryAddress before navigating
        navigation.navigate('ActiveDelivery', { order });
    };

    const handleSelectUniversity = async (uniId) => {
        try {
            setSelectingUni(true);
            await api.put('/delivery/profile', { universityId: uniId });
            setShowUniModal(false);
            setRefreshTrigger(prev => prev + 1); // FORCE REFRESH STATS IMMEDIATELY
            setAlertConfig({
                visible: true,
                title: 'Campus Set!',
                message: 'You will now receive orders from this university campus.',
                confirmType: 'success',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to set university. Please try again.');
        } finally {
            setSelectingUni(false);
        }
    };

    const renderOrder = ({ item }) => {
        const isActive = activeTab === 'active';
        return (
            <View style={[styles.orderCard, { backgroundColor: colors.white, borderColor: colors.lightGray }]}>
                <View style={styles.orderHeader}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[styles.shopName, { color: colors.black }]} numberOfLines={1}>{item.shopName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Ionicons name="person" size={12} color={colors.gray} style={{ marginRight: 4 }} />
                            <Text style={[styles.customerSummary, { color: colors.gray }]} numberOfLines={1}>{item.customerName}</Text>
                        </View>
                        <Text style={[styles.orderId, { color: colors.gray }]} numberOfLines={1}>Order #{item.id} • {item.items?.length || 0} items</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.amount, { color: colors.primary }]}>₹{parseFloat(item.totalAmount || 0).toFixed(2)}</Text>
                        <View style={[
                            styles.paymentBadge,
                            item.paymentMethod === 'cod'
                                ? [styles.codBadge, { backgroundColor: isDarkMode ? '#451a03' : '#fffbeb', borderColor: isDarkMode ? '#92400e' : '#fef3c7' }]
                                : [styles.prepaidBadge, { backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4', borderColor: isDarkMode ? '#065f46' : '#bbf7d0' }]
                        ]}>
                            <Text style={[
                                styles.paymentBadgeText,
                                item.paymentMethod === 'cod'
                                    ? { color: isDarkMode ? '#fbbf24' : '#d97706' }
                                    : { color: isDarkMode ? '#34d399' : '#16a34a' }
                            ]}>
                                {item.paymentMethod === 'cod' ? 'COLLECT CASH' : 'PREPAID'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <View style={styles.detailItem}>
                        <Ionicons name="storefront-outline" size={16} color={colors.gray} />
                        <Text style={[styles.address, { color: colors.gray }]}>Pickup: {item.shopAddress}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={16} color={colors.primary} />
                        <Text style={[styles.address, { color: colors.gray }]}>Drop: {item.deliveryAddress}</Text>
                    </View>
                    {isActive ? (
                        <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={16} color={colors.gray} />
                            <Text style={styles.statusBadge}>{item.status.toUpperCase()}</Text>
                        </View>
                    ) : (
                        <View style={styles.detailItem}>
                            <Ionicons name="bicycle-outline" size={16} color={colors.gray} />
                            <Text style={[styles.distance, { color: colors.gray }]}>{item.distance}</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: colors.primary }, isActive && { backgroundColor: colors.secondary }]}
                    onPress={() => isActive ? handleViewOrder(item) : handleAcceptOrder(item)}
                >
                    <Text style={[styles.acceptButtonText, { color: colors.white }]}>{isActive ? 'Update Status' : 'Accept Order'}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Status Toggle Header */}
            <View style={[styles.topHeader, { paddingTop: insets.top + 15, backgroundColor: colors.secondary }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>Laro Partner</Text>
                    {stats.universityName && (
                        <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                            📍 {stats.universityName}
                        </Text>
                    )}
                </View>
                <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                    <View style={[styles.profileAvatar, { backgroundColor: colors.white }]}>
                        <Ionicons name="person" size={20} color={colors.primary} />
                    </View>
                </TouchableOpacity>
            </View>



            {/* Tab Switcher */}
            {isOnline && (
                <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            { backgroundColor: colors.white, borderColor: colors.lightGray },
                            activeTab === 'requests' && { backgroundColor: isDarkMode ? colors.primary + '30' : colors.secondary, borderColor: isDarkMode ? colors.primary : colors.secondary }
                        ]}
                        onPress={() => setActiveTab('requests')}
                    >
                        <Text style={[styles.tabText, { color: colors.gray }, activeTab === 'requests' && { color: isDarkMode ? colors.primary : colors.white }]}>
                            Requests ({orders.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            { backgroundColor: colors.white, borderColor: colors.lightGray },
                            activeTab === 'active' && { backgroundColor: isDarkMode ? colors.primary + '30' : colors.secondary, borderColor: isDarkMode ? colors.primary : colors.secondary }
                        ]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.tabText, { color: colors.gray }, activeTab === 'active' && { color: isDarkMode ? colors.primary : colors.white }]}>
                            My Active ({activeOrders.length})
                        </Text>
                        {activeOrders.length > 0 && <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.white }]} />}
                    </TouchableOpacity>
                </View>
            )}

            {/* Order List */}
            {!isOnline ? (
                <View style={styles.offlineMessage}>
                    <Text style={styles.offlineEmoji}>😴</Text>
                    <Text style={[styles.offlineText, { color: colors.gray }]}>Go online to receive delivery orders</Text>
                </View>
            ) : loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
            ) : (activeTab === 'requests' ? orders : activeOrders).length === 0 ? (
                <View style={styles.offlineMessage}>
                    <Text style={styles.offlineEmoji}>{activeTab === 'requests' ? '🕐' : '📦'}</Text>
                    <Text style={[styles.offlineText, { color: colors.black }]}>
                        {activeTab === 'requests' ? 'Waiting for new orders...' : 'No active orders yet'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'requests' ? orders : activeOrders}
                    keyExtractor={(item, index) => (item.id || index).toString()}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.list}
                />
            )}

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.confirmType}
                confirmText={alertConfig.confirmText || 'Confirm'}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />

            {/* University Selection Modal */}
            <Modal
                visible={showUniModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.uniModalCard, { backgroundColor: colors.white }]}>
                        <View style={styles.uniModalHeader}>
                            <MaterialCommunityIcons name="school" size={40} color={COLORS.primary} />
                            <Text style={[styles.uniModalTitle, { color: colors.black }]}>Select Your Campus</Text>
                            <Text style={[styles.uniModalSubtitle, { color: colors.gray }]}>To receive orders, please select the university you are currently operating in.</Text>
                        </View>

                        <ScrollView style={styles.uniList} showsVerticalScrollIndicator={false}>
                            {universities.map(uni => (
                                <TouchableOpacity
                                    key={uni.id}
                                    style={[styles.uniItem, { backgroundColor: colors.lightGray + '50', borderColor: colors.lightGray }]}
                                    onPress={() => handleSelectUniversity(uni.id)}
                                >
                                    <View>
                                        <Text style={[styles.uniName, { color: colors.black }]}>{uni.name}</Text>
                                        <Text style={[styles.uniAddress, { color: colors.gray }]}>{uni.address || 'Campus Hub'}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {selectingUni && (
                            <View style={styles.loaderOverlay}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 65,
        borderBottomLeftRadius: 35, borderBottomRightRadius: 35
    },
    headerTitle: { fontSize: 26, fontWeight: '900' },
    headerSubtitle: { fontSize: 13, fontWeight: '700', marginTop: 2 },
    earningsMiniBox: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
    earningsMiniLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    earningsMiniValue: { fontSize: 16, fontWeight: '900', marginTop: 2 },
    profileBtn: { padding: 5 },
    profileAvatar: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center'
    },

    offlineMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    offlineEmoji: { fontSize: 64, marginBottom: 24 },
    offlineText: { fontSize: 22, fontWeight: '900', textAlign: 'center', lineHeight: 30 },

    list: { padding: 20, paddingTop: 15 },
    orderCard: {
        borderRadius: 28, padding: 24, marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 6,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    shopName: { fontSize: 20, fontWeight: '900' },
    orderId: { fontSize: 12, marginTop: 4, fontWeight: '700' },
    customerSummary: { fontSize: 14, fontWeight: '700' },
    amount: { fontSize: 24, fontWeight: '900' },

    orderDetails: { marginBottom: 25, gap: 14 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    address: { fontSize: 15, flex: 1, fontWeight: '600', lineHeight: 22 },
    distance: { fontSize: 14, fontWeight: '700' },

    acceptButton: {
        paddingVertical: 18, borderRadius: 22, alignItems: 'center',
        shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10
    },
    acceptButtonText: { fontWeight: '900', fontSize: 18, letterSpacing: 0.8 },

    tabContainer: {
        flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, gap: 12
    },
    tab: {
        flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 18,
        borderWidth: 1
    },
    tabText: { fontSize: 14, fontWeight: '800' },
    badge: {
        position: 'absolute', top: 10, right: 15, width: 10, height: 10,
        borderRadius: 5, borderWidth: 2
    },
    statusBadge: {
        fontSize: 13, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase'
    },
    paymentBadge: {
        marginTop: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    prepaidBadge: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    codBadge: {
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    paymentBadgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    prepaidBadgeText: {
        color: '#16a34a',
    },
    codBadgeText: {
        color: '#d97706',
    },

    // University Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    uniModalCard: {
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 30,
        paddingBottom: 50,
        maxHeight: '80%',
    },
    uniModalHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    uniModalTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 15,
        marginBottom: 8,
    },
    uniModalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    uniList: {
        marginBottom: 20,
    },
    uniItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
    },
    uniName: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    uniAddress: {
        fontSize: 12,
        fontWeight: '600',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    }
});
