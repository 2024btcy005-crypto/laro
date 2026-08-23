import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, RefreshControl, Image, StatusBar, Dimensions, Modal, Animated, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS, CONSTANTS } from '../../theme';
import api, { resolveImageUrl } from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';
import { OrderDetailScreenSkeleton } from '../../components/SkeletonLoader';
import { DeliveryLiveStatus } from '../../services/deliveryLiveStatus';
import LiveStatusPermissionModal, { requestNotificationPermissionsAsync } from '../../components/LiveStatusPermissionModal';

const { width } = Dimensions.get('window');

export default function OrderDetailScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [receiptVisible, setReceiptVisible] = useState(false);
    const [permModalVisible, setPermModalVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchOrderDetail();

        // Pulsing Flame / Radar Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.12,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();

        // Check & prompt for Live Status system permissions
        requestNotificationPermissionsAsync().then(granted => {
            if (!granted) {
                setPermModalVisible(true);
            }
        });
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            if (response.data) {
                setOrder(response.data);

                // Sync Android System Live Delivery Status
                const dbStatus = response.data.status;
                const mappedStatus = dbStatus === 'placed' ? 'PLACED' :
                                     dbStatus === 'accepted' ? 'CONFIRMED' :
                                     dbStatus === 'picked' ? 'PICKED_UP' :
                                     dbStatus === 'out_for_delivery' ? 'ON_THE_WAY' :
                                     dbStatus === 'delivered' ? 'DELIVERED' :
                                     dbStatus === 'cancelled' ? 'CANCELLED' : 'ON_THE_WAY';

                const liveData = {
                    orderId: response.data.id,
                    restaurantName: response.data.Shop ? response.data.Shop.name : 'Laro Kitchen',
                    deliveryPartnerName: 'Arun',
                    status: mappedStatus,
                    etaMinutes: 15,
                    progress: dbStatus === 'delivered' ? 1.0 : 0.6,
                    deepLink: `laro://order/${response.data.id}`
                };

                if (dbStatus === 'delivered') {
                    DeliveryLiveStatus.end(liveData);
                } else if (dbStatus === 'cancelled') {
                    DeliveryLiveStatus.cancel(response.data.id);
                } else {
                    DeliveryLiveStatus.update(liveData);
                }
            }
        } catch (error) {
            console.error('[ORDER DETAIL FETCH ERROR]', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const simulateNextStatus = async () => {
        if (!order) return;
        const stages = [
            { status: 'PREPARING', eta: 25, progress: 0.25 },
            { status: 'ON_THE_WAY', eta: 12, progress: 0.65 },
            { status: 'NEARBY', eta: 2, progress: 0.90 },
            { status: 'DELIVERED', eta: 0, progress: 1.0 }
        ];

        const currentStageIdx = stages.findIndex(s => s.status === order._simStatus) ?? -1;
        const nextStage = stages[(currentStageIdx + 1) % stages.length];

        setOrder(prev => ({ ...prev, _simStatus: nextStage.status }));

        const liveData = {
            orderId: order.id,
            restaurantName: order.Shop ? order.Shop.name : 'Laro Kitchen',
            deliveryPartnerName: 'Arun (Driver)',
            status: nextStage.status,
            etaMinutes: nextStage.eta,
            progress: nextStage.progress,
            deepLink: `laro://order/${order.id}`
        };

        if (nextStage.status === 'DELIVERED') {
            await DeliveryLiveStatus.end(liveData);
        } else {
            await DeliveryLiveStatus.update(liveData);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrderDetail();
    };

    const handleCallRider = (phone) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            setAlertConfig({
                visible: true,
                title: 'Rider Not Assigned Yet',
                message: 'A delivery partner has not accepted your order yet. The call button will directly dial your rider as soon as a delivery partner accepts!',
                confirmText: 'Got It',
                confirmType: 'primary',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
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

    const formatOrderTime = (timeStr, offsetMinutes = 0) => {
        if (!timeStr) return '';
        const d = new Date(timeStr);
        if (offsetMinutes > 0) {
            d.setMinutes(d.getMinutes() + offsetMinutes);
        }
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    if (loading) {
        return <OrderDetailScreenSkeleton />;
    }

    if (!order) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
                <Text style={{ color: '#666', fontWeight: 'bold' }}>Order not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
                    <Text style={{ color: '#056f36', fontWeight: '800' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const heroBgColor = isDarkMode ? '#0f172a' : '#f0fdf4';
    const rider = order.delivery?.partner;
    const itemsCount = order.items?.reduce((acc, curr) => acc + (curr.quantity || 1), 0) || 0;

    // Split address into lines
    const addressParts = order.deliveryAddress ? order.deliveryAddress.split(',').map(p => p.trim()) : [];
    const mainAddressTitle = addressParts[0] || 'Your Location';
    const detailAddressSub = addressParts.slice(1).join(', ') || 'Within Campus Area';

    // Format OTP spacing
    const formattedOtp = order.deliveryOtp ? order.deliveryOtp.toString().split('').join(' ') : '8 8 2 1';

    // Dynamic arrival minutes based on status
    let statusText = "Preparing Order";
    let arrivalText = "Arriving soon";
    let statusIconName = "fast-food";
    let activeStepIndex = 1;

    if (order.status === 'placed') {
        statusText = `Preparing at ${order.Shop?.name || 'Shop'}`;
        arrivalText = "Arriving in approx. 15 mins";
        statusIconName = "bag-handle";
        activeStepIndex = 0;
    } else if (order.status === 'accepted') {
        statusText = "Preparing your food";
        arrivalText = "Arriving in approx. 10 mins";
        statusIconName = "restaurant";
        activeStepIndex = 1;
    } else if (order.status === 'out_for_delivery') {
        statusText = `Heading to ${mainAddressTitle}`;
        arrivalText = "Arriving in approx. 4 mins";
        statusIconName = "bicycle";
        activeStepIndex = 2;
    } else if (order.status === 'delivered') {
        statusText = "Order Delivered";
        arrivalText = "Enjoy your meal!";
        statusIconName = "checkmark-circle";
        activeStepIndex = 3;
    } else if (order.status === 'cancelled') {
        statusText = "Order Cancelled";
        arrivalText = "This order was cancelled";
        statusIconName = "close-circle";
        activeStepIndex = 0;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={heroBgColor} />

            <ScrollView
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#056f36" />
                }
            >
                {/* Top Section Hero Backdrop (Matching Home & Food Screen) */}
                <View style={[styles.heroHeaderSection, { backgroundColor: heroBgColor, paddingTop: Math.max(insets.top, 16) + 8 }]}>
                    {/* Navigation Header Row */}
                    <View style={styles.topHeaderNavRow}>
                        <TouchableOpacity
                            style={[styles.backBtnCircle, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }]}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
                        </TouchableOpacity>

                        <View style={styles.orderIdBadge}>
                            <Ionicons name="receipt" size={14} color="#056f36" />
                            <Text style={styles.orderIdBadgeText}>#{order.id.split('-')[0].toUpperCase()}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.callBtnCircle, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }]}
                            onPress={() => handleCallRider(rider?.phoneNumber)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="call" size={18} color="#056f36" />
                        </TouchableOpacity>
                    </View>

                    {/* Main Title & Calligraphy Subtitle with Swoosh */}
                    <View style={styles.heroTextWrapper}>
                        <Text style={[styles.heroTitleText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                            LIVE ORDER TRACKING
                        </Text>
                        <Text style={styles.heroCalligraphySubText}>
                            Freshly Prepared & Delivered to Your Hostel
                        </Text>
                        <View style={styles.curvedSwooshWrapper}>
                            <Svg width={180} height={15} viewBox="0 0 180 15" fill="none">
                                <Path
                                    d="M 4,5 Q 90,1 175,6 C 181,7 177,13 150,13"
                                    stroke="#056f36"
                                    strokeWidth={2.2}
                                    strokeLinecap="round"
                                />
                            </Svg>
                        </View>
                    </View>

                    {/* Hero Tracking Status Card */}
                    <View style={[styles.heroTrackingCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#dcfce7' }]}>
                        <Animated.View style={[styles.statusIconCircle, { transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons name={statusIconName} size={36} color="#056f36" />
                        </Animated.View>

                        <Text style={[styles.statusTitleText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{statusText}</Text>
                        <Text style={styles.arrivalSubtitleText}>{arrivalText}</Text>

                        {/* 4-Step Progress Tracker */}
                        {order.status !== 'cancelled' && (
                            <View style={styles.progressTimelineWrapper}>
                                <View style={styles.progressTrackLineBackground}>
                                    <View
                                        style={[
                                            styles.progressTrackLineFill,
                                            { width: `${(activeStepIndex / 3) * 100}%` }
                                        ]}
                                    />
                                </View>

                                {['Placed', 'Preparing', 'On The Way', 'Delivered'].map((stepName, idx) => {
                                    const isDone = idx <= activeStepIndex;
                                    return (
                                        <View key={idx} style={styles.stepNodeContainer}>
                                            <View style={[styles.stepNodeCircle, isDone && styles.stepNodeCircleDone]}>
                                                <Ionicons
                                                    name={isDone ? "checkmark" : "ellipse-outline"}
                                                    size={12}
                                                    color={isDone ? "#ffffff" : "#94a3b8"}
                                                />
                                            </View>
                                            <Text style={[styles.stepNodeLabel, isDone && styles.stepNodeLabelDone]}>
                                                {stepName}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>

                {/* Soft Edge Blend Transition Strip where Green meets White */}
                <View style={{ height: 26, width: '100%', backgroundColor: colors.background }}>
                    <Svg width="100%" height={26} preserveAspectRatio="none">
                        <Defs>
                            <LinearGradient id="orderDetailEdgeBlend" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={heroBgColor} stopOpacity="1" />
                                <Stop offset="100%" stopColor={colors.background} stopOpacity="1" />
                            </LinearGradient>
                        </Defs>
                        <Rect width="100%" height={26} fill="url(#orderDetailEdgeBlend)" />
                    </Svg>
                </View>

                {/* Main Content Details Body */}
                <View style={styles.contentBody}>

                    {/* Dev Live Status Test Trigger */}
                    {__DEV__ && (
                        <TouchableOpacity
                            style={styles.devTestTriggerBtn}
                            onPress={simulateNextStatus}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="notifications" size={18} color="#ffffff" />
                            <Text style={styles.devTestTriggerText}>
                                ⚡ Test Android Live Delivery Status Pill
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Delivery Partner Card */}
                    {!['delivered', 'cancelled'].includes(order.status) && (
                        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                            <View style={styles.cardHeaderRow}>
                                <MaterialCommunityIcons name="bike-fast" size={18} color="#056f36" />
                                <Text style={[styles.cardHeaderTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>DELIVERY PARTNER</Text>
                            </View>

                            <View style={styles.riderRow}>
                                <View style={styles.riderAvatarCircle}>
                                    <Ionicons name={rider ? "person" : "hourglass-outline"} size={22} color={rider ? "#056f36" : "#94a3b8"} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.riderNameText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                        {rider ? rider.name : 'Assigning Campus Rider...'}
                                    </Text>
                                    <Text style={styles.riderSubText}>
                                        {rider ? 'Laro Express Partner' : 'Finding nearest driver near campus'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.riderCallBtn, !rider?.phoneNumber && { backgroundColor: '#cbd5e1' }]}
                                    onPress={() => handleCallRider(rider?.phoneNumber)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="call" size={16} color="#ffffff" />
                                </TouchableOpacity>
                            </View>

                            {/* OTP Delivery Verification Code */}
                            {order.deliveryOtp && (
                                <View style={styles.otpCardBox}>
                                    <View>
                                        <Text style={styles.otpLabel}>DELIVERY VERIFICATION OTP</Text>
                                        <Text style={styles.otpSub}>Share with driver on handoff</Text>
                                    </View>
                                    <View style={styles.otpPill}>
                                        <Text style={styles.otpText}>{formattedOtp}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Delivery Address Card */}
                    <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                        <View style={styles.cardHeaderRow}>
                            <Ionicons name="location-outline" size={18} color="#056f36" />
                            <Text style={[styles.cardHeaderTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>DELIVERY LOCATION</Text>
                        </View>
                        <Text style={[styles.addressTitleText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{mainAddressTitle}</Text>
                        <Text style={styles.addressSubText}>{detailAddressSub}</Text>
                    </View>

                    {/* Ordered Items Summary Card */}
                    <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                        <View style={styles.cardHeaderRow}>
                            <Ionicons name="bag-handle-outline" size={18} color="#056f36" />
                            <Text style={[styles.cardHeaderTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                ORDER ITEMS ({itemsCount})
                            </Text>
                        </View>

                        {order.items?.map((item, idx) => (
                            <View key={item.id || idx} style={styles.itemRow}>
                                <Image
                                    source={{ uri: resolveImageUrl(item.product?.imageUrl || item.imageUrl) }}
                                    style={styles.itemThumb}
                                />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.itemNameText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                        {item.product?.name || item.name || 'Campus Item'}
                                    </Text>
                                    <Text style={styles.itemQtyPriceText}>
                                        {item.quantity} x {CONSTANTS.CURRENCY}{parseFloat(item.price || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <Text style={[styles.itemTotalPriceText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                    {CONSTANTS.CURRENCY}{(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Bill & Tax Receipt Card */}
                    <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                        <View style={styles.cardHeaderRow}>
                            <Ionicons name="card-outline" size={18} color="#056f36" />
                            <Text style={[styles.cardHeaderTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>BILL BREAKDOWN</Text>
                        </View>

                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Item Total</Text>
                            <Text style={[styles.billValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                {CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Delivery Fee</Text>
                            <Text style={[styles.billValue, { color: '#056f36', fontWeight: '900' }]}>FREE</Text>
                        </View>

                        <View style={styles.billDivider} />

                        <View style={styles.billTotalRow}>
                            <Text style={[styles.billTotalLabel, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Total Paid ({order.paymentMethod?.toUpperCase()})</Text>
                            <Text style={styles.billTotalValue}>
                                {CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}
                            </Text>
                        </View>

                        {/* View Tax Receipt Button */}
                        <TouchableOpacity
                            style={styles.viewReceiptBtn}
                            onPress={() => setReceiptVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="document-text-outline" size={16} color="#056f36" />
                            <Text style={styles.viewReceiptBtnText}>View Official Tax Invoice / Receipt</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Actions / Cancel Order Button */}
                    {['placed', 'accepted'].includes(order.status) && (
                        <TouchableOpacity
                            style={styles.cancelOrderBtn}
                            onPress={handleCancelOrder}
                            disabled={cancelLoading}
                            activeOpacity={0.85}
                        >
                            {cancelLoading ? (
                                <ActivityIndicator color="#ef4444" />
                            ) : (
                                <>
                                    <Ionicons name="close-circle-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Receipt Modal */}
            <Modal
                transparent={true}
                visible={receiptVisible}
                animationType="fade"
                onRequestClose={() => setReceiptVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.receiptContainer}>
                        <View style={styles.receiptTopHeader}>
                            <View style={styles.receiptBrandRow}>
                                <Text style={styles.receiptBrand}>ZIP'IT BY LARO</Text>
                                <Ionicons name="school" size={18} color="#056f36" />
                            </View>
                            <Text style={styles.receiptType}>TAX INVOICE / RECEIPT</Text>
                        </View>

                        <ScrollView contentContainerStyle={styles.receiptScrollContent} showsVerticalScrollIndicator={false}>
                            <Text style={styles.receiptShopName}>{order.Shop?.name || 'Laro Store'}</Text>

                            <View style={styles.receiptDivider} />

                            <View style={styles.receiptMetaRow}>
                                <Text style={styles.receiptMetaLabel}>Order ID:</Text>
                                <Text style={styles.receiptMetaValue}>#{order.id.split('-')[0].toUpperCase()}</Text>
                            </View>
                            <View style={styles.receiptMetaRow}>
                                <Text style={styles.receiptMetaLabel}>Date & Time:</Text>
                                <Text style={styles.receiptMetaValue}>{new Date(order.createdAt).toLocaleDateString('en-IN')} {formatOrderTime(order.createdAt)}</Text>
                            </View>
                            <View style={styles.receiptMetaRow}>
                                <Text style={styles.receiptMetaLabel}>Payment Method:</Text>
                                <Text style={styles.receiptMetaValue}>{order.paymentMethod?.toUpperCase()}</Text>
                            </View>

                            <View style={styles.receiptDivider} />

                            <View style={styles.receiptGrandTotalRow}>
                                <Text style={styles.receiptGrandTotalLabel}>TOTAL PAID:</Text>
                                <Text style={styles.receiptGrandTotalValue}>{CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}</Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.closeReceiptBtn} onPress={() => setReceiptVisible(false)}>
                            <Text style={styles.closeReceiptBtnText}>Close Receipt</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type="destructive"
                confirmText="Cancel Order"
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />

            <LiveStatusPermissionModal
                visible={permModalVisible}
                onClose={() => setPermModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justify: 'center',
        alignItems: 'center',
    },
    backBtnWrapper: {
        marginTop: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderRadius: 12,
    },
    heroHeaderSection: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    topHeaderNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtnCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justify: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    callBtnCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justify: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    orderIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    orderIdBadgeText: {
        color: '#056f36',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    heroTextWrapper: {
        alignItems: 'center',
        justify: 'center',
        marginBottom: 18,
    },
    heroTitleText: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.6,
        textAlign: 'center',
    },
    heroCalligraphySubText: {
        fontSize: 22,
        fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'cursive' }),
        color: '#056f36',
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    curvedSwooshWrapper: {
        alignItems: 'center',
        justify: 'center',
        marginTop: 4,
    },
    heroTrackingCard: {
        borderRadius: 24,
        padding: 22,
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginHorizontal: 4,
    },
    statusIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justify: 'center',
        marginBottom: 14,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    statusTitleText: {
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    arrivalSubtitleText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#056f36',
        marginTop: 4,
        marginBottom: 20,
    },
    progressTimelineWrapper: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative',
        paddingHorizontal: 8,
        marginTop: 6,
    },
    progressTrackLineBackground: {
        position: 'absolute',
        top: 10,
        left: 24,
        right: 24,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
    },
    progressTrackLineFill: {
        height: '100%',
        backgroundColor: '#056f36',
        borderRadius: 2,
    },
    stepNodeContainer: {
        alignItems: 'center',
        width: 64,
    },
    stepNodeCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#cbd5e1',
        alignItems: 'center',
        justify: 'center',
        marginBottom: 6,
    },
    stepNodeCircleDone: {
        backgroundColor: '#056f36',
    },
    stepNodeLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#94a3b8',
        textAlign: 'center',
    },
    stepNodeLabelDone: {
        color: '#056f36',
        fontWeight: '900',
    },
    contentBody: {
        paddingHorizontal: 16,
    },
    devTestTriggerBtn: {
        backgroundColor: '#056f36',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        flexDirection: 'row',
        justify: 'center',
        gap: 6,
    },
    devTestTriggerText: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 13,
    },
    card: {
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        marginBottom: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    cardHeaderTitle: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    riderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    riderAvatarCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justify: 'center',
        marginRight: 12,
    },
    riderNameText: {
        fontSize: 15,
        fontWeight: '800',
    },
    riderSubText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    riderCallBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#056f36',
        alignItems: 'center',
        justify: 'center',
    },
    otpCardBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justify: 'space-between',
        backgroundColor: '#f0fdf4',
        padding: 14,
        borderRadius: 16,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    otpLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.8,
    },
    otpSub: {
        fontSize: 11.5,
        color: '#64748b',
        marginTop: 2,
    },
    otpPill: {
        backgroundColor: '#056f36',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    otpText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    addressTitleText: {
        fontSize: 15,
        fontWeight: '800',
    },
    addressSubText: {
        fontSize: 12.5,
        color: '#64748b',
        marginTop: 4,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    itemThumb: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
    },
    itemNameText: {
        fontSize: 14,
        fontWeight: '700',
    },
    itemQtyPriceText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    itemTotalPriceText: {
        fontSize: 14,
        fontWeight: '900',
    },
    billRow: {
        flexDirection: 'row',
        justify: 'space-between',
        marginBottom: 8,
    },
    billLabel: {
        fontSize: 13.5,
        color: '#64748b',
    },
    billValue: {
        fontSize: 13.5,
        fontWeight: '700',
    },
    billDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
    },
    billTotalRow: {
        flexDirection: 'row',
        justify: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    billTotalLabel: {
        fontSize: 14.5,
        fontWeight: '900',
    },
    billTotalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#056f36',
    },
    viewReceiptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justify: 'center',
        backgroundColor: '#f0fdf4',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        gap: 6,
    },
    viewReceiptBtnText: {
        color: '#056f36',
        fontSize: 13,
        fontWeight: '800',
    },
    cancelOrderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justify: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    cancelOrderBtnText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justify: 'center',
        alignItems: 'center',
        padding: 20,
    },
    receiptContainer: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    receiptTopHeader: {
        alignItems: 'center',
        marginBottom: 14,
    },
    receiptBrandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    receiptBrand: {
        fontSize: 16,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 1,
    },
    receiptType: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        marginTop: 2,
    },
    receiptScrollContent: {
        paddingVertical: 10,
    },
    receiptShopName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
    },
    receiptDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 12,
    },
    receiptMetaRow: {
        flexDirection: 'row',
        justify: 'space-between',
        marginBottom: 6,
    },
    receiptMetaLabel: {
        fontSize: 12.5,
        color: '#64748b',
    },
    receiptMetaValue: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#0f172a',
    },
    receiptGrandTotalRow: {
        flexDirection: 'row',
        justify: 'space-between',
        alignItems: 'center',
    },
    receiptGrandTotalLabel: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
    },
    receiptGrandTotalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#056f36',
    },
    closeReceiptBtn: {
        backgroundColor: '#056f36',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 14,
    },
    closeReceiptBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
    },
});
