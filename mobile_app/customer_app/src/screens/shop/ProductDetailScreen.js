import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, Dimensions, Animated, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../../store/cartSlice';
import { COLORS, CONSTANTS } from '../../theme';
import LaroToast from '../../components/LaroToast';
import * as Haptics from 'expo-haptics';
import SoundService from '../../services/SoundService';
import { FavouriteService } from '../../services/FavouriteService';
import apiService, { resolveImageUrl } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { product: initialProduct, productId: initialProductId } = route.params;
    const [product, setProduct] = useState(initialProduct || {});
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const cart = useSelector(state => state.cart);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [loading, setLoading] = useState(!initialProduct && !!initialProductId);
    const [isFav, setIsFav] = useState(false);
    const { user, selectedUniversity } = useSelector(state => state.auth);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    const cartItem = cart.items.find(item => (item.id || item._id) === (product?.id || product?._id));
    const quantity = cartItem ? cartItem.quantity : 0;

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

    React.useEffect(() => {
        const loadPage = async () => {
            if (!product.id && initialProductId) {
                setLoading(true);
                await fetchProductDetails(initialProductId);
                setLoading(false);
            }
        };
        loadPage();
    }, [initialProductId]);

    React.useEffect(() => {
        if (!product?.id) return;

        const checkFavStatus = async () => {
            if (!user) return;
            const status = await FavouriteService.isFavourite(user.id, product.id || product._id, 'product');
            setIsFav(status);
        };
        const fetchRelated = async () => {
            const sid = product.shopId || (product.shop ? (product.shop.id || product.shop._id) : null);
            console.log('[ProductDetail] Detected shopId:', sid, 'for product:', product.name);

            if (!sid) {
                console.log('[ProductDetail] No shopId found for product:', JSON.stringify(product, null, 2));
                return;
            }
            setLoadingRelated(true);
            try {
                const res = await apiService.get(`/shops/${sid}?universityId=${selectedUniversity?.id || ''}`);
                if (res.data && res.data.products) {
                    const currentId = product.id || product._id;
                    const related = res.data.products.filter(p => (p.id || p._id) !== currentId);
                    console.log(`[ProductDetail] Found ${res.data.products.length} items in shop, ${related.length} suggestions.`);
                    setRelatedProducts(related);
                }
            } catch (error) {
                console.log('[ProductDetail] Error fetching related products:', error.message);
            } finally {
                setLoadingRelated(false);
            }
        };
        checkFavStatus();
        fetchRelated();
    }, [user, product]);

    const toggleFav = async () => {
        if (!user) return;
        const newFavs = await FavouriteService.toggleFavourite(user.id, product, 'product');
        if (newFavs) {
            setIsFav(newFavs.some(fav => (fav.id || fav._id) === (product.id || product._id)));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleAdd = () => {
        const itemToBuy = selectedVariant || product;
        dispatch(addToCart({ ...itemToBuy, shopId: product.shopId }));
        setToastMessage(`${itemToBuy.variantName || itemToBuy.name} added to cart!`);
        setToastVisible(true);
        Haptics.selectionAsync();
        SoundService.playPop();
    };

    let discountPercent = 0;
    if (product.originalPrice && product.originalPrice > product.price) {
        discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }

    if (loading || !product.id) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={{ mt: 10, color: colors.gray }}>Loading product...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <LaroToast
                visible={toastVisible}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />

            <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.white }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDarkMode ? colors.background : '#f8f8f8' }]}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={[styles.iconBtn, { marginRight: 10, backgroundColor: isDarkMode ? colors.background : '#f8f8f8' }]} onPress={toggleFav}>
                        <Ionicons
                            name={isFav ? "heart" : "heart-outline"}
                            size={24}
                            color={isFav ? "#ff4757" : COLORS.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? colors.background : '#f8f8f8' }]} onPress={() => navigation.navigate('Cart')}>
                        <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
                        {cart.items.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{cart.items.reduce((total, i) => total + (i.quantity || 0), 0)}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={[styles.imageContainer, { backgroundColor: isDarkMode ? colors.white : '#f9f9f9' }]}>
                    <Image source={{ uri: resolveImageUrl(product.imageUrl) }} style={styles.productImage} />
                    {discountPercent > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
                        </View>
                    )}
                </View>

                <View style={[styles.infoContainer, { backgroundColor: colors.white }]}>
                    <Text style={[styles.productName, { color: colors.black }]}>{product.name}</Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>
                            {CONSTANTS.CURRENCY}{selectedVariant ? selectedVariant.price : product.price}
                        </Text>
                        {(selectedVariant ? selectedVariant.originalPrice : product.originalPrice) > (selectedVariant ? selectedVariant.price : product.price) && (
                            <Text style={styles.originalPrice}>
                                {CONSTANTS.CURRENCY}{selectedVariant ? selectedVariant.originalPrice : product.originalPrice}
                            </Text>
                        )}
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {product.variants && product.variants.length > 0 && (
                        <View style={[styles.detailSection, { backgroundColor: isDarkMode ? colors.background : '#fdfdfd', borderColor: colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: colors.black }]}>Select Option</Text>
                            <View style={styles.variantContainer}>
                                {product.variants.map((v) => (
                                    <TouchableOpacity
                                        key={v.id || v._id}
                                        style={[
                                            styles.variantChip,
                                            { backgroundColor: isDarkMode ? colors.background : '#fcfcfc', borderColor: colors.border },
                                            selectedVariant?.id === (v.id || v._id) && styles.variantChipActive
                                        ]}
                                        onPress={() => setSelectedVariant(v)}
                                    >
                                        <Text style={[
                                            styles.variantChipText,
                                            { color: colors.gray },
                                            selectedVariant?.id === (v.id || v._id) && styles.variantChipActiveText
                                        ]}>
                                            {v.variantName} - {CONSTANTS.CURRENCY}{v.price}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={{ marginTop: 10 }}
                                onPress={() => setSelectedVariant(null)}
                            >
                                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>Reset to default</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={[styles.detailSection, { backgroundColor: isDarkMode ? colors.background : '#fdfdfd', borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.black }]}>Product Description</Text>
                        <Text style={[styles.description, { color: colors.gray }]}>
                            This premium {product.name} is carefully picked for its quality and taste.
                            It contains essential nutrients and provides great value for your daily needs.
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={[styles.detailSection, { backgroundColor: isDarkMode ? colors.background : '#fdfdfd', borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.black }]}>Delivery Information</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                            <Text style={[styles.infoText, { color: colors.gray }]}>Estimated Delivery: 30-45 mins</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
                            <Text style={[styles.infoText, { color: colors.gray }]}>Quality Assured by Laro</Text>
                        </View>
                    </View>

                    {loadingRelated ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator color={COLORS.primary} size="small" />
                            <Text style={{ color: colors.gray, marginTop: 10 }}>Fetching suggestions...</Text>
                        </View>
                    ) : (
                        relatedProducts.length > 0 ? (
                            <View style={styles.suggestionsContainer}>
                                <View style={styles.suggestionsHeader}>
                                    <View>
                                        <Text style={[styles.sectionTitle, { color: colors.black }]}>More from this Shop</Text>
                                        <Text style={{ fontSize: 10, color: colors.gray }}>{relatedProducts.length} items found</Text>
                                    </View>
                                    <Ionicons name="sparkles" size={18} color={COLORS.primary} />
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                                    {relatedProducts.map((item) => (
                                        <TouchableOpacity
                                            key={item.id || item._id}
                                            style={[styles.suggestionCard, { backgroundColor: isDarkMode ? colors.background : '#fcfcfc', borderColor: colors.border }]}
                                            onPress={() => navigation.push('ProductDetail', { product: item })}
                                        >
                                            <View style={[styles.suggestionImageWrapper, { backgroundColor: isDarkMode ? colors.white : '#f9f9f9', opacity: isDarkMode ? 0.9 : 1 }]}>
                                                <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={styles.suggestionImage} />
                                            </View>
                                            <Text style={[styles.suggestionName, { color: colors.black }]} numberOfLines={1}>{item.name}</Text>
                                            <Text style={[styles.suggestionPrice, { color: colors.primary }]}>{CONSTANTS.CURRENCY}{item.price}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : (
                            <View style={{ padding: 20 }}>
                                <Text style={{ color: colors.gray, fontSize: 11, fontStyle: 'italic' }}>Looking for more? No other products currently available in this shop.</Text>
                            </View>
                        )
                    )}
                </View>
            </ScrollView>

            <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 10, backgroundColor: colors.white, borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.actionBtn, styles.cartBtn, { backgroundColor: isDarkMode ? colors.background : '#f5f5f5' }]} onPress={handleAdd}>
                    <Text style={[styles.cartBtnText, { color: colors.black }]}>ADD TO CART</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.buyBtn, isDarkMode && { shadowColor: '#000', elevation: 0 }]} onPress={() => navigation.navigate('Cart')}>
                    <Text style={styles.buyBtnText}>BUY NOW</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10, backgroundColor: '#fff', zIndex: 10 },
    headerRight: { flexDirection: 'row' },
    iconBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center' },
    badge: { position: 'absolute', top: 5, right: 5, backgroundColor: COLORS.accent, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    imageContainer: { width: width, height: 350, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    productImage: { width: '85%', height: '85%', resizeMode: 'contain' },

    infoContainer: { padding: 25, marginTop: -20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    productName: { fontSize: 28, fontWeight: '900', color: '#1a1a1a', marginBottom: 8 },
    priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    price: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
    originalPrice: { fontSize: 16, color: '#999', textDecorationLine: 'line-through', marginLeft: 10, alignSelf: 'flex-end', marginBottom: 3 },
    discountBadge: { position: 'absolute', top: 20, right: 20, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    discountBadgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    divider: { height: 1.5, backgroundColor: '#f0f0f0', marginVertical: 25 },

    detailSection: { marginBottom: 15, backgroundColor: '#fdfdfd', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#f0f0f0' },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginBottom: 12 },
    description: { fontSize: 15, color: '#666', lineHeight: 24, fontWeight: '500' },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    infoText: { fontSize: 14, color: '#444', marginLeft: 12, fontWeight: '600' },

    bottomActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 15,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 20,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5'
    },
    actionBtn: { flex: 1, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
    cartBtn: { backgroundColor: '#f5f5f5', marginRight: 12 },
    buyBtn: { backgroundColor: COLORS.primary, elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
    cartBtnText: { fontSize: 16, fontWeight: '900', color: '#333' },
    buyBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },

    variantContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
    variantChip: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginRight: 10,
        marginBottom: 10,
        backgroundColor: '#fcfcfc'
    },
    variantChipActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(236, 72, 153, 0.05)'
    },
    variantChipText: { fontSize: 14, fontWeight: '700', color: '#666' },
    variantChipActiveText: { color: COLORS.primary, fontWeight: '900' },

    suggestionsContainer: { marginTop: 20, marginBottom: 10 },
    suggestionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
    suggestionsScroll: { paddingRight: 20 },
    suggestionCard: { width: 140, marginRight: 15, borderRadius: 20, padding: 10, borderWidth: 1, borderColor: '#eee' },
    suggestionImageWrapper: { width: '100%', height: 100, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
    suggestionImage: { width: '80%', height: '80%', resizeMode: 'contain' },
    suggestionName: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    suggestionPrice: { fontSize: 14, fontWeight: '900' }
});
