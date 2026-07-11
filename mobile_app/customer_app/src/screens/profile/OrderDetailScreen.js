import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, RefreshControl, Image, StatusBar, Dimensions, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import api from '../../services/api';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OrderDetailScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [receiptVisible, setReceiptVisible] = useState(false);
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
        } else {
            Linking.openURL(`tel:+919876543210`);
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
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: '#f2f7f2' }]} edges={['top']}>
                <ActivityIndicator size="large" color="#056f36" />
                <Text style={styles.loadingText}>Loading details...</Text>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: '#f2f7f2' }]} edges={['top']}>
                <Text style={{ color: '#666', fontWeight: 'bold' }}>Order not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
                    <Text style={{ color: '#056f36', fontWeight: '800' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

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
    if (order.status === 'placed') {
        statusText = `Preparing at ${order.shop?.name || 'Shop'}`;
        arrivalText = "Arriving in approx. 15 mins";
    } else if (order.status === 'accepted') {
        statusText = "Preparing your food";
        arrivalText = "Arriving in approx. 10 mins";
    } else if (order.status === 'out_for_delivery') {
        statusText = `Heading to ${mainAddressTitle}`;
        arrivalText = "Arriving in approx. 4 mins";
    } else if (order.status === 'delivered') {
        statusText = "Order Delivered";
        arrivalText = "Enjoy your meal!";
    } else if (order.status === 'cancelled') {
        statusText = "Order Cancelled";
        arrivalText = "This order was cancelled";
    }

    // Step status indicators
    const isPlaced = ['placed', 'accepted', 'out_for_delivery', 'delivered'].includes(order.status);
    const isPreparing = ['accepted', 'out_for_delivery', 'delivered'].includes(order.status);
    const isTransit = ['out_for_delivery', 'delivered'].includes(order.status);
    const isDelivered = order.status === 'delivered';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnCircle}>
                    <Ionicons name="chevron-back" size={20} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{order.id.split('-')[0].toUpperCase()}</Text>
                <TouchableOpacity style={styles.shareBtn}>
                    <Ionicons name="share-social-outline" size={22} color="#555" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#056f36" />
                }
            >
                {/* Map/Tracking Section */}
                <View style={styles.mapCard}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80' }} 
                        style={styles.mapImage} 
                    />
                    <View style={styles.overlayGlassCard}>
                        <View style={styles.statusPinWrapper}>
                            <Ionicons name="location" size={22} color="#fff" />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.overlayStatusTitle}>{statusText}</Text>
                            <Text style={styles.overlayArrivalText}>{arrivalText}</Text>
                        </View>
                        <TouchableOpacity style={styles.callRiderBtn} onPress={() => handleCallRider(rider?.phoneNumber)}>
                            <Text style={styles.callRiderText}>Call</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Delivery OTP Card */}
                {!['delivered', 'cancelled'].includes(order.status) && (
                    <View style={styles.otpCard}>
                        <Text style={styles.otpLabel}>DELIVERY OTP</Text>
                        <Text style={styles.otpNumber}>{formattedOtp}</Text>
                        <Text style={styles.otpInstruction}>Share this code with the rider upon arrival</Text>
                    </View>
                )}

                {/* Order Journey Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Order Journey</Text>
                    
                    <View style={styles.timeline}>
                        {/* Step 1: Placed */}
                        <View style={styles.timelineRow}>
                            <View style={styles.iconCol}>
                                <View style={[styles.stepCircle, isPlaced && styles.stepCircleDone]}>
                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                </View>
                                <View style={[styles.stepLine, isPreparing && styles.stepLineDone]} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, isPlaced && styles.stepTitleActive]}>Order Placed</Text>
                                <Text style={styles.stepSubtitle}>{formatOrderTime(order.createdAt)} • Today</Text>
                            </View>
                        </View>

                        {/* Step 2: Preparing */}
                        <View style={styles.timelineRow}>
                            <View style={styles.iconCol}>
                                <View style={[styles.stepCircle, isPreparing && styles.stepCircleDone]}>
                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                </View>
                                <View style={[styles.stepLine, isTransit && styles.stepLineDone]} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, isPreparing && styles.stepTitleActive]}>Preparing</Text>
                                <Text style={styles.stepSubtitle}>{formatOrderTime(order.createdAt, 5)} • Today</Text>
                            </View>
                        </View>

                        {/* Step 3: Out for Delivery */}
                        <View style={styles.timelineRow}>
                            <View style={styles.iconCol}>
                                <View style={[styles.stepCircle, isTransit && styles.stepCircleDone, !isTransit && styles.stepCirclePending]}>
                                    <FontAwesome5 name="bicycle" size={12} color={isTransit ? '#fff' : '#aaa'} />
                                </View>
                                <View style={[styles.stepLine, isDelivered && styles.stepLineDone]} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, isTransit && styles.stepTitleActive]}>Out for Delivery</Text>
                                <Text style={styles.stepSubtitle}>{isTransit ? `Picked up at ${formatOrderTime(order.createdAt, 12)}` : 'Pending'}</Text>
                            </View>
                        </View>

                        {/* Step 4: Delivered */}
                        <View style={[styles.timelineRow, { marginBottom: 0 }]}>
                            <View style={styles.iconCol}>
                                <View style={[styles.stepCircle, isDelivered && styles.stepCircleDone, !isDelivered && styles.stepCirclePending]}>
                                    <Ionicons name="home" size={12} color={isDelivered ? '#fff' : '#aaa'} />
                                </View>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, isDelivered && styles.stepTitleActive]}>Delivered</Text>
                                <Text style={styles.stepSubtitle}>{isDelivered ? `Delivered at ${formatOrderTime(order.createdAt, 20)}` : `Expected by ${formatOrderTime(order.createdAt, 20)}`}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Your Order Items Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardHeaderLabel}>YOUR ORDER</Text>
                        <View style={styles.itemsBadge}>
                            <Text style={styles.itemsBadgeText}>{itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}</Text>
                        </View>
                    </View>
                    
                    {order.items?.map((item, idx) => (
                        <View key={idx} style={[styles.itemRow, idx > 0 && { borderTopWidth: 1, borderTopColor: '#f2f5f2', paddingTop: 12, marginTop: 12 }]}>
                            {item.product?.imageUrl ? (
                                <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} />
                            ) : (
                                <View style={styles.itemImagePlaceholder}>
                                    <Ionicons name="fast-food-outline" size={24} color="#056f36" />
                                </View>
                            )}
                            <View style={styles.itemTextInfo}>
                                <Text style={styles.itemNameText}>{item.product?.name || 'Item'}</Text>
                                <Text style={styles.itemShopText}>{order.shop?.name || 'Laro Kitchen'}</Text>
                                <Text style={styles.itemPriceText}>{CONSTANTS.CURRENCY}{parseFloat(item.priceAtTime || 0).toFixed(2)}</Text>
                            </View>
                            <View style={styles.qtyBadge}>
                                <Text style={styles.qtyBadgeText}>Qty: {item.quantity}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Delivery Address Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeaderLabel}>DELIVERY ADDRESS</Text>
                    <View style={styles.addressRow}>
                        <View style={styles.addressCircleOutline}>
                            <View style={styles.addressCircleInner} />
                        </View>
                        <View style={styles.addressTextWrapper}>
                            <Text style={styles.addressNameText}>{mainAddressTitle}</Text>
                            <Text style={styles.addressDetailText}>{detailAddressSub}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeaderLabel}>PAYMENT SUMMARY</Text>
                    <View style={styles.paymentSummaryRow}>
                        <Text style={styles.paymentLabel}>Item Total</Text>
                        <Text style={styles.paymentValue}>{CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.paymentSummaryRow}>
                        <Text style={styles.paymentLabel}>Delivery Fee</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.deliveryStruckText}>{CONSTANTS.CURRENCY}1.50</Text>
                            <Text style={styles.deliveryFreeText}>FREE</Text>
                        </View>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.paymentSummaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}</Text>
                    </View>
                </View>

                {order.status === 'placed' && (
                    <TouchableOpacity
                        style={[styles.cancelBtn, cancelLoading && { opacity: 0.7 }]}
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
            </ScrollView>

            {/* Bottom Floating Action Buttons */}
            <View style={styles.bottomBarActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL('https://laro.onrender.com/api/help')}>
                    <Ionicons name="help-circle-outline" size={20} color="#056f36" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>Need Help?</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionBtn} onPress={() => setReceiptVisible(true)}>
                    <Ionicons name="receipt-outline" size={20} color="#056f36" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>Receipt</Text>
                </TouchableOpacity>
            </View>

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
                            <Text style={styles.receiptShopName}>{order.shop?.name || 'Laro Store'}</Text>
                            <Text style={styles.receiptShopAddress}>{order.shop?.address || 'Joy University Campus'}</Text>
                            
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
                                <Text style={styles.receiptMetaValue}>
                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod === 'laro_coins' ? 'Laro Wallet Coins' : 'Online Payment')}
                                </Text>
                            </View>

                            <View style={styles.receiptDivider} />

                            {/* Item header */}
                            <View style={styles.receiptItemHeaderRow}>
                                <Text style={[styles.receiptItemHeader, { flex: 2 }]}>ITEM</Text>
                                <Text style={[styles.receiptItemHeader, { textAlign: 'center', width: 40 }]}>QTY</Text>
                                <Text style={[styles.receiptItemHeader, { textAlign: 'right', width: 70 }]}>PRICE</Text>
                            </View>

                            {/* Items list */}
                            {order.items?.map((item, idx) => (
                                <View key={idx} style={styles.receiptItemRow}>
                                    <Text style={[styles.receiptItemName, { flex: 2 }]} numberOfLines={1}>{item.product?.name || 'Item'}</Text>
                                    <Text style={[styles.receiptItemQty, { textAlign: 'center', width: 40 }]}>{item.quantity}</Text>
                                    <Text style={[styles.receiptItemPrice, { textAlign: 'right', width: 70 }]}>
                                        {CONSTANTS.CURRENCY}{parseFloat((item.priceAtTime || 0) * (item.quantity || 0)).toFixed(2)}
                                    </Text>
                                </View>
                            ))}

                            {/* Calculations for receipt */}
                            {(() => {
                                const subtotal = order.items?.reduce((acc, curr) => acc + (parseFloat(curr.priceAtTime || 0) * (curr.quantity || 1)), 0) || parseFloat(order.totalAmount || 0);
                                const totalTax = Math.round(subtotal * 0.05);
                                const cgst = totalTax / 2;
                                const sgst = totalTax / 2;
                                const handling = 2.00;
                                const discount = parseFloat(order.discountAmount || 0);
                                
                                return (
                                    <>
                                        <View style={styles.receiptDivider} />

                                        {/* Totals */}
                                        <View style={styles.receiptTotalRow}>
                                            <Text style={styles.receiptTotalLabel}>Item Subtotal:</Text>
                                            <Text style={styles.receiptTotalValue}>{CONSTANTS.CURRENCY}{subtotal.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.receiptTotalRow}>
                                            <Text style={styles.receiptTotalLabel}>CGST (2.5%):</Text>
                                            <Text style={styles.receiptTotalValue}>{CONSTANTS.CURRENCY}{cgst.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.receiptTotalRow}>
                                            <Text style={styles.receiptTotalLabel}>SGST (2.5%):</Text>
                                            <Text style={styles.receiptTotalValue}>{CONSTANTS.CURRENCY}{sgst.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.receiptTotalRow}>
                                            <Text style={styles.receiptTotalLabel}>Platform Handling Fee:</Text>
                                            <Text style={styles.receiptTotalValue}>{CONSTANTS.CURRENCY}{handling.toFixed(2)}</Text>
                                        </View>
                                        {discount > 0 && (
                                            <View style={styles.receiptTotalRow}>
                                                <Text style={styles.receiptTotalLabel}>Discount:</Text>
                                                <Text style={[styles.receiptTotalValue, { color: '#ef4444' }]}>-{CONSTANTS.CURRENCY}{discount.toFixed(2)}</Text>
                                            </View>
                                        )}
                                        <View style={styles.receiptTotalRow}>
                                            <Text style={styles.receiptTotalLabel}>Delivery Fee:</Text>
                                            <Text style={[styles.receiptTotalValue, { color: '#056f36', fontWeight: '900' }]}>FREE</Text>
                                        </View>
                                        
                                        <View style={[styles.receiptDivider, { borderStyle: 'solid' }]} />

                                        <View style={styles.receiptGrandTotalRow}>
                                            <Text style={styles.receiptGrandTotalLabel}>TOTAL PAID:</Text>
                                            <Text style={styles.receiptGrandTotalValue}>{CONSTANTS.CURRENCY}{parseFloat(order.totalAmount || 0).toFixed(2)}</Text>
                                        </View>
                                    </>
                                );
                            })()}

                            <View style={styles.receiptDivider} />

                            {/* Barcode illustration */}
                            <View style={styles.barcodeWrapper}>
                                <View style={styles.barcodeLines}>
                                    {[...Array(24)].map((_, i) => (
                                        <View key={i} style={[styles.barcodeLine, { width: (i % 3 === 0 ? 3 : (i % 2 === 0 ? 1.5 : 1)), marginRight: (i % 4 === 0 ? 3 : 2) }]} />
                                    ))}
                                </View>
                                <Text style={styles.barcodeText}>*{order.id.split('-')[0].toUpperCase()}*</Text>
                            </View>

                            <Text style={styles.thankYouText}>THANK YOU FOR SHOPPING WITH US!</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' }, // Matching overall Zippit theme
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#666', fontWeight: 'bold' },
    backBtnWrapper: { marginTop: 15, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#f2f7f2'
    },
    backBtnCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.5,
        borderColor: '#056f36',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#056f36' },
    shareBtn: { padding: 4 },

    scroll: { paddingHorizontal: 20 },

    mapCard: {
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    mapImage: { width: '100%', height: '100%' },
    overlayGlassCard: {
        position: 'absolute',
        bottom: 15,
        left: 15,
        right: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        borderRadius: 20,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)'
    },
    statusPinWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#27c96c',
        justifyContent: 'center',
        alignItems: 'center'
    },
    statusTextContainer: { flex: 1, marginLeft: 12 },
    overlayStatusTitle: { fontSize: 15, fontWeight: '900', color: '#111' },
    overlayArrivalText: { fontSize: 12, color: '#666', marginTop: 2 },
    callRiderBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    callRiderText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    otpCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
        marginBottom: 20
    },
    otpLabel: { fontSize: 12, fontWeight: '800', color: '#666', letterSpacing: 1 },
    otpNumber: { fontSize: 32, fontWeight: '900', color: '#27c96c', letterSpacing: 6, marginVertical: 8 },
    otpInstruction: { fontSize: 12, color: '#999', fontWeight: '600' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
        marginBottom: 20
    },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 20 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardHeaderLabel: { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 1 },
    itemsBadge: {
        backgroundColor: '#ffebe3',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    itemsBadgeText: { fontSize: 11, fontWeight: '900', color: '#ff6633' },

    // Timeline elements
    timeline: { marginLeft: 10 },
    timelineRow: { flexDirection: 'row', minHeight: 65 },
    iconCol: { alignItems: 'center', marginRight: 15 },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2
    },
    stepCircleDone: { backgroundColor: '#056f36' },
    stepCirclePending: { backgroundColor: '#eef3ee', borderWidth: 1.5, borderColor: '#ccc' },
    stepLine: { width: 3, flex: 1, zIndex: 1, marginTop: -2, marginBottom: -2 },
    stepLineDone: { backgroundColor: '#056f36' },
    stepLinePending: { backgroundColor: '#edf2ed' },
    stepContent: { flex: 1, paddingTop: 2 },
    stepTitle: { fontSize: 14, fontWeight: '700', color: '#999' },
    stepTitleActive: { color: '#056f36', fontWeight: '900' },
    stepSubtitle: { fontSize: 11, color: '#666', marginTop: 2 },

    // Items list
    itemRow: { flexDirection: 'row', alignItems: 'center' },
    itemImage: { width: 50, height: 50, borderRadius: 12 },
    itemImagePlaceholder: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#edf5ed', justifyContent: 'center', alignItems: 'center' },
    itemTextInfo: { flex: 1, marginLeft: 12 },
    itemNameText: { fontSize: 15, fontWeight: '900', color: '#111' },
    itemShopText: { fontSize: 12, color: '#666', marginTop: 2 },
    itemPriceText: { fontSize: 14, fontWeight: '800', color: '#056f36', marginTop: 2 },
    qtyBadge: { backgroundColor: '#f0f4f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    qtyBadgeText: { fontSize: 12, fontWeight: '700', color: '#056f36' },

    // Address
    addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    addressCircleOutline: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#056f36',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    addressCircleInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#056f36' },
    addressTextWrapper: { flex: 1 },
    addressNameText: { fontSize: 15, fontWeight: '900', color: '#111' },
    addressDetailText: { fontSize: 13, color: '#666', marginTop: 2 },

    // Payment details
    paymentSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
    paymentLabel: { fontSize: 14, color: '#666', fontWeight: '700' },
    paymentValue: { fontSize: 14, color: '#111', fontWeight: '800' },
    deliveryStruckText: { fontSize: 13, color: '#999', textDecorationLine: 'line-through', marginRight: 6, fontWeight: '600' },
    deliveryFreeText: { fontSize: 13, color: '#056f36', fontWeight: '900' },
    summaryDivider: { height: 1, backgroundColor: '#edf2ed', marginVertical: 12 },
    totalLabel: { fontSize: 16, fontWeight: '900', color: '#111' },
    totalValue: { fontSize: 18, fontWeight: '900', color: '#056f36' },

    cancelBtn: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fee2e2',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 1
    },
    cancelBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },

    // Bottom Action Buttons
    bottomBarActions: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    actionBtn: {
        flex: 1,
        backgroundColor: '#e6ede6', // Light beige-green button
        borderRadius: 16,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d0dcd0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2
    },
    actionBtnText: { fontSize: 14, fontWeight: '800', color: '#056f36' },

    // Receipt Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    receiptContainer: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10
    },
    receiptTopHeader: {
        alignItems: 'center',
        marginBottom: 16
    },
    receiptBrandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    receiptBrand: {
        fontSize: 18,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 2,
        marginRight: 6
    },
    receiptType: {
        fontSize: 11,
        fontWeight: '800',
        color: '#999',
        letterSpacing: 1
    },
    receiptScrollContent: {
        paddingBottom: 20
    },
    receiptShopName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#111',
        textAlign: 'center'
    },
    receiptShopAddress: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 2
    },
    receiptDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        marginVertical: 14,
        borderRadius: 1
    },
    receiptMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4
    },
    receiptMetaLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600'
    },
    receiptMetaValue: {
        fontSize: 12,
        color: '#111',
        fontWeight: '800'
    },
    receiptItemHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    receiptItemHeader: {
        fontSize: 11,
        fontWeight: '900',
        color: '#999',
        letterSpacing: 0.5
    },
    receiptItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5
    },
    receiptItemName: {
        fontSize: 13,
        color: '#333',
        fontWeight: '700'
    },
    receiptItemQty: {
        fontSize: 13,
        color: '#333',
        fontWeight: '800'
    },
    receiptItemPrice: {
        fontSize: 13,
        color: '#111',
        fontWeight: '800'
    },
    receiptTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4
    },
    receiptTotalLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600'
    },
    receiptTotalValue: {
        fontSize: 13,
        color: '#111',
        fontWeight: '800'
    },
    receiptGrandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 6
    },
    receiptGrandTotalLabel: {
        fontSize: 14,
        color: '#111',
        fontWeight: '900'
    },
    receiptGrandTotalValue: {
        fontSize: 18,
        color: '#056f36',
        fontWeight: '900'
    },
    barcodeWrapper: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10
    },
    barcodeLines: {
        flexDirection: 'row',
        height: 35,
        alignItems: 'stretch',
        marginBottom: 6
    },
    barcodeLine: {
        backgroundColor: '#111'
    },
    barcodeText: {
        fontSize: 11,
        color: '#666',
        letterSpacing: 3,
        fontWeight: '700'
    },
    thankYouText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        letterSpacing: 0.5
    },
    closeReceiptBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15
    },
    closeReceiptBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800'
    }
});
