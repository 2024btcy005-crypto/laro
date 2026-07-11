import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, Dimensions, Animated, StatusBar, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../../store/cartSlice';
import { COLORS, CONSTANTS } from '../../theme';
import LaroToast from '../../components/LaroToast';
import * as Haptics from 'expo-haptics';
import SoundService from '../../services/SoundService';
import apiService, { resolveImageUrl } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FavouriteService } from '../../services/FavouriteService';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
    const { colors } = useTheme();
    const { product: initialProduct, productId: initialProductId } = route.params;
    const [product, setProduct] = useState(initialProduct || {});
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const cart = useSelector(state => state.cart);
    const { user } = useSelector(state => state.auth);
    
    // States
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [loading, setLoading] = useState(!initialProduct && !!initialProductId);
    const [isFav, setIsFav] = useState(false);
    
    const [localQty, setLocalQty] = useState(1);
    const productPrice = parseFloat(product.price || 0);

    // Favorite effect
    useEffect(() => {
        if (!product?.id) return;
        const checkFavStatus = async () => {
            if (!user) return;
            const status = await FavouriteService.isFavourite(user.id, product.id || product._id, 'product');
            setIsFav(status);
        };
        checkFavStatus();
    }, [user, product]);

    const toggleFav = async () => {
        if (!user) return;
        const newFavs = await FavouriteService.toggleFavourite(user.id, product, 'product');
        if (newFavs) {
            setIsFav(newFavs.some(fav => (fav.id || fav._id) === (product.id || product._id)));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const fetchProductDetails = async (id) => {
        try {
            const res = await apiService.get(`/products/${id}`);
            if (res.data) {
                setProduct(res.data);
            }
        } catch (error) {
            console.log('[ProductDetail] Error fetching product:', error.message);
        }
    };

    useEffect(() => {
        const loadPage = async () => {
            if (!product.id && initialProductId) {
                setLoading(true);
                await fetchProductDetails(initialProductId);
                setLoading(false);
            }
        };
        loadPage();
    }, [initialProductId]);

    const handleAddToCart = () => {
        const cartItemPayload = {
            ...product,
            price: productPrice,
            quantity: localQty,
            shopId: product.shopId
        };

        dispatch(addToCart(cartItemPayload));
        setToastMessage(`${product.name} added to cart!`);
        setToastVisible(true);
        Haptics.selectionAsync();
        SoundService.playPop();
    };

    if (loading || !product.id) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f7f2' }]}>
                <ActivityIndicator color="#056f36" size="large" />
                <Text style={{ marginTop: 10, color: '#666', fontWeight: '800' }}>Loading product details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <LaroToast
                visible={toastVisible}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                {/* Hero Product Image */}
                <View style={styles.imageHeroContainer}>
                    <Image source={{ uri: resolveImageUrl(product.imageUrl) }} style={styles.productHeroImage} />
                    
                    {/* Absolute Floating Buttons */}
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={[styles.floatingCircleBtn, { left: 20, top: insets.top + 10 }]}
                    >
                        <Ionicons name="arrow-back" size={20} color="#056f36" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.floatingCircleBtn, { right: 70, top: insets.top + 10 }]}
                        onPress={toggleFav}
                    >
                        <Ionicons 
                            name={isFav ? "heart" : "heart-outline"} 
                            size={20} 
                            color={isFav ? "#ff3b30" : "#056f36"} 
                        />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.floatingCircleBtn, { right: 20, top: insets.top + 10 }]}
                    >
                        <Ionicons name="share-social-outline" size={20} color="#056f36" />
                    </TouchableOpacity>
                </View>

                {/* Content Details */}
                <View style={styles.infoWrapper}>
                    <View style={styles.titlePriceRow}>
                        <Text style={styles.productTitleText} numberOfLines={2}>{product.name}</Text>
                        <Text style={styles.productPriceText}>{CONSTANTS.CURRENCY}{productPrice.toFixed(2)}</Text>
                    </View>
                    
                    <Text style={styles.shopNameText}>{product.category || 'Campus Store'}</Text>

                    {/* Review Badge rows */}
                    <View style={styles.badgeRow}>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#ff6633" style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText}>4.8 <Text style={styles.ratingCountText}>(120+)</Text></Text>
                        </View>
                        <View style={styles.studentBadge}>
                            <Text style={styles.studentBadgeText}>Student Favorite</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.descText}>
                        {product.description || `This premium ${product.name} is carefully picked for its quality. It is tailored for student needs on campus.`}
                    </Text>

                    <View style={styles.dividerLine} />

                    {/* Delivery Information Block */}
                    <View style={styles.deliveryInfoBlock}>
                        <Text style={styles.optionSectionTitle}>Delivery Information</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={18} color="#056f36" style={{ marginRight: 10 }} />
                            <Text style={styles.infoLabelText}>Estimated Delivery: 20-30 mins</Text>
                        </View>
                        <View style={[styles.infoRow, { marginTop: 10 }]}>
                            <Ionicons name="shield-checkmark-outline" size={18} color="#056f36" style={{ marginRight: 10 }} />
                            <Text style={styles.infoLabelText}>Quality Assured by Laro Network</Text>
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* Floating Cart FAB */}
            {cart.items.length > 0 && (
                <TouchableOpacity 
                    style={[styles.cartFab, { bottom: insets.bottom + 75 }]}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Ionicons name="cart" size={24} color="#fff" />
                    <View style={styles.cartFabBadge}>
                        <Text style={styles.cartFabBadgeText}>
                            {cart.items.reduce((acc, curr) => acc + (curr.quantity || 1), 0)}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Bottom Add Bar */}
            <View style={[styles.stickyBottomBar, { paddingBottom: insets.bottom + 10 }]}>
                {/* Quantity select pill */}
                <View style={styles.quantitySelectorPill}>
                    <TouchableOpacity 
                        style={styles.qtyPillActionBtn} 
                        onPress={() => setLocalQty(q => Math.max(1, q - 1))}
                    >
                        <Ionicons name="remove" size={16} color="#111" />
                    </TouchableOpacity>
                    
                    <Text style={styles.qtyPillValueText}>{localQty}</Text>
                    
                    <TouchableOpacity 
                        style={styles.qtyPillActionBtn} 
                        onPress={() => setLocalQty(q => q + 1)}
                    >
                        <Ionicons name="add" size={16} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* Add To Cart CTA Button */}
                <TouchableOpacity style={styles.addToCartCtaBtn} onPress={handleAddToCart}>
                    <Text style={styles.addToCartCtaBtnText}>Add to Cart  •  {CONSTANTS.CURRENCY}{(productPrice * localQty).toFixed(2)}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' },
    
    // Image container styles
    imageHeroContainer: {
        width: width,
        height: 380,
        backgroundColor: '#fff',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center'
    },
    productHeroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    floatingCircleBtn: {
        position: 'absolute',
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4
    },

    // Info details wrapper
    infoWrapper: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -30,
        padding: 24,
        minHeight: Dimensions.get('window').height - 400
    },
    titlePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10
    },
    productTitleText: {
        flex: 1,
        fontSize: 22,
        fontWeight: '900',
        color: '#111',
        lineHeight: 28
    },
    productPriceText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#056f36'
    },
    shopNameText: {
        fontSize: 13,
        color: '#999',
        fontWeight: '700',
        marginTop: 6
    },

    // Badges Row
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        marginBottom: 16
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f7f2',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '850',
        color: '#111'
    },
    ratingCountText: {
        color: '#888',
        fontWeight: '600'
    },
    studentBadge: {
        backgroundColor: '#d8e5d8',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12
    },
    studentBadgeText: {
        fontSize: 11,
        color: '#056f36',
        fontWeight: '850'
    },

    descText: {
        fontSize: 13,
        color: '#555',
        lineHeight: 20,
        fontWeight: '650',
        marginBottom: 20
    },
    dividerLine: {
        height: 1.5,
        backgroundColor: '#edf2ed',
        marginVertical: 15
    },

    // Option selections
    optionSectionTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#111',
        marginVertical: 12
    },
    packSizeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20
    },
    sizeBtn: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e6ede6',
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    sizeBtnActive: {
        backgroundColor: '#27c96c', // Bright green selected state
        borderColor: '#27c96c'
    },
    sizeBtnText: {
        fontSize: 13,
        fontWeight: '850',
        color: '#666'
    },
    sizeBtnTextActive: {
        color: '#fff'
    },

    // Flavors list and headers
    headerSelectionLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10
    },
    badgeTagSelect: {
        backgroundColor: '#f1f1f1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    badgeTagSelectText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#666',
        letterSpacing: 0.5
    },
    badgeTagOptional: {
        backgroundColor: '#f1f1f1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    badgeTagOptionalText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#666',
        letterSpacing: 0.5
    },

    flavorOptionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#f0f4f0',
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5
    },
    flavorOptionCardActive: {
        borderColor: '#27c96c',
        backgroundColor: '#edf5ed'
    },
    flavorDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    flavorNameText: {
        fontSize: 14,
        fontWeight: '850',
        color: '#111'
    },
    flavorPriceText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#666'
    },

    // Checkbox cards
    checkboxRowCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#f0f4f0',
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5
    },
    checkboxOutline: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#bbb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    checkboxActive: {
        backgroundColor: '#056f36',
        borderColor: '#056f36'
    },
    checkboxLabelText: {
        fontSize: 14,
        fontWeight: '850',
        color: '#111'
    },
    addonPriceText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#666'
    },

    // Sticky Bottom Add Bar
    stickyBottomBar: {
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
    quantitySelectorPill: {
        backgroundColor: '#f2f7f2',
        borderRadius: 16,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        width: 110,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e6ede6'
    },
    qtyPillActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    qtyPillValueText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#111',
        textAlign: 'center'
    },
    addToCartCtaBtn: {
        backgroundColor: '#27c96c', // Solid bright green button matching mockup
        borderRadius: 16,
        height: 48,
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#27c96c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    addToCartCtaBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900'
    },
    cartFab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#056f36',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 999
    },
    cartFabBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ff3b30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#fff'
    },
    cartFabBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900'
    },
    deliveryInfoBlock: {
        backgroundColor: '#f8faf8',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e6ede6',
        marginTop: 10
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    infoLabelText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '700'
    }
});
