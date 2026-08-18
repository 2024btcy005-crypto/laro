import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, StatusBar, Image, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/cartSlice';
import { authAPI, orderAPI, couponAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import OrderSuccessOverlay from '../../components/OrderSuccessOverlay';
import { useTheme } from '../../context/ThemeContext';
import LaroAlert from '../../components/LaroAlert';

const { width } = Dimensions.get('window');

export default function CheckoutScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const cart = useSelector((state) => state.cart);
    const { user, selectedUniversity } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    
    // States
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState({
        address: 'Engineering Block C, Room 102',
        label: 'Engineering Block C'
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

    useEffect(() => {
        const loadDefaultAddress = async () => {
            const key = `@user_addresses_${user?.id || 'guest'}`;
            try {
                const stored = await AsyncStorage.getItem(key);
                if (stored) {
                    const addresses = JSON.parse(stored);
                    const def = addresses.find(a => a.isDefault) || addresses[0];
                    if (def) {
                        setSelectedAddress({
                            address: def.address,
                            label: def.hostel || def.type || 'Default Address'
                        });
                        return;
                    }
                }
                const summaryRes = await orderAPI.getUserSummary();
                const cloudAddress = summaryRes.data?.user?.address;
                if (cloudAddress) {
                    setSelectedAddress({ address: cloudAddress, label: 'Cloud Address' });
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
    const [laroCurrency, setLaroCurrency] = useState(0);
    const [loyaltyLevel, setLoyaltyLevel] = useState('Learner');

    useEffect(() => {
        const fetchLoyaltyAndConfig = async () => {
            try {
                const res = await orderAPI.getUserSummary();
                setLoyaltyLevel(res.data.loyaltyLevel || 'Learner');
                setLaroCurrency(res.data.laroCurrency || 0);

                const configRes = await orderAPI.getConfig();
                if (configRes.data) {
                    setConfig(configRes.data);
                }
            } catch (err) {
                console.log('Failed to fetch loyalty status or config');
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchLoyaltyAndConfig();
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
                    navigation.navigate('AddressBook');
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
                    productId: item.id || item._id,
                    quantity: item.quantity,
                    metadata: item.metadata
                })),
                couponCode: appliedCoupon?.code,
                universityId: selectedUniversity?.id
            };

            const orderResponse = await orderAPI.createOrder(orderPayload);
            const createdOrder = orderResponse.data;

            // Sync the address to the user's cloud profile
            try {
                await authAPI.updateProfile({ address: selectedAddress.address });
            } catch (cloudErr) {
                console.log('[DEBUG] Cloud address sync failed:', cloudErr.message);
            }

            dispatch(clearCart());
            setOrderSuccess(true);
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

    if (loadingConfig) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: '#f2f7f2' }]} edges={['top']}>
                <ActivityIndicator size="large" color="#056f36" />
                <Text style={{ marginTop: 12, color: '#666', fontWeight: '800' }}>Preparing checkout...</Text>
            </SafeAreaView>
        );
    }

    // Split address into sub-lines
    const addressLines = selectedAddress.address.split(',').map(s => s.trim());
    const addressTitle = selectedAddress.label || addressLines[0] || 'My Location';
    const addressDetails = addressLines.slice(1).join(', ') || 'Within University Grounds';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={22} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            {orderSuccess ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#056f36" />
                    <Text style={{ marginTop: 12, color: '#666', fontWeight: '800' }}>Confirming order...</Text>
                </View>
            ) : (
                <>
                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                        
                        {/* Delivery Address Section */}
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Delivery Address</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AddressBook')}>
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.addressCard}>
                            <View style={styles.addressPinCircle}>
                                <Ionicons name="location" size={20} color="#fff" />
                            </View>
                            <View style={styles.addressTextCol}>
                                <Text style={styles.addressBlockText}>{addressTitle}</Text>
                                <Text style={styles.addressSubText} numberOfLines={2}>{addressDetails}</Text>
                            </View>
                        </View>

                        {/* Payment Method Section */}
                        <Text style={styles.sectionTitle}>Payment Method</Text>

                        {/* Laro Coins */}
                        <TouchableOpacity
                            style={[
                                styles.paymentCard, 
                                paymentMethod === 'laro_coins' && styles.paymentCardActive,
                                laroCurrency < grandTotal && { opacity: 0.5 }
                            ]}
                            onPress={() => {
                                if (laroCurrency >= grandTotal) {
                                    setPaymentMethod('laro_coins');
                                } else {
                                    setAlertConfig({
                                        visible: true,
                                        title: 'Insufficient Balance',
                                        message: `You need ${grandTotal} Laro Coins, but only have ${laroCurrency}.`,
                                        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                                    });
                                }
                            }}
                        >
                            <View style={[styles.paymentIconBox, paymentMethod === 'laro_coins' && styles.paymentIconBoxActive]}>
                                <Ionicons name="logo-bitcoin" size={20} color={paymentMethod === 'laro_coins' ? '#fff' : '#666'} />
                            </View>
                            <View style={styles.paymentDetails}>
                                <Text style={styles.paymentNameText}>Laro Coins</Text>
                                <Text style={styles.paymentSubtext}>Available Balance: {laroCurrency.toFixed(2)}</Text>
                            </View>
                            <View style={styles.radioButton}>
                                {paymentMethod === 'laro_coins' && <View style={styles.radioButtonSelected} />}
                            </View>
                        </TouchableOpacity>

                        {/* COD */}
                        <TouchableOpacity
                            style={[styles.paymentCard, paymentMethod === 'cod' && styles.paymentCardActive]}
                            onPress={() => setPaymentMethod('cod')}
                        >
                            <View style={[styles.paymentIconBox, paymentMethod === 'cod' && styles.paymentIconBoxActive]}>
                                <Ionicons name="cash" size={20} color={paymentMethod === 'cod' ? '#fff' : '#666'} />
                            </View>
                            <View style={styles.paymentDetails}>
                                <Text style={styles.paymentNameText}>Cash on Delivery</Text>
                                <Text style={styles.paymentSubtext}>Pay when you receive</Text>
                            </View>
                            <View style={styles.radioButton}>
                                {paymentMethod === 'cod' && <View style={styles.radioButtonSelected} />}
                            </View>
                        </TouchableOpacity>

                        {/* Order Summary Section */}
                        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Order Summary</Text>
                        <View style={styles.summaryListCard}>
                            {cart.items.map((item, idx) => (
                                <View key={item.id || item._id} style={[styles.summaryRow, idx > 0 && styles.summaryRowBorder]}>
                                    {item.imageUrl ? (
                                        <Image source={{ uri: item.imageUrl }} style={styles.summaryProductImage} />
                                    ) : (
                                        <View style={[styles.summaryProductImage, styles.summaryProductPlaceholder]}>
                                            <Ionicons name="cube-outline" size={16} color="#056f36" />
                                        </View>
                                    )}
                                    <View style={styles.summaryProductDetails}>
                                        <Text style={styles.summaryProductName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.summaryProductQty}>Qty: {item.quantity} • Standard Pack</Text>
                                    </View>
                                    <Text style={styles.summaryProductPrice}>
                                        {CONSTANTS.CURRENCY}{(item.price * item.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Coupons Box */}
                        {!appliedCoupon ? (
                            <View style={styles.couponContainer}>
                                <TextInput
                                    style={styles.couponInput}
                                    placeholder="Enter Promo Code"
                                    placeholderTextColor="#999"
                                    value={couponCode}
                                    onChangeText={(text) => setCouponCode(text.toUpperCase())}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={[styles.couponApplyBtn, !couponCode && { opacity: 0.6 }]}
                                    onPress={handleApplyCoupon}
                                    disabled={couponLoading || !couponCode}
                                >
                                    {couponLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.couponApplyBtnText}>Apply</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.couponActiveCard}>
                                <View style={styles.couponActiveRow}>
                                    <Ionicons name="checkmark-circle" size={18} color="#27c96c" style={{ marginRight: 8 }} />
                                    <Text style={styles.couponActiveText}>{appliedCoupon.code} Applied!</Text>
                                </View>
                                <TouchableOpacity onPress={removeCoupon}>
                                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Bill details */}
                        <View style={styles.billDetailsCard}>
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Item Total</Text>
                                <Text style={styles.billValue}>{CONSTANTS.CURRENCY}{parseFloat(subtotal || 0).toFixed(2)}</Text>
                            </View>

                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Delivery Fee</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={styles.freeBadge}>
                                        <Text style={styles.freeBadgeText}>CAMPUS FREE</Text>
                                    </View>
                                    <Text style={styles.deliveryFeeStruck}>{CONSTANTS.CURRENCY}25.00</Text>
                                    <Text style={styles.deliveryFeeFree}>FREE</Text>
                                </View>
                            </View>

                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Handling Charge</Text>
                                <Text style={styles.billValue}>{CONSTANTS.CURRENCY}{handlingFee.toFixed(2)}</Text>
                            </View>

                            {taxes > 0 && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Platform Tax</Text>
                                    <Text style={styles.billValue}>{CONSTANTS.CURRENCY}{taxes.toFixed(2)}</Text>
                                </View>
                            )}

                            {couponDiscount > 0 && (
                                <View style={styles.billRow}>
                                    <Text style={[styles.billLabel, { color: '#056f36', fontWeight: 'bold' }]}>Coupon Discount</Text>
                                    <Text style={[styles.billValue, { color: '#056f36', fontWeight: 'bold' }]}>-{CONSTANTS.CURRENCY}{couponDiscount.toFixed(2)}</Text>
                                </View>
                            )}

                            <View style={styles.billDivider} />

                            <View style={styles.billTotalRow}>
                                <View>
                                    <Text style={styles.billTotalLabel}>Total Payable</Text>
                                    <Text style={styles.billTotalSubLabel}>Inclusive of all taxes</Text>
                                </View>
                                <Text style={styles.billTotalValue}>{CONSTANTS.CURRENCY}{parseFloat(grandTotal || 0).toFixed(2)}</Text>
                            </View>

                            <View style={{ alignItems: 'center', paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#edf2ed' }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#056f36' }}>Made with ❤️ for Students</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Bottom Payment sticky bar */}
                    <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
                        <View>
                            <Text style={styles.bottomBarLabel}>Total to pay</Text>
                            <Text style={styles.bottomBarAmount}>{CONSTANTS.CURRENCY}{parseFloat(grandTotal || 0).toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]}
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
    container: { flex: 1, backgroundColor: '#f2f7f2' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#f2f7f2'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#056f36' },

    scroll: { paddingHorizontal: 20 },

    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginVertical: 12 },
    editBtnText: { fontSize: 13, fontWeight: '850', color: '#056f36' },

    // Address Card
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1,
        marginBottom: 15
    },
    addressPinCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#27c96c',
        justifyContent: 'center',
        alignItems: 'center'
    },
    addressTextCol: {
        flex: 1,
        marginLeft: 12
    },
    addressBlockText: { fontSize: 15, fontWeight: '900', color: '#111' },
    addressSubText: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '600' },

    // Payment Selection Cards
    paymentCard: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#f0f4f0',
        borderRadius: 22,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1
    },
    paymentCardActive: {
        borderColor: '#27c96c',
        backgroundColor: '#edf5ed'
    },
    paymentIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#f2f7f2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e6ede6'
    },
    paymentIconBoxActive: {
        backgroundColor: '#27c96c',
        borderColor: '#27c96c'
    },
    paymentDetails: {
        flex: 1,
        marginLeft: 12
    },
    paymentNameText: { fontSize: 14, fontWeight: '900', color: '#111' },
    paymentSubtext: { fontSize: 11, color: '#666', marginTop: 2, fontWeight: '600' },
    radioButton: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#aaa',
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioButtonSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#056f36'
    },

    // Order Summary
    summaryListCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14
    },
    summaryRowBorder: {
        borderTopWidth: 1,
        borderTopColor: '#f7faf7'
    },
    summaryProductImage: { width: 44, height: 44, borderRadius: 10 },
    summaryProductPlaceholder: {
        backgroundColor: '#edf5ed',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d0dcd0',
    },
    summaryProductDetails: {
        flex: 1,
        marginLeft: 12
    },
    summaryProductName: { fontSize: 14, fontWeight: '900', color: '#111' },
    summaryProductQty: { fontSize: 11, color: '#666', marginTop: 2, fontWeight: '600' },
    summaryProductPrice: { fontSize: 14, fontWeight: '900', color: '#111' },

    // Coupon
    couponContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15
    },
    couponInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#f0f4f0',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 48,
        fontSize: 13,
        fontWeight: '700',
        color: '#111'
    },
    couponApplyBtn: {
        backgroundColor: '#056f36',
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16
    },
    couponApplyBtnText: { color: '#fff', fontWeight: '850', fontSize: 13 },
    couponActiveCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#edf5ed',
        borderWidth: 1,
        borderColor: '#27c96c',
        borderRadius: 16,
        padding: 14,
        marginBottom: 15
    },
    couponActiveRow: { flexDirection: 'row', alignItems: 'center' },
    couponActiveText: { fontSize: 13, fontWeight: '850', color: '#056f36' },

    // Bill Details Card
    billDetailsCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1,
        marginBottom: 20
    },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
    billLabel: { fontSize: 13, color: '#666', fontWeight: '750' },
    billValue: { fontSize: 13, color: '#111', fontWeight: '800' },
    freeBadge: {
        backgroundColor: '#d8e5d8',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginRight: 6
    },
    freeBadgeText: { fontSize: 9, color: '#056f36', fontWeight: '850' },
    deliveryFeeStruck: { fontSize: 12, color: '#999', textDecorationLine: 'line-through', marginRight: 6, fontWeight: '600' },
    deliveryFeeFree: { fontSize: 13, color: '#27c96c', fontWeight: '900' },
    billDivider: { height: 1, backgroundColor: '#edf2ed', marginVertical: 12 },
    
    billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    billTotalLabel: { fontSize: 15, fontWeight: '900', color: '#111' },
    billTotalSubLabel: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 1 },
    billTotalValue: { fontSize: 20, fontWeight: '900', color: '#056f36' },

    // Bottom Sticky Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f4f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 10
    },
    bottomBarLabel: { fontSize: 10, color: '#999', fontWeight: '800' },
    bottomBarAmount: { fontSize: 22, fontWeight: '950', color: '#056f36', marginTop: 2 },
    placeOrderBtn: {
        backgroundColor: '#056f36', // Deep green checkout placement button
        borderRadius: 16,
        height: 48,
        paddingHorizontal: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    placeOrderText: { color: '#fff', fontSize: 14, fontWeight: '850' }
});
