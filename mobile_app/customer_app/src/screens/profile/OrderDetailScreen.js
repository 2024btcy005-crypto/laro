import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import api from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'react-native';

const STATUS_STEPS = [
    { key: 'placed', label: 'Order Placed', timeLabel: 'We have received your order' },
    { key: 'accepted', label: 'Accepted', timeLabel: 'Shop is preparing your order' },
    { key: 'out_for_delivery', label: 'Out for Delivery', timeLabel: 'Rider is on the way' },
    { key: 'delivered', label: 'Delivered', timeLabel: 'Order reached its destination' },
];

export default function OrderDetailScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    useEffect(() => {
        fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (error) {
            console.error('[ORDER DETAIL FETCH ERROR]', error);
        } finally {
            setLoading(false);
            setRefreshing(true); // Wait, should be false
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrderDetail();
    };

    const handleCallRider = (phone) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const handleCancelOrder = () => {
        setAlertConfig({
            visible: true,
            title: 'Cancel Order?',
            message: 'Are you sure you want to cancel this order? This action cannot be undone.',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                setCancelLoading(true);
                try {
                    await api.put(`/orders/${orderId}/cancel`);
                    fetchOrderDetail();
                } catch (error) {
                    console.error('[CANCEL ORDER ERROR]', error.response?.data || error.message);
                } finally {
                    setCancelLoading(false);
                }
            }
        });
    };

    const getCurrentStatusIndex = () => {
        if (!order) return 0;
        const index = STATUS_STEPS.findIndex(s => s.key === order.status);
        if (index === -1) {
            // Special handling for intermediate statuses like 'picked' mapping to 'out_for_delivery'
            if (order.status === 'picked') return 2;
            return 0;
        }
        return index;
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingText, { color: colors.gray }]}>Loading details...</Text>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
                <Text style={{ color: colors.black }}>Order not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: COLORS.primary, marginTop: 10 }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const currentStep = getCurrentStatusIndex();
    const rider = order.delivery?.partner;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Order #{order.id.split('-')[0].toUpperCase()}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {/* OTP Card */}
                {order.deliveryOtp && !['delivered', 'cancelled'].includes(order.status) && (
                    <View style={[styles.card, { backgroundColor: COLORS.primary, alignItems: 'center', paddingVertical: 30 }]}>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Secure Delivery Code</Text>
                        <Text style={{ color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: 8 }}>{order.deliveryOtp}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 15, textAlign: 'center', paddingHorizontal: 20 }}>Please share this code with your rider to receive your order.</Text>
                    </View>
                )}

                {/* Status Card */}
                <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.black }]}>Tracking Status</Text>
                    {STATUS_STEPS.map((step, index) => {
                        const isDone = index <= currentStep;
                        const isCurrent = index === currentStep;
                        const isLast = index === STATUS_STEPS.length - 1;

                        return (
                            <View key={step.key} style={styles.statusRow}>
                                <View style={styles.trackerColumn}>
                                    <View style={[styles.dot, isDone ? styles.dotDone : [styles.dotPending, { backgroundColor: colors.border }]]} />
                                    {!isLast && <View style={[styles.line, isDone && index < currentStep ? styles.lineDone : [styles.linePending, { backgroundColor: colors.border }]]} />}
                                </View>
                                <View style={styles.statusContent}>
                                    <Text style={[styles.statusLabel, { color: colors.gray }, isDone && [styles.textDone, { color: colors.black }], isCurrent && styles.textCurrent]}>
                                        {step.label}
                                    </Text>
                                    <Text style={[styles.statusTime, { color: colors.gray }]}>{isDone ? (isCurrent ? step.timeLabel : 'Completed') : 'Pending'}</Text>
                                </View>
                                {isCurrent && (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentBadgeText}>LIVE</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Rider Info Card */}
                {rider && (
                    <View style={[styles.riderCard, isDarkMode && { backgroundColor: colors.white, shadowColor: '#000' }]}>
                        <View style={styles.riderHeader}>
                            <View style={styles.riderAvatar}>
                                <FontAwesome5 name="motorcycle" size={20} color="#fff" />
                            </View>
                            <View style={styles.riderInfo}>
                                <Text style={[styles.riderLabel, { color: isDarkMode ? colors.gray : '#94a3b8' }]}>Delivery Partner Assigned</Text>
                                <Text style={[styles.riderName, { color: isDarkMode ? colors.black : '#fff' }]}>{rider.name}</Text>
                            </View>
                            <TouchableOpacity style={styles.callBtn} onPress={() => handleCallRider(rider.phoneNumber)}>
                                <Ionicons name="call" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.safetyBanner, { borderTopColor: isDarkMode ? colors.border : 'rgba(255,255,255,0.1)' }]}>
                            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                            <Text style={styles.safetyText}>Your rider follows all safety protocols</Text>
                        </View>
                    </View>
                )}

                {/* Order Summary */}
                <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.black }]}>Order Summary</Text>
                    {order.items?.map((item, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemQty}>{item.quantity} x</Text>
                            <Text style={[styles.itemName, { color: colors.gray }]}>{item.product?.name || 'Item'}</Text>
                            <Text style={[styles.itemPrice, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat((item.priceAtTime || 0) * (item.quantity || 0)).toFixed(2)}</Text>
                        </View>
                    ))}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: colors.black }]}>Total Amount Paid</Text>
                        <Text style={[styles.totalValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}</Text>
                    </View>
                    <Text style={styles.paymentMode}>Payment via {
                        order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                            (order.paymentMethod === 'laro_coins' ? 'Laro Coins' : 'Online Payment')
                    }</Text>
                </View>

                {/* Delivery Address */}
                <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.black }]}>Delivery Details</Text>
                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.addressTitle, { color: colors.gray }]}>Drop at</Text>
                            <Text style={[styles.addressText, { color: colors.black }]}>{order.deliveryAddress}</Text>
                        </View>
                    </View>
                    <View style={[styles.detailRow, { marginTop: 15 }]}>
                        <Ionicons name="storefront" size={18} color={colors.gray} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.addressTitle, { color: colors.gray }]}>Picked from</Text>
                            <Text style={[styles.addressText, { color: colors.black }]}>{order.shop?.name || 'Laro Store'}</Text>
                            <Text style={[styles.addressTextSub, { color: colors.gray }]}>{order.shop?.address}</Text>
                        </View>
                    </View>
                </View>

                {order.status === 'placed' && (
                    <TouchableOpacity
                        style={[styles.cancelBtn, { backgroundColor: colors.white, borderColor: colors.border }, cancelLoading && { opacity: 0.7 }]}
                        onPress={handleCancelOrder}
                        disabled={cancelLoading}
                    >
                        {cancelLoading ? (
                            <ActivityIndicator color="#ef4444" />
                        ) : (
                            <Text style={styles.cancelBtnText}>Cancel Order</Text>
                        )}
                    </TouchableOpacity>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type="destructive"
                confirmText="Cancel Order"
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#64748b', fontWeight: 'bold' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    backBtn: { padding: 5, marginLeft: -5 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
    scroll: { padding: 16 },

    card: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
    },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#1a1a2e', marginBottom: 20 },

    // Tracking UI
    statusRow: { flexDirection: 'row', minHeight: 60 },
    trackerColumn: { alignItems: 'center', marginRight: 15 },
    dot: { width: 12, height: 12, borderRadius: 6, zIndex: 2 },
    dotDone: { backgroundColor: '#10b981' },
    dotPending: { backgroundColor: '#e2e8f0' },
    line: { width: 2, flex: 1, zIndex: 1, marginTop: -2, marginBottom: -2 },
    lineDone: { backgroundColor: '#10b981' },
    linePending: { backgroundColor: '#e2e8f0' },
    statusContent: { flex: 1 },
    statusLabel: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
    statusTime: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    textDone: { color: '#1a1a2e' },
    textCurrent: { color: COLORS.primary },
    currentBadge: { backgroundColor: `${COLORS.primary}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    currentBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '900' },

    // Rider Card
    riderCard: {
        backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20, marginBottom: 16,
        shadowColor: '#1a1a2e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5
    },
    riderHeader: { flexDirection: 'row', alignItems: 'center' },
    riderAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    riderInfo: { flex: 1, marginLeft: 15 },
    riderLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    riderName: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 },
    callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#24963f', justifyContent: 'center', alignItems: 'center' },
    safetyBanner: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    safetyText: { color: '#10b981', fontSize: 12, fontWeight: '700', marginLeft: 8 },

    // Summary
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    itemQty: { fontSize: 14, fontWeight: '800', color: COLORS.primary, width: 35 },
    itemName: { fontSize: 14, color: '#475569', fontWeight: '600', flex: 1 },
    itemPrice: { fontSize: 14, color: '#1a1a2e', fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: '900', color: '#1a1a2e' },
    totalValue: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
    paymentMode: { fontSize: 12, color: '#94a3b8', marginTop: 10, fontWeight: '600' },

    // Details
    detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    addressTitle: { fontSize: 12, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' },
    addressText: { fontSize: 14, color: '#1a1a2e', fontWeight: '700', marginTop: 2 },
    addressTextSub: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 1 },

    cancelBtn: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fee2e2',
        shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1
    },
    cancelBtnText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5
    }
});
