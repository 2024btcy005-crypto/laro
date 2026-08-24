import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, TextInput, ScrollView, RefreshControl, StatusBar, Alert,
    Animated, Dimensions, ActivityIndicator, Modal, Linking, FlatList, Platform, Keyboard, Easing
} from 'react-native';

const { width } = Dimensions.get('window');
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { resolveImageUrl, API_BASE_URL } from '../../services/api';
import { FavouriteService } from '../../services/FavouriteService';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../../store/cartSlice';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import LaroToast from '../../components/LaroToast';
import { COLORS, CONSTANTS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { registerForPushNotificationsAsync } from '../../services/notificationService';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { HomeScreenSkeleton } from '../../components/SkeletonLoader';

const isEdibleProduct = (item) => {
    if (!item) return false;
    if (item.isEdible === false) return false;
    if (item.isVeg === null) return false;
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const nonEdibleCategories = ['xerox', 'printing', 'stationery', 'books', 'electronics', 'medicines'];
    if (nonEdibleCategories.some(c => cat.includes(c) || name.includes(c))) return false;
    return true;
};

const ProductCardImage = ({ product, style }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const rawUrl = product?.imageUrl || 
                   product?.image || 
                   product?.img || 
                   product?.image_url || 
                   (Array.isArray(product?.images) ? product.images[0] : null);
    const resolvedUri = resolveImageUrl(rawUrl);

    if (imgFailed || !rawUrl) {
        return (
            <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="fast-food-outline" size={28} color="#056f36" />
            </View>
        );
    }

    return (
        <Image
            source={{ uri: resolvedUri }}
            style={style}
            resizeMode="contain"
            onError={() => setImgFailed(true)}
        />
    );
};

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

    const [quests, setQuests] = useState([]);
    const [userSummary, setUserSummary] = useState(null);
    const pulseAnim = useRef(new Animated.Value(0.6)).current;


    // Animated Search Placeholder
    const SEARCH_SUGGESTIONS = [
        "Search 'Cold Coffee' ☕",
        "Search 'Farmhouse Pizza' 🍕",
        "Search 'Xerox & Printing' 🖨️",
        "Search 'Crispy Burger' 🍔",
        "Search 'Paneer Thali' 🍛",
        "Search 'Lab Notebooks & Pens' 📝",
        "Search 'Fresh Mango Juice' 🧃"
    ];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const searchFadeAnim = useRef(new Animated.Value(1)).current;
    const searchTranslateY = useRef(new Animated.Value(0)).current;

    // Animated Expanding Search Overlay State & Recent Searches
    const RECENT_SEARCHES_KEY = '@recent_searches_history';
    const [recentSearches, setRecentSearches] = useState([]);
    const [isSearchOverlayVisible, setIsSearchOverlayVisible] = useState(false);
    const searchExpandAnim = useRef(new Animated.Value(0)).current;
    const searchInputRef = useRef(null);

    const loadRecentSearches = async () => {
        try {
            const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (data) setRecentSearches(JSON.parse(data));
        } catch (e) {
            console.error('Failed to load recent searches:', e);
        }
    };

    const saveRecentSearch = async (searchTerm) => {
        if (!searchTerm || !searchTerm.trim()) return;
        const clean = searchTerm.trim();
        try {
            const filtered = recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase());
            const updated = [clean, ...filtered].slice(0, 6);
            setRecentSearches(updated);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save search:', e);
        }
    };

    const removeRecentSearch = async (searchTerm) => {
        try {
            const updated = recentSearches.filter(s => s !== searchTerm);
            setRecentSearches(updated);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to remove search:', e);
        }
    };

    const clearRecentSearches = async () => {
        try {
            setRecentSearches([]);
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (e) {
            console.error('Failed to clear searches:', e);
        }
    };

    const openSearchOverlay = () => {
        loadRecentSearches();
        setIsSearchOverlayVisible(true);
        Animated.spring(searchExpandAnim, {
            toValue: 1,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
        }).start(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        });
    };

    const closeSearchOverlay = () => {
        Keyboard.dismiss();
        if (searchInputRef.current) {
            searchInputRef.current.blur();
        }
        setIsSearchOverlayVisible(false);
        searchExpandAnim.setValue(0);
        setSearchQuery('');
    };


    const cart = useSelector(state => state.cart);
    const { user, selectedUniversity } = useSelector(state => state.auth);
    const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    const ALL_CATEGORIES = [
        { name: 'All', icon: 'apps', color: '#FFF5F5' },
        { name: 'Fresh', icon: 'leaf', color: '#FFF5F5' },
        { name: 'Dairy', icon: 'cheese', color: '#FFF5F5' },
        { name: 'Grocery', icon: 'shopping', color: '#FFF5F5' },
        { name: 'Snacks & drinks', icon: 'cookie', color: '#FFF5F5' },
        { name: 'Stationery', icon: 'pencil', color: '#FFF5F5' },
        { name: 'Xerox', icon: 'printer', color: '#FFF5F5' },
        { name: 'Laro Care', icon: 'heart-pulse', color: '#FFF5F5' },
    ];

    const STATIONERY_SHOP_MODES = ['Stationery', 'Books', 'Xerox', 'Printing', 'Stationary'];

    const categoriesList = ALL_CATEGORIES;

    useFocusEffect(

        useCallback(() => {
            fetchDefaultAddress();
            getLocationAsync(); // Gets GPS and calls fetchShops
            loadFavourites();
            registerForPushNotificationsAsync(); // Prompts user for Push Notification permissions
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
            let addresses = storedAddresses ? JSON.parse(storedAddresses) : [];
            
            // Sync with backend address if present
            if (user?.address && typeof user.address === 'string' && user.address.trim() !== '') {
                const match = addresses.find(a => a && a.address === user.address);
                if (!match) {
                    const parts = user.address.split(',').map(p => p.trim());
                    const cloudAddr = {
                        id: 'cloud_' + Date.now().toString(),
                        type: 'Home',
                        name: user.name || 'Student',
                        phone: user.phoneNumber || '',
                        hostel: parts[0] || 'Main Dormitory',
                        room: parts[1] || 'Room 402',
                        address: user.address,
                        isDefault: addresses.length === 0
                    };
                    addresses = [cloudAddr, ...addresses];
                    await AsyncStorage.setItem(key, JSON.stringify(addresses));
                }
            }

            // Auto-redirect checks for authenticated (non-guest) users
            if (user && user.id !== 'guest') {
                if (addresses.length === 0) {
                    console.log('[HomeScreen] Redirecting to AddressBook setup flow...');
                    navigation.navigate('AddressBook', { isSetup: true });
                    return;
                } else if (!user.phoneNumber) {
                    console.log('[HomeScreen] Redirecting to LinkWallet activation flow...');
                    navigation.navigate('LinkWallet', { isSetup: true });
                    return;
                }
            }

            if (addresses.length > 0) {
                const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
                if (defaultAddr) {
                    setDefaultAddress({
                        title: defaultAddr.hostel || defaultAddr.type || 'Home',
                        subtitle: defaultAddr.name || user?.name || defaultAddr.address
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
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.6,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
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

            const [shopsRes, ordersRes, questsRes, summaryRes] = await Promise.all([
                api.get(`/shops?lat=${finalLat}&lng=${finalLng}&universityId=${uniId}&t=${Date.now()}`),
                api.get('/orders'),
                api.get('/quests/active'),
                api.get('/orders/user-summary')
            ].map(p => p.catch(e => e))); // catch individual errors so partial load works

            if (summaryRes && summaryRes.data && !summaryRes.isAxiosError) {
                setUserSummary(summaryRes.data);
            }

            if (questsRes && questsRes.data && !questsRes.isAxiosError) {
                setQuests(questsRes.data);
            }

            if (shopsRes && shopsRes.data) {
                // Focus Home Screen on Daily Groceries, Essentials, and Stationery (Restaurants are in Food tab)
                const groceryShops = shopsRes.data.filter(s => 
                    s.shopType === 'GROCERY' || 
                    s.shopType === 'STATIONERY' || 
                    (s.category && !['food & canteen', 'restaurant', 'cafe', 'pizzeria'].includes(s.category.toLowerCase())) ||
                    s.isWarehouse
                );
                setShops(groceryShops.length > 0 ? groceryShops : shopsRes.data);
                
                const targetShops = groceryShops.length > 0 ? groceryShops : shopsRes.data;
                const allProds = targetShops.flatMap(s =>
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

    const matchingProducts = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return (products || []).filter(p =>
            p.name?.toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
        );
    }, [products, searchQuery]);

    // Grouping logic for sections with Search Filtering
    const sections = useMemo(() => {
        let allProducts = products;

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
            const categoriesCovered = new Set();

            const addSection = (title, filterFn) => {
                const items = filteredProducts.filter(p => {
                    const match = filterFn(p);
                    if (match && p.category) categoriesCovered.add(p.category);
                    return match;
                });
                return { title, data: items };
            };

            const rawSections = [
                addSection('Fresh & Healthy', p =>
                    ['Fresh', 'Vegetables', 'Fruits', 'Dairy'].includes(p.category)
                ),
                addSection('Grocery Essentials', p =>
                    ['Grocery', 'Grocery & kitchen', 'Dairy & Bread', 'Dairy & Eggs', 'Organic'].includes(p.category)
                ),
                addSection('Drinks & Beverages', p =>
                    ['Snacks & drinks', 'Munchies', 'Drinks', 'Beverages', 'Cold Drinks', 'Juices', 'Smoothies', 'Protein Shakes', 'Coffee'].includes(p.category)
                ),
                addSection('Campus Canteen & Meals', p =>
                    ['Food', 'Food & Canteen', 'Restaurant', 'Burgers', 'Pizzas', 'Biryani', 'Curries', 'Thalis', 'Pastas', 'Desserts', 'Bakery', 'Snacks'].includes(p.category)
                ),
                addSection('Stationery & Study', p =>
                    ['Stationery', 'Xerox', 'Printing', 'Books', 'Study', 'Books & Stationery'].includes(p.category) ||
                    STATIONERY_SHOP_MODES.some(m => (p.category || '').toLowerCase().includes(m.toLowerCase()) || (p.shopCategory || '').toLowerCase().includes(m.toLowerCase()))
                ),
                addSection('Pharmacy & Healthcare', p =>
                    ['Medicines', 'Pharmacy', 'Healthcare', 'Wellness'].includes(p.category)
                )
            ];

            const filtered = rawSections.filter(s => s.data.length > 0);

            // Group remaining items by their actual category name dynamically
            const remainingItems = filteredProducts.filter(p => !categoriesCovered.has(p.category));
            if (remainingItems.length > 0) {
                const customCategoryGroups = {};
                remainingItems.forEach(item => {
                    const catName = item.category || 'Essential Items';
                    if (!customCategoryGroups[catName]) customCategoryGroups[catName] = [];
                    customCategoryGroups[catName].push(item);
                });

                Object.keys(customCategoryGroups).forEach(catName => {
                    filtered.push({
                        title: catName,
                        data: customCategoryGroups[catName]
                    });
                });
            }

            if (filtered.length === 0 && filteredProducts.length > 0) {
                return [{ title: searchQuery ? 'Search Results' : 'Explore Products', data: filteredProducts }];
            }

            if (!searchQuery && recentProducts.length > 0) {
                filtered.unshift({
                    title: 'Buy it Again',
                    data: recentProducts
                });
            }

            console.log(`[HomeScreen] 'All' selected. Sections count: ${filtered.length}`);
            return filtered;
        } else {
            const isXerox = selectedCategory === 'Xerox';
            const targetCatLower = selectedCategory.toLowerCase();

            const filteredData = filteredProducts.filter(p => {
                const catLower = (p.category || '').toLowerCase();
                const nameLower = (p.name || '').toLowerCase();
                const shopCatLower = (p.shopCategory || '').toLowerCase();

                if (targetCatLower === 'grocery') {
                    return catLower.includes('groc') || catLower.includes('dairy') || catLower.includes('egg') || catLower.includes('bread') || catLower.includes('kitchen') || catLower.includes('general') || shopCatLower.includes('groc');
                }
                if (targetCatLower === 'fresh') {
                    return catLower.includes('fresh') || catLower.includes('veg') || catLower.includes('fruit') || catLower.includes('dairy') || catLower.includes('curd') || catLower.includes('milk');
                }
                if (targetCatLower === 'stationery') {
                    return catLower.includes('station') || catLower.includes('book') || catLower.includes('xerox') || catLower.includes('pen') || catLower.includes('paper') || catLower.includes('sheet') || shopCatLower.includes('station');
                }
                if (targetCatLower === 'laro care' || targetCatLower === 'pharmacy' || targetCatLower === 'care') {
                    return catLower.includes('med') || catLower.includes('care') || catLower.includes('soap') || catLower.includes('shampoo') || catLower.includes('health') || catLower.includes('hygiene') || catLower.includes('toothpaste') || catLower.includes('paste');
                }
                return catLower.includes(targetCatLower) || targetCatLower.includes(catLower) || nameLower.includes(targetCatLower);
            });

            const resultData = filteredData.length > 0 ? filteredData : filteredProducts;
            return (resultData.length > 0 || isXerox) ? [{ title: selectedCategory, data: resultData }] : [];
        }
    }, [products, selectedCategory, searchQuery, recentProducts]);

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

    const homeHeroBgColor = isDarkMode ? '#0f172a' : '#f0fdf4';

    const renderHeader = () => {
        return (
            <View style={[styles.headerContainer, { paddingHorizontal: 0 }]}>
                {/* Light Green Hero Backdrop Container */}
                <View style={[
                    styles.homeHeroBackdropSection,
                    { 
                        backgroundColor: homeHeroBgColor,
                        paddingTop: (insets?.top || 0) + 12,
                    }
                ]}>
                    {/* Top Row: Deliver To Address Selector + Streak & Profile */}
                    <View style={styles.locationHeader}>
                        <View style={styles.locationContainer}>
                            <TouchableOpacity 
                                style={styles.addressSelector} 
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    navigation.navigate('AddressBook');
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={{ maxWidth: width * 0.58 }}>
                                    <Text style={styles.deliverToText}>DELIVER TO</Text>
                                    <View style={styles.addressRow}>
                                        <Ionicons name="location-sharp" size={13} color="#056f36" style={{ marginRight: 3 }} />
                                        <Text style={styles.addressMainText} numberOfLines={1}>
                                            {defaultAddress?.title && defaultAddress?.title !== 'Set up delivery address'
                                                ? `${defaultAddress.title}${defaultAddress.subtitle ? ` • ${defaultAddress.subtitle}` : ''}`
                                                : (user?.address || selectedUniversity?.name || 'Set Delivery Location')}
                                        </Text>
                                        <Ionicons name="chevron-down" size={15} color="#056f36" style={styles.chevronIcon} />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <View style={{ flex: 1 }} />

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TouchableOpacity 
                                    style={styles.headerStreakPill} 
                                    onPress={() => navigation.navigate('Streak')}
                                >
                                    <Text style={{ fontSize: 14 }}>🔥</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#d94600', marginLeft: 2 }}>
                                        {userSummary?.currentStreak > 0 ? `${userSummary.currentStreak}d` : '0d'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    onPress={() => navigation.navigate('Profile')} 
                                    style={[styles.profileAvatarWrapper, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#dcecdc' }]}
                                >
                                    {user?.avatarUrl ? (
                                        <Image source={{ uri: user.avatarUrl }} style={styles.profileAvatar} />
                                    ) : (
                                        <Ionicons name="person" size={18} color="#056f36" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Hero Headline Box with Calligraphy Subtitle & Curved Swoosh */}
                    <View style={styles.homeHeroContentBox}>
                        <Text style={[styles.homeHeroTitleText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                            CAMPUS SUPERSTORE
                        </Text>
                        <Text style={styles.homeHeroCalligraphySubText}>
                            Hostel Life, Made Effortless
                        </Text>
                        <View style={styles.homeCurvedSwooshWrapper}>
                            <Svg width={170} height={15} viewBox="0 0 170 15" fill="none">
                                <Path
                                    d="M 4,5 Q 85,1 165,6 C 171,7 167,13 140,13"
                                    stroke="#056f36"
                                    strokeWidth={2.2}
                                    strokeLinecap="round"
                                />
                            </Svg>
                        </View>
                    </View>

                    {/* Redesigned Search Pill UI */}
                    <TouchableOpacity 
                        style={[styles.homeSearchPillContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}
                        onPress={openSearchOverlay}
                        activeOpacity={0.9}
                    >
                        <View style={styles.homeSearchIconBadge}>
                            <Ionicons name="search" size={16} color="#ffffff" />
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', height: 44, position: 'relative' }}>
                            <Animated.View
                                pointerEvents="none"
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    opacity: searchFadeAnim,
                                    transform: [{ translateY: searchTranslateY }]
                                }}
                            >
                                <Text style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 13.5, fontWeight: '500' }}>
                                    {SEARCH_SUGGESTIONS[placeholderIndex]}
                                </Text>
                            </Animated.View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Soft Edge Blend Transition Strip where Green meets White */}
                <View style={{ height: 26, width: '100%', backgroundColor: colors.background }}>
                    <Svg width="100%" height={26} preserveAspectRatio="none">
                        <Defs>
                            <LinearGradient id="homeEdgeBlend" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={homeHeroBgColor} stopOpacity="1" />
                                <Stop offset="100%" stopColor={colors.background} stopOpacity="1" />
                            </LinearGradient>
                        </Defs>
                        <Rect width="100%" height={26} fill="url(#homeEdgeBlend)" />
                    </Svg>
                </View>






            </View>
        );
    };

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

    const renderQuestsWidget = () => {
        if (!quests || quests.length === 0) return null;

        return (
            <View style={styles.questsWidgetContainer}>
                <View style={styles.questsHeaderRow}>
                    <Text style={styles.questsWidgetTitle}>COMMUNITY CHALLENGES 🏆</Text>
                    <View style={styles.liveIndicator}>
                        <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                </View>

                {quests.map((quest) => {
                    const progressFraction = Math.min(quest.currentCount / quest.targetCount, 1);
                    const progressPercent = Math.round(progressFraction * 100);

                    return (
                        <TouchableOpacity 
                            key={quest.id} 
                            style={styles.questCard}
                            activeOpacity={0.9}
                            onPress={async () => {
                                try {
                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                } catch (e) {}
                                navigation.navigate('Quest', { quest });
                            }}
                        >
                            <View style={styles.questCardTop}>
                                <View style={styles.questIconWrapper}>
                                    <Ionicons name="trophy" size={24} color="#056f36" />
                                </View>
                                <View style={styles.questInfoBox}>
                                    <Text style={styles.questTitle}>{quest.title}</Text>
                                </View>
                                <View style={styles.questRewardBadge}>
                                    <Text style={styles.questRewardLabel}>REWARD</Text>
                                    <View style={styles.rewardAmountRow}>
                                        <MaterialCommunityIcons name="database-marker" size={14} color="#056f36" style={{ marginRight: 2 }} />
                                        <Text style={styles.questRewardAmount}>+{Math.round(quest.rewardAmount)} Ł</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                                </View>
                                <View style={styles.progressTextRow}>
                                    <Text style={styles.progressCountText}>
                                        {quest.currentCount} / {quest.targetCount} orders completed
                                    </Text>
                                    <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const handleQuickAdd = (product) => {
        const cartItemPayload = {
            ...product,
            price: product.price,
            quantityToAdd: 1,
            shopId: product.shopId
        };
        dispatch(addToCart(cartItemPayload));
        setToastMessage(`${product.name} added to cart!`);
        setToastVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleDecreaseQty = (product) => {
        const productId = product.id || product._id;
        dispatch(removeFromCart(productId));
        setToastMessage(`Removed ${product.name} from cart`);
        setToastVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    const renderGridItem = (product) => {
        // Compute discount
        let discountPercent = 0;
        if (product.originalPrice && product.originalPrice > product.price) {
            discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        }

        const isFav = favProducts.includes(product.id || product._id);

        // Find quantity in cart using a secure ID comparison (preventing undefined === undefined matching)
        const getProductId = (p) => p?.id || p?._id;
        const targetId = getProductId(product);
        const cartItem = targetId ? cart.items.find(item => getProductId(item) === targetId) : null;
        const cartQty = cartItem ? cartItem.quantity : 0;

        return (
            <View
                key={product.id || product._id}
                style={[styles.gridProductItem, product.stockQuantity === 0 && { opacity: 0.6 }]}
            >
                <TouchableOpacity
                    style={styles.cardPressArea}
                    onPress={() => navigation.navigate('ProductDetail', { product })}
                    disabled={product.stockQuantity === 0}
                    activeOpacity={0.8}
                >
                    <View style={[styles.gridImageWrapper, { backgroundColor: isDarkMode ? colors.white + '10' : '#f8faf8' }]}>
                        <ProductCardImage product={product} style={styles.gridProductImage} />
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
                    
                    {/* Category and Veg indicator row */}
                    <View style={styles.cardMetaRow}>
                        {isEdibleProduct(product) && (
                            <View style={[styles.vegSquare, { borderColor: product.isVeg ? '#00b894' : '#d63031' }]}>
                                <View style={[styles.vegCircle, { backgroundColor: product.isVeg ? '#00b894' : '#d63031' }]} />
                            </View>
                        )}
                        <Text style={styles.cardCategoryText}>{product.category || 'Item'}</Text>
                    </View>

                    <Text style={[styles.gridProductName, { color: colors.black }]} numberOfLines={2}>{product.name}</Text>
                </TouchableOpacity>

                <View style={styles.cardBottomRow}>
                    <View style={styles.priceCol}>
                        {discountPercent > 0 && (
                            <Text style={[styles.originalPrice, { color: colors.gray }]}>{CONSTANTS.CURRENCY}{product.originalPrice}</Text>
                        )}
                        <Text style={[styles.currentPrice, { color: colors.black }]}>{CONSTANTS.CURRENCY}{product.price}</Text>
                    </View>
                    
                    {cartQty > 0 ? (
                        <View style={styles.qtyContainer}>
                            <TouchableOpacity 
                                style={styles.qtyBtn} 
                                onPress={() => handleDecreaseQty(product)}
                            >
                                <Ionicons name="remove" size={14} color="#056f36" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{cartQty}</Text>
                            <TouchableOpacity 
                                style={styles.qtyBtn} 
                                onPress={() => handleQuickAdd(product)}
                            >
                                <Ionicons name="add" size={14} color="#056f36" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={styles.quickAddBtn}
                            onPress={() => handleQuickAdd(product)}
                            disabled={product.stockQuantity === 0}
                        >
                            <Text style={styles.quickAddBtnText}>+ ADD</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderSection = ({ item }) => {
        const isXeroxSection = item.title === 'Xerox' || selectedCategory === 'Xerox';

        if (item.title === 'Buy it Again') {
            return (
                <View style={[styles.gridSectionCapsule, { backgroundColor: isDarkMode ? colors.white + '10' : '#ffffff' }]}>
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
            {loading && shops.length === 0 ? (
                <HomeScreenSkeleton />
            ) : (
                <FlatList
                    ListHeaderComponent={
                        <View>
                            {renderHeader()}
                            {renderQuestsWidget()}
                            <View style={{ height: 10 }} />
                        </View>
                    }
                    data={sections}
                    keyExtractor={(item) => item.title}
                    renderItem={renderSection}
                    contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyContainer}>
                                <View style={styles.outlineArtWrapper}>
                                    <View style={[styles.dashedCircleOrbit, { borderColor: isDarkMode ? '#334155' : '#cbd5e1' }]}>
                                        <MaterialCommunityIcons name="storefront-outline" size={44} color="#056f36" />
                                        <Ionicons name="sparkles-outline" size={16} color="#fbbf24" style={styles.sparkleAccentTop} />
                                        <Ionicons name="search-outline" size={14} color="#94a3b8" style={styles.searchAccentBottom} />
                                    </View>
                                    <View style={styles.outlineStatusPill}>
                                        <Text style={styles.outlineStatusPillText}>0 STORES OPEN</Text>
                                    </View>
                                </View>
                                <Text style={[styles.emptyText, { color: isDarkMode ? colors.white : '#0f172a' }]}>
                                    No Stores Found
                                </Text>
                                <Text style={[styles.emptySub, { color: isDarkMode ? colors.gray : '#64748b' }]}>
                                    We couldn't find any stores matching your current search or category in Kanyakumari.
                                </Text>
                            </View>
                        )
                    }
                    ListFooterComponent={
                        <View style={styles.brandFooterCard}>
                            <Text style={styles.brandFooterTitle}>
                                {"Hostel\nlife, easy!"}
                            </Text>
                            <View style={styles.brandFooterSubRow}>
                                <Text style={styles.brandFooterSubText}>Crafted with </Text>
                                <Ionicons name="heart" size={16} color="#ff385c" style={{ marginHorizontal: 2 }} />
                                <Text style={styles.brandFooterSubText}> in Kanyakumari, India</Text>
                            </View>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchShops} tintColor={colors.primary} />
                    }
                />
            )}

            {/* Smart Cart FAB */}
            <Animated.View style={[
                styles.smartCartContainer,
                {
                    opacity: cartOpacity,
                    bottom: 12,
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

            {/* Smooth Expanding Search Page Overlay Modal */}
            <Modal
                visible={isSearchOverlayVisible}
                animationType="none"
                transparent={true}
                onRequestClose={closeSearchOverlay}
            >
                <Animated.View style={[
                    styles.searchMorphOverlayContainer,
                    {
                        backgroundColor: colors.background,
                        opacity: searchExpandAnim,
                        transform: [
                            {
                                translateY: searchExpandAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0]
                                })
                            },
                            {
                                scale: searchExpandAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.94, 1]
                                })
                            }
                        ]
                    }
                ]}>
                    {/* Top Header Row in Expanded Overlay */}
                    <View style={[
                        styles.overlaySearchHeader,
                        {
                            backgroundColor: isDarkMode ? '#0f172a' : '#f0fdf4',
                            paddingTop: Math.max(insets.top, 20) + 8,
                        }
                    ]}>
                        <View style={styles.overlayHeaderRow}>
                            <TouchableOpacity onPress={closeSearchOverlay} style={styles.overlayBackBtn} activeOpacity={0.8}>
                                <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
                            </TouchableOpacity>

                            <View style={[
                                styles.overlayInputBox,
                                {
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                    borderColor: isDarkMode ? '#334155' : '#dcfce7',
                                }
                            ]}>
                                <Ionicons name="search" size={18} color="#056f36" style={{ marginRight: 8 }} />
                                <TextInput
                                    ref={searchInputRef}
                                    style={[styles.overlayTextInput, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}
                                    placeholder="Search snacks, groceries, food..."
                                    placeholderTextColor={isDarkMode ? '#94a3b8' : '#64748b'}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    returnKeyType="search"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Live Search Content & Suggestions */}
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
                        {searchQuery.trim().length === 0 ? (
                            <View>
                                {/* Recent Search History */}
                                {recentSearches.length > 0 && (
                                    <View style={{ marginBottom: 22 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <Text style={[styles.overlaySectionTitle, { color: isDarkMode ? '#ffffff' : '#0f172a', marginBottom: 0 }]}>
                                                🕒 Recent Searches
                                            </Text>
                                            <TouchableOpacity onPress={clearRecentSearches} activeOpacity={0.7}>
                                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>Clear All</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.trendingChipsContainer}>
                                            {recentSearches.map((term, idx) => (
                                                <View
                                                    key={idx}
                                                    style={[
                                                        styles.recentSearchChip,
                                                        { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }
                                                    ]}
                                                >
                                                    <TouchableOpacity
                                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                                        onPress={() => {
                                                            setSearchQuery(term);
                                                            saveRecentSearch(term);
                                                        }}
                                                    >
                                                        <Ionicons name="time-outline" size={14} color="#64748b" style={{ marginRight: 6 }} />
                                                        <Text style={{ fontSize: 13, fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#334155' }}>{term}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => removeRecentSearch(term)} style={{ marginLeft: 8, padding: 2 }}>
                                                        <Ionicons name="close" size={14} color="#94a3b8" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Trending Searches */}
                                <Text style={[styles.overlaySectionTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>🔥 Trending Campus Items</Text>
                                <View style={styles.trendingChipsContainer}>
                                    {['Maggi', 'Amul Milk', 'Notebooks', 'Chicken Biryani', 'Cold Coffee', 'Xerox Printing', 'Chocolates'].map((item, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[styles.trendingChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f0fdf4', borderColor: isDarkMode ? '#334155' : '#bbf7d0' }]}
                                            onPress={() => {
                                                setSearchQuery(item);
                                                saveRecentSearch(item);
                                            }}
                                        >
                                            <Ionicons name="sparkles-outline" size={14} color="#056f36" style={{ marginRight: 5 }} />
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#056f36' }}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View>
                                <Text style={[styles.overlaySectionTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                                    Search Results ({matchingProducts.length})
                                </Text>
                                {matchingProducts.slice(0, 15).map((prod) => (
                                    <TouchableOpacity
                                        key={prod.id || prod._id}
                                        style={[styles.searchResultRow, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}
                                        onPress={() => {
                                            saveRecentSearch(searchQuery || prod.name);
                                            closeSearchOverlay();
                                            navigation.navigate('ProductDetail', { productId: prod.id || prod._id });
                                        }}
                                    >
                                        <ProductCardImage product={prod} style={styles.searchResultThumb} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.searchResultName, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{prod.name}</Text>
                                            <Text style={styles.searchResultPrice}>₹{prod.price}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.addSmallBtn}
                                            onPress={() => {
                                                const prodId = prod.id || prod._id;
                                                const shopId = prod.shopId || prod.shop?._id || prod.shop?.id;
                                                dispatch(addToCart({
                                                    ...prod,
                                                    id: prodId,
                                                    _id: prodId,
                                                    shopId: shopId,
                                                    price: parseFloat(prod.price || 0)
                                                }));
                                                setToastMessage(`${prod.name} added to cart`);
                                                setToastVisible(true);
                                            }}
                                        >
                                            <Text style={styles.addSmallBtnText}>+ ADD</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Floating Smart Cart FAB inside Search Overlay */}
                    {cartItemCount > 0 && (
                        <View style={[styles.floatingCartOverlayBar, { bottom: Math.max(insets.bottom, 12) + 6 }]}>
                            <TouchableOpacity
                                style={styles.floatingCartBtn}
                                onPress={() => {
                                    closeSearchOverlay();
                                    navigation.navigate('Cart');
                                }}
                                activeOpacity={0.9}
                            >
                                <View style={styles.cartInfoGroup}>
                                    <View style={styles.cartIconCircle}>
                                        <Ionicons name="basket" size={20} color="#ffffff" />
                                        <View style={styles.cartBadgeDot}>
                                            <Text style={styles.cartBadgeDotText}>{cartItemCount}</Text>
                                        </View>
                                    </View>
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.cartBarPrice}>{CONSTANTS.CURRENCY}{parseFloat(cart.totalAmount || 0).toFixed(2)}</Text>
                                        <Text style={styles.cartBarItems}>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart</Text>
                                    </View>
                                </View>

                                <View style={styles.viewCartActionBox}>
                                    <Text style={styles.viewCartActionText}>View Cart</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
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
        paddingHorizontal: 14,
        height: 50,
        borderRadius: 16,
        borderWidth: 1.5,
        marginBottom: 15,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2
    },
    searchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    searchRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchDivider: { width: 1, height: 20 },
    headerSearchInput: { flex: 1, marginLeft: 6, fontSize: 14, fontWeight: '600' },
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

    gridProductItem: { 
        width: (width - 40) / 2, 
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eef2ee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 2
    },
    cardPressArea: { width: '100%' },
    gridImageWrapper: { width: '100%', aspectRatio: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: 8 },
    gridProductImage: { width: '90%', height: '90%', resizeMode: 'contain' },
    gridProductName: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'left',
        paddingHorizontal: 4,
        marginTop: 6,
        marginBottom: 2
    },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4, gap: 6 },
    vegSquare: { width: 12, height: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 2 },
    vegCircle: { width: 6, height: 6, borderRadius: 3 },
    cardCategoryText: { fontSize: 10, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', paddingHorizontal: 4, marginTop: 6 },
    priceCol: { flex: 1 },
    quickAddBtn: { borderWidth: 1.5, borderColor: '#056f36', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 28, justifyContent: 'center', alignItems: 'center' },
    quickAddBtnText: { color: '#056f36', fontSize: 12, fontWeight: '900' },
    qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, height: 28, borderWidth: 1.5, borderColor: '#056f36' },
    qtyBtn: { width: 24, height: '100%', justifyContent: 'center', alignItems: 'center' },
    qtyText: { color: '#056f36', fontSize: 12, fontWeight: '900', paddingHorizontal: 6, minWidth: 16, textAlign: 'center' },
    currentPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111'
    },
    originalPrice: {
        fontSize: 11,
        textDecorationLine: 'line-through',
        color: '#888',
        marginBottom: 2
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
    smartCartContainer: { position: 'absolute', left: 16, right: 16, zIndex: 1000 },
    smartCartBtn: { backgroundColor: '#056f36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
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
    headerWrapper: {
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        paddingTop: 10,
    },
    locationHeader: {
        marginBottom: 15,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    addressSelector: {
        flex: 1,
    },
    deliverToText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#888',
        letterSpacing: 0.5,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    addressMainText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111',
    },
    chevronIcon: {
        marginLeft: 4,
    },
    estDeliveryContainer: {
        alignItems: 'flex-end',
        marginRight: 15,
    },
    estDeliveryTime: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111',
    },
    estDeliveryLabel: {
        fontSize: 10,
        color: '#888',
        marginTop: 2,
    },
    profileAvatarWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    profileAvatar: {
        width: '100%',
        height: '100%',
    },
    customSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3fbf4',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 52,
        marginBottom: 20,
    },
    customSearchIcon: {
        marginRight: 10,
    },
    customSearchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        height: '100%',
    },
    micButton: {
        padding: 5,
    },
    categorySection: {
        marginBottom: 25,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111',
        marginBottom: 15,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    gridCategoryItem: {
        width: (width - 76) / 4,
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryImgWrapper: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 16,
        backgroundColor: '#f3fbf4',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    seeAllWrapper: {
        backgroundColor: '#e6ede6',
    },
    categoryImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gridCategoryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 14,
    },
    promoCarousel: {
        marginBottom: 25,
    },
    promoCardGreen: {
        backgroundColor: '#056f36',
        borderRadius: 20,
        width: width - 50,
        height: 140,
        flexDirection: 'row',
        padding: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 10,
    },
    promoLeft: {
        flex: 1.2,
    },
    promoTitle: {
        fontSize: 22,
        fontWeight: '950',
        color: '#fff',
        lineHeight: 24,
    },
    promoTitleSecond: {
        fontSize: 22,
        fontWeight: '950',
        color: '#fff',
        lineHeight: 24,
        marginBottom: 4,
    },
    promoSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 12,
    },
    promoButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
        alignSelf: 'flex-start',
    },
    promoButtonText: {
        color: '#056f36',
        fontWeight: 'bold',
        fontSize: 12,
    },
    promoImage: {
        flex: 1,
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 14,
    },
    promoCardBrown: {
        backgroundColor: '#8b4513',
        borderRadius: 20,
        width: 25,
        height: 140,
    },
    trendingSection: {
        marginBottom: 25,
    },
    trendingScrollContent: {
        paddingRight: 20,
        gap: 15,
    },
    trendingItemCard: {
        width: 170,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#eef5ee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    trendingImgBg: {
        width: '100%',
        height: 110,
        backgroundColor: '#f3fbf4',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    trendingProductImg: {
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
    },
    trendingTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#222',
        marginBottom: 2,
    },
    trendingSubText: {
        fontSize: 11,
        color: '#888',
        marginBottom: 10,
    },
    trendingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trendingPrice: {
        fontSize: 15,
        fontWeight: '900',
        color: '#111',
    },
    trendingAddButton: {
        borderWidth: 1.5,
        borderColor: '#056f36',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
        backgroundColor: '#fff',
    },
    trendingAddText: {
        color: '#056f36',
        fontSize: 11,
        fontWeight: 'bold',
    },
    guaranteeBanner: {
        backgroundColor: '#edf5ed',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    guaranteeIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#34d399',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    guaranteeTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#056f36',
        marginBottom: 6,
    },
    guaranteeSubtitle: {
        fontSize: 12,
        color: '#556655',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 15,
    },
    questsWidgetContainer: {
        marginHorizontal: 15,
        marginVertical: 12,
    },
    questsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    questsWidgetTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.5,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ef4444',
        marginRight: 4,
    },
    liveText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#ef4444',
    },
    questCard: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#d0dcd0',
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 12,
    },
    questCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    questIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#edf5ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rewardAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    questInfoBox: {
        flex: 1,
    },
    questTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#111',
        marginBottom: 4,
    },
    questDesc: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        lineHeight: 16,
    },
    questRewardBadge: {
        backgroundColor: '#edf5ed',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#d0dcd0',
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 70,
    },
    questRewardLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    questRewardAmount: {
        fontSize: 15,
        fontWeight: '900',
        color: '#056f36',
    },
    progressContainer: {
        marginTop: 14,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#f0f3f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#056f36',
        borderRadius: 4,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    progressCountText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#666',
    },
    progressPercentText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
    },
    foodDeliveryPromoBanner: {
        width: '100%',
        height: 135,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        marginVertical: 10,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    foodDeliveryPromoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    foodDeliveryPromoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 16,
        justifyContent: 'flex-end',
    },
    foodDeliveryPromoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    foodDeliveryPromoTag: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    foodDeliveryPromoTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    },
    foodDeliveryPromoSubtitle: {
        color: '#eee',
        fontSize: 12,
        fontWeight: '750',
        marginTop: 2,
    },
    streakBannerContainer: {
        backgroundColor: '#fff4eb',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ffd8be',
        shadowColor: '#ff6b00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    streakBannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    streakIconBox: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#ffe3d1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#d94600',
    },
    streakSubtext: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7c3a00',
        marginTop: 1,
    },
    streakActiveBadge: {
        backgroundColor: '#ff6b00',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    streakActiveText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    streakCoinBadge: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffc5a1',
    },
    streakCoinBadgeAmount: {
        color: '#d94600',
        fontSize: 14,
        fontWeight: '900',
    },
    streakCoinBadgeLabel: {
        color: '#994d00',
        fontSize: 8,
        fontWeight: '800',
    },
    streakProgressTrack: {
        height: 8,
        backgroundColor: '#ffe4d6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    streakProgressFill: {
        height: '100%',
        backgroundColor: '#ff6b00',
        borderRadius: 4,
    },
    streakProgressLabel: {
        fontSize: 10,
        color: '#8a4b18',
        fontWeight: '600',
    },
    streakProgressLabelBold: {
        fontSize: 10,
        color: '#d94600',
        fontWeight: '800',
    },
    headerStreakPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff4eb',
        borderWidth: 1.5,
        borderColor: '#ffd8be',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        shadowColor: '#ff6b00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    brandFooterCard: {
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 16,
        marginTop: 20,
        marginBottom: 8,
    },
    brandFooterTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: '#7d8590',
        lineHeight: 46,
        letterSpacing: -1,
        marginBottom: 20,
    },
    brandFooterSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    brandFooterSubText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#7d8590',
        letterSpacing: -0.2,
    },
    emptyContainer: {
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    outlineArtWrapper: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dashedCircleOrbit: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    sparkleAccentTop: {
        position: 'absolute',
        top: 12,
        right: 14,
    },
    searchAccentBottom: {
        position: 'absolute',
        bottom: 12,
        left: 14,
    },
    outlineStatusPill: {
        backgroundColor: '#056f36',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: -12,
    },
    outlineStatusPillText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '900',
        marginTop: 4,
        letterSpacing: -0.3,
    },
    emptySub: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
    },

    /* Home Hero Header Styling */
    homeHeroBackdropSection: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    homeHeroContentBox: {
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 18,
        paddingHorizontal: 10,
    },
    homeHeroTitleText: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.6,
        textAlign: 'center',
        lineHeight: 32,
    },
    homeHeroCalligraphySubText: {
        fontSize: 24,
        fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'cursive' }),
        color: '#056f36',
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    homeCurvedSwooshWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    homeSearchPillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    homeSearchIconBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#056f36',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    /* Morphing Search Overlay Styles */
    searchMorphOverlayContainer: {
        flex: 1,
    },
    overlaySearchHeader: {
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    overlayHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    overlayBackBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlayInputBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    overlayTextInput: {
        flex: 1,
        fontSize: 14.5,
        fontWeight: '600',
    },
    overlaySectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 14,
    },
    trendingChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    trendingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1,
    },
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    searchResultThumb: {
        width: 54,
        height: 54,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
    },
    searchResultName: {
        fontSize: 14,
        fontWeight: '700',
    },
    searchResultPrice: {
        fontSize: 13.5,
        fontWeight: '900',
        color: '#056f36',
        marginTop: 3,
    },
    addSmallBtn: {
        backgroundColor: '#056f36',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    addSmallBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '900',
    },
    recentSearchChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
    },
    floatingCartOverlayBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 20,
    },
    floatingCartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#056f36',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    cartInfoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cartIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    cartBadgeDot: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ff385c',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeDotText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '900',
    },
    cartBarPrice: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '900',
    },
    cartBarItems: {
        color: '#dcfce7',
        fontSize: 11.5,
        fontWeight: '600',
    },
    viewCartActionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
    },
    viewCartActionText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
    },
});
