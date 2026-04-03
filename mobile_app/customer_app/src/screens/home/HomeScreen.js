import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, TextInput, ScrollView, RefreshControl, StatusBar, Alert,
    Animated, Dimensions, ActivityIndicator, Modal, Linking
} from 'react-native';

const { width } = Dimensions.get('window');
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { resolveImageUrl, API_BASE_URL } from '../../services/api';
import { FavouriteService } from '../../services/FavouriteService';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/cartSlice';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import LaroToast from '../../components/LaroToast';
import { COLORS, CONSTANTS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const dispatch = useDispatch();
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [mode, setMode] = useState('food'); // 'food' | 'stationery'
    const [defaultAddress, setDefaultAddress] = useState({ title: 'Set up delivery address', subtitle: 'Tap to add your location' });
    const [recentProducts, setRecentProducts] = useState([]);
    const [favProducts, setFavProducts] = useState([]);
    const [xeroxFile, setXeroxFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [colorMode, setColorMode] = useState('BW');
    const [sides, setSides] = useState('Single');
    const [ratio, setRatio] = useState('1:1');
    const [xeroxPricing, setXeroxPricing] = useState({ bwSingle: 1, bwDouble: 1.5, colorSingle: 5, colorDouble: 8 });
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [activeAd, setActiveAd] = useState(null);
    const [adModalVisible, setAdModalVisible] = useState(false);
    const [userCoords, setUserCoords] = useState(null);

    const cart = useSelector(state => state.cart);
    const { user, selectedUniversity } = useSelector(state => state.auth);
    const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    const FOOD_CATEGORIES = [
        { name: 'All', icon: 'apps', color: '#FFF5F5' },
        { name: 'Fresh', icon: 'leaf', color: '#FFF5F5' },
        { name: 'Dairy', icon: 'cheese', color: '#FFF5F5' },
        { name: 'Grocery', icon: 'shopping', color: '#FFF5F5' },
        { name: 'Summer', icon: 'weather-sunny', color: '#FFF5F5' },
        { name: 'Laro Care', icon: 'heart-pulse', color: '#FFF5F5' },
    ];

    const STATIONERY_CATEGORIES = [
        { name: 'All', icon: 'apps', color: '#FFF5F5' },
        { name: 'Books', icon: 'book-open-variant', color: '#FFF5F5' },
        { name: 'A4 Sheets', icon: 'file-document', color: '#FFF5F5' },
        { name: 'Xerox', icon: 'printer', color: '#FFF5F5' },
    ];

    const STATIONERY_SHOP_MODES = ['Stationery', 'Books', 'Xerox', 'Printing', 'Stationary'];

    const categoriesList = mode === 'food' ? FOOD_CATEGORIES : STATIONERY_CATEGORIES;

    useFocusEffect(
        useCallback(() => {
            fetchDefaultAddress();
            getLocationAsync(); // Gets GPS and calls fetchShops
            loadFavourites();
        }, [user, selectedUniversity])
    );

    const getLocationAsync = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('[HomeScreen] Location permission denied');
                fetchShops(); // fallback
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            console.log(`[HomeScreen] GPS Location: ${latitude}, ${longitude}`);
            setUserCoords({ lat: latitude, lng: longitude });
            fetchShops(latitude, longitude);
        } catch (error) {
            console.warn('[HomeScreen] Error getting location:', error);
            fetchShops(); // fallback
        }
    };

    const loadFavourites = async () => {
        if (!user) return;
        const favs = await FavouriteService.getFavourites(user.id, 'product');
        setFavProducts(favs.map(p => p.id || p._id));
    };

    const toggleFavProduct = async (product) => {
        if (!user) return;
        const newFavs = await FavouriteService.toggleFavourite(user.id, product, 'product');
        if (newFavs) {
            setFavProducts(newFavs.map(p => p.id || p._id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const fetchDefaultAddress = async () => {
        try {
            const key = `@user_addresses_${user?.id || 'guest'}`;
            const storedAddresses = await AsyncStorage.getItem(key);
            if (storedAddresses) {
                const addresses = JSON.parse(storedAddresses);
                const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
                if (defaultAddr) {
                    setDefaultAddress({
                        title: defaultAddr.hostel || defaultAddr.type || 'Home',
                        subtitle: defaultAddr.room ? `Room ${defaultAddr.room}` : defaultAddr.address
                    });
                } else {
                    setDefaultAddress({ title: 'Set up delivery address', subtitle: 'Tap to add your location' });
                }
            } else {
                setDefaultAddress({ title: 'Set up delivery address', subtitle: 'Tap to add your location' });
            }
        } catch (error) {
            console.error('Error fetching default address:', error);
        }
    };

    useEffect(() => {
        fetchActiveAd();
    }, []);

    const fetchActiveAd = async () => {
        try {
            const response = await api.get('/config/active-ad');
            if (response.data && response.data.isActive) {
                setActiveAd(response.data);
                // Show after a short delay for better UX
                setTimeout(() => {
                    setAdModalVisible(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }, 1500);
            }
        } catch (error) {
            console.error('[HOME AD FETCH ERROR]', error);
        }
    };

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

    const fetchShops = async (lat, lng) => {
        setLoading(true);
        try {
            console.log('[HomeScreen] Fetching shops and recent orders...');
            // Use passed coords, state coords, or mock fallback
            const finalLat = lat || userCoords?.lat || 25.3333;
            const finalLng = lng || userCoords?.lng || 82.9999;
            const uniId = selectedUniversity?.id || '';

            const [shopsRes, ordersRes] = await Promise.all([
                api.get(`/shops?lat=${finalLat}&lng=${finalLng}&universityId=${uniId}&t=${Date.now()}`),
                api.get('/orders')
            ].map(p => p.catch(e => e))); // catch individual errors so partial load works

            if (shopsRes && shopsRes.data) {
                setShops(shopsRes.data);
                const allProds = shopsRes.data.flatMap(s =>
                    (s.products || []).map(p => ({ ...p, shopCategory: s.category || '' }))
                );
                setProducts(allProds);

                // Fetch Xerox pricing if a xerox shop exists
                const xeroxShop = shopsRes.data.find(s => s.category?.toLowerCase().includes('xerox') || s.category?.toLowerCase().includes('printing') || s.category?.toLowerCase().includes('stationary'));
                if (xeroxShop) {
                    try {
                        const pricingRes = await api.get(`/xerox-pricing/shop/${xeroxShop.id}`);
                        if (pricingRes.data) {
                            setXeroxPricing(pricingRes.data);
                        }
                    } catch (pErr) {
                        console.log('Failed to fetch xerox pricing');
                    }
                }
            }

            // Extract recent products from orders
            if (ordersRes && ordersRes.data && ordersRes.data.length > 0) {
                const delivered = ordersRes.data.filter(o => o.status === 'delivered');
                const recentItems = [];
                const seenIds = new Set();

                for (const order of delivered) {
                    if (order.items) {
                        for (const item of order.items) {
                            if (item.product && !seenIds.has(item.product.id || item.product._id)) {
                                seenIds.add(item.product.id || item.product._id);
                                recentItems.push(item.product);
                                if (recentItems.length >= 6) break;
                            }
                        }
                    }
                    if (recentItems.length >= 6) break;
                }
                setRecentProducts(recentItems);
            }
        } catch (err) {
            console.error('[HomeScreen] Fetch error:', err);
            Alert.alert('Error', 'Could not connect to the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product) => {
        dispatch(addToCart({ ...product, shopId: product.shopId }));
    };

    // Grouping logic for sections with Search Filtering
    const sections = useMemo(() => {
        // First filter products by search query
        let allProducts = products;

        // Filter by mode using both product and shop categories
        if (mode === 'stationery') {
            allProducts = products.filter(p =>
                STATIONERY_SHOP_MODES.some(m =>
                    (p.category || '').toLowerCase().includes(m.toLowerCase()) ||
                    (p.shopCategory || '').toLowerCase().includes(m.toLowerCase())
                )
            );
        } else {
            allProducts = products.filter(p =>
                !STATIONERY_SHOP_MODES.some(m =>
                    (p.category || '').toLowerCase().includes(m.toLowerCase()) ||
                    (p.shopCategory || '').toLowerCase().includes(m.toLowerCase())
                )
            );
        }

        const filteredProducts = allProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        const uniqueCategories = [...new Set(filteredProducts.map(p => p.category))];
        console.log('[HomeScreen] Re-calculating sections...', {
            searchQuery,
            totalFiltered: filteredProducts.length,
            foundCategories: uniqueCategories
        });

        if (selectedCategory === 'All') {
            const rawSections = [
                {
                    title: 'Fresh & Healthy',
                    data: filteredProducts.filter(p => p.category === 'Fresh' || p.category === 'Vegetables' || p.category === 'Fruits' || p.category === 'Dairy')
                },
                {
                    title: 'Grocery Essentials',
                    data: filteredProducts.filter(p => p.category === 'Grocery' || p.category === 'Grocery & kitchen' || p.category === 'Dairy & Bread' || p.category === 'Organic')
                },
                {
                    title: 'Snacks & drinks',
                    data: filteredProducts.filter(p => p.category === 'Snacks & drinks' || p.category === 'Munchies')
                },
                {
                    title: 'Explore More',
                    data: filteredProducts.filter(p => !['Fresh', 'Vegetables', 'Fruits', 'Dairy', 'Grocery', 'Grocery & kitchen', 'Dairy & Bread', 'Organic', 'Snacks & drinks', 'Munchies'].includes(p.category))
                }
            ];
            // Filter out empty sections
            const filtered = rawSections.filter(s => s.data.length > 0);

            // If search is active and no standard sections match, but we have products, show them in a generic search result section
            if (searchQuery && filtered.length === 0 && filteredProducts.length > 0) {
                return [{ title: 'Search Results', data: filteredProducts }];
            }

            // Inject Buy it Again if we have recent products and no search query
            if (!searchQuery && recentProducts.length > 0) {
                filtered.unshift({
                    title: 'Buy it Again',
                    data: recentProducts
                });
            }

            console.log(`[HomeScreen] 'All' selected. Sections count: ${filtered.length}`);
            return filtered;
        } else {
            const categoryMap = {
                'Grocery': 'Grocery & kitchen',
                'Fresh': 'Fresh',
                'Laro Care': 'Medicines'
            };
            const mappedCat = categoryMap[selectedCategory] || selectedCategory;
            const filteredData = filteredProducts.filter(p => p.category === mappedCat);

            const isXerox = selectedCategory === 'Xerox';
            return (filteredData.length > 0 || isXerox) ? [{ title: selectedCategory, data: filteredData }] : [];
        }
    }, [products, selectedCategory, searchQuery, mode]);

    const cartOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (cartItemCount > 0) {
            Animated.spring(cartOpacity, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        } else {
            Animated.timing(cartOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [cartItemCount]);

    const banners = [
        { id: 'b1', image: 'https://img.freepik.com/free-psd/food-delivery-social-media-banner-template_23-2149028042.jpg' },
        { id: 'b2', image: 'https://img.freepik.com/free-vector/healthy-food-banner-template_23-2148496494.jpg' },
    ];

    const renderHeader = () => (
        <View style={[styles.headerContainer, { paddingTop: (insets?.top || 0) + 10, backgroundColor: colors.background }]}>
            {/* Top Logo & Mode Toggle */}
            <View style={styles.topSection}>
                <Text style={[styles.laroLogo, { color: colors.primary }]}>Laro</Text>
                <View style={[styles.modeTogglePillSmall, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.modeToggleBtnSmall, mode === 'food' && { backgroundColor: colors.primary }]}
                        onPress={() => { setMode('food'); setSelectedCategory('All'); }}
                    >
                        <MaterialCommunityIcons name="food" size={14} color={mode === 'food' ? '#fff' : colors.gray} />
                        <Text style={[styles.modeToggleBtnText, { color: colors.gray }, mode === 'food' && { color: '#fff' }]}>Food</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeToggleBtnSmall, mode === 'stationery' && { backgroundColor: colors.primary }]}
                        onPress={() => { setMode('stationery'); setSelectedCategory('All'); }}
                    >
                        <MaterialCommunityIcons name="book-open-variant" size={14} color={mode === 'stationery' ? '#fff' : colors.gray} />
                        <Text style={[styles.modeToggleBtnText, { color: colors.gray }, mode === 'stationery' && { color: '#fff' }]}>Study</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* University / Campus Selector */}
            <TouchableOpacity
                style={[styles.locationBar, { backgroundColor: isDarkMode ? colors.white : '#fff', borderColor: colors.border }]}
                onPress={() => navigation.navigate('ChangeUniversity')}
            >
                <View style={styles.locationLeft}>
                    <View style={[styles.uniIconCircle, { backgroundColor: colors.primary + '15' }]}>
                        <MaterialCommunityIcons name="school" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.locationTextGroup}>
                        <Text style={[styles.locationAddressText, { color: colors.black }]} numberOfLines={1}>
                            {selectedUniversity?.name || 'Select Campus'}
                        </Text>
                        <Text style={[styles.locationSubtitleText, { color: colors.gray }]} numberOfLines={1}>
                            {defaultAddress.title === 'Set up delivery address' ? 'Tap to change campus' : `${defaultAddress.title}, ${defaultAddress.subtitle}`}
                        </Text>
                    </View>
                </View>
                <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
            </TouchableOpacity>

            {shops.length > 0 && shops[0].distance && (
                <View style={styles.nearestStoreBar}>
                    <View style={styles.nearestStoreMain}>
                        <MaterialCommunityIcons name="lightning-bolt" size={14} color="#fbbf24" />
                        <Text style={[styles.nearestStoreText, { color: colors.gray }]}>
                            Serving from <Text style={{ color: colors.black, fontWeight: '700' }}>{shops[0].name}</Text> • {shops[0].distance} km
                        </Text>
                    </View>
                    <View style={styles.nearestStoreMeta}>
                        <View style={styles.metaBadge}>
                            <Ionicons name="time-outline" size={12} color={colors.primary} />
                            <Text style={styles.metaBadgeText}>{shops[0].estimatedDeliveryTime || '25 min'}</Text>
                        </View>
                        <View style={styles.metaBadge}>
                            <MaterialCommunityIcons name="moped" size={12} color={colors.primary} />
                            <Text style={styles.metaBadgeText}>₹{shops[0].deliveryFee || 0}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Improved Search Bar matching original theme colors */}
            <View style={[styles.searchBarContainer, { backgroundColor: isDarkMode ? colors.white : '#fff', borderColor: colors.border }]}>
                <View style={styles.searchLeft}>
                    <Ionicons name="search" size={22} color={colors.primary} />
                    <TextInput
                        placeholder="Search for 'biscuits'"
                        placeholderTextColor={isDarkMode ? colors.gray : '#999'}
                        style={[styles.headerSearchInput, { color: colors.black }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={styles.searchRight}>
                    <TouchableOpacity style={styles.searchIconBtn}>
                        <Ionicons name="mic-outline" size={20} color={colors.gray} />
                    </TouchableOpacity>
                    <View style={[styles.searchDivider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity style={styles.searchIconBtn}>
                        <MaterialCommunityIcons name="note-edit-outline" size={20} color={colors.black} />
                    </TouchableOpacity>
                </View>
            </View>


            <View style={styles.categoriesContainer}>
                {/* Horizontal Categories Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScrollContent}
                    style={styles.categoryScrollView}
                >
                    {categoriesList.map((cat, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.categoryPill, selectedCategory === cat.name && styles.categoryPillActive]}
                            onPress={() => setSelectedCategory(cat.name)}
                        >
                            <View style={styles.categoryIconBox}>
                                <MaterialCommunityIcons
                                    name={cat.icon}
                                    size={28}
                                    color={selectedCategory === cat.name ? colors.primary : colors.black}
                                />
                            </View>
                            <Text style={[styles.categoryPillText, { color: colors.black }, selectedCategory === cat.name && { color: colors.primary }]}>{cat.name}</Text>
                            {selectedCategory === cat.name && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderBanner = () => (
        <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerScroll}
        >
            {banners.map(banner => (
                <View key={banner.id} style={styles.bannerContainer}>
                    <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                </View>
            ))}
        </ScrollView>
    );

    const renderGridItem = (product) => {
        // Dynamic background colors like the image
        const bgColors = isDarkMode
            ? ['#1e1b4b', '#1e293b', '#172554', '#1e1b4b']
            : ['#E3F2FD', '#FFF8E1', '#E8F5E9', '#F3E5F5'];
        const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];

        // Compute discount
        let discountPercent = 0;
        if (product.originalPrice && product.originalPrice > product.price) {
            discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        }

        const isFav = favProducts.includes(product.id || product._id);

        return (
            <TouchableOpacity
                key={product.id || product._id}
                style={[styles.gridProductItem, product.stockQuantity === 0 && { opacity: 0.6 }]}
                onPress={() => navigation.navigate('ProductDetail', { product })}
                disabled={product.stockQuantity === 0}
            >
                <View style={[styles.gridImageWrapper, { backgroundColor: isDarkMode ? colors.white + '10' : bgColor }]}>
                    <Image source={{ uri: resolveImageUrl(product.imageUrl) }} style={styles.gridProductImage} />
                    {product.stockQuantity === 0 && (
                        <View style={styles.outOfStockOverlay}>
                            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                        </View>
                    )}
                    {discountPercent > 0 && product.stockQuantity > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={[styles.gridFavBtn, { backgroundColor: isDarkMode ? colors.background : 'rgba(255,255,255,0.8)' }]}
                        onPress={() => toggleFavProduct(product)}
                    >
                        <Ionicons
                            name={isFav ? "heart" : "heart-outline"}
                            size={18}
                            color={isFav ? "#ff4757" : colors.black}
                        />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.gridProductName, { color: colors.black }]} numberOfLines={2}>{product.name}</Text>

                <View style={styles.priceContainer}>
                    <Text style={[styles.currentPrice, { color: colors.black }]}>{CONSTANTS.CURRENCY}{product.price}</Text>
                    {discountPercent > 0 && (
                        <Text style={[styles.originalPrice, { color: colors.gray }]}>{CONSTANTS.CURRENCY}{product.originalPrice}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderSection = ({ item }) => {
        const isXeroxSection = item.title === 'Xerox' || selectedCategory === 'Xerox';

        if (item.title === 'Buy it Again') {
            return (
                <View style={[styles.gridSectionCapsule, { backgroundColor: isDarkMode ? colors.white + '10' : '#FFF0F5' }]}>
                    <View style={styles.capsuleHeader}>
                        <Text style={[styles.capsuleHeaderText, { color: colors.primary }]}>{item.title} ⚡</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 10 }}>
                        {item.data.map(product => (
                            <View key={product.id || product._id} style={{ marginRight: 10 }}>
                                {renderGridItem(product)}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            );
        }

        return (
            <View style={[styles.gridSection, { backgroundColor: colors.background }]}>
                <Text style={[styles.gridSectionTitle, { color: colors.black }]}>{item.title}</Text>

                {isXeroxSection && (
                    <View style={styles.xeroxContainer}>
                        <View style={[styles.xeroxBanner, { backgroundColor: colors.white, borderColor: colors.border }]}>
                            <View style={styles.xeroxBannerHeader}>
                                <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                                <Text style={[styles.xeroxBannerTitle, { color: colors.black }]}>Upload Document</Text>
                            </View>
                            <Text style={[styles.xeroxBannerDesc, { color: colors.gray }]}>Attach your file (PDF, Doc, Image) for printing.</Text>

                            {xeroxFile ? (
                                <View style={[styles.xeroxFileRow, { backgroundColor: isDarkMode ? colors.background : '#f8fafc', borderColor: colors.border }]}>
                                    <Ionicons name="document-attach" size={20} color={colors.primary} />
                                    <Text style={[styles.xeroxFileName, { color: colors.black }]} numberOfLines={1}>{xeroxFile.originalName || xeroxFile.name}</Text>
                                    {xeroxFile.pageCount && (
                                        <View style={[styles.pageBadge, { backgroundColor: isDarkMode ? colors.primary + '20' : '#e0f2fe' }]}>
                                            <Text style={[styles.pageBadgeText, { color: colors.primary }]}>{xeroxFile.pageCount} Pages</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity onPress={() => setXeroxFile(null)}>
                                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                uploading ? (
                                    <View style={styles.uploadingContainer}>
                                        <ActivityIndicator color={colors.primary} size="small" />
                                        <Text style={[styles.uploadingText, { color: colors.gray }]}>Analyzing document...</Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={[styles.xeroxPickBtn, { backgroundColor: colors.primary }]} onPress={handlePickDocument}>
                                        <Ionicons name="cloud-upload" size={22} color="#fff" />
                                        <Text style={styles.xeroxPickBtnText}>Choose File</Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </View>

                        {xeroxFile && (
                            <View style={[styles.optionsContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
                                <Text style={[styles.optionsTitle, { color: colors.black }]}>Printing Options</Text>

                                <Text style={[styles.optionLabel, { color: colors.gray }]}>Color Mode</Text>
                                <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }]}>
                                    {['BW', 'Color'].map(m => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.segmentBtn, colorMode === m && [styles.segmentBtnActive, { backgroundColor: isDarkMode ? colors.white + '20' : '#fff' }]]}
                                            onPress={() => setColorMode(m)}
                                        >
                                            <Text style={[styles.segmentText, { color: colors.gray }, colorMode === m && { color: colors.primary }]}>{m}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.optionLabel, { color: colors.gray }]}>Sidedness</Text>
                                <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }]}>
                                    {['Single', 'Double'].map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[styles.segmentBtn, sides === s && [styles.segmentBtnActive, { backgroundColor: isDarkMode ? colors.white + '20' : '#fff' }]]}
                                            onPress={() => setSides(s)}
                                        >
                                            <Text style={[styles.segmentText, { color: colors.gray }, sides === s && { color: colors.primary }]}>{s} Sided</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.optionLabel, { color: colors.gray }]}>Ratio</Text>
                                <View style={styles.gridContainerSmall}>
                                    {['1:1', '1:2', '1:4', '1:6', '1:9'].map(r => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.gridBtn, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }, ratio === r && { backgroundColor: colors.primary }]}
                                            onPress={() => setRatio(r)}
                                        >
                                            <Text style={[styles.gridText, { color: colors.gray }, ratio === r && { color: '#fff' }]}>{r}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.xeroxAddToCartBtn, { backgroundColor: colors.black }]}
                                    onPress={() => {
                                        const xeroxShop = shops.find(s => s.category?.toLowerCase().includes('xerox') || s.category?.toLowerCase().includes('printing'));
                                        const baseProduct = (xeroxShop?.products || []).find(p => p.name.includes('Xerox') || p.name.includes('Printing')) || item.data[0];

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
                                            shopId: xeroxShop?.id || baseProduct?.shopId || shopId,
                                            id: `xerox_${Date.now()}`,
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
                )
                }

                <View style={styles.gridContainer}>
                    {item.data.map(product => renderGridItem(product))}
                </View>
            </View >
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={colors.background}
            />
            <LaroToast
                visible={toastVisible}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />
            <FlatList
                ListHeaderComponent={
                    <View>
                        {renderHeader()}
                        <View style={{ height: 10 }} />
                    </View>
                }
                data={sections}
                keyExtractor={(item) => item.title}
                renderItem={renderSection}
                contentContainerStyle={{ paddingBottom: 150 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading && (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text style={{ color: '#999' }}>No items found in this category.</Text>
                        </View>
                    )
                }
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchShops} tintColor={COLORS.primary} />
                }
            />

            {/* Smart Cart FAB */}
            <Animated.View style={[
                styles.smartCartContainer,
                {
                    opacity: cartOpacity,
                    transform: [{
                        translateY: cartOpacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0]
                        })
                    }]
                }
            ]}>
                <TouchableOpacity
                    style={styles.smartCartBtn}
                    onPress={() => navigation.navigate('Cart')}
                    activeOpacity={0.9}
                >
                    <View style={styles.cartInfo}>
                        <View style={styles.cartIconBadge}>
                            <Ionicons name="basket" size={24} color="#fff" />
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{cartItemCount}</Text>
                            </View>
                        </View>
                        <View style={styles.cartTextGroup}>
                            <Text style={styles.cartPriceText}>{CONSTANTS.CURRENCY}{parseFloat(cart.totalAmount || 0).toFixed(2)}</Text>
                            <Text style={styles.cartItemsText}>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart</Text>
                        </View>
                    </View>
                    <View style={styles.viewCartAction}>
                        <Text style={styles.viewCartText}>View Cart</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Modern Bottom Tab Bar Emulation */}


            <View style={[styles.bottomTabBar, { backgroundColor: isDarkMode ? colors.white : '#fff', borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.tabItem}>
                    <View style={[styles.activeTabBg, { backgroundColor: isDarkMode ? colors.primary + '30' : colors.primary + '15' }]}>
                        <Ionicons name="home" size={22} color={colors.primary} />
                        <Text style={[styles.activeTabText, { color: colors.primary }]}>Home</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Orders')}>
                    <Ionicons name="clipboard-outline" size={22} color={isDarkMode ? colors.gray : '#666'} />
                    <Text style={[styles.tabText, { color: isDarkMode ? colors.gray : '#666' }]}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person-outline" size={22} color={isDarkMode ? colors.gray : '#666'} />
                    <Text style={[styles.tabText, { color: isDarkMode ? colors.gray : '#666' }]}>Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Advertisement Popup Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={adModalVisible}
                onRequestClose={() => setAdModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalBackgroundClose}
                        onPress={() => setAdModalVisible(false)}
                    />
                    <View style={styles.adModalContainer}>
                        {/* Full Screen Image Body */}
                        <View style={styles.adImageWrapper}>
                            <TouchableOpacity
                                activeOpacity={1}
                                style={styles.adImageClickArea}
                                onPress={() => {
                                    if (!activeAd?.linkUrl) return;

                                    if (activeAd.linkUrl.startsWith('zippit://')) {
                                        const path = activeAd.linkUrl.replace('zippit://', '');
                                        const [type, id] = path.split('/');

                                        if (type === 'shop' && id) {
                                            navigation.navigate('ShopDetails', { shopId: id });
                                        } else if (type === 'product' && id) {
                                            navigation.navigate('ProductDetail', { productId: id });
                                        }
                                    } else {
                                        Linking.openURL(activeAd.linkUrl);
                                    }
                                    setAdModalVisible(false);
                                }}
                            >
                                {activeAd?.imageUrl ? (
                                    <Image
                                        source={{ uri: resolveImageUrl(activeAd.imageUrl) }}
                                        style={styles.adBannerImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.adPlaceholder, { backgroundColor: '#1a1a1a' }]}>
                                        <Ionicons name="image" size={80} color="#333" />
                                        <Text style={[styles.adPlaceholderText, { color: '#555' }]}>Zippit Exclusive</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Floating Close Button at Top Right */}
                            <TouchableOpacity
                                style={[styles.adCloseButtonTop, { top: insets.top + 20 }]}
                                onPress={() => setAdModalVisible(false)}
                            >
                                <Ionicons name="close" size={28} color="#FFF" />
                            </TouchableOpacity>

                            {/* Info Overlay at Bottom */}
                            <View style={[styles.adModalFooter, { paddingBottom: insets.bottom + 40 }]}>
                                <Text style={styles.adModalTitle}>{activeAd?.title || 'Zippit Deals'}</Text>
                                <Text style={styles.adModalSubtitle}>Exclusive limited time offer for you</Text>

                                <TouchableOpacity
                                    style={styles.adActionButton}
                                    onPress={() => {
                                        if (!activeAd?.linkUrl) {
                                            setAdModalVisible(false);
                                            return;
                                        }

                                        if (activeAd.linkUrl.startsWith('zippit://')) {
                                            const path = activeAd.linkUrl.replace('zippit://', '');
                                            const [type, id] = path.split('/');

                                            if (type === 'shop' && id) {
                                                navigation.navigate('ShopDetails', { shopId: id });
                                            } else if (type === 'product' && id) {
                                                navigation.navigate('ProductDetail', { productId: id });
                                            }
                                        } else {
                                            Linking.openURL(activeAd.linkUrl);
                                        }
                                        setAdModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.adActionButtonText}>SHOP NOW</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    headerContainer: { backgroundColor: '#fff', paddingHorizontal: 15, paddingBottom: 10 },
    topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    laroLogo: { fontSize: 32, fontWeight: '900', color: COLORS.primary, fontStyle: 'italic', letterSpacing: -1.5 },
    profileBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    gridFavBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    locationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 15,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    locationLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    locationTextGroup: { marginLeft: 8 },
    locationAddressText: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
    locationSubtitleText: { fontSize: 12, color: '#888' },
    nearestStoreBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 15,
        backgroundColor: 'rgba(251, 191, 36, 0.08)',
        gap: 6,
    },
    nearestStoreText: {
        fontSize: 12,
        fontWeight: '600',
    },

    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 15,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    searchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    searchRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchDivider: { width: 1, height: 20 },
    headerSearchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600' },
    searchIconBtn: { padding: 5, marginLeft: 5 },

    categoryScrollView: { marginTop: 5 },
    categoryScrollContent: { paddingRight: 20 },
    categoryPill: { alignItems: 'center', marginRight: 20, minWidth: 60 },
    categoryIconBox: { width: 55, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    categoryPillText: { fontSize: 12, fontWeight: '700' },
    activeDot: { width: 12, height: 4, borderRadius: 2, marginTop: 4 },

    bannerScroll: { marginVertical: 15, height: 180 },
    bannerContainer: { width: width - 30, height: 180, marginHorizontal: 15, borderRadius: 20, overflow: 'hidden' },
    bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },

    gridSection: { marginBottom: 25, paddingHorizontal: 15 },
    gridSectionCapsule: { marginHorizontal: 15, paddingVertical: 15, paddingLeft: 15, borderRadius: 20, marginBottom: 25 },
    gridSectionTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginBottom: 18, letterSpacing: -0.5 },
    capsuleHeader: { marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
    capsuleHeaderText: { fontSize: 17, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.3 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10 },

    gridProductItem: { width: (width - 60) / 4, marginBottom: 20, alignItems: 'center' },
    gridImageWrapper: { width: '100%', aspectRatio: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: 10 },
    gridProductImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    gridProductName: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 4,
        marginBottom: 2
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
    },
    currentPrice: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    originalPrice: {
        fontSize: 10,
        textDecorationLine: 'line-through'
    },
    discountBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderBottomLeftRadius: 8,
        borderTopRightRadius: 12
    },
    discountBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold'
    },
    smartCartContainer: { position: 'absolute', bottom: 100, left: 20, right: 20, zIndex: 1000 },
    smartCartBtn: { backgroundColor: COLORS.zippitGreen || '#27994B', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 20, elevation: 10 },
    cartInfo: { flexDirection: 'row', alignItems: 'center' },
    cartIconBadge: { position: 'relative', marginRight: 15 },
    countBadge: { position: 'absolute', top: -5, right: -10, backgroundColor: COLORS.accent, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.zippitGreen || '#27994B' },
    countText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
    cartPriceText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    cartItemsText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    viewCartAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12 },
    viewCartText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginRight: 5 },

    modeToggleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    modeTogglePill: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 50,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modeToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 50,
    },
    modeToggleBtnActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    modeToggleBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
    },
    modeToggleBtnTextActive: {
        color: '#fff',
    },

    modeTogglePillSmall: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 50,
        padding: 3,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modeToggleBtnSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 50,
    },

    bottomTabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 25,
    },
    tabItem: { alignItems: 'center', flex: 1 },
    activeTabBg: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25, alignItems: 'center' },
    activeTabText: { fontWeight: 'bold', marginLeft: 8 },
    tabText: { fontSize: 11, marginTop: 4 },

    // Xerox Styles
    xeroxContainer: { marginBottom: 20 },
    xeroxBanner: { borderRadius: 24, padding: 20, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    xeroxBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    xeroxBannerTitle: { fontSize: 20, fontWeight: '900' },
    xeroxBannerDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
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

    gridContainerSmall: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
    gridBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f1f5f9', borderRadius: 10, minWidth: 60, alignItems: 'center' },
    gridBtnActive: { backgroundColor: COLORS.primary },
    gridText: { fontSize: 14, fontWeight: '800', color: '#64748b' },
    gridTextActive: { color: '#fff' },

    xeroxAddToCartBtn: { backgroundColor: '#1a1a1a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 18, marginTop: 30 },
    xeroxAddToCartText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    // Advertisement Modal Styles (Immersive Story Style)
    modalOverlay: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalBackgroundClose: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    adModalContainer: {
        flex: 1,
        width: width,
        height: Dimensions.get('window').height,
    },
    adImageWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    adImageClickArea: {
        width: '100%',
        height: '100%',
    },
    adBannerImage: {
        width: '100%',
        height: '100%',
    },
    adCloseButtonTop: {
        position: 'absolute',
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    adModalFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 30,
        paddingTop: 50,
        backgroundColor: 'rgba(0,0,0,0.5)', // Fallback for no linear gradient
    },
    adModalTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        marginBottom: 5,
    },
    adModalSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        marginBottom: 20,
    },
    adActionButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: 20,
        gap: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
    adActionButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    adPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adPlaceholderText: {
        marginTop: 10,
        fontWeight: 'bold',
        opacity: 0.5,
    },
    nearestStoreBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 15,
        marginTop: -5,
    },
    nearestStoreMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nearestStoreMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#ec489915',
    },
    metaBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ec4899',
    },
    nearestStoreText: {
        fontSize: 12,
        marginLeft: 5,
    },
    outOfStockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    outOfStockText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    uniIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
