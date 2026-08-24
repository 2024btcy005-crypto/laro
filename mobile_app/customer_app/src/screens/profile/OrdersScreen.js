import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Image, StatusBar, Dimensions, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import { orderAPI, resolveImageUrl } from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';
import Svg, { Path } from 'react-native-svg';
import { OrderCardSkeleton } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

export default function OrdersScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past'
    const [containerWidth, setContainerWidth] = useState(0);

    const slideAnim = useRef(new Animated.Value(0)).current;

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        Animated.spring(slideAnim, {
            toValue: tab === 'active' ? 0 : 1,
            useNativeDriver: true,
            tension: 68,
            friction: 9
        }).start();
    };

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
                        storeImage: order.shop?.imageUrl || order.shop?.image || null,
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

    const getStepState = (status) => {
        switch (status) {
            case 'placed': return { step: 1, label: 'Order Confirmed', color: '#d97706', sub: 'Preparing soon' };
            case 'accepted': return { step: 2, label: 'Kitchen Preparing', color: '#0284c7', sub: 'Food being cooked' };
            case 'out_for_delivery': return { step: 3, label: 'Out for Delivery', color: '#056f36', sub: 'Rider is on the way!' };
            default: return { step: 1, label: 'Order Placed', color: '#056f36', sub: 'Processing...' };
        }
    };

    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

    const renderOrderItem = ({ item }) => {
        const isLive = item.status !== 'delivered' && item.status !== 'cancelled';

        if (isLive) {
            const stepInfo = getStepState(item.status);
            const currentStep = stepInfo.step;

            return (
                <View style={[
                    styles.liveCard, 
                    { 
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0' 
                    }
                ]}>
                    {/* Top Header Row */}
                    <View style={styles.liveCardHeaderRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={[styles.liveStoreName, { color: isDarkMode ? '#fff' : '#111827' }]} numberOfLines={1}>
                                {item.store}
                            </Text>
                            <Text style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '600', marginTop: 2 }}>
                                {item.storeCategory} • {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
                            </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 17, fontWeight: '900', color: '#056f36' }}>{item.total}</Text>
                            <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#9ca3af', fontWeight: '700', marginTop: 1 }}>
                                #{item.id.split('-')[0].toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Live Status Pill Header */}
                    <View style={[styles.statusPillHeader, { backgroundColor: `${stepInfo.color}15`, borderColor: `${stepInfo.color}30` }]}>
                        <View style={[styles.pulseDotLive, { backgroundColor: stepInfo.color }]} />
                        <Text style={[styles.statusPillText, { color: stepInfo.color }]}>
                            {stepInfo.label}
                        </Text>
                        <Text style={[styles.statusPillSub, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                            • {stepInfo.sub}
                        </Text>
                    </View>

                    {/* Modern 3-Node Stepper Progress Bar */}
                    <View style={styles.stepperContainer}>
                        {/* Background Track */}
                        <View style={[styles.stepperTrackBg, { backgroundColor: isDarkMode ? '#334155' : '#e2e8f0' }]} />
                        {/* Active Track */}
                        <View style={[
                            styles.stepperTrackActive, 
                            { width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }
                        ]} />

                        {/* Step 1 Node: Ordered */}
                        <View style={styles.stepperNodeCol}>
                            <View style={[
                                styles.stepperNode, 
                                currentStep >= 1 ? styles.stepperNodeActive : [styles.stepperNodeInactive, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]
                            ]}>
                                <Ionicons name="checkmark-sharp" size={12} color={currentStep >= 1 ? "#fff" : "#94a3b8"} />
                            </View>
                            <Text style={[styles.stepperNodeLabel, currentStep >= 1 && styles.stepperNodeLabelActive]}>Ordered</Text>
                        </View>

                        {/* Step 2 Node: Preparing */}
                        <View style={styles.stepperNodeCol}>
                            <View style={[
                                styles.stepperNode, 
                                currentStep >= 2 ? styles.stepperNodeActive : [styles.stepperNodeInactive, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]
                            ]}>
                                <MaterialCommunityIcons name="chef-hat" size={13} color={currentStep >= 2 ? "#fff" : "#94a3b8"} />
                            </View>
                            <Text style={[styles.stepperNodeLabel, currentStep >= 2 && styles.stepperNodeLabelActive]}>Preparing</Text>
                        </View>

                        {/* Step 3 Node: Arriving */}
                        <View style={styles.stepperNodeCol}>
                            <View style={[
                                styles.stepperNode, 
                                currentStep >= 3 ? styles.stepperNodeActive : [styles.stepperNodeInactive, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]
                            ]}>
                                <Ionicons name="bicycle" size={13} color={currentStep >= 3 ? "#fff" : "#94a3b8"} />
                            </View>
                            <Text style={[styles.stepperNodeLabel, currentStep >= 3 && styles.stepperNodeLabelActive]}>On The Way</Text>
                        </View>
                    </View>

                    {/* Primary CTA Button */}
                    <TouchableOpacity 
                        style={styles.trackButton}
                        onPress={() => {
                            navigation.navigate('OrderDetail', { orderId: item.id });
                        }}
                        activeOpacity={0.88}
                    >
                        <Ionicons name="navigate-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.trackButtonText}>Track Live Order</Text>
                        <Ionicons name="chevron-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            );
        }

const StoreImage = ({ imageUrl }) => {
            const [imageError, setImageError] = useState(false);
            if (!imageUrl || imageError) {
                return <Ionicons name="receipt-outline" size={20} color={isDarkMode ? '#94a3b8' : '#666'} />;
            }
            return (
                <Image
                    source={{ uri: resolveImageUrl(imageUrl) }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                    onError={() => setImageError(true)}
                />
            );
        };

        // Past Order Item
        return (
            <TouchableOpacity 
                style={[
                    styles.pastCard, 
                    { 
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                        borderColor: isDarkMode ? '#334155' : '#f1f5f9' 
                    }
                ]} 
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                activeOpacity={0.85}
            >
                <View style={styles.pastCardHeader}>
                    <View style={styles.pastStoreInfo}>
                        <View style={[styles.pastStoreIcon, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', overflow: 'hidden' }]}>
                            <StoreImage imageUrl={item.storeImage} />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={[styles.pastStoreName, { color: isDarkMode ? '#ffffff' : '#111827' }]}>{item.store}</Text>
                            <Text style={[styles.pastStoreSub, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>{item.date} • {item.total}</Text>
                        </View>
                    </View>
                    <Text style={[styles.pastStatus, item.status === 'cancelled' ? styles.statusCancelled : styles.statusDelivered]}>
                        {item.statusLabel}
                    </Text>
                </View>
                <Text style={[styles.pastItems, { color: isDarkMode ? '#cbd5e1' : '#666' }]} numberOfLines={1}>{item.items}</Text>
                <View style={styles.pastActions}>
                    <TouchableOpacity 
                        style={[styles.viewDetailsBtn, { backgroundColor: isDarkMode ? '#0f172a' : '#f0fdf4', borderColor: isDarkMode ? '#334155' : '#bbf7d0' }]} 
                        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                    >
                        <Text style={[styles.viewDetailsText, { color: '#056f36' }]}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: isDarkMode ? '#334155' : '#fef2f2' }]} onPress={() => handleDeletePress(item)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0f172a' : '#fcfdfc'} />
            
            {/* Custom Header */}
            <View style={[styles.header, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#1a1a2e' }]}>Your Orders</Text>
                    <View style={styles.curvedSwooshWrapperHeader}>
                        <Svg width={140} height={14} viewBox="0 0 140 14" fill="none">
                            <Path
                                d="M 4,5 Q 70,1 135,6 C 141,7 137,12 115,12"
                                stroke="#056f36"
                                strokeWidth={2}
                                strokeLinecap="round"
                            />
                        </Svg>
                    </View>
                </View>
                <TouchableOpacity 
                    style={styles.cartIcon} 
                    onPress={() => {
                        navigation.navigate('Cart');
                    }}
                >
                    <Ionicons name="cart-outline" size={26} color="#056f36" />
                </TouchableOpacity>
            </View>

            {/* Ultra-Premium Segmented Tab Selector with Spring Slide Animation */}
            <View 
                style={[
                    styles.segmentContainer, 
                    { backgroundColor: isDarkMode ? '#1e293b' : '#f0fdf4', borderColor: isDarkMode ? '#334155' : '#dcfce7' }
                ]}
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
                {containerWidth > 0 && (
                    <Animated.View 
                        style={[
                            styles.animatedSlidingPill,
                            {
                                width: (containerWidth - 10) / 2,
                                backgroundColor: activeTab === 'active' ? '#056f36' : (isDarkMode ? '#0f172a' : '#ffffff'),
                                borderColor: activeTab === 'active' ? '#056f36' : (isDarkMode ? '#334155' : '#e2e8f0'),
                                transform: [{
                                    translateX: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, (containerWidth - 10) / 2]
                                    })
                                }]
                            }
                        ]}
                    />
                )}

                <TouchableOpacity 
                    style={styles.segmentBtn}
                    onPress={() => handleTabChange('active')}
                    activeOpacity={0.85}
                >
                    {activeTab === 'active' ? (
                        <View style={styles.pulseDot} />
                    ) : (
                        <Ionicons name="time-outline" size={16} color={isDarkMode ? "#94a3b8" : "#475569"} />
                    )}
                    <Text style={[
                        styles.segmentText, 
                        { color: isDarkMode ? '#94a3b8' : '#475569' }, 
                        activeTab === 'active' && styles.segmentTextActivePrimary
                    ]}>
                        Active Orders
                    </Text>
                    <View style={[
                        styles.badge, 
                        activeTab === 'active' ? styles.activeBadgePrimary : styles.inactiveBadge
                    ]}>
                        <Text style={[
                            styles.badgeText, 
                            activeTab === 'active' ? styles.activeBadgeTextPrimary : styles.inactiveBadgeText
                        ]}>
                            {activeOrders.length}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.segmentBtn}
                    onPress={() => handleTabChange('past')}
                    activeOpacity={0.85}
                >
                    <Ionicons 
                        name={activeTab === 'past' ? "receipt" : "receipt-outline"} 
                        size={16} 
                        color={activeTab === 'past' ? "#056f36" : (isDarkMode ? "#94a3b8" : "#475569")} 
                    />
                    <Text style={[
                        styles.segmentText, 
                        { color: isDarkMode ? '#94a3b8' : '#475569' }, 
                        activeTab === 'past' && styles.segmentTextActiveSecondary
                    ]}>
                        Past History
                    </Text>
                    <View style={[
                        styles.badge, 
                        activeTab === 'past' ? styles.activeBadgeSecondary : styles.inactiveBadge
                    ]}>
                        <Text style={[
                            styles.badgeText, 
                            activeTab === 'past' ? styles.activeBadgeTextSecondary : styles.inactiveBadgeText
                        ]}>
                            {pastOrders.length}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Content list */}
            {loading ? (
                <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
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
                            <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
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
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 10,
        backgroundColor: '#fcfdfc',
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'cursive' }),
        fontWeight: '700',
        color: '#056f36',
        letterSpacing: 0.5,
    },
    curvedSwooshWrapperHeader: {
        marginTop: 2,
        marginLeft: 2,
    },
    cartIcon: { padding: 4 },
    
    segmentContainer: {
        flexDirection: 'row',
        borderRadius: 24,
        padding: 5,
        marginHorizontal: 20,
        marginVertical: 12,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    animatedSlidingPill: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 5,
        borderRadius: 20,
        borderWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    segmentBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 20,
        gap: 7,
        zIndex: 2,
    },
    segmentBtnActivePrimary: {
        backgroundColor: '#056f36',
    },
    segmentBtnActiveSecondary: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80',
        borderWidth: 1.5,
        borderColor: '#ffffff',
    },
    segmentText: {
        fontSize: 13.5,
        fontWeight: '700',
        letterSpacing: -0.1,
    },
    segmentTextActivePrimary: {
        color: '#ffffff',
        fontWeight: '900',
    },
    segmentTextActiveSecondary: {
        color: '#056f36',
        fontWeight: '900',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    activeBadgePrimary: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    activeBadgeSecondary: {
        backgroundColor: '#e6f7ed',
    },
    inactiveBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '900',
    },
    activeBadgeTextPrimary: {
        color: '#ffffff',
    },
    activeBadgeTextSecondary: {
        color: '#056f36',
    },
    inactiveBadgeText: {
        color: '#64748b',
    },
    listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 15 },
    
    liveCard: {
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    liveCardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    liveStoreName: { fontSize: 16, fontWeight: '900' },
    statusPillHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 18,
        alignSelf: 'flex-start',
    },
    pulseDotLive: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusPillText: {
        fontSize: 12.5,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    statusPillSub: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    stepperContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    stepperTrackBg: {
        position: 'absolute',
        top: 13,
        left: 20,
        right: 20,
        height: 4,
        borderRadius: 2,
    },
    stepperTrackActive: {
        position: 'absolute',
        top: 13,
        left: 20,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#056f36',
    },
    stepperNodeCol: {
        alignItems: 'center',
        zIndex: 2,
    },
    stepperNode: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    stepperNodeActive: {
        backgroundColor: '#056f36',
        elevation: 3,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    stepperNodeInactive: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    stepperNodeLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
    },
    stepperNodeLabelActive: {
        color: '#056f36',
        fontWeight: '900',
    },

    trackButton: {
        backgroundColor: '#056f36',
        borderRadius: 14,
        height: 46,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },

    pastCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f0f4f0',
        marginBottom: 15,
        overflow: 'hidden',
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

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 24,
    },
    emptyIconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#f0fdf4',
        borderWidth: 1.5,
        borderColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySub: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    shopBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#056f36',
        borderRadius: 24,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    shopBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '800',
    }
});
