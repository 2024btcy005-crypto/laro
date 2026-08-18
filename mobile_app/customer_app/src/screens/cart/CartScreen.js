import React, { useRef, useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
    ScrollView, StatusBar, ActivityIndicator, TextInput, Dimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart, clearCart } from '../../store/cartSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function CartScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const cart = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const flatListRef = useRef(null);
    const insets = useSafeAreaInsets();

    // Local States
    const [defaultAddress, setDefaultAddress] = useState('Setup Campus Block');
    const [instructions, setInstructions] = useState('');
    const [config, setConfig] = useState({
        taxRate: 5.0,
        handlingCharge: 2.00,
        defaultDeliveryFee: 0.00
    });
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        const fetchConfigAndAddress = async () => {
            try {
                // Fetch config
                const response = await api.get('/config');
                if (response.data) {
                    setConfig({
                        taxRate: response.data.taxRate || 5.0,
                        handlingCharge: response.data.handlingCharge || 2.00,
                        defaultDeliveryFee: response.data.defaultDeliveryFee || 0.00
                    });
                }

                // Fetch default address
                const key = `@user_addresses_${user?.id || 'guest'}`;
                const storedAddresses = await AsyncStorage.getItem(key);
                if (storedAddresses) {
                    const addresses = JSON.parse(storedAddresses);
                    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
                    if (defaultAddr) {
                        setDefaultAddress(defaultAddr.hostel || `${defaultAddr.room}, ${defaultAddr.universityName}`);
                    }
                }
            } catch (error) {
                console.log('Failed to fetch config or address:', error.message);
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfigAndAddress();
    }, [user]);

    const handleIncrement = (item) => dispatch(addToCart(item));
    const handleDecrement = (item) => dispatch(removeFromCart(item.id || item._id));

    // Billing Calculations
    const subtotal = cart.totalAmount || 0;
    const taxes = Math.round(subtotal * (config.taxRate / 100));
    const handlingFee = parseFloat(config.handlingCharge);
    const deliveryFee = parseFloat(config.defaultDeliveryFee);
    const grandTotal = subtotal + taxes + handlingFee + deliveryFee;

    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    if (loadingConfig && cart.items.length > 0) {
        return (
            <SafeAreaView style={[styles.emptyContainer, { backgroundColor: '#f2f7f2' }]}>
                <ActivityIndicator size="large" color="#056f36" />
            </SafeAreaView>
        );
    }

    if (cart.items.length === 0) {
        return (
            <SafeAreaView style={[styles.emptyContainer, { backgroundColor: '#ffffff' }]}>
                <Ionicons name="cart-outline" size={100} color="#056f36" style={{ opacity: 0.2 }} />
                <Text style={styles.emptyText}>Your cart is empty.</Text>
                <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
                    <Text style={styles.browseButtonText}>Start Shopping</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={22} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Cart</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]} 
                showsVerticalScrollIndicator={false}
            >
                {/* Delivering To Card */}
                <View style={styles.deliveryCard}>
                    <View style={styles.deliveryIconCircle}>
                        <Ionicons name="location" size={20} color="#fff" />
                    </View>
                    <View style={styles.deliveryTextCol}>
                        <Text style={styles.deliveryLabel}>DELIVERING TO</Text>
                        <Text style={styles.deliveryBlockText} numberOfLines={1}>{defaultAddress}</Text>
                        
                        <View style={styles.timeBadgeRow}>
                            <View style={styles.timeBadge}>
                                <Ionicons name="time-outline" size={12} color="#056f36" style={{ marginRight: 4 }} />
                                <Text style={styles.timeBadgeText}>Arriving in 12-15 mins</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.deliveryEditBtn}
                        onPress={() => navigation.navigate('AddressBook')}
                    >
                        <Ionicons name="pencil-sharp" size={14} color="#056f36" style={{ marginRight: 4 }} />
                        <Text style={styles.deliveryEditText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Items Section Title */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Your Items</Text>
                    <Text style={styles.itemsCountLabel}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
                </View>

                {/* Cart Items List */}
                {cart.items.map((item, idx) => (
                    <View key={item.id || item._id} style={styles.cartCard}>
                        {item.imageUrl ? (
                            <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} />
                        ) : (
                            <View style={[styles.cartItemImage, styles.cartItemPlaceholder]}>
                                <Ionicons name="cube-outline" size={24} color="#056f36" />
                            </View>
                        )}
                        <View style={styles.cartItemDetails}>
                            <Text style={styles.cartItemShopName} numberOfLines={1}>{item.category || 'Store Item'}</Text>
                            <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                            {item.metadata?.options ? (
                                <Text style={styles.cartItemVariant}>{item.metadata.options.colorMode} • {item.metadata.options.sides}</Text>
                            ) : (
                                <Text style={styles.cartItemVariant}>Standard</Text>
                            )}
                            <Text style={styles.cartItemPrice}>{CONSTANTS.CURRENCY}{parseFloat(item.price || 0).toFixed(2)}</Text>
                        </View>
                        
                        {/* Quantity controls */}
                        <View style={styles.quantityPill}>
                            <TouchableOpacity style={styles.qtyPillAction} onPress={() => handleDecrement(item)}>
                                <Ionicons name="remove" size={14} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.qtyPillValue}>{item.quantity}</Text>
                            <TouchableOpacity style={styles.qtyPillAction} onPress={() => handleIncrement(item)}>
                                <Ionicons name="add" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Add More Items Button */}
                <TouchableOpacity 
                    style={styles.addMoreDashedBtn} 
                    onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                >
                    <Ionicons name="add-circle" size={20} color="#056f36" style={{ marginRight: 6 }} />
                    <Text style={styles.addMoreBtnText}>Add more items</Text>
                </TouchableOpacity>

                {/* Rider Instructions */}
                <View style={styles.instructionsContainer}>
                    <View style={styles.instructionsHeaderRow}>
                        <Ionicons name="document-text-outline" size={18} color="#056f36" style={{ marginRight: 6 }} />
                        <Text style={styles.instructionsHeaderLabel}>Rider Instructions</Text>
                    </View>
                    <TextInput
                        style={styles.instructionsInput}
                        placeholder="Leave at the reception or call upon arrival..."
                        placeholderTextColor="#999"
                        multiline={true}
                        value={instructions}
                        onChangeText={setInstructions}
                    />
                </View>

                {/* Bill Details */}
                <View style={styles.billDetailsCard}>
                    <Text style={styles.billCardTitle}>Bill Details</Text>
                    
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Item Total</Text>
                        <Text style={styles.billValue}>{CONSTANTS.CURRENCY}{parseFloat(subtotal || 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Delivery Fee</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.billDeliveryStruck}>{CONSTANTS.CURRENCY}25.00</Text>
                            <Text style={styles.billDeliveryFree}>FREE</Text>
                        </View>
                    </View>

                    <View style={styles.billRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.billLabel}>Campus Handling Fee</Text>
                            <Ionicons name="information-circle-outline" size={14} color="#888" style={{ marginLeft: 4 }} />
                        </View>
                        <Text style={styles.billValue}>{CONSTANTS.CURRENCY}{handlingFee.toFixed(2)}</Text>
                    </View>

                    {taxes > 0 && (
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Govt Taxes & Charges</Text>
                            <Text style={styles.billValue}>{CONSTANTS.CURRENCY}{parseFloat(taxes || 0).toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={styles.billDivider} />

                    <View style={styles.billRow}>
                        <Text style={styles.billTotalLabel}>Total Payable</Text>
                        <Text style={styles.billTotalValue}>{CONSTANTS.CURRENCY}{parseFloat(grandTotal || 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.billFooterBadge}>
                        <Text style={styles.billMadeWithLoveText}>Made with ❤️ for Students</Text>
                    </View>
                </View>

                {/* Savings Banner */}
                <View style={styles.savingsBanner}>
                    <Text style={styles.savingsBannerText}>You're saving {CONSTANTS.CURRENCY}25.00 on this order!</Text>
                </View>
            </ScrollView>

            {/* Bottom Checkout Bar */}
            <View style={[styles.checkoutStickyBar, { paddingBottom: insets.bottom + 10 }]}>
                <View style={styles.checkoutPricingCol}>
                    <Text style={styles.checkoutItemCountText}>{itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}</Text>
                    <Text style={styles.checkoutPriceTotalText}>{CONSTANTS.CURRENCY}{parseFloat(grandTotal || 0).toFixed(2)}</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.checkoutButton}
                    onPress={() => navigation.navigate('Checkout')}
                >
                    <Text style={styles.checkoutBtnLabel}>Proceed to Checkout</Text>
                    <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {/* Secure footer text */}
                <View style={styles.secureBadgeFooter}>
                    <Ionicons name="lock-closed" size={10} color="#999" style={{ marginRight: 4 }} />
                    <Text style={styles.secureBadgeText}>SAFE & SECURE CHECKOUT</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#f2f7f2'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#056f36' },
    moreButton: { padding: 4 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
    emptyText: { fontSize: 20, color: '#333', marginVertical: 20, fontWeight: '950' },
    browseButton: { backgroundColor: '#056f36', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20 },
    browseButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },

    // Delivery Address Card
    deliveryCard: {
        backgroundColor: '#e6ede6', // Dotted banner tint
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1.5,
        borderColor: '#d0dcd0'
    },
    deliveryIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#056f36',
        justifyContent: 'center',
        alignItems: 'center'
    },
    deliveryTextCol: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center'
    },
    deliveryLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#666',
        letterSpacing: 1
    },
    deliveryBlockText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#111',
        marginTop: 2
    },
    timeBadgeRow: { flexDirection: 'row', marginTop: 4 },
    timeBadge: {
        backgroundColor: '#d8e5d8',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center'
    },
    timeBadgeText: { fontSize: 10, color: '#056f36', fontWeight: '800' },
    deliveryEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d0dcd0'
    },
    deliveryEditText: { fontSize: 12, fontWeight: '800', color: '#056f36' },

    // Sections Header
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
    itemsCountLabel: { fontSize: 13, color: '#666', fontWeight: '800' },

    // Cart Items
    cartCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1
    },
    cartItemImage: { width: 68, height: 68, borderRadius: 14 },
    cartItemPlaceholder: {
        backgroundColor: '#edf5ed',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d0dcd0',
    },
    cartItemDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center'
    },
    cartItemShopName: { fontSize: 11, color: '#999', fontWeight: '700' },
    cartItemName: { fontSize: 14, fontWeight: '900', color: '#111', marginTop: 2 },
    cartItemVariant: { fontSize: 11, color: '#666', marginTop: 1, fontWeight: '600' },
    cartItemPrice: { fontSize: 14, fontWeight: '800', color: '#056f36', marginTop: 3 },

    quantityPill: {
        backgroundColor: '#27c96c', // Green controller background
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        gap: 6
    },
    qtyPillAction: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center'
    },
    qtyPillValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        minWidth: 18,
        textAlign: 'center'
    },

    // Add More button
    addMoreDashedBtn: {
        borderWidth: 1.5,
        borderColor: '#056f36',
        borderStyle: 'dashed',
        borderRadius: 16,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(5, 111, 54, 0.03)',
        marginTop: 10,
        marginBottom: 20
    },
    addMoreBtnText: { color: '#056f36', fontSize: 13, fontWeight: '800' },

    // Instructions
    instructionsContainer: {
        backgroundColor: '#e6ede6',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#d0dcd0'
    },
    instructionsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    instructionsHeaderLabel: { fontSize: 13, fontWeight: '800', color: '#056f36' },
    instructionsInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d0dcd0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        height: 60,
        fontSize: 13,
        color: '#111',
        textAlignVertical: 'top',
        fontWeight: '700'
    },

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
        marginBottom: 12
    },
    billFooterBadge: {
        alignItems: 'center',
        paddingTop: 10,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#edf2ed',
    },
    billMadeWithLoveText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#056f36',
    },
    billCardTitle: { fontSize: 15, fontWeight: '900', color: '#111', marginBottom: 15 },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
    billLabel: { fontSize: 13, color: '#666', fontWeight: '750' },
    billValue: { fontSize: 13, color: '#111', fontWeight: '800' },
    billDeliveryStruck: { fontSize: 12, color: '#999', textDecorationLine: 'line-through', marginRight: 6, fontWeight: '600' },
    billDeliveryFree: { fontSize: 13, color: '#056f36', fontWeight: '900' },
    billDivider: { height: 1, backgroundColor: '#edf2ed', marginVertical: 12 },
    billTotalLabel: { fontSize: 15, fontWeight: '900', color: '#111' },
    billTotalValue: { fontSize: 18, fontWeight: '900', color: '#056f36' },

    // Savings banner
    savingsBanner: {
        backgroundColor: '#d8e5d8',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30
    },
    savingsBannerText: { fontSize: 12, color: '#056f36', fontWeight: '900' },

    // Sticky Checkout Bar
    checkoutStickyBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 15,
        flexDirection: 'row',
        flexWrap: 'wrap',
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
    checkoutPricingCol: {
        justifyContent: 'center'
    },
    checkoutItemCountText: { fontSize: 9, fontWeight: '850', color: '#999', letterSpacing: 0.5 },
    checkoutPriceTotalText: { fontSize: 22, fontWeight: '950', color: '#056f36', marginTop: 2 },
    checkoutButton: {
        backgroundColor: '#27c96c', // Green checkout button
        borderRadius: 16,
        height: 48,
        paddingHorizontal: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#27c96c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    checkoutBtnLabel: { color: '#fff', fontSize: 14, fontWeight: '850' },
    
    secureBadgeFooter: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#f7faf7'
    },
    secureBadgeText: { fontSize: 9, color: '#999', fontWeight: '800', letterSpacing: 0.5 }
});
