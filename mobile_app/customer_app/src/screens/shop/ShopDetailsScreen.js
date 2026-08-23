import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator, StatusBar, ScrollView, Alert, Dimensions, Modal,
    Animated, PanResponder
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/cartSlice';
import api, { resolveImageUrl, API_BASE_URL } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import LaroToast from '../../components/LaroToast';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import SoundService from '../../services/SoundService';
import { FavouriteService } from '../../services/FavouriteService';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const isEdibleProduct = (item) => {
    if (!item) return false;
    if (item.isEdible === false) return false;
    if (item.isVeg === null) return false;

    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    const nonEdibleKeywords = [
        'a4', 'sheet', 'print', 'xerox', 'paper', 'notebook', 'binding',
        'pen', 'pencil', 'calculator', 'charger', 'cable', 'bottle', 'water bottle',
        'stapler', 'folder', 'file', 'sanitizer', 'soap', 'shampoo', 'toothpaste',
        'mask', 'bandage', 'thermometer', 'medicine'
    ];

    const nonEdibleCategories = [
        'xerox', 'printing', 'stationery', 'books', 'study', 'electronics',
        'accessories', 'hardware', 'utility', 'general', 'pharmacy', 'medicines', 'healthcare'
    ];

    const foodKeywords = ['milk', 'curd', 'buttermilk', 'butter', 'egg', 'bread', 'chips', 'lays', 'coke', 'campa', 'maggi', 'noodle', 'rice', 'atta', 'dal', 'tea', 'coffee', 'juice', 'soda', 'peanuts', 'chocolate', 'biscuit', 'cookie', 'pizza', 'burger'];

    if (nonEdibleKeywords.some(k => name.includes(k))) return false;

    if (nonEdibleCategories.some(c => cat === c)) {
        if (foodKeywords.some(f => name.includes(f))) return true;
        return false;
    }

    return true;
};

const SwipeableProductItem = ({
    item,
    isDarkMode,
    colors,
    favProducts,
    toggleFavProduct,
    handleAddToCart,
    cart,
    dispatch,
    navigation
}) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const isFav = favProducts.includes(item.id || item._id);

    const resetPosition = () => {
        Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            bounciness: 4,
            useNativeDriver: false
        }).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15;
            },
            onPanResponderMove: (_, gestureState) => {
                pan.setValue({ x: gestureState.dx, y: 0 });
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 80) {
                    toggleFavProduct(item);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    resetPosition();
                } else if (gestureState.dx < -80) {
                    handleAddToCart(item);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    resetPosition();
                } else {
                    resetPosition();
                }
            }
        })
    ).current;

    const itemQty = cart.items.find(i => (i.id || i._id) === (item.id || item._id))?.quantity || 0;
    const edible = isEdibleProduct(item);
    const isVeg = item.isVeg !== false;

    const favOpacity = pan.x.interpolate({
        inputRange: [0, 40, 90],
        outputRange: [0, 0.6, 1],
        extrapolate: 'clamp'
    });

    const cartOpacity = pan.x.interpolate({
        inputRange: [-90, -40, 0],
        outputRange: [1, 0.6, 0],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.swipeCardWrapper}>
            <Animated.View style={[styles.swipeActionBackground, styles.swipeFavBg, { opacity: favOpacity }]}>
                <View style={styles.swipeActionContentLeft}>
                    <Ionicons name={isFav ? "heart-dislike" : "heart"} size={20} color="#fff" />
                    <Text style={styles.swipeActionText}>{isFav ? 'Unfavorite' : 'Favorite ❤️'}</Text>
                </View>
            </Animated.View>

            <Animated.View style={[styles.swipeActionBackground, styles.swipeCartBg, { opacity: cartOpacity }]}>
                <View style={styles.swipeActionContentRight}>
                    <Text style={styles.swipeActionText}>Add to Cart 🛒</Text>
                    <Ionicons name="cart" size={20} color="#fff" />
                </View>
            </Animated.View>

            <Animated.View
                style={[
                    styles.productCard,
                    { backgroundColor: colors.white, borderColor: colors.border, marginBottom: 0 },
                    { transform: [{ translateX: pan.x }] }
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row' }}
                    onPress={() => navigation.navigate('ProductDetail', { product: item })}
                    activeOpacity={0.9}
                >
                    <View style={styles.infoWrapper}>
                        <View style={styles.badgeRow}>
                            {edible && (
                                <View style={[styles.vegBadgeIcon, { borderColor: isVeg ? '#16a34a' : '#dc2626' }]}>
                                    <View style={[styles.vegBadgeDot, { backgroundColor: isVeg ? '#16a34a' : '#dc2626', borderRadius: isVeg ? 4 : 0 }]} />
                                </View>
                            )}
                            {item.isBestseller && (
                                <View style={styles.bestsellerTag}>
                                    <Text style={styles.bestsellerTagText}>🔥 MUST TRY</Text>
                                </View>
                            )}
                            {item.isB2G1 && (
                                <View style={[styles.bestsellerTag, { backgroundColor: '#f59e0b' }]}>
                                    <Text style={styles.bestsellerTagText}>🎁 BUY 2 GET 1 FREE</Text>
                                </View>
                            )}
                            {item.isCombo && (
                                <View style={[styles.bestsellerTag, { backgroundColor: '#ec4899' }]}>
                                    <Text style={styles.bestsellerTagText}>🔥 COMBO MEAL</Text>
                                </View>
                            )}
                            {item.variants?.length > 0 && (
                                <View style={styles.customisableTag}>
                                    <Text style={styles.customisableTagText}>✨ CUSTOMISABLE</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.productName, { color: colors.black }]} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.priceRatingRow}>
                            <Text style={[styles.price, { color: colors.black }]}>
                                {CONSTANTS.CURRENCY}{item.price}
                                {item.variants?.length > 0 && <Text style={{ fontSize: 11, color: colors.gray, fontWeight: '600' }}> onwards</Text>}
                            </Text>
                            <View style={styles.ratingBadge}>
                                <Text style={styles.ratingBadgeText}>⭐ {(item.rating || (4.2 + (typeof item.id === 'string' ? item.id.charCodeAt(0) % 7 : 3) * 0.1)).toFixed(1)}</Text>
                            </View>
                        </View>
                        {item.description ? (
                            <Text style={[styles.productDesc, { color: colors.gray }]} numberOfLines={2}>{item.description}</Text>
                        ) : null}
                    </View>

                    <View style={styles.imageActionWrapper}>
                        <View style={[styles.imageWrapper, { backgroundColor: isDarkMode ? colors.background : '#f8fafc' }]}>
                            <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={styles.productImage} defaultSource={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop' }} />
                            <TouchableOpacity
                                style={styles.itemFavBtn}
                                onPress={() => toggleFavProduct(item)}
                            >
                                <Ionicons
                                    name={isFav ? "heart" : "heart-outline"}
                                    size={18}
                                    color={isFav ? "#ff4757" : "#fff"}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.cardAddButtonOverlay}>
                            {itemQty > 0 ? (
                                <View style={styles.stepperContainer}>
                                    <TouchableOpacity
                                        style={styles.stepperBtn}
                                        onPress={() => dispatch({ type: 'cart/removeFromCart', payload: item.id || item._id })}
                                    >
                                        <Ionicons name="remove" size={16} color="#fff" />
                                    </TouchableOpacity>
                                    <Text style={[styles.stepperQtyText, { color: '#ffffff', fontWeight: '900', fontSize: 15 }]}>{itemQty}</Text>
                                    <TouchableOpacity
                                        style={styles.stepperBtn}
                                        onPress={() => handleAddToCart(item)}
                                    >
                                        <Ionicons name="add" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.floatingAddBtn}
                                    onPress={() => handleAddToCart(item)}
                                >
                                    <Text style={styles.floatingAddBtnText}>{item.variants?.length > 0 ? 'CHOOSE +' : 'ADD +'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

export default function ShopDetailsScreen({ route, navigation }) {
    const { shop: initialShop, shopId: initialShopId } = route.params;
    const [shop, setShop] = useState(initialShop || {});
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.cart);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isShopFav, setIsShopFav] = useState(false);
    const [favProducts, setFavProducts] = useState([]);
    const { user, selectedUniversity } = useSelector(state => state.auth);
    const [selectedParent, setSelectedParent] = useState(null);
    const [variantModalVisible, setVariantModalVisible] = useState(false);

    const cartItemCount = cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
    const cartTotal = cart.items.reduce((total, item) => total + ((parseFloat(item.price) || 0) * (item.quantity || 0)), 0);

    const XEROX_CATEGORIES = ['xerox', 'printing', 'stationery', 'books', 'stationary'];
    const isXeroxShop = shop && XEROX_CATEGORIES.some(c => (shop.category || '').toLowerCase().includes(c));
    const [xeroxFile, setXeroxFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [colorMode, setColorMode] = useState('BW'); // 'BW' or 'Color'
    const [sides, setSides] = useState('Single'); // 'Single' or 'Double'
    const [ratio, setRatio] = useState('1:1'); // '1:1', '1:2', '1:4', '1:6', '1:9'
    const [xeroxPricing, setXeroxPricing] = useState({ bwSingle: 1, bwDouble: 1.5, colorSingle: 5, colorDouble: 8 });

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'image/*',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                ],
                copyToCacheDirectory: true
            });
            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];

                if (asset.mimeType?.startsWith('video/')) {
                    Alert.alert('Invalid File', 'Video files are not allowed for printing. Please select a PDF, Image, Word, or PPT file.');
                    return;
                }

                setUploading(true);
                // Prepare form data for upload
                const formData = new FormData();
                const fileName = asset.name || `document_${Date.now()}.pdf`;
                const fileType = asset.mimeType || 'application/pdf';

                formData.append('file', {
                    uri: asset.uri,
                    name: fileName,
                    type: fileType
                });

                console.log('[DEBUG] Uploading Xerox document:', { uri: asset.uri, name: fileName, type: fileType });

                const token = await AsyncStorage.getItem('userToken');
                const uploadUrl = `${API_BASE_URL}/upload/xerox`;

                const res = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                    body: formData
                });

                if (!res.ok) {
                    const text = await res.text();
                    console.log('[DEBUG] Upload HTTP Error:', res.status, text);
                    throw new Error(`Upload failed (${res.status}): ${text}`);
                }

                const responseData = await res.json();
                console.log('[DEBUG] Upload Success:', responseData);
                setXeroxFile(responseData);
            }
        } catch (err) {
            console.log('[DEBUG] Xerox Upload Error:', err);
            Alert.alert('Upload Error', `Failed to upload document: ${err.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const loadPage = async () => {
            if (!shop.id && initialShopId) {
                await fetchShopDetails(initialShopId);
            } else {
                fetchProducts();
            }
            loadFavourites();
        };
        loadPage();
    }, [initialShopId]);

    const fetchShopDetails = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`/shops/${id}?universityId=${selectedUniversity?.id || ''}`);
            if (response.data) {
                setShop(response.data);
                if (response.data.products) {
                    setProducts(response.data.products);
                }
            }
        } catch (err) {
            console.log('Error fetching shop details');
        } finally {
            setLoading(false);
        }
    };

    const loadFavourites = async () => {
        if (!user) return;

        // Load Shop Fav Status
        const shopFav = await FavouriteService.isFavourite(user.id, shop.id, 'shop');
        setIsShopFav(shopFav);

        // Load Product Favs
        const favs = await FavouriteService.getFavourites(user.id, 'product');
        setFavProducts(favs.map(p => p.id || p._id));
    };

    const toggleFavShop = async () => {
        if (!user) return;
        const newFavs = await FavouriteService.toggleFavourite(user.id, shop, 'shop');
        if (newFavs) {
            setIsShopFav(newFavs.some(fav => (fav.id || fav._id) === shop.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const toggleFavProduct = async (product) => {
        if (!user) return;
        const newFavs = await FavouriteService.toggleFavourite(user.id, product, 'product');
        if (newFavs) {
            setFavProducts(newFavs.map(p => p.id || p._id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/shops/${shop.id}?universityId=${selectedUniversity?.id || ''}`);
            if (response.data && response.data.products) {
                setProducts(response.data.products);
            }

            // Fetch pricing if Xerox shop
            if (['Xerox', 'Printing', 'Stationery', 'Books', 'Stationary'].includes(shop.category)) {
                try {
                    const pricingRes = await api.get(`/xerox-pricing/shop/${shop.id}`);
                    if (pricingRes.data) {
                        setXeroxPricing(pricingRes.data);
                    }
                } catch (pErr) {
                    console.log('Failed to fetch xerox pricing');
                }
            }
        } catch (err) {
            console.log('Error fetching products');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedParent(product);
            setVariantModalVisible(true);
            return;
        }
        dispatch(addToCart({ ...product, shopId: shop.id }));
        setToastMessage(`${product.name} added to cart!`);
        setToastVisible(true);
        Haptics.selectionAsync();
        SoundService.playPop(); // Optional auditory feedback
    };

    const handleAddVariant = (variant) => {
        dispatch(addToCart({ ...variant, shopId: shop.id }));
        setToastMessage(`${variant.variantName} added to cart!`);
        setToastVisible(true);
        Haptics.selectionAsync();
        SoundService.playPop();
    };

    // Group products by category
    const groupedProducts = products.reduce((acc, product) => {
        const category = product.category || 'Others';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
    }, {});

    const categories = Object.keys(groupedProducts);

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.white, borderBottomColor: colors.border }]}>
            <View style={styles.topRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDarkMode ? colors.background : '#f8f8f8' }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.black }]} numberOfLines={1}>{shop.name}</Text>
                    <TouchableOpacity onPress={toggleFavShop} style={styles.favIconBtn}>
                        <Ionicons
                            name={isShopFav ? "heart" : "heart-outline"}
                            size={22}
                            color={isShopFav ? "#ff4757" : "#333"}
                        />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={[styles.iconBtn, { backgroundColor: isDarkMode ? colors.background : '#f8f8f8' }]}>
                    <Ionicons name="cart-outline" size={24} color={colors.black} />
                    {cartItemCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderProduct = (item) => (
        <SwipeableProductItem
            key={item.id || item._id}
            item={item}
            isDarkMode={isDarkMode}
            colors={colors}
            favProducts={favProducts}
            toggleFavProduct={toggleFavProduct}
            handleAddToCart={handleAddToCart}
            cart={cart}
            dispatch={dispatch}
            navigation={navigation}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <LaroToast
                visible={toastVisible}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />
            {renderHeader()}

            <Modal
                animationType="slide"
                transparent={true}
                visible={variantModalVisible}
                onRequestClose={() => setVariantModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, backgroundColor: colors.white }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: colors.black }]}>{selectedParent?.name}</Text>
                                <Text style={[styles.modalSubTitle, { color: colors.gray }]}>Choose your preference</Text>
                            </View>
                            <TouchableOpacity onPress={() => setVariantModalVisible(false)} style={[styles.closeBtn, { backgroundColor: isDarkMode ? colors.background : '#f5f5f5' }]}>
                                <Ionicons name="close" size={24} color={colors.black} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.variantList} showsVerticalScrollIndicator={false}>
                            {selectedParent?.variants?.map((v) => {
                                const variantQty = cart.items.find(i => (i.id || i._id) === (v.id || v._id))?.quantity || 0;
                                return (
                                    <View key={v.id || v._id} style={[styles.variantItem, { borderBottomColor: colors.border }]}>
                                        <View style={styles.variantInfo}>
                                            <Text style={[styles.variantName, { color: colors.black }]}>{v.variantName}</Text>
                                            <Text style={styles.variantPrice}>{CONSTANTS.CURRENCY}{v.price}</Text>
                                        </View>

                                        {variantQty > 0 ? (
                                            <View style={styles.modalAddGroup}>
                                                <TouchableOpacity
                                                    style={styles.modalQtyBtn}
                                                    onPress={() => dispatch({ type: 'cart/removeFromCart', payload: v.id || v._id })}
                                                >
                                                    <Ionicons name="remove" size={18} color={COLORS.primary} />
                                                </TouchableOpacity>
                                                <Text style={[styles.modalQtyText, { color: colors.black }]}>{variantQty}</Text>
                                                <TouchableOpacity
                                                    style={styles.modalQtyBtn}
                                                    onPress={() => handleAddVariant(v)}
                                                >
                                                    <Ionicons name="add" size={18} color={COLORS.primary} />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.modalAddBtn, { backgroundColor: isDarkMode ? colors.background : '#fcfcfc', borderColor: colors.border }]}
                                                onPress={() => handleAddVariant(v)}
                                            >
                                                <Text style={styles.modalAddText}>ADD</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

                    {/* Shop Banner Image */}
                    <View style={styles.shopBannerContainer}>
                        <Image
                            source={{ uri: resolveImageUrl(shop.imageUrl) }}
                            style={styles.shopBannerImage}
                        />
                        <View style={styles.shopBannerOverlay}>
                            <Text style={styles.shopCategoryBadge}>{shop.category || 'Shop'}</Text>
                            <Text style={styles.shopDescriptionText} numberOfLines={2}>{shop.description}</Text>
                        </View>
                    </View>

                    {/* Xerox: Specialized Printing Flow */}
                    {isXeroxShop && (
                        <View style={styles.xeroxContainer}>
                            <View style={[styles.xeroxBanner, { backgroundColor: colors.white, borderColor: colors.border }]}>
                                <View style={styles.xeroxBannerHeader}>
                                    <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                                    <Text style={[styles.xeroxBannerTitle, { color: colors.black }]}>Upload Document</Text>
                                </View>
                                <Text style={[styles.xeroxBannerDesc, { color: colors.gray }]}>Attach your file (PDF, Doc, Image) for printing.</Text>
                                {xeroxFile ? (
                                    <View style={[styles.xeroxFileRow, { backgroundColor: isDarkMode ? colors.background : '#f8fafc', borderColor: colors.border }]}>
                                        <Ionicons name="document-attach" size={20} color={COLORS.primary} />
                                        <Text style={[styles.xeroxFileName, { color: colors.black }]} numberOfLines={1}>{xeroxFile.originalName || xeroxFile.name}</Text>
                                        {xeroxFile.pageCount && (
                                            <View style={[styles.pageBadge, { backgroundColor: isDarkMode ? '#1e3a8a' : '#e0f2fe' }]}>
                                                <Text style={[styles.pageBadgeText, { color: isDarkMode ? '#bfdbfe' : '#0369a1' }]}>{xeroxFile.pageCount} Pages</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity onPress={() => setXeroxFile(null)}>
                                            <Ionicons name="close-circle" size={24} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    uploading ? (
                                        <View style={styles.uploadingContainer}>
                                            <ActivityIndicator color={COLORS.primary} size="small" />
                                            <Text style={[styles.uploadingText, { color: colors.gray }]}>Analyzing document...</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.xeroxPickBtn} onPress={handlePickDocument}>
                                            <Ionicons name="cloud-upload" size={22} color="#fff" />
                                            <Text style={styles.xeroxPickBtnText}>Choose File</Text>
                                        </TouchableOpacity>
                                    )
                                )}
                            </View>

                            {xeroxFile && (
                                <View style={[styles.optionsContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
                                    <Text style={[styles.optionsTitle, { color: colors.black }]}>Printing Options</Text>

                                    {/* Color Mode */}
                                    <Text style={[styles.optionLabel, { color: colors.gray }]}>Color Mode</Text>
                                    <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }]}>
                                        {['BW', 'Color'].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[styles.segmentBtn, colorMode === m && [styles.segmentBtnActive, { backgroundColor: colors.white }]]}
                                                onPress={() => setColorMode(m)}
                                            >
                                                <Text style={[styles.segmentText, { color: colors.gray }, colorMode === m && styles.segmentTextActive]}>{m}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Sidedness */}
                                    <Text style={[styles.optionLabel, { color: colors.gray }]}>Sidedness</Text>
                                    <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }]}>
                                        {['Single', 'Double'].map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.segmentBtn, sides === s && [styles.segmentBtnActive, { backgroundColor: colors.white }]]}
                                                onPress={() => setSides(s)}
                                            >
                                                <Text style={[styles.segmentText, { color: colors.gray }, sides === s && styles.segmentTextActive]}>{s} Sided</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Ratio */}
                                    <Text style={[styles.optionLabel, { color: colors.gray }]}>Ratio</Text>
                                    <View style={styles.gridContainer}>
                                        {['1:1', '1:2', '1:4', '1:6', '1:9'].map(r => (
                                            <TouchableOpacity
                                                key={r}
                                                style={[styles.gridBtn, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }, ratio === r && styles.gridBtnActive]}
                                                onPress={() => setRatio(r)}
                                            >
                                                <Text style={[styles.gridText, { color: colors.gray }, ratio === r && styles.gridTextActive]}>{r}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        style={styles.xeroxAddToCartBtn}
                                        onPress={() => {
                                            const baseProduct = products.find(p => p.name.includes('Xerox') || p.name.includes('Printing')) || products[0];

                                            let rate = 1;
                                            if (colorMode === 'Color') {
                                                rate = sides === 'Single' ? xeroxPricing.colorSingle : xeroxPricing.colorDouble;
                                            } else {
                                                rate = sides === 'Single' ? xeroxPricing.bwSingle : xeroxPricing.bwDouble;
                                            }
                                            const total = (xeroxFile.pageCount * rate).toFixed(2);

                                            const productToAdd = baseProduct ? { ...baseProduct } : {
                                                name: `Print: ${xeroxFile.originalName || xeroxFile.name}`,
                                                category: 'Xerox',
                                                imageUrl: 'https://cdn-icons-png.flaticon.com/512/2991/2991110.png',
                                                description: 'Xerox printing service'
                                            };

                                            dispatch(addToCart({
                                                ...productToAdd,
                                                shopId: shop.id,
                                                id: `xerox_${Date.now()}`, // Unique ID for this specific upload
                                                name: `Print: ${xeroxFile.originalName || xeroxFile.name}`,
                                                price: parseFloat(total),
                                                metadata: {
                                                    url: xeroxFile.url,
                                                    fileName: xeroxFile.originalName || xeroxFile.name,
                                                    pageCount: xeroxFile.pageCount,
                                                    options: { colorMode, sides, ratio },
                                                    pricePerPage: rate
                                                }
                                            }));
                                            setToastMessage(`Added to cart! Total: ₹${total}`);
                                            setToastVisible(true);
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={styles.xeroxAddToCartText}>Add to Cart - ₹{((xeroxFile.pageCount || 0) * (colorMode === 'Color' ? (sides === 'Single' ? xeroxPricing.colorSingle : xeroxPricing.colorDouble) : (sides === 'Single' ? xeroxPricing.bwSingle : xeroxPricing.bwDouble))).toFixed(2)}</Text>
                                            <Ionicons name="cart" size={20} color="#fff" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Always show product categories below Xerox UI if applicable */}
                    {categories.map((cat) => (
                        <View key={cat} style={styles.sectionContainer}>
                            <Text style={[styles.categoryHeading, { color: colors.black }]}>{cat}</Text>
                            {groupedProducts[cat].map(product => renderProduct(product))}
                        </View>
                    ))}

                    {/* Bottom Hygiene & Campus Quality Assurance Footer */}
                    <View style={[styles.bottomHygieneCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: colors.border }]}>
                        <View style={styles.hygieneHeader}>
                            <Ionicons name="shield-checkmark" size={22} color="#056f36" />
                            <Text style={[styles.hygieneTitle, { color: colors.black }]}>100% Campus Hygiene Assured</Text>
                        </View>
                        <Text style={[styles.hygieneDesc, { color: colors.gray }]}>
                            Partner Outlet Verified by Laro Quality Control. Freshly prepared under strict safety standards.
                        </Text>
                        <View style={styles.hygieneDivider} />
                        <Text style={styles.bottomMadeWithLove}>Made with ❤️ for Students</Text>
                        <Text style={[styles.bottomCopyright, { color: colors.gray }]}>© 2026 Laro Technologies Private Limited</Text>
                    </View>
                </ScrollView>
            )}

            {cartItemCount > 0 && (
                <View style={[styles.floatingCartContainer, { bottom: insets.bottom + 10 }]}>
                    <TouchableOpacity
                        style={styles.floatingCartBtn}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <View style={styles.floatLeft}>
                            <Ionicons name="basket" size={24} color="#fff" />
                            <View style={styles.floatTextGroup}>
                                <Text style={styles.floatPrice}>{CONSTANTS.CURRENCY}{parseFloat(cartTotal || 0).toFixed(2)}</Text>
                                <Text style={styles.floatItems}>{cartItemCount} items</Text>
                            </View>
                        </View>
                        <View style={styles.floatAction}>
                            <Text style={styles.floatActionText}>View Cart</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: { backgroundColor: '#fff', paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
    headerTitle: { color: '#1a1a1a', fontSize: 18, fontWeight: '900', textAlign: 'center' },
    favIconBtn: { marginLeft: 6, padding: 4 },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemFavBtn: { padding: 5 },
    cartBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: COLORS.accent, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    cartBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

    list: { padding: 20, paddingBottom: 150 },
    sectionContainer: { marginBottom: 30 },
    categoryHeading: { fontSize: 22, fontWeight: '900', color: '#1a1a1a', marginBottom: 15, letterSpacing: -0.5 },

    bottomHygieneCard: {
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6
    },
    hygieneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    hygieneTitle: { fontSize: 14, fontWeight: '900' },
    hygieneDesc: { fontSize: 12, textAlign: 'center', lineHeight: 18, fontWeight: '500' },
    hygieneDivider: { height: 1, backgroundColor: '#edf2ed', width: '100%', marginVertical: 14 },
    bottomMadeWithLove: { fontSize: 13, fontWeight: '900', color: '#056f36', textAlign: 'center' },
    bottomCopyright: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4 },

    productCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginBottom: 16,
        borderRadius: 22,
        padding: 14,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
    },
    infoWrapper: { flex: 1, marginRight: 12 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
    vegBadgeIcon: { width: 14, height: 14, borderWidth: 1.5, borderRadius: 3.5, justifyContent: 'center', alignItems: 'center' },
    vegBadgeDot: { width: 6, height: 6 },
    bestsellerTag: { backgroundColor: '#fef3c7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
    bestsellerTagText: { fontSize: 9, fontWeight: '900', color: '#b45309' },
    customisableTag: { backgroundColor: '#f3e8ff', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#e9d5ff' },
    customisableTagText: { fontSize: 9, fontWeight: '900', color: '#7c3aed' },
    productName: { fontSize: 16, fontWeight: '800', color: '#111', lineHeight: 20 },
    priceRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    price: { fontSize: 15, fontWeight: '900', color: '#111' },
    ratingBadge: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
    ratingBadgeText: { fontSize: 10, fontWeight: '900', color: '#15803d' },
    productDesc: { fontSize: 12, fontWeight: '500', color: '#64748b', marginTop: 4, lineHeight: 16 },

    imageActionWrapper: { alignItems: 'center', position: 'relative', width: 110, paddingBottom: 10 },
    imageWrapper: { width: 110, height: 110, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    itemFavBtn: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },

    cardAddButtonOverlay: { position: 'absolute', bottom: -10, width: '90%', alignItems: 'center' },
    floatingAddBtn: { width: '100%', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#056f36', paddingVertical: 7, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#056f36', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
    floatingAddBtnText: { color: '#056f36', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    stepperContainer: { width: '100%', backgroundColor: '#056f36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, elevation: 4, shadowColor: '#056f36', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5 },
    stepperBtn: { padding: 2 },
    swipeCardWrapper: {
        position: 'relative',
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden'
    },
    swipeActionBackground: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 20,
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    swipeFavBg: {
        backgroundColor: '#ec4899',
        alignItems: 'flex-start'
    },
    swipeCartBg: {
        backgroundColor: '#056f36',
        alignItems: 'flex-end'
    },
    swipeActionContentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    swipeActionContentRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    swipeActionText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 0.5
    },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', fontSize: 16, color: '#888', marginTop: 50 },

    floatingCartContainer: { position: 'absolute', left: 20, right: 20, zIndex: 1000 },
    floatingCartBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 20,
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
    },
    floatLeft: { flexDirection: 'row', alignItems: 'center' },
    floatTextGroup: { marginLeft: 15 },
    floatPrice: { color: '#fff', fontWeight: '900', fontSize: 18 },
    floatItems: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
    floatAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12 },
    floatActionText: { color: '#fff', fontWeight: '900', fontSize: 14, marginRight: 5 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a' },
    modalSubTitle: { fontSize: 14, fontWeight: '600', color: '#888', marginTop: 2 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
    variantList: { marginBottom: 10 },
    variantItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    variantInfo: { flex: 1 },
    variantName: { fontSize: 17, fontWeight: '800', color: '#333' },
    variantPrice: { fontSize: 15, fontWeight: '900', color: COLORS.primary, marginTop: 4 },
    modalAddBtn: { backgroundColor: '#fcfcfc', borderWidth: 1, borderColor: '#eee', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
    modalAddText: { color: COLORS.primary, fontWeight: '900', fontSize: 14 },
    modalAddGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fcfcfc', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 4 },
    modalQtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    modalQtyText: { marginHorizontal: 12, fontWeight: '900', fontSize: 16, color: '#1a1a1a' },

    // Xerox Styles
    xeroxContainer: { marginBottom: 20 },
    xeroxBanner: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#eee', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    xeroxBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    xeroxBannerTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a1a' },
    xeroxBannerDesc: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
    xeroxPickBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 16 },
    xeroxPickBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    xeroxFileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    xeroxFileName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
    pageBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pageBadgeText: { fontSize: 11, fontWeight: '800', color: '#0369a1' },
    uploadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    uploadingText: { fontSize: 14, fontWeight: '600', color: '#64748b' },

    optionsContainer: { marginTop: 24, padding: 20, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#eee' },
    optionsTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginBottom: 20 },
    optionLabel: { fontSize: 14, fontWeight: '800', color: '#64748b', marginBottom: 10, marginTop: 15 },
    segmentContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, gap: 4 },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    segmentBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    segmentText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    segmentTextActive: { color: COLORS.primary },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
    gridBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f1f5f9', borderRadius: 10, minWidth: 60, alignItems: 'center' },
    gridBtnActive: { backgroundColor: COLORS.primary },
    gridText: { fontSize: 14, fontWeight: '800', color: '#64748b' },
    gridTextActive: { color: '#fff' },

    xeroxAddToCartBtn: { backgroundColor: '#1a1a1a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 18, marginTop: 30 },
    xeroxAddToCartText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    // Shop Banner Styles
    shopBannerContainer: {
        width: '100%',
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#f0f0f0',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    shopBannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    shopBannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    shopCategoryBadge: {
        backgroundColor: COLORS.primary,
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 10,
        fontWeight: '900',
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    shopDescriptionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.9,
    }
});
