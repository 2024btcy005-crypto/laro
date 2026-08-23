import React, { useState, useEffect, useRef } from 'react';
import { useFonts, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, RefreshControl, Image, StatusBar, Dimensions, Animated, Platform, Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Circle, Line } from 'react-native-svg';
import { COLORS, CONSTANTS } from '../../theme';
import api, { resolveImageUrl, orderAPI } from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';
import { OrderDetailScreenSkeleton } from '../../components/SkeletonLoader';
import { DeliveryLiveStatus } from '../../services/deliveryLiveStatus';
import LiveStatusPermissionModal, { requestNotificationPermissionsAsync } from '../../components/LiveStatusPermissionModal';

const { width } = Dimensions.get('window');

// Helper component to render 100% geometrically centered Ionicons inside circles
const CenteredIcon = ({ name, size, color, style }) => (
    <Ionicons
        name={name}
        size={size}
        color={color}
        style={[
            {
                width: size,
                height: size,
                lineHeight: size,
                textAlign: 'center',
                textAlignVertical: 'center',
                includeFontPadding: false,
            },
            style
        ]}
    />
);

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
    const [config, setConfig] = useState({ taxRate: 5.0, handlingCharge: 2.00, defaultDeliveryFee: 0.00 });
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const lastSyncedStatusRef = useRef(null);
    const [fontsLoaded] = useFonts({ DancingScript_700Bold });

    useEffect(() => {
        fetchOrderDetail();

        // Pulsing Radar Ring Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.18,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
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

        // Fetch billing config (taxRate, handlingCharge)
        orderAPI.getConfig().then(res => {
            if (res?.data) setConfig(res.data);
        }).catch(() => {});
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            if (response.data) {
                setOrder(response.data);

                // Sync Android System Live Delivery Status only if status changed
                const dbStatus = (response.data.status || '').toLowerCase();
                const mappedStatus = dbStatus === 'placed' ? 'PLACED' :
                                     dbStatus === 'accepted' ? 'CONFIRMED' :
                                     dbStatus === 'picked' ? 'PICKED_UP' :
                                     dbStatus === 'out_for_delivery' ? 'ON_THE_WAY' :
                                     dbStatus === 'delivered' ? 'DELIVERED' :
                                     dbStatus === 'cancelled' ? 'CANCELLED' : 'ON_THE_WAY';

                if (lastSyncedStatusRef.current !== mappedStatus) {
                    lastSyncedStatusRef.current = mappedStatus;

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
            { status: 'PREPARING', eta: 25, progress: 0.35 },
            { status: 'ON_THE_WAY', eta: 12, progress: 0.70 },
            { status: 'NEARBY', eta: 2, progress: 0.90 },
            { status: 'DELIVERED', eta: 0, progress: 1.0 }
        ];

        const currentStageIdx = stages.findIndex(s => s.status === order._simStatus) ?? -1;
        const nextStage = stages[(currentStageIdx + 1) % stages.length];

        setOrder(prev => ({ ...prev, _simStatus: nextStage.status }));

        const liveData = {
            orderId: order.id,
            restaurantName: order.shop?.name || '',
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

    // Address lines formatting
    const addressParts = order.deliveryAddress ? order.deliveryAddress.split(',').map(p => p.trim()) : [];
    const mainAddressTitle = addressParts[0] || 'Your Location';
    const detailAddressSub = addressParts.slice(1).join(', ') || 'Within Campus Area';

    // Format OTP
    const formattedOtp = order.deliveryOtp ? order.deliveryOtp.toString().split('').join(' ') : '8 8 2 1';

    // Bill breakdown — matches CheckoutScreen exactly
    const itemSubtotal = order.items?.reduce((sum, item) => {
        const price = parseFloat(item.priceAtTime || item.price || item.product?.price || 0);
        return sum + price * (item.quantity || 1);
    }, 0) || parseFloat(order.totalAmount || 0);
    const taxes = parseFloat((itemSubtotal * (config.taxRate / 100)).toFixed(2));
    const handlingFee = parseFloat(config.handlingCharge || 0);
    const couponDiscount = parseFloat(order.discountAmount || 0);

    // Dynamic arrival minutes & status text mapping
    let statusTitle = "Order Placed";
    let arrivalText = "Shop is confirming your order (approx. 15 mins)";
    let statusIconName = "cube-outline";
    let activeStepIndex = 0;
    let progressRatio = 0.15;

    const rawStatus = (order._simStatus || order.status || '').toLowerCase();

    if (rawStatus === 'placed') {
        statusTitle = "Order Placed";
        arrivalText = "Shop is confirming your order (approx. 15 mins)";
        statusIconName = "cube-outline";
        activeStepIndex = 0;
        progressRatio = 0.15;
    } else if (rawStatus === 'accepted' || rawStatus === 'confirmed' || rawStatus === 'preparing') {
        statusTitle = `Preparing at ${order.shop?.name || 'Kitchen'}`;
        arrivalText = "Kitchen is cooking your fresh meal (approx. 10 mins)";
        statusIconName = "flame";
        activeStepIndex = 1;
        progressRatio = 0.45;
    } else if (rawStatus === 'picked' || rawStatus === 'out_for_delivery' || rawStatus === 'on_the_way' || rawStatus === 'nearby') {
        statusTitle = `Rider Heading to ${mainAddressTitle}`;
        arrivalText = "Arun is on the way to your door (approx. 4 mins)";
        statusIconName = "bicycle";
        activeStepIndex = 2;
        progressRatio = 0.80;
    } else if (rawStatus === 'delivered') {
        statusTitle = "Order Delivered";
        arrivalText = "Enjoy your fresh meal!";
        statusIconName = "checkmark-circle";
        activeStepIndex = 3;
        progressRatio = 1.0;
    } else if (rawStatus === 'cancelled') {
        statusTitle = "Order Cancelled";
        arrivalText = "This order was cancelled";
        statusIconName = "close-circle";
        activeStepIndex = 0;
        progressRatio = 0.0;
    }

    const stepsList = [
        { label: 'Placed', icon: 'cube' },
        { label: 'Preparing', icon: 'flame' },
        { label: 'On Way', icon: 'bicycle' },
        { label: 'Delivered', icon: 'checkmark-circle' }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={heroBgColor} />

            {/* Premium Sticky Navigation Header Bar */}
            <View style={[
                styles.fixedHeaderBar,
                {
                    backgroundColor: heroBgColor,
                    paddingTop: Math.max(insets.top, 10),
                    borderBottomColor: isDarkMode ? '#1e293b' : '#e6f7ed'
                }
            ]}>
                <TouchableOpacity
                    style={[styles.backBtnCircle, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <CenteredIcon name="arrow-back" size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
                </TouchableOpacity>

                <Text style={[styles.fixedHeaderTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                    Order Details
                </Text>

                <TouchableOpacity
                    style={styles.receiptHeaderBtn}
                    onPress={() => setReceiptVisible(true)}
                    activeOpacity={0.8}
                >
                    <CenteredIcon name="receipt" size={15} color="#056f36" />
                    <Text style={styles.receiptHeaderBtnText}>Receipt</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#056f36" />
                }
            >
                {/* Hero Banner Section */}
                <View style={[styles.heroHeaderSection, { backgroundColor: heroBgColor, paddingTop: 14 }]}>

                    {/* Brand Title & Cursive Subtitle */}
                    <View style={styles.heroTextWrapper}>
                        <Text style={[styles.heroTitleText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                            LIVE ORDER TRACKING
                        </Text>
                        <Text style={styles.heroCalligraphySubText}>
                            Freshly Prepared & Delivered to Your Doorstep
                        </Text>
                        <View style={styles.curvedSwooshWrapper}>
                            <Svg width={200} height={14} viewBox="0 0 200 14" fill="none">
                                <Path
                                    d="M 10,6 Q 100,1 190,7 C 196,8 192,13 165,13"
                                    stroke="#056f36"
                                    strokeWidth={2.2}
                                    strokeLinecap="round"
                                />
                            </Svg>
                        </View>
                    </View>

                    {/* Hero Tracking Status Card */}
                    <View style={[styles.heroTrackingCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#dcfce7' }]}>
                        {/* Pulse Radar Circle */}
                        <View style={styles.iconPulseWrapper}>
                            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                            <View style={styles.statusIconCircle}>
                                <CenteredIcon name={statusIconName} size={36} color="#ffffff" />
                            </View>
                        </View>

                        {/* Title & ETA Pill */}
                        <Text style={[styles.cardStatusTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                            {statusTitle}
                        </Text>

                        <View style={styles.etaPillBadge}>
                            <CenteredIcon name="time" size={13} color="#056f36" />
                            <Text style={styles.etaPillText}>{arrivalText}</Text>
                        </View>

                        {/* Continuous Track Line with Floating Rider */}
                        {rawStatus !== 'cancelled' && (
                            <View style={styles.zomatoProgressWrapper}>
                                <View style={styles.zomatoTrackBackground}>
                                    <View style={[styles.zomatoTrackFill, { width: `${progressRatio * 100}%` }]} />
                                    <View style={[styles.zomatoRiderDotTip, { left: `${Math.min(Math.max(progressRatio * 100, 4), 96)}%` }]}>
                                        <CenteredIcon name="bicycle" size={12} color="#ffffff" />
                                    </View>
                                </View>

                                <View style={styles.zomatoStepsRow}>
                                    {stepsList.map((step, idx) => {
                                        const isDone = idx <= activeStepIndex;
                                        const isCurrent = idx === activeStepIndex;

                                        return (
                                            <View key={idx} style={styles.zomatoStepItem}>
                                                <View style={[
                                                    styles.zomatoStepCircle,
                                                    isDone && styles.zomatoStepCircleDone,
                                                    isCurrent && styles.zomatoStepCircleCurrent
                                                ]}>
                                                    <CenteredIcon
                                                        name={step.icon}
                                                        size={13}
                                                        color={isDone ? '#ffffff' : '#94a3b8'}
                                                    />
                                                </View>
                                                <Text style={[
                                                    styles.zomatoStepLabel,
                                                    isDone && styles.zomatoStepLabelDone,
                                                    isCurrent && styles.zomatoStepLabelCurrent
                                                ]}>
                                                    {step.label}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Soft Gradient Edge Blend */}
                <View style={{ height: 24, width: '100%', backgroundColor: colors.background }}>
                    <Svg width="100%" height={24} preserveAspectRatio="none">
                        <Defs>
                            <LinearGradient id="orderDetailEdgeBlend" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={heroBgColor} stopOpacity="1" />
                                <Stop offset="100%" stopColor={colors.background} stopOpacity="1" />
                            </LinearGradient>
                        </Defs>
                        <Rect width="100%" height={24} fill="url(#orderDetailEdgeBlend)" />
                    </Svg>
                </View>

                {/* Content Body */}
                <View style={styles.contentBody}>

                    {/* Vector Campus Route Map Card */}
                    <View style={[styles.vectorMapCard, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
                        <Svg width="100%" height={140} style={{ position: 'absolute' }}>
                            <Line x1="0" y1="40" x2="100%" y2="40" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="12" />
                            <Line x1="0" y1="95" x2="100%" y2="95" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="16" />
                            <Line x1="70" y1="0" x2="70" y2="100%" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="14" />
                            <Line x1="240" y1="0" x2="240" y2="100%" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="12" />
                            <Path d="M 40,95 L 140,95 L 140,40 L 280,40" stroke="#056f36" strokeWidth="4" strokeDasharray="6,4" fill="none" />
                        </Svg>

                        <View style={styles.mapPinShop}>
                            <View style={styles.mapPinIconCircle}>
                                <CenteredIcon name="storefront" size={14} color="#056f36" />
                            </View>
                            <Text style={styles.mapPinText}>{order.shop?.name || 'Shop'}</Text>
                        </View>

                        <View style={styles.mapPinDriver}>
                            <View style={styles.mapPinDriverCircle}>
                                <CenteredIcon name="bicycle" size={14} color="#ffffff" />
                            </View>
                        </View>

                        <View style={styles.mapPinDestination}>
                            <View style={styles.mapPinDestCircle}>
                                <CenteredIcon name="location" size={14} color="#ef4444" />
                            </View>
                            <Text style={styles.mapPinText}>{mainAddressTitle}</Text>
                        </View>

                        <View style={styles.mapOverlayPill}>
                            <CenteredIcon name="navigate-circle" size={18} color="#056f36" />
                            <Text style={styles.mapOverlayText}>Live Driver Route • {mainAddressTitle}</Text>
                        </View>
                    </View>

                    {/* Delivery Partner Card */}
                    {!['delivered', 'cancelled'].includes(order.status) && (
                        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                            <View style={styles.cardHeaderRow}>
                                <MaterialCommunityIcons name="bike-fast" size={18} color="#056f36" />
                                <Text style={[styles.cardHeaderTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>DELIVERY PARTNER</Text>
                            </View>

                            <View style={styles.riderRow}>
                                <View style={styles.riderAvatarCircle}>
                                    <CenteredIcon
                                        name={rider ? "person" : "hourglass-outline"}
                                        size={22}
                                        color={rider ? "#056f36" : "#94a3b8"}
                                    />
                                </View>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.riderNameText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                                            {rider ? rider.name : 'Assigning Campus Rider...'}
                                        </Text>
                                        {rider && (
                                            <View style={styles.ratingBadge}>
                                                <Ionicons name="star" size={10} color="#f59e0b" />
                                                <Text style={styles.ratingText}>4.9</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.riderSubText} numberOfLines={1}>
                                        {rider ? 'Laro Express Partner • 140+ Deliveries' : 'Finding nearest driver near campus'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.riderCallBtn, !rider?.phoneNumber && { backgroundColor: '#cbd5e1' }]}
                                    onPress={() => handleCallRider(rider?.phoneNumber)}
                                    activeOpacity={0.8}
                                >
                                    <CenteredIcon name="call" size={16} color="#ffffff" />
                                </TouchableOpacity>
                            </View>

                            {/* OTP Delivery Verification Banner */}
                            {order.deliveryOtp && (
                                <View style={styles.otpCardBox}>
                                    <View style={{ flex: 1 }}>
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

                    {/* Delivery Location Card */}
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

                        {order.items?.map((item, idx) => {
                            const unitPrice = parseFloat(item.priceAtTime || item.price || item.product?.price || 0);
                            const qty = item.quantity || 1;
                            const itemTotal = unitPrice * qty;

                            return (
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
                                            Qty: {qty} • {CONSTANTS.CURRENCY}{unitPrice.toFixed(2)} each
                                        </Text>
                                    </View>
                                    <Text style={[styles.itemTotalPriceText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                        {CONSTANTS.CURRENCY}{itemTotal.toFixed(2)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Bill Details Card — matches Checkout bill exactly */}
                    <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                        <View style={styles.cardHeaderRow}>
                            <Ionicons name="card-outline" size={18} color="#056f36" />
                            <Text style={[styles.cardHeaderTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>BILL DETAILS</Text>
                        </View>

                        {/* Item Total */}
                        <View style={styles.paymentSummaryRow}>
                            <Text style={styles.paymentLabel}>Item Total</Text>
                            <Text style={[styles.paymentValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                {CONSTANTS.CURRENCY}{itemSubtotal.toFixed(2)}
                            </Text>
                        </View>

                        {/* Delivery Fee — CAMPUS FREE */}
                        <View style={styles.paymentSummaryRow}>
                            <Text style={styles.paymentLabel}>Delivery Fee</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={styles.campusFreeBadge}>
                                    <Text style={styles.campusFreeBadgeText}>CAMPUS FREE</Text>
                                </View>
                                <Text style={styles.deliveryStruckText}>₹25.00</Text>
                                <Text style={styles.deliveryFreeText}>FREE</Text>
                            </View>
                        </View>

                        {/* Handling Charge */}
                        <View style={styles.paymentSummaryRow}>
                            <Text style={styles.paymentLabel}>Handling Charge</Text>
                            {handlingFee > 0 ? (
                                <Text style={[styles.paymentValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                    {CONSTANTS.CURRENCY}{handlingFee.toFixed(2)}
                                </Text>
                            ) : (
                                <Text style={styles.deliveryFreeText}>FREE</Text>
                            )}
                        </View>

                        {/* Platform Tax */}
                        {taxes > 0 && (
                            <View style={styles.paymentSummaryRow}>
                                <Text style={styles.paymentLabel}>Platform Tax ({config.taxRate}%)</Text>
                                <Text style={[styles.paymentValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                    {CONSTANTS.CURRENCY}{taxes.toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Coupon Discount — only if order had one */}
                        {order.couponCode && couponDiscount > 0 && (
                            <View style={styles.paymentSummaryRow}>
                                <Text style={[styles.paymentLabel, { color: '#056f36' }]}>
                                    Coupon ({order.couponCode})
                                </Text>
                                <Text style={[styles.paymentValue, { color: '#056f36' }]}>
                                    -{CONSTANTS.CURRENCY}{couponDiscount.toFixed(2)}
                                </Text>
                            </View>
                        )}

                        <View style={styles.summaryDivider} />

                        {/* Total Payable */}
                        <View style={styles.paymentSummaryRow}>
                            <View>
                                <Text style={[styles.totalLabel, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Total Payable</Text>
                                <Text style={styles.paymentLabel}>Inclusive of all taxes</Text>
                            </View>
                            <Text style={styles.totalValue}>
                                {CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}
                            </Text>
                        </View>

                        <View style={{ alignItems: 'center', paddingTop: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: isDarkMode ? '#334155' : '#e6f7ed' }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#056f36' }}>Made with ❤️ for Students</Text>
                        </View>
                    </View>

                    {/* Actions / Cancel Order Card Strip */}
                    {['placed', 'accepted'].includes((order.status || '').toLowerCase()) && (
                        <View style={[
                            styles.cancelCardStrip,
                            {
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                borderColor: isDarkMode ? '#334155' : '#fee2e2'
                            }
                        ]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={[styles.cancelCardTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                    Need to cancel?
                                </Text>
                                <Text style={styles.cancelCardSub}>
                                    Free cancellation before kitchen prepares
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.cancelActionBtn}
                                onPress={handleCancelOrder}
                                disabled={cancelLoading}
                                activeOpacity={0.8}
                            >
                                {cancelLoading ? (
                                    <ActivityIndicator color="#dc2626" size="small" />
                                ) : (
                                    <Text style={styles.cancelActionBtnText}>Cancel Order</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Receipt Modal */}
            <Modal
                visible={receiptVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setReceiptVisible(false)}
            >
                <View style={styles.receiptOverlay}>
                    <TouchableOpacity
                        style={styles.receiptDismissArea}
                        activeOpacity={1}
                        onPress={() => setReceiptVisible(false)}
                    />

                    <View style={[styles.receiptSheet, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }]}>
                        {/* Sheet handle */}
                        <View style={styles.receiptHandle} />

                        {/* Receipt Header */}
                        <View style={styles.receiptLogoRow}>
                            <View style={styles.receiptLogoBadge}>
                                <Text style={styles.receiptLogoText}>Z</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.receiptBrandName, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Laro</Text>
                                <Text style={styles.receiptBrandSub}>Official Digital Receipt</Text>
                            </View>
                            <TouchableOpacity onPress={() => setReceiptVisible(false)} style={styles.receiptCloseBtn}>
                                <CenteredIcon name="close" size={18} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Dashed divider */}
                        <View style={[styles.receiptDash, { borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} />

                        {/* Order meta */}
                        <View style={styles.receiptMetaRow}>
                            <View>
                                <Text style={styles.receiptMetaLabel}>ORDER ID</Text>
                                <Text style={[styles.receiptMetaValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>#{order.id.split('-')[0].toUpperCase()}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.receiptMetaLabel}>DATE</Text>
                                <Text style={[styles.receiptMetaValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                    {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.receiptMetaRow}>
                            <View>
                                <Text style={styles.receiptMetaLabel}>FROM</Text>
                                <Text style={[styles.receiptMetaValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{order.shop?.name || order.shopName}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.receiptMetaLabel}>STATUS</Text>
                                <View style={[
                                    styles.receiptStatusPill,
                                    { backgroundColor: order.status === 'delivered' ? '#dcfce7' : order.status === 'cancelled' ? '#fef2f2' : '#fef3c7' }
                                ]}>
                                    <Text style={[
                                        styles.receiptStatusText,
                                        { color: order.status === 'delivered' ? '#056f36' : order.status === 'cancelled' ? '#dc2626' : '#d97706' }
                                    ]}>
                                        {(order.status || 'placed').toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Dashed divider */}
                        <View style={[styles.receiptDash, { borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} />

                        {/* Line items */}
                        <Text style={[styles.receiptSectionTitle, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>ITEMS ORDERED</Text>
                        {order.items?.map((item, idx) => {
                            const price = parseFloat(item.priceAtTime || item.price || item.product?.price || 0);
                            const qty = item.quantity || 1;
                            return (
                                <View key={idx} style={styles.receiptItemRow}>
                                    <View style={styles.receiptQtyBadge}>
                                        <Text style={styles.receiptQtyText}>{qty}x</Text>
                                    </View>
                                    <Text style={[styles.receiptItemName, { color: isDarkMode ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                                        {item.product?.name || item.name || 'Item'}
                                    </Text>
                                    <Text style={[styles.receiptItemPrice, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                        {CONSTANTS.CURRENCY}{(price * qty).toFixed(2)}
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Dashed divider */}
                        <View style={[styles.receiptDash, { borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} />

                        {/* Subtotals — matches checkout bill exactly */}
                        <View style={styles.receiptSubRow}>
                            <Text style={styles.receiptSubLabel}>Item Total</Text>
                            <Text style={[styles.receiptSubValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                {CONSTANTS.CURRENCY}{itemSubtotal.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.receiptSubRow}>
                            <Text style={styles.receiptSubLabel}>Delivery Fee</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.deliveryStruckText}>₹25.00</Text>
                                <Text style={styles.deliveryFreeText}>FREE</Text>
                            </View>
                        </View>
                        <View style={styles.receiptSubRow}>
                            <Text style={styles.receiptSubLabel}>Handling Charge</Text>
                            {handlingFee > 0 ? (
                                <Text style={[styles.receiptSubValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                    {CONSTANTS.CURRENCY}{handlingFee.toFixed(2)}
                                </Text>
                            ) : (
                                <Text style={styles.receiptFreeChip}>FREE</Text>
                            )}
                        </View>
                        {taxes > 0 && (
                            <View style={styles.receiptSubRow}>
                                <Text style={styles.receiptSubLabel}>Platform Tax ({config.taxRate}%)</Text>
                                <Text style={[styles.receiptSubValue, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                    {CONSTANTS.CURRENCY}{taxes.toFixed(2)}
                                </Text>
                            </View>
                        )}
                        {order.couponCode && couponDiscount > 0 && (
                            <View style={styles.receiptSubRow}>
                                <Text style={[styles.receiptSubLabel, { color: '#056f36' }]}>Coupon ({order.couponCode})</Text>
                                <Text style={[styles.receiptSubValue, { color: '#056f36' }]}>-{CONSTANTS.CURRENCY}{couponDiscount.toFixed(2)}</Text>
                            </View>
                        )}

                        {/* Dashed divider */}
                        <View style={[styles.receiptDash, { borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} />

                        {/* Grand total */}
                        <View style={styles.receiptTotalRow}>
                            <View>
                                <Text style={[styles.receiptTotalLabel, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Total Payable</Text>
                                <Text style={styles.receiptSubLabel}>Inclusive of all taxes</Text>
                            </View>
                            <Text style={styles.receiptTotalValue}>
                                {CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}
                            </Text>
                        </View>

                        {/* Payment method */}
                        <View style={[styles.receiptPaymentRow, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
                            <CenteredIcon
                                name={order.paymentMethod === 'laro_coins' ? 'diamond' : order.paymentMethod === 'cod' ? 'cash' : 'card'}
                                size={16}
                                color={order.paymentMethod === 'cod' ? '#d97706' : '#056f36'}
                            />
                            <Text style={[styles.receiptPaymentText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'laro_coins' ? 'Laro Coins' : 'Online Payment'}
                            </Text>
                            {order.paymentMethod === 'cod' ? (
                                <Text style={[styles.receiptPaymentBadge, { color: '#d97706', backgroundColor: '#fef3c7' }]}>PAY ON DELIVERY</Text>
                            ) : (
                                <Text style={styles.receiptPaymentBadge}>PAID</Text>
                            )}
                        </View>

                        {/* Footer barcode-style strip */}
                        <View style={styles.receiptBarcode}>
                            {Array.from({ length: 32 }).map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.receiptBar,
                                        { height: [8, 14, 10, 18, 12, 8, 16, 10][i % 8], backgroundColor: isDarkMode ? '#334155' : '#0f172a' }
                                    ]}
                                />
                            ))}
                        </View>
                        <Text style={[styles.receiptFooterText, { color: isDarkMode ? '#475569' : '#94a3b8' }]}>
                            Thank you for ordering with Laro 🎉
                        </Text>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtnWrapper: {
        marginTop: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderRadius: 12,
    },
    fixedHeaderBar: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    fixedHeaderTitle: {
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    heroHeaderSection: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    backBtnCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
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
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 4,
    },
    orderIdBadgeText: {
        color: '#056f36',
        fontSize: 11.5,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    heroTextWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    heroTitleText: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    heroCalligraphySubText: {
        fontSize: 14,
        fontFamily: 'DancingScript_700Bold',
        color: '#056f36',
        marginTop: 3,
        textAlign: 'center',
        letterSpacing: 0.4,
    },
    curvedSwooshWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    heroTrackingCard: {
        borderRadius: 26,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        marginHorizontal: 2,
    },
    iconPulseWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: 84,
        height: 84,
        marginBottom: 12,
    },
    pulseRing: {
        position: 'absolute',
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#bbf7d0',
        opacity: 0.6,
    },
    statusIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#056f36',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    cardStatusTitle: {
        fontSize: 19,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    etaPillBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6f7ed',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        marginBottom: 20,
    },
    etaPillText: {
        color: '#056f36',
        fontSize: 13,
        fontWeight: '800',
    },
    zomatoProgressWrapper: {
        width: '100%',
        marginTop: 4,
    },
    zomatoTrackBackground: {
        width: '100%',
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        position: 'relative',
        marginBottom: 16,
    },
    zomatoTrackFill: {
        height: '100%',
        backgroundColor: '#056f36',
        borderRadius: 4,
    },
    zomatoRiderDotTip: {
        position: 'absolute',
        top: -7,
        marginLeft: -11,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#056f36',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
        elevation: 4,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    zomatoStepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    zomatoStepItem: {
        alignItems: 'center',
        flex: 1,
    },
    zomatoStepCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    zomatoStepCircleDone: {
        backgroundColor: '#056f36',
    },
    zomatoStepCircleCurrent: {
        backgroundColor: '#16a34a',
        borderWidth: 2,
        borderColor: '#bbf7d0',
    },
    zomatoStepLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#94a3b8',
        textAlign: 'center',
    },
    zomatoStepLabelDone: {
        color: '#056f36',
        fontWeight: '900',
    },
    zomatoStepLabelCurrent: {
        color: '#0f172a',
        fontWeight: '900',
    },
    contentBody: {
        paddingHorizontal: 16,
    },
    vectorMapCard: {
        height: 140,
        borderRadius: 22,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 16,
        borderWidth: 1,
        justifyContent: 'center',
    },
    mapPinShop: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mapPinIconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#056f36',
    },
    mapPinDriver: {
        position: 'absolute',
        top: 75,
        left: 126,
    },
    mapPinDriverCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#056f36',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
        elevation: 4,
    },
    mapPinDestination: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mapPinDestCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fef2f2',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    mapPinText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0f172a',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    mapOverlayPill: {
        position: 'absolute',
        bottom: 10,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    mapOverlayText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0f172a',
    },
    card: {
        borderRadius: 22,
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
        fontSize: 12.5,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    riderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    riderAvatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    riderNameText: {
        fontSize: 14.5,
        fontWeight: '800',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    ratingText: {
        fontSize: 10.5,
        fontWeight: '900',
        color: '#d97706',
    },
    riderSubText: {
        fontSize: 11.5,
        color: '#64748b',
        marginTop: 2,
    },
    riderCallBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#056f36',
        alignItems: 'center',
        justifyContent: 'center',
    },
    otpCardBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0fdf4',
        padding: 12,
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    otpText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 3,
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
    paymentSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 6,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '700',
    },
    paymentValue: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '800',
    },
    deliveryStruckText: {
        fontSize: 12,
        color: '#94a3b8',
        textDecorationLine: 'line-through',
        fontWeight: '600',
    },
    campusFreeBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#86efac',
    },
    campusFreeBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.5,
    },
    deliveryFreeText: {
        fontSize: 13,
        color: '#056f36',
        fontWeight: '900',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#056f36',
    },
    cancelCardStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 6,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cancelCardTitle: {
        fontSize: 14,
        fontWeight: '900',
    },
    cancelCardSub: {
        fontSize: 11.5,
        color: '#64748b',
        marginTop: 2,
    },
    cancelActionBtn: {
        backgroundColor: '#fef2f2',
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    cancelActionBtnText: {
        color: '#dc2626',
        fontSize: 12.5,
        fontWeight: '900',
    },
    receiptHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 5,
    },
    receiptHeaderBtnText: {
        color: '#056f36',
        fontSize: 12,
        fontWeight: '900',
    },
    receiptOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    receiptDismissArea: {
        flex: 1,
    },
    receiptSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 22,
        paddingBottom: 36,
        paddingTop: 12,
        maxHeight: '90%',
    },
    receiptHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e2e8f0',
        alignSelf: 'center',
        marginBottom: 20,
    },
    receiptLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    receiptLogoBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#056f36',
        justifyContent: 'center',
        alignItems: 'center',
    },
    receiptLogoText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '900',
    },
    receiptBrandName: {
        fontSize: 16,
        fontWeight: '900',
    },
    receiptBrandSub: {
        fontSize: 11.5,
        color: '#64748b',
        marginTop: 2,
    },
    receiptCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    receiptDash: {
        borderStyle: 'dashed',
        borderTopWidth: 1.5,
        marginVertical: 14,
    },
    receiptMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    receiptMetaLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 3,
    },
    receiptMetaValue: {
        fontSize: 14,
        fontWeight: '800',
    },
    receiptStatusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    receiptStatusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    receiptSectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 10,
    },
    receiptItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    receiptQtyBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    receiptQtyText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
    },
    receiptItemName: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: '700',
    },
    receiptItemPrice: {
        fontSize: 13.5,
        fontWeight: '900',
    },
    receiptSubRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    receiptSubLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    receiptSubValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    receiptFreeChip: {
        fontSize: 12,
        fontWeight: '900',
        color: '#056f36',
    },
    receiptTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    receiptTotalLabel: {
        fontSize: 15,
        fontWeight: '900',
    },
    receiptTotalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#056f36',
    },
    receiptPaymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 20,
    },
    receiptPaymentText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
    },
    receiptPaymentBadge: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    receiptBarcode: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 3,
        marginBottom: 12,
    },
    receiptBar: {
        width: 3,
        borderRadius: 1.5,
    },
    receiptFooterText: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
    },
});



