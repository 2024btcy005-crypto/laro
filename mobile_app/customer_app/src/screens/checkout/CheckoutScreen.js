import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/cartSlice';
import { authAPI, orderAPI, couponAPI } from '../../services/api';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import LaroAlert from '../../components/LaroAlert';
import { COLORS, CONSTANTS } from '../../theme';
import OrderSuccessOverlay from '../../components/OrderSuccessOverlay';
import { useTheme } from '../../context/ThemeContext';

export default function CheckoutScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const cart = useSelector((state) => state.cart);
    const { user, selectedUniversity } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState({
        address: 'Hostel 4, Room 205',
        label: 'Default Address'
    });

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'primary',
        confirmText: 'OK',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
    });

    React.useEffect(() => {
        const loadDefaultAddress = async () => {
            const key = `@user_addresses_${user?.id || 'guest'}`;
            try {
                // 1. Try to load from local storage
                const stored = await AsyncStorage.getItem(key);
                if (stored) {
                    const addresses = JSON.parse(stored);
                    const def = addresses.find(a => a.isDefault) || addresses[0];
                    if (def) {
                        setSelectedAddress({
                            address: def.address,
                            label: def.type || 'Home'
                        });
                        console.log('[Checkout] Loaded local default address:', def.address);
                        return;
                    }
                }

                // 2. Fallback: try to load from cloud (backend)
                const summaryRes = await orderAPI.getUserSummary();
                const cloudAddress = summaryRes.data?.user?.address;
                if (cloudAddress) {
                    setSelectedAddress({ address: cloudAddress, label: 'Cloud Address' });
                    console.log('[Checkout] Loaded cloud address fallback:', cloudAddress);

                    // Optional: Seed local storage with this cloud address for parity
                    const initialAddress = {
                        id: Date.now().toString(),
                        type: 'Home',
                        name: user?.name || 'Student',
                        phone: user?.phoneNumber || '',
                        address: cloudAddress,
                        isDefault: true
                    };
                    await AsyncStorage.setItem(key, JSON.stringify([initialAddress]));
                }
            } catch (err) {
                console.error('[Checkout] Failed to load address:', err);
            }
        };
        loadDefaultAddress();
    }, [user]);

    // Dynamic Configs State
    const [config, setConfig] = useState({
        taxRate: 5.0,
        handlingCharge: 2.00,
        defaultDeliveryFee: 0.00
    });
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [laroCurrency, setLaroCurrency] = useState(0);
    const [loyaltyLevel, setLoyaltyLevel] = useState('Learner');

    React.useEffect(() => {
        const fetchLoyalty = async () => {
            try {
                const res = await orderAPI.getUserSummary();
                setLoyaltyLevel(res.data.loyaltyLevel || 'Learner');
                setLoyaltyPoints(res.data.loyaltyPoints || 0);
                setLaroCurrency(res.data.laroCurrency || 0);
            } catch (err) {
                console.log('Failed to fetch loyalty status');
            }
        };
        fetchLoyalty();
    }, []);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await orderAPI.getConfig();
                if (res.data) setConfig(res.data);
            } catch (err) {
                console.log('Failed to fetch config');
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponLoading(true);
        try {
            const res = await couponAPI.validateCoupon(couponCode, subtotal);
            setAppliedCoupon(res.data);
            setCouponCode('');
            setAlertConfig({
                visible: true,
                title: 'Coupon Applied',
                message: `You saved ${CONSTANTS.CURRENCY}${res.data.discountAmount}!`,
                type: 'success',
                confirmText: 'Great!',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } catch (err) {
            setAlertConfig({
                visible: true,
                title: 'Invalid Coupon',
                message: err.response?.data?.message || 'Could not apply coupon',
                type: 'destructive',
                confirmText: 'Retry',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
    };

    const subtotal = cart.totalAmount || 0;
    const taxes = Math.round(subtotal * (config.taxRate / 100));
    const handlingFee = parseFloat(config.handlingCharge);
    const deliveryFee = parseFloat(config.defaultDeliveryFee);

    // Legend Discount Calculation (5% on Medicines)
    let legendDiscount = 0;
    if (loyaltyLevel === 'Legend') {
        const medicineTotal = cart.items
            .filter(item => item.category === 'Medicines')
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        legendDiscount = Math.round(medicineTotal * 0.05);
    }

    const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const grandTotal = Math.max(0, subtotal + taxes + handlingFee + deliveryFee - legendDiscount - couponDiscount);

    const handlePlaceOrder = async () => {
        if (!cart.shopId || cart.items.length === 0) {
            setAlertConfig({
                visible: true,
                title: 'Empty Cart',
                message: 'Your cart is empty. Add some items to start!',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        if (!selectedAddress || !selectedAddress.address) {
            setAlertConfig({
                visible: true,
                title: 'Address Missing',
                message: 'Please add a delivery address in your profile before checking out.',
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    navigation.navigate('ProfileTab');
                }
            });
            return;
        }

        if (subtotal < 50) {
            setAlertConfig({
                visible: true,
                title: 'Minimum Order ₹50',
                message: `Your cart total is ₹${subtotal.toFixed(2)}. Add items worth ₹${(50 - subtotal).toFixed(2)} more to place an order.`,
                type: 'primary',
                confirmText: 'Add More Items',
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    navigation.goBack();
                }
            });
            return;
        }

        setLoading(true);
        try {
            const orderPayload = {
                shopId: cart.shopId,
                deliveryAddress: selectedAddress.address,
                paymentMethod,
                orderItems: cart.items.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    metadata: item.metadata
                })),
                couponCode: appliedCoupon?.code,
                universityId: selectedUniversity?.id
            };

            const orderResponse = await orderAPI.createOrder(orderPayload);
            const createdOrder = orderResponse.data;

            // Sync the address to the user's cloud profile for web/cross-platform access
            try {
                await authAPI.updateProfile({ address: selectedAddress.address });
                console.log('[DEBUG] Address synced to cloud profile');
            } catch (cloudErr) {
                console.log('[DEBUG] Cloud address sync failed (non-critical):', cloudErr.message);
            }

            if (paymentMethod === 'cod' || paymentMethod === 'laro_coins') {
                dispatch(clearCart());
                setOrderSuccess(true);
            } else {
                const paymentResponse = await api.post('/payments/create', { orderId: createdOrder.id });
                setAlertConfig({
                    visible: true,
                    title: 'Online Payment',
                    message: `Razorpay order created: ${paymentResponse.data.rzpOrderId}\n\nIntegrate Razorpay SDK to complete payment.`,
                    confirmText: 'Pay Now (Mock)',
                    onConfirm: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        dispatch(clearCart());
                        setOrderSuccess(true);
                    }
                });
            }
        } catch (err) {
            console.error('Order error:', err.response?.data || err.message);
            setAlertConfig({
                visible: true,
                title: 'Order Failed',
                message: err.response?.data?.message || 'Failed to place order. Please try again.',
                type: 'destructive',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    const [stabilizing, setStabilizing] = useState(true);

    React.useEffect(() => {
        // Give Redux store a moment to stabilize during navigation transition
        const timer = setTimeout(() => {
            setStabilizing(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    if (stabilizing || loadingConfig || (loading && cart.items.length === 0)) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 12, color: colors.gray, fontWeight: '600' }}>Preparing your checkout...</Text>
            </SafeAreaView>
        );
    }

    if (!stabilizing && cart.items.length === 0 && !orderSuccess) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
                <Ionicons name="cart-outline" size={64} color={colors.border} />
                <Text style={{ color: colors.gray, fontSize: 16, marginTop: 15, fontWeight: 'bold' }}>Your cart is empty.</Text>
                <TouchableOpacity
                    style={{ marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 }}
                    onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Shopping</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            {orderSuccess ? (
                <View style={[styles.center, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ marginTop: 12, color: colors.gray, fontWeight: '600' }}>Confirming order...</Text>
                </View>
            ) : (
                <>
                    <ScrollView style={styles.scroll}>
                        {/* Delivery Address */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.black }]}>📍 Delivery Address</Text>
                            <View style={[styles.addressCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                                <Text style={[styles.addressText, { color: colors.black }]}>{selectedAddress.address}</Text>
                                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                            </View>
                        </View>

                        {/* Order Summary */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.black }]}>🛒 Order Summary</Text>
                            {cart.items.map(item => (
                                <View key={item.id} style={styles.summaryItem}>
                                    <Text style={[styles.summaryName, { color: colors.gray }]}>{item.quantity}× {item.name}</Text>
                                    <Text style={[styles.summaryPrice, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat((item.price || 0) * (item.quantity || 0)).toFixed(2)}</Text>
                                </View>
                            ))}
                            <View style={[styles.billDetailSection, { borderTopColor: colors.border }]}>
                                <View style={styles.billRow}>
                                    <Text style={[styles.billLabel, { color: colors.gray }]}>Item Total</Text>
                                    <Text style={[styles.billValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{subtotal.toFixed(2)}</Text>
                                </View>
                                <View style={styles.billRow}>
                                    <Text style={[styles.billLabel, { color: colors.gray }]}>Delivery Fee</Text>
                                    {deliveryFee === 0 ? (
                                        <Text style={[styles.billValue, { color: COLORS.zippitGreen || '#10b981' }]}>Free</Text>
                                    ) : (
                                        <Text style={[styles.billValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{deliveryFee.toFixed(2)}</Text>
                                    )}
                                </View>
                                <View style={styles.billRow}>
                                    <Text style={[styles.billLabel, { color: colors.gray }]}>Handling Fee</Text>
                                    <Text style={[styles.billValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{handlingFee.toFixed(2)}</Text>
                                </View>
                                <View style={styles.billRow}>
                                    <Text style={[styles.billLabel, { color: colors.gray }]}>Govt Taxes & Charges</Text>
                                    <Text style={[styles.billValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{taxes.toFixed(2)}</Text>
                                </View>
                                {legendDiscount > 0 && (
                                    <View style={styles.billRow}>
                                        <Text style={[styles.billLabel, { color: '#fbbf24', fontWeight: 'bold' }]}>Legend Medicine Discount (5%)</Text>
                                        <Text style={[styles.billValue, { color: '#fbbf24', fontWeight: 'bold' }]}>-{CONSTANTS.CURRENCY}{legendDiscount.toFixed(2)}</Text>
                                    </View>
                                )}
                                {appliedCoupon && (
                                    <View style={styles.billRow}>
                                        <Text style={[styles.billLabel, { color: COLORS.zippitGreen, fontWeight: 'bold' }]}>Coupon Discount ({appliedCoupon.code})</Text>
                                        <Text style={[styles.billValue, { color: COLORS.zippitGreen, fontWeight: 'bold' }]}>-{CONSTANTS.CURRENCY}{couponDiscount.toFixed(2)}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={[styles.summaryItem, styles.summaryTotal, { borderTopColor: colors.border }]}>
                                <Text style={[styles.summaryTotalLabel, { color: colors.black }]}>Grand Total</Text>
                                <Text style={[styles.summaryTotalAmount, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat(grandTotal || 0).toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Coupons Section */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.black }]}>🎟️ Coupons & Offers</Text>
                            {!appliedCoupon ? (
                                <View style={styles.couponInputContainer}>
                                    <TextInput
                                        style={[styles.couponInput, { backgroundColor: isDarkMode ? colors.white : '#f8f8f8', borderColor: colors.border, color: colors.black }]}
                                        placeholder="Enter Promo Code"
                                        placeholderTextColor={colors.gray}
                                        value={couponCode}
                                        onChangeText={(text) => setCouponCode(text.toUpperCase())}
                                        autoCapitalize="characters"
                                    />
                                    <TouchableOpacity
                                        style={[styles.applyBtn, !couponCode && { opacity: 0.5 }]}
                                        onPress={handleApplyCoupon}
                                        disabled={couponLoading || !couponCode}
                                    >
                                        {couponLoading ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.applyBtnText}>Apply</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={[styles.appliedCouponContainer, { backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4', borderColor: isDarkMode ? '#10b981' : '#22c55e' }]}>
                                    <View style={styles.appliedCouponInfo}>
                                        <Ionicons name="checkmark-circle" size={20} color={isDarkMode ? '#10b981' : COLORS.zippitGreen} />
                                        <Text style={[styles.appliedCouponText, { color: isDarkMode ? '#10b981' : '#166534' }]}>
                                            <Text style={{ fontWeight: 'bold' }}>{appliedCoupon.code}</Text> Applied!
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={removeCoupon}>
                                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Payment Method */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.black }]}>💳 Payment Method</Text>
                            <TouchableOpacity
                                style={[styles.paymentOption, { backgroundColor: colors.white, borderColor: colors.border }, paymentMethod === 'cod' && [styles.paymentOptionActive, { backgroundColor: isDarkMode ? colors.white : COLORS.background }]]}
                                onPress={() => setPaymentMethod('cod')}
                            >
                                <MaterialIcons name="delivery-dining" size={20} color={paymentMethod === 'cod' ? COLORS.primary : colors.gray} style={{ marginRight: 8 }} />
                                <Text style={[styles.paymentOptionText, paymentMethod === 'cod' && styles.paymentOptionTextActive]}>
                                    Cash on Delivery
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.paymentOption, { backgroundColor: colors.white, borderColor: colors.border }, paymentMethod === 'online' && [styles.paymentOptionActive, { backgroundColor: isDarkMode ? colors.white : COLORS.background }]]}
                                onPress={() => setPaymentMethod('online')}
                            >
                                <Ionicons name="phone-portrait-outline" size={20} color={paymentMethod === 'online' ? COLORS.primary : colors.gray} style={{ marginRight: 8 }} />
                                <Text style={[styles.paymentOptionText, { color: colors.gray }, paymentMethod === 'online' && styles.paymentOptionTextActive]}>
                                    Pay Online (Razorpay)
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.paymentOption, { backgroundColor: colors.white, borderColor: colors.border },
                                    paymentMethod === 'laro_coins' && [styles.paymentOptionActive, { backgroundColor: isDarkMode ? colors.white : COLORS.background }],
                                    laroCurrency < grandTotal && { opacity: 0.5 }
                                ]}
                                onPress={() => {
                                    if (laroCurrency >= grandTotal) {
                                        setPaymentMethod('laro_coins');
                                    } else {
                                        setAlertConfig({
                                            visible: true,
                                            title: 'Insufficient Balance',
                                            message: `You need ${grandTotal} Laro Coins, but only have ${laroCurrency}. Keep ordering to earn more!`,
                                            onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                                        });
                                    }
                                }}
                            >
                                <MaterialCommunityIcons name="star-circle" size={20} color={paymentMethod === 'laro_coins' ? COLORS.primary : colors.gray} style={{ marginRight: 8 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.paymentOptionText, { color: colors.gray }, paymentMethod === 'laro_coins' && styles.paymentOptionTextActive]}>
                                        Pay with Laro Coins
                                    </Text>
                                    <Text style={{ fontSize: 11, color: laroCurrency >= grandTotal ? COLORS.zippitGreen : '#ef4444', fontWeight: 'bold' }}>
                                        Balance: {laroCurrency} Ł
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View style={[styles.bottomBar, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
                        <View>
                            <Text style={[styles.totalLabel, { color: colors.gray }]}>Total to pay</Text>
                            <Text style={[styles.totalAmount, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat(grandTotal || 0).toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.placeOrderButton, loading && { opacity: 0.7 }]}
                            onPress={handlePlaceOrder}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.placeOrderText}>Place Order</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <OrderSuccessOverlay
                visible={orderSuccess}
                onTrackOrder={() => {
                    setOrderSuccess(false);
                    navigation.navigate('Main', { screen: 'Orders' });
                }}
                onHome={() => {
                    setOrderSuccess(false);
                    navigation.navigate('Main', { screen: 'Home' });
                }}
            />

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 15 },
    section: { marginBottom: 22 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10 },
    addressCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.accent },
    addressText: { fontSize: 15, color: '#1a1a2e' },
    addressLabel: { marginTop: 4, fontSize: 12, color: COLORS.primary, fontWeight: '600' },
    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    summaryName: { fontSize: 14, color: '#555', flex: 1 },
    summaryPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
    summaryTotal: { borderTopWidth: 1, borderColor: '#eee', marginTop: 12, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
    summaryTotalLabel: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
    summaryTotalAmount: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
    billDetailSection: { marginTop: 10 },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    billLabel: { fontSize: 13, color: '#666' },
    billValue: { fontSize: 13, fontWeight: '600', color: '#333' },
    paymentOption: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd', padding: 14, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    paymentOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.background },
    paymentOptionText: { fontSize: 15, color: '#666', fontWeight: '600' },
    paymentOptionTextActive: { color: COLORS.primary },
    bottomBar: {
        backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 10,
    },
    totalLabel: { fontSize: 13, color: '#888' },
    totalAmount: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
    placeOrderButton: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 25, minWidth: 130, alignItems: 'center' },
    placeOrderText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Coupon Styles
    couponInputContainer: { flexDirection: 'row', gap: 10 },
    couponInput: { flex: 1, backgroundColor: '#f8f8f8', borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 14, fontWeight: '600' },
    applyBtn: { backgroundColor: '#1a1a2e', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12 },
    applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    appliedCouponContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#22c55e' },
    appliedCouponInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    appliedCouponText: { fontSize: 14, color: '#166534' },
});
