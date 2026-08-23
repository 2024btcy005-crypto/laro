import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, Image, ActivityIndicator, StatusBar, Animated, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/cartSlice';
import api, { resolveImageUrl } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import LaroToast from '../../components/LaroToast';

const RECENT_SEARCHES_KEY = '@recent_searches_history';
const TRENDING_KEYWORDS = [
    { label: 'Maggi', icon: 'noodle' },
    { label: 'Amul Milk', icon: 'glass-mug-variant' },
    { label: 'Notebooks', icon: 'notebook' },
    { label: 'Chicken Biryani', icon: 'food' },
    { label: 'Cold Coffee', icon: 'coffee' },
    { label: 'Xerox Printing', icon: 'printer' },
    { label: 'Chocolates', icon: 'candy' },
];

export default function SearchScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const dispatch = useDispatch();
    const cart = useSelector(state => state.cart);
    const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    const [query, setQuery] = useState(route.params?.initialQuery || '');
    const [recentSearches, setRecentSearches] = useState([]);
    const [searchResults, setSearchResults] = useState({ products: [], shops: [] });
    const [loading, setLoading] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const inputRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadRecentSearches();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (query.trim().length > 0) {
            performSearch(query);
        } else {
            setSearchResults({ products: [], shops: [] });
            setLoading(false);
        }
    }, [query]);

    const loadRecentSearches = async () => {
        try {
            const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (data) {
                setRecentSearches(JSON.parse(data));
            }
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

    const performSearch = async (searchTerm) => {
        setLoading(true);
        try {
            const [prodRes, shopRes] = await Promise.all([
                api.get('/products', { params: { search: searchTerm, limit: 30 } }).catch(() => ({ data: [] })),
                api.get('/shops', { params: { search: searchTerm } }).catch(() => ({ data: [] }))
            ]);

            const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || []);
            const shops = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data?.shops || []);

            setSearchResults({ products: prods, shops });
        } catch (e) {
            console.error('Search error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectKeyword = (keyword) => {
        setQuery(keyword);
        saveRecentSearch(keyword);
    };

    const handleAddToCart = (product) => {
        const prodId = product.id || product._id;
        const shopId = product.shopId || product.shop?._id || product.shop?.id;
        dispatch(addToCart({
            ...product,
            id: prodId,
            _id: prodId,
            shopId: shopId,
            price: parseFloat(product.price || 0),
        }));
        setToastMessage(`${product.name} added to cart`);
        setToastVisible(true);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <LaroToast
                visible={toastVisible}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />

            {/* Top Smooth Search Bar */}
            <View style={[
                styles.searchHeaderSection,
                {
                    backgroundColor: isDarkMode ? '#0f172a' : '#f0fdf4',
                    paddingTop: Math.max(insets.top, 20) + 8,
                }
            ]}>
                <View style={styles.searchHeaderRow}>
                    <TouchableOpacity
                        style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
                    </TouchableOpacity>

                    <View style={[
                        styles.inputPillBox,
                        {
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                            borderColor: isDarkMode ? '#334155' : '#dcfce7',
                        }
                    ]}>
                        <Ionicons name="search" size={18} color="#056f36" style={{ marginRight: 8 }} />
                        <TextInput
                            ref={inputRef}
                            style={[styles.inputField, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}
                            placeholder="Search snacks, groceries, food..."
                            placeholderTextColor={isDarkMode ? '#94a3b8' : '#64748b'}
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={() => saveRecentSearch(query)}
                            returnKeyType="search"
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
                                <Ionicons name="close-circle" size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* Main Content Area */}
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color="#056f36" />
                        <Text style={[styles.loadingText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>Searching across campus...</Text>
                    </View>
                ) : query.trim().length === 0 ? (
                    <FlatList
                        data={[{ key: 'recent' }, { key: 'trending' }]}
                        keyExtractor={item => item.key}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 }}
                        renderItem={({ item }) => {
                            if (item.key === 'recent') {
                                if (recentSearches.length === 0) return null;
                                return (
                                    <View style={styles.sectionWrapper}>
                                        <View style={styles.sectionHeaderRow}>
                                            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Recent Searches</Text>
                                            <TouchableOpacity onPress={async () => {
                                                setRecentSearches([]);
                                                await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
                                            }}>
                                                <Text style={styles.clearAllText}>Clear All</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.recentListContainer}>
                                            {recentSearches.map((item, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={[styles.recentPillRow, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}
                                                    onPress={() => handleSelectKeyword(item)}
                                                >
                                                    <Ionicons name="time-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
                                                    <Text style={[styles.recentText, { color: isDarkMode ? '#e2e8f0' : '#334155' }]}>{item}</Text>
                                                    <TouchableOpacity onPress={() => removeRecentSearch(item)} style={{ marginLeft: 'auto', padding: 2 }}>
                                                        <Ionicons name="close" size={16} color="#94a3b8" />
                                                    </TouchableOpacity>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                );
                            }

                            if (item.key === 'trending') {
                                return (
                                    <View style={styles.sectionWrapper}>
                                        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#0f172a', marginBottom: 12 }]}>🔥 Trending Campus Items</Text>
                                        <View style={styles.trendingChipsGrid}>
                                            {TRENDING_KEYWORDS.map((item, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={[styles.chipPill, { backgroundColor: isDarkMode ? '#1e293b' : '#f0fdf4', borderColor: isDarkMode ? '#334155' : '#bbf7d0' }]}
                                                    onPress={() => handleSelectKeyword(item.label)}
                                                >
                                                    <MaterialCommunityIcons name={item.icon} size={15} color="#056f36" style={{ marginRight: 6 }} />
                                                    <Text style={[styles.chipText, { color: isDarkMode ? '#38bdf8' : '#056f36' }]}>{item.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                );
                            }
                            return null;
                        }}
                    />
                ) : searchResults.products.length === 0 && searchResults.shops.length === 0 ? (
                    <View style={styles.centerBox}>
                        <MaterialCommunityIcons name="magnify-remove-outline" size={54} color="#94a3b8" />
                        <Text style={[styles.emptyTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>No Results Found</Text>
                        <Text style={[styles.emptySub, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>Try searching for "Maggi", "Milk", or "Biryani"</Text>
                    </View>
                ) : (
                    <FlatList
                        data={searchResults.products}
                        keyExtractor={item => item.id || item._id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 60 }}
                        renderItem={({ item }) => (
                            <View style={[styles.productCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                                <Image
                                    source={{ uri: resolveImageUrl(item.imageUrl) || 'https://via.placeholder.com/80' }}
                                    style={styles.productThumb}
                                />
                                <View style={styles.productMeta}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        {item.isVeg !== undefined && (
                                            <View style={[styles.vegBadge, { borderColor: item.isVeg ? '#16a34a' : '#dc2626' }]}>
                                                <View style={[styles.vegDot, { backgroundColor: item.isVeg ? '#16a34a' : '#dc2626' }]} />
                                            </View>
                                        )}
                                        <Text style={[styles.productName, { color: isDarkMode ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                    </View>
                                    {item.shopName && (
                                        <Text style={styles.shopSub} numberOfLines={1}>{item.shopName}</Text>
                                    )}
                                    <Text style={styles.priceText}>₹{item.price}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.addBtn}
                                    onPress={() => handleAddToCart(item)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add" size={16} color="#ffffff" />
                                    <Text style={styles.addBtnText}>ADD</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}
            </Animated.View>

            {/* Floating Smart Cart FAB inside Search Screen */}
            {cartItemCount > 0 && (
                <View style={[styles.floatingCartOverlayBar, { bottom: Math.max(insets.bottom, 12) + 6 }]}>
                    <TouchableOpacity
                        style={styles.floatingCartBtn}
                        onPress={() => navigation.navigate('Cart')}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchHeaderSection: {
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
    searchHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputPillBox: {
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
    inputField: {
        flex: 1,
        fontSize: 14.5,
        fontWeight: '600',
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    sectionWrapper: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    clearAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#dc2626',
    },
    recentListContainer: {
        gap: 8,
    },
    recentPillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    recentText: {
        fontSize: 13.5,
        fontWeight: '600',
    },
    trendingChipsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 12,
    },
    emptySub: {
        fontSize: 13.5,
        marginTop: 6,
        textAlign: 'center',
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    productThumb: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
    },
    productMeta: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    vegBadge: {
        width: 13,
        height: 13,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
    },
    vegDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    productName: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    shopSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    priceText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#056f36',
        marginTop: 4,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#056f36',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 18,
        gap: 2,
    },
    addBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '900',
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
