import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, TextInput, ActivityIndicator, StatusBar, Dimensions, Animated, Platform, Modal, ScrollView, Keyboard, Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api, { resolveImageUrl } from '../../services/api';
import { COLORS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { FoodStoreCardSkeleton } from '../../components/SkeletonLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const FOOD_CUISINES = [
    { name: 'All Cuisines', icon: 'food-variant' },
    { name: 'Burgers', icon: 'hamburger' },
    { name: 'Pizza', icon: 'pizza' },
    { name: 'Biryani & Meals', icon: 'rice' },
    { name: 'Cafe & Drinks', icon: 'coffee' },
    { name: 'Desserts & Sweets', icon: 'cake-variant' },
    { name: 'Snacks & Fast Food', icon: 'food-croissant' },
];

const FOOD_SEARCH_SUGGESTIONS = [
    "Search 'Cheesy Pizza'",
    "Search 'Crispy Burgers'",
    "Search 'Cold Coffee & Shakes'",
    "Search 'Chicken Biryani'",
    "Search 'Hot Paneer Roll'",
    "Search 'Momos & Chutney'"
];

const STATIONERY_SHOP_MODES = ['stationery', 'books', 'xerox', 'printing', 'stationary'];

export default function FoodDeliveryScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const { selectedUniversity } = useSelector(state => state.auth);
    const cart = useSelector(state => state.cart);
    const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    
    const [shops, setShops] = useState([]);
    const [filteredShops, setFilteredShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState('All Cuisines');

    // Animated Search Bar Suggestions
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const searchFadeAnim = useRef(new Animated.Value(1)).current;
    const searchTranslateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const interval = setInterval(() => {
            Animated.parallel([
                Animated.timing(searchFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
                Animated.timing(searchTranslateY, { toValue: -12, duration: 250, useNativeDriver: true }),
            ]).start(() => {
                setPlaceholderIndex((prev) => (prev + 1) % FOOD_SEARCH_SUGGESTIONS.length);
                searchTranslateY.setValue(12);
                Animated.parallel([
                    Animated.timing(searchFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(searchTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start();
            });
        }, 2800);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchFoodShops();
    }, [selectedUniversity]);

    const fetchFoodShops = async () => {
        try {
            setLoading(true);
            const univId = selectedUniversity?.id;
            const res = await api.get('/shops', {
                params: {
                    shopType: 'RESTAURANT',
                    universityId: univId || undefined
                }
            });

            const data = Array.isArray(res.data) ? res.data : (res.data?.shops || []);
            setShops(data);
        } catch (error) {
            console.error('[FOOD SHOPS FETCH ERROR]', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

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

    // Filtering logic based on search query and cuisine chip
    useEffect(() => {
        let result = [...shops];

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(shop => 
                shop.name?.toLowerCase().includes(query) ||
                shop.category?.toLowerCase().includes(query) ||
                shop.description?.toLowerCase().includes(query)
            );
        }

        if (selectedCuisine !== 'All Cuisines') {
            const cuisineLower = selectedCuisine.split(' ')[0].toLowerCase();
            result = result.filter(shop => 
                shop.category?.toLowerCase().includes(cuisineLower) ||
                shop.name?.toLowerCase().includes(cuisineLower) ||
                shop.description?.toLowerCase().includes(cuisineLower)
            );
        }

        setFilteredShops(result);
    }, [searchQuery, selectedCuisine, shops]);

    const renderRestaurantCard = ({ item }) => {
        const isClosed = item.isOpen === false;
        
        return (
            <TouchableOpacity 
                style={[
                    styles.card, 
                    { backgroundColor: colors.white, borderColor: colors.border },
                    isClosed && { opacity: 0.6 }
                ]}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('ShopDetails', { shopId: item.id })}
            >
                <View style={styles.imageWrapper}>
                    <Image 
                        source={{ uri: resolveImageUrl(item.imageUrl) }} 
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                    {item.discount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{item.discount}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardBody}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={[styles.restaurantName, { color: colors.black }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#fff" />
                            <Text style={styles.ratingText}>{item.rating || 'New'}</Text>
                        </View>
                    </View>

                    <Text style={[styles.restaurantCategory, { color: colors.gray }]}>
                        {item.category || 'Food Spot'} • {item.costForTwo || '₹200 for two'}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={colors.primary} />
                            <Text style={[styles.metaText, { color: colors.gray }]}>
                                {item.estimatedDeliveryTime || item.deliveryTime || '20-30 min'}
                            </Text>
                        </View>
                        <View style={styles.metaDot} />
                        <View style={styles.metaItem}>
                            <Ionicons name="bicycle-outline" size={14} color="#056f36" />
                            <Text style={[styles.metaText, { color: colors.gray }]}>
                                {item.deliveryFee ? `₹${item.deliveryFee} delivery` : 'Free delivery'}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const heroBgColor = isDarkMode ? '#0f172a' : '#f0fdf4';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar 
                barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
                backgroundColor={heroBgColor}
            />

            {/* 1/3 Hero Header Section */}
            <View style={[
                styles.heroHeaderSection, 
                { 
                    backgroundColor: heroBgColor,
                    paddingTop: Math.max(insets.top, 20) + 16,
                }
            ]}>

                {/* Hero Title & Calligraphy Subtitle */}
                <View style={styles.heroContentBox}>
                    <Text style={[styles.heroTitleText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                        CAMPUS FOOD DELIVERY
                    </Text>
                    <Text style={styles.heroCalligraphySubText}>
                        {selectedUniversity?.name || 'Joy University, Kanyakumari'}
                    </Text>
                    <View style={styles.curvedSwooshWrapper}>
                        <Svg width={180} height={16} viewBox="0 0 180 16" fill="none">
                            <Path
                                d="M 5,6 Q 90,1 175,7 C 182,8 178,14 150,14"
                                stroke="#056f36"
                                strokeWidth={2.2}
                                strokeLinecap="round"
                            />
                        </Svg>
                    </View>
                </View>

                {/* Redesigned Floating Pill Search UI */}
                <TouchableOpacity 
                    style={[styles.redesignedSearchContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}
                    onPress={openSearchOverlay}
                    activeOpacity={0.9}
                >
                    <View style={styles.searchIconBadge}>
                        <Ionicons name="search" size={16} color="#ffffff" />
                    </View>
                    <View style={styles.searchInputWrapper}>
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.animatedPlaceholderWrapper,
                                {
                                    opacity: searchFadeAnim,
                                    transform: [{ translateY: searchTranslateY }]
                                }
                            ]}
                        >
                            <Text style={[styles.animatedPlaceholderText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                                {FOOD_SEARCH_SUGGESTIONS[placeholderIndex]}
                            </Text>
                        </Animated.View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Soft Edge Blend Transition Strip where Green meets White */}
            <View style={{ height: 26, width: '100%', backgroundColor: colors.background }}>
                <Svg width="100%" height={26} preserveAspectRatio="none">
                    <Defs>
                        <LinearGradient id="edgeBlend" x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor={heroBgColor} stopOpacity="1" />
                            <Stop offset="100%" stopColor={colors.background} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect width="100%" height={26} fill="url(#edgeBlend)" />
                </Svg>
            </View>

            {/* List with elements */}
            <FlatList
                data={filteredShops}
                keyExtractor={(item) => item.id}
                renderItem={renderRestaurantCard}
                style={{ flex: 1, backgroundColor: colors.background }}
                contentContainerStyle={[styles.listContainer, { paddingBottom: 60, paddingTop: 16 }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    loading ? (
                        <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 10 }}>
                            <FoodStoreCardSkeleton />
                            <FoodStoreCardSkeleton />
                            <FoodStoreCardSkeleton />
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.outlineArtWrapper}>
                                <View style={[styles.dashedCircleOrbit, { borderColor: isDarkMode ? '#334155' : '#cbd5e1' }]}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={44} color="#056f36" />
                                    <Ionicons name="sparkles-outline" size={16} color="#fbbf24" style={styles.sparkleAccentTop} />
                                    <Ionicons name="search-outline" size={14} color="#94a3b8" style={styles.searchAccentBottom} />
                                </View>
                                <View style={styles.outlineStatusPill}>
                                    <Text style={styles.outlineStatusPillText}>0 RESTAURANTS</Text>
                                </View>
                            </View>

                            <Text style={[styles.emptyText, { color: isDarkMode ? colors.white : '#0f172a' }]}>
                                No Restaurants Found
                            </Text>
                            <Text style={[styles.emptySub, { color: isDarkMode ? colors.gray : '#64748b' }]}>
                                We couldn't find any dining spots matching your search in Kanyakumari.
                            </Text>
                        </View>
                    )
                }
                ListFooterComponent={
                    <View style={styles.brandFooterCard}>
                        <Text style={styles.brandFooterTitle}>
                            {"Your favorite meals,\njust a tap away."}
                        </Text>
                        <View style={styles.brandFooterSubRow}>
                            <Text style={styles.brandFooterSubText}>Crafted with </Text>
                            <Ionicons name="heart" size={16} color="#ff385c" style={{ marginHorizontal: 2 }} />
                            <Text style={styles.brandFooterSubText}> in Kanyakumari, India</Text>
                        </View>
                    </View>
                }
            />

            {/* Smooth Expanding Search Overlay Modal */}
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
                                    placeholder="Search restaurants, cuisines, dishes..."
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
                                <Text style={[styles.overlaySectionTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>🔥 Trending Food Searches</Text>
                                <View style={styles.trendingChipsContainer}>
                                    {['Biryani', 'Cold Coffee', 'Chicken Roll', 'Burger', 'Paneer Butter Masala', 'Milkshake', 'Shawarma'].map((item, idx) => (
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
                                    Matching Food Spots ({filteredShops.length})
                                </Text>
                                {filteredShops.map((shop) => (
                                    <TouchableOpacity
                                        key={shop.id}
                                        style={[styles.searchResultRow, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}
                                        onPress={() => {
                                            saveRecentSearch(searchQuery || shop.name);
                                            closeSearchOverlay();
                                            navigation.navigate('ShopDetails', { shopId: shop.id });
                                        }}
                                    >
                                        <Image source={{ uri: resolveImageUrl(shop.imageUrl) }} style={styles.searchResultThumb} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.searchResultName, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{shop.name}</Text>
                                            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{shop.category || 'Restaurant'}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#056f36" />
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
                                        <Text style={styles.cartBarPrice}>₹{parseFloat(cart.totalAmount || 0).toFixed(2)}</Text>
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
    container: { flex: 1 },
    heroHeaderSection: {
        paddingHorizontal: 22,
        paddingBottom: 28,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        justifyContent: 'center',
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    heroBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topDeliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#e6f4ea',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#c6e7d0',
    },
    topDeliveryBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.8,
    },
    topCartBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroContentBox: {
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 16,
        paddingHorizontal: 10,
    },
    heroTitleText: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.8,
        textAlign: 'center',
        lineHeight: 34,
    },
    heroCalligraphySubText: {
        fontSize: 26,
        fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'cursive' }),
        color: '#056f36',
        marginTop: 6,
        textAlign: 'center',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    curvedSwooshWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    heroPillChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    heroPillChip: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    heroPillChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
    },

    redesignedSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
    searchIconBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#056f36',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    searchInputWrapper: {
        flex: 1,
        justifyContent: 'center',
        height: 50,
        position: 'relative',
    },
    animatedPlaceholderWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 15,
    },
    animatedPlaceholderText: {
        fontSize: 14,
        fontWeight: '600',
    },
    redesignedSearchInput: {
        width: '100%',
        height: '100%',
        fontSize: 14,
        fontWeight: '700',
    },
    searchRightAction: {
        padding: 6,
    },

    promoBanner: {
        width: '100%',
        height: 120,
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 25,
    },
    bannerImage: { ...StyleSheet.absoluteFillObject },
    promoTextContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    promoTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
    promoSub: { color: '#eee', fontSize: 12, fontWeight: '600', marginTop: 2 },

    secTitle: { fontSize: 16, fontWeight: '900', marginBottom: 12, letterSpacing: -0.2 },
    cuisinesScroll: { gap: 10, paddingBottom: 15, paddingRight: 20 },

    brandFooterCard: {
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 16,
        marginTop: 20,
        marginBottom: 8,
    },
    brandFooterTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#7d8590',
        lineHeight: 38,
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

    card: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
        marginHorizontal: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    imageWrapper: { width: '100%', height: 140, position: 'relative' },
    cardImage: { width: '100%', height: '100%' },
    discountBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: '#056f36',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    discountText: { color: '#fff', fontSize: 11, fontWeight: '900' },

    cardBody: { padding: 16 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    restaurantName: { fontSize: 16, fontWeight: '900', flex: 1, marginRight: 10 },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fbbf24',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 3,
    },
    ratingText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    restaurantCategory: { fontSize: 13, fontWeight: '500', marginBottom: 12 },
    
    cardFooter: { flexDirection: 'row', alignItems: 'center' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '750' },
    metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', mx: 8, marginHorizontal: 8 },

    centerContainer: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
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
    emptyOutlineResetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#056f36',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        marginTop: 20,
    },
    emptyOutlineResetBtnText: {
        color: '#056f36',
        fontSize: 14,
        fontWeight: '800',
    },
    emptySuggestionsContainer: {
        marginTop: 28,
        alignItems: 'center',
        width: '100%',
    },
    emptySuggestionsTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.2,
        marginBottom: 10,
    },
    emptyTagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    emptyOutlineTagChip: {
        backgroundColor: 'transparent',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
    },
    emptyOutlineTagText: {
        fontSize: 13,
        fontWeight: '700',
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
