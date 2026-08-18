import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, TextInput, ActivityIndicator, StatusBar, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api, { resolveImageUrl } from '../../services/api';
import { COLORS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const FOOD_CUISINES = [
    { name: 'All Cuisines', icon: 'food-variant' },
    { name: 'Burgers', icon: 'hamburger' },
    { name: 'Pizza', icon: 'pizza' },
    { name: 'Cafe', icon: 'coffee' },
    { name: 'Desserts', icon: 'cake-variant' },
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

    useEffect(() => {
        fetchFoodShops();
    }, [selectedUniversity]);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, selectedCuisine, shops]);

    const fetchFoodShops = async () => {
        setLoading(true);
        try {
            const uniId = selectedUniversity?.id || '';
            const res = await api.get(`/shops?shopType=RESTAURANT&universityId=${uniId}`);
            if (res.data) {
                // Filter strictly RESTAURANT shopType or non-stationery food places
                const foodShops = res.data.filter(s => 
                    s.shopType === 'RESTAURANT' || 
                    (!s.shopType && !STATIONERY_SHOP_MODES.some(m => (s.category || '').toLowerCase().includes(m)))
                );
                setShops(foodShops);
            }
        } catch (err) {
            console.warn('[FoodDeliveryScreen] Fetch shops error:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = shops;

        // Search text
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s => 
                s.name.toLowerCase().includes(query) ||
                (s.category && s.category.toLowerCase().includes(query))
            );
        }

        // Cuisine chip
        if (selectedCuisine !== 'All Cuisines') {
            result = result.filter(s => s.category && s.category.toLowerCase().includes(selectedCuisine.toLowerCase()));
        }

        setFilteredShops(result);
    };

    const renderRestaurantCard = ({ item }) => {
        return (
            <TouchableOpacity 
                style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}
                activeOpacity={0.9}
                onPress={() => {
                    Haptics.selectionAsync();
                    navigation.navigate('ShopDetails', { shop: item });
                }}
            >
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={styles.cardImage} />
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
                        {/* Search Input */}
                        <View style={[styles.searchBarContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
                            <Ionicons name="search" size={20} color={colors.gray} style={styles.searchIcon} />
                            <TextInput
                                placeholder="Search dishes, cafes, or snack joints..."
                                placeholderTextColor="#aaaaaa"
                                style={[styles.searchInput, { color: colors.black }]}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.gray} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Banner Ads Carousel Mock */}
                        <View style={styles.promoBanner}>
                            <Image 
                                source={{ uri: 'https://img.freepik.com/free-psd/food-delivery-social-media-banner-template_23-2149028042.jpg' }} 
                                style={styles.bannerImage}
                            />
                            <View style={styles.promoTextContainer}>
                                <Text style={styles.promoTitle}>Laro Student Special</Text>
                                <Text style={styles.promoSub}>Get flat 20% off at campus cafeterias!</Text>
                            </View>
                        </View>

                        {/* Cuisines Categories List */}
                        <Text style={[styles.secTitle, { color: colors.black }]}>Popular Cuisines</Text>
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
                                        style={[
                                            styles.cuisineChip, 
                                            { backgroundColor: active ? colors.primary : colors.white, borderColor: colors.border }
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedCuisine(item.name);
                                        }}
                                    >
                                        <MaterialCommunityIcons 
                                            name={item.icon} 
                                            size={16} 
                                            color={active ? '#fff' : colors.primary} 
                                            style={styles.cuisineIcon}
                                        />
                                        <Text style={[styles.cuisineChipText, { color: active ? '#fff' : colors.black }]}>
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
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="restaurant-outline" size={48} color={colors.gray} />
                            <Text style={[styles.emptyText, { color: colors.black }]}>No Restaurants Found</Text>
                            <Text style={styles.emptySub}>We couldn't find any food joints matching your description.</Text>
                        </View>
                    )
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

    secTitle: { fontSize: 17, fontWeight: '900', marginBottom: 12, letterSpacing: -0.2 },
    cuisinesScroll: { gap: 10, paddingBottom: 15 },
    cuisineChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    cuisineIcon: { marginRight: 6 },
    cuisineChipText: { fontSize: 13, fontWeight: '800' },

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
