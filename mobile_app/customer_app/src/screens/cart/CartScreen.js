import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart, clearCart } from '../../store/cartSlice';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function CartScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const cart = useSelector((state) => state.cart);
    const dispatch = useDispatch();
    const flatListRef = useRef(null);
    const insets = useSafeAreaInsets();

    // Dynamic Configs State
    const [config, setConfig] = useState({
        taxRate: 5.0,
        handlingCharge: 2.00,
        defaultDeliveryFee: 0.00
    });
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get('/config');
                if (response.data) {
                    setConfig({
                        taxRate: response.data.taxRate || 5.0,
                        handlingCharge: response.data.handlingCharge || 2.00,
                        defaultDeliveryFee: response.data.defaultDeliveryFee || 0.00
                    });
                }
            } catch (error) {
                console.log('Failed to fetch config, using defaults:', error.message);
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    const handleIncrement = (item) => dispatch(addToCart(item));
    const handleDecrement = (item) => dispatch(removeFromCart(item.id || item._id));
    // Dynamic Billing Calculations
    const subtotal = cart.totalAmount || 0;
    const taxes = Math.round(subtotal * (config.taxRate / 100));
    const handlingFee = parseFloat(config.handlingCharge);
    const deliveryFee = parseFloat(config.defaultDeliveryFee);
    const grandTotal = subtotal + taxes + handlingFee + deliveryFee;

    if (loadingConfig && cart.items.length > 0) {
        return (
            <SafeAreaView style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    const scrollToBill = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    const renderCartItem = ({ item }) => (
        <View style={[styles.cartItem, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <Image source={{ uri: item.imageUrl }} style={[styles.itemImage, { backgroundColor: isDarkMode ? colors.background : '#f9f9f9' }]} />
            <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.black }]} numberOfLines={1}>{item.name}</Text>
                {item.metadata && (
                    <View style={styles.xeroxBadgeContainer}>
                        <View style={[styles.xeroxBadge, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }]}>
                            <Text style={[styles.xeroxBadgeText, { color: colors.gray }]}>{item.metadata.pageCount} Pages</Text>
                        </View>
                        <View style={[styles.xeroxBadge, { backgroundColor: isDarkMode ? '#831843' : '#fdf2f8' }]}>
                            <Text style={[styles.xeroxBadgeText, { color: COLORS.primary }]}>{item.metadata.options?.colorMode}</Text>
                        </View>
                        <View style={[styles.xeroxBadge, { backgroundColor: isDarkMode ? '#064e3b' : '#f0fdf4' }]}>
                            <Text style={[styles.xeroxBadgeText, { color: isDarkMode ? '#6ee7b7' : '#166534' }]}>{item.metadata.options?.sides}</Text>
                        </View>
                    </View>
                )}
                <Text style={styles.itemPrice}>{CONSTANTS.CURRENCY}{parseFloat(item.price || 0).toFixed(2)}</Text>
            </View>
            <View style={[styles.quantityContainer, { backgroundColor: isDarkMode ? colors.background : '#f5f5f5' }]}>
                <TouchableOpacity style={[styles.qtyButton, { backgroundColor: colors.white }]} onPress={() => handleDecrement(item)}>
                    <Ionicons name="remove" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={[styles.qtyValue, { color: colors.black }]}>{item.quantity}</Text>
                <TouchableOpacity style={[styles.qtyButton, { backgroundColor: colors.white }]} onPress={() => handleIncrement(item)}>
                    <Ionicons name="add" size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (cart.items.length === 0) {
        return (
            <SafeAreaView style={[styles.emptyContainer, { backgroundColor: colors.white }]}>
                <Ionicons name="cart-outline" size={100} color={COLORS.primary} style={{ opacity: 0.2 }} />
                <Text style={[styles.emptyText, { color: colors.black }]}>Your cart is empty.</Text>
                <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
                    <Text style={styles.browseButtonText}>Start Shopping</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDarkMode ? colors.background : '#f8f8f8' }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>My Cart ({cart.items.length})</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={cart.items}
                keyExtractor={(item) => (item.id || item._id).toString()}
                renderItem={renderCartItem}
                contentContainerStyle={styles.listContainer}
                ListFooterComponent={() => (
                    <View style={[styles.billContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
                        <Text style={[styles.billTitle, { color: colors.black }]}>Bill Details</Text>
                        <View style={styles.billRow}>
                            <View style={styles.billLabelGroup}>
                                <Ionicons name="bag-check-outline" size={16} color={colors.gray} />
                                <Text style={[styles.billLabel, { color: colors.gray }]}>Item Total</Text>
                            </View>
                            <Text style={[styles.billValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat(subtotal || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.billRow}>
                            <View style={styles.billLabelGroup}>
                                <Ionicons name="bicycle-outline" size={16} color={colors.gray} />
                                <Text style={[styles.billLabel, { color: colors.gray }]}>Delivery Fee</Text>
                            </View>
                            {deliveryFee === 0 ? (
                                <Text style={[styles.billValue, { color: COLORS.primary }]}>FREE</Text>
                            ) : (
                                <Text style={[styles.billValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{deliveryFee.toFixed(2)}</Text>
                            )}
                        </View>
                        <View style={styles.billRow}>
                            <View style={styles.billLabelGroup}>
                                <Ionicons name="shield-checkmark-outline" size={16} color={colors.gray} />
                                <Text style={[styles.billLabel, { color: colors.gray }]}>Handling Charge</Text>
                            </View>
                            <Text style={[styles.billValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{handlingFee.toFixed(2)}</Text>
                        </View>
                        <View style={styles.billRow}>
                            <View style={styles.billLabelGroup}>
                                <Ionicons name="receipt-outline" size={16} color={colors.gray} />
                                <Text style={[styles.billLabel, { color: colors.gray }]}>Govt Taxes & Charges</Text>
                            </View>
                            <Text style={[styles.billValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat(taxes || 0).toFixed(2)}</Text>
                        </View>
                        <View style={[styles.billRow, styles.billRowTotal, { borderTopColor: colors.border }]}>
                            <Text style={[styles.billTotalLabel, { color: colors.black }]}>Grand Total</Text>
                            <Text style={[styles.billTotalValue, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat(grandTotal || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                )}
            />

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 15, backgroundColor: colors.white, borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.bottomBarTextContainer} onPress={scrollToBill}>
                    <Text style={[styles.grandTotalAmount, { color: colors.black }]}>{CONSTANTS.CURRENCY}{parseFloat(grandTotal || 0).toFixed(2)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.grandTotalText}>VIEW DETAIL BILL</Text>
                        <Ionicons name="chevron-up" size={14} color={COLORS.primary} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={() => navigation.navigate('Checkout')}
                >
                    <Text style={styles.checkoutButtonText}>Proceed to Pay</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 15, backgroundColor: '#fff', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    backButton: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a', marginLeft: 12 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
    emptyText: { fontSize: 20, color: '#333', marginVertical: 20, fontWeight: '900' },
    browseButton: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20, elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
    browseButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },

    listContainer: { padding: 20, paddingBottom: 140 },
    cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 24, marginBottom: 15, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, borderWidth: 1, borderColor: '#f0f0f0' },
    itemImage: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#f9f9f9', resizeMode: 'contain' },
    itemInfo: { flex: 1, marginLeft: 15 },
    itemName: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },
    itemPrice: { fontSize: 16, color: COLORS.primary, marginTop: 4, fontWeight: '900' },

    quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 14, padding: 4 },
    qtyButton: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    qtyValue: { marginHorizontal: 15, fontSize: 16, fontWeight: '900', color: '#1a1a1a' },

    billContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 15, borderWidth: 1, borderColor: '#f0f0f0' },
    billTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginBottom: 20 },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    billLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    billLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
    billValue: { fontSize: 15, color: '#1a1a1a', fontWeight: '900' },
    billRowTotal: { borderTopWidth: 1.5, borderTopColor: '#f0f0f0', paddingTop: 20, marginTop: 8 },
    billTotalLabel: { fontSize: 20, fontWeight: '900', color: '#1a1a1a' },
    billTotalValue: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 25, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
    bottomBarTextContainer: { flex: 1 },
    grandTotalText: { fontSize: 12, color: COLORS.primary, fontWeight: '900', marginTop: 4, letterSpacing: 0.8 },
    grandTotalAmount: { fontSize: 28, fontWeight: '900', color: '#1a1a1a' },
    checkoutButton: { backgroundColor: COLORS.primary, paddingVertical: 18, paddingHorizontal: 40, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 12 },
    checkoutButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    xeroxBadgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 4 },
    xeroxBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    xeroxBadgeText: { fontSize: 10, fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
});
