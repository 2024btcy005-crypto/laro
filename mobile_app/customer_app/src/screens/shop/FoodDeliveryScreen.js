import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, TextInput, ActivityIndicator, StatusBar, Dimensions, Animated, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api, { resolveImageUrl } from '../../services/api';
import { COLORS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { FoodStoreCardSkeleton } from '../../components/SkeletonLoader';

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
            setFilteredShops(data);
        } catch (error) {
            console.error('[FOOD SHOPS FETCH ERROR]', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Sticky Header */}
            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.black} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 16 }} />
                )}
                <View style={styles.headerInfo}>
                    <Text style={styles.headerLabel}>CAMPUS FOOD DELIVERY</Text>
                    <Text style={[styles.universityLabel, { color: colors.primary }]} numberOfLines={1}>
                        {selectedUniversity?.name || 'Select Campus'}
                    </Text>
                </View>
                {navigation.canGoBack() && <View style={{ width: 40 }} />}
            </View>

            {/* List with elements */}
            <FlatList
                data={filteredShops}
                keyExtractor={(item) => item.id}
                renderItem={renderRestaurantCard}
                contentContainerStyle={[styles.listContainer, { paddingBottom: 60 }]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        {/* Animated Search Input */}
                        <View style={[styles.searchBarContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
                            <Ionicons name="search" size={20} color="#056f36" style={styles.searchIcon} />
                            <View style={{ flex: 1, justifyContent: 'center', height: 42, position: 'relative' }}>
                                {!searchQuery && (
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
                                        <Text style={{ color: '#888888', fontSize: 14, fontWeight: '500' }}>
                                            {FOOD_SEARCH_SUGGESTIONS[placeholderIndex]}
                                        </Text>
                                    </Animated.View>
                                )}
                                <TextInput
                                    placeholder=""
                                    placeholderTextColor="transparent"
                                    style={[styles.searchInput, { color: colors.black, width: '100%' }]}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            {searchQuery.length > 0 ? (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                                    <Ionicons name="close-circle" size={18} color={colors.gray} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={{ padding: 4 }}>
                                    <Ionicons name="mic" size={20} color="#056f36" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Cuisines Categories List */}
                        <Text style={[styles.secTitle, { color: colors.black }]}>Explore Cuisines</Text>
                        <FlatList
                            data={FOOD_CUISINES}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.name}
                            contentContainerStyle={styles.cuisinesScroll}
                            renderItem={({ item }) => {
                                const active = selectedCuisine === item.name;
                                return (
                                    <TouchableOpacity
                                        style={[{
                                            alignItems: 'center',
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            borderRadius: 12,
                                            backgroundColor: active ? (isDarkMode ? '#056f3620' : '#edf5ed') : (isDarkMode ? '#1e293b' : '#f8fafc'),
                                            borderWidth: 1,
                                            borderColor: active ? (isDarkMode ? '#056f36' : '#d5edd5') : (isDarkMode ? '#334155' : '#e2e8f0'),
                                            flexDirection: 'row',
                                            gap: 6
                                        }]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedCuisine(item.name);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialCommunityIcons 
                                            name={item.icon} 
                                            size={16} 
                                            color={active ? '#056f36' : (isDarkMode ? '#94a3b8' : '#666')} 
                                        />
                                        <Text style={{
                                            fontSize: 13,
                                            fontWeight: '700',
                                            color: active ? '#056f36' : (isDarkMode ? '#cbd5e1' : '#666')
                                        }}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <Text style={[styles.secTitle, { color: colors.black, marginTop: 15 }]}>
                            Featured Food Spots
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 10 }}>
                            <FoodStoreCardSkeleton />
                            <FoodStoreCardSkeleton />
                            <FoodStoreCardSkeleton />
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="restaurant-outline" size={48} color={colors.gray} />
                            <Text style={[styles.emptyText, { color: colors.black }]}>No Restaurants Found</Text>
                            <Text style={styles.emptySub}>We couldn't find any food joints matching your description.</Text>
                        </View>
                    )
                }
                ListFooterComponent={
                    filteredShops.length > 0 ? (
                        <View style={{ alignItems: 'center', marginVertical: 32, paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <Ionicons name="sparkles" size={14} color="#056f36" />
                                <Text style={{ fontSize: 13, fontWeight: '900', color: '#056f36', letterSpacing: 1.5 }}>
                                    LARO
                                </Text>
                                <Ionicons name="sparkles" size={14} color="#056f36" />
                            </View>
                            <Text style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: '#64748b',
                                textAlign: 'center',
                                letterSpacing: 0.3
                            }}>
                                Delivering Happiness to Every Hostel Room ❤️
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: { padding: 4 },
    headerInfo: { alignItems: 'center', flex: 1 },
    headerLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#999' },
    universityLabel: { fontSize: 15, fontWeight: '900', marginTop: 2 },
    
    listContainer: { paddingHorizontal: 16, paddingTop: 10 },
    
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 20,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },

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

    card: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    imageWrapper: { width: '100%', height: 160, position: 'relative' },
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
    emptyContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyText: { fontSize: 16, fontWeight: '900', marginTop: 12 },
    emptySub: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }
});
