import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { FavouriteService } from '../../services/FavouriteService';
import { COLORS, CONSTANTS } from '../../theme';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'react-native';

export default function FavoritesScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState('shops');
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);

    useFocusEffect(
        useCallback(() => {
            loadFavourites();
        }, [user, activeTab])
    );

    const loadFavourites = async () => {
        if (!user) return;
        setLoading(true);
        const data = await FavouriteService.getFavourites(user.id, activeTab === 'shops' ? 'shop' : 'product');
        if (activeTab === 'shops') {
            setShops(data);
        } else {
            setProducts(data);
        }
        setLoading(false);
    };

    const toggleFavourite = async (item) => {
        if (!user) return;
        const type = activeTab === 'shops' ? 'shop' : 'product';
        const newFavs = await FavouriteService.toggleFavourite(user.id, item, type);
        if (newFavs) {
            if (activeTab === 'shops') setShops(newFavs);
            else setProducts(newFavs);
            Haptics.selectionAsync();
        }
    };

    const renderShopCard = ({ item }) => (
        <TouchableOpacity style={[styles.favoriteCard, { backgroundColor: colors.white, borderColor: colors.border }]} onPress={() => navigation.navigate('ShopDetails', { shop: item })}>
            <Image source={{ uri: item.imageUrl }} style={styles.shopImage} />
            <View style={styles.shopDetails}>
                <Text style={[styles.shopName, { color: colors.black }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.shopCategory, { color: colors.gray }]}>{item.category} • {item.deliveryTime || '30-40 min'}</Text>
                <View style={styles.ratingBox}>
                    <Text style={styles.ratingText}>{item.rating || '4.2'} ★</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.heartIcon} onPress={() => toggleFavourite(item)}>
                <Ionicons name="heart" size={24} color="#ff4757" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderProductCard = ({ item }) => (
        <TouchableOpacity style={[styles.favoriteCard, { backgroundColor: colors.white, borderColor: colors.border }]} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
            <View style={[styles.productImageWrapper, { backgroundColor: isDarkMode ? colors.background : '#f8f9fa' }]}>
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            </View>
            <View style={styles.shopDetails}>
                <Text style={[styles.shopName, { color: colors.black }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.shopCategory, { color: colors.gray }]}>{item.category}</Text>
                <Text style={styles.productPrice}>{CONSTANTS.CURRENCY}{item.price}</Text>
            </View>
            <TouchableOpacity style={styles.heartIcon} onPress={() => toggleFavourite(item)}>
                <Ionicons name="heart" size={24} color="#ff4757" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const data = activeTab === 'shops' ? shops : products;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={26} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>My Favorites</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={[styles.tabContainer, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'shops' && styles.activeTab]}
                    onPress={() => setActiveTab('shops')}
                >
                    <Text style={[styles.tabText, { color: colors.gray }, activeTab === 'shops' && styles.activeTabText]}>SHOPS</Text>
                    {activeTab === 'shops' && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'products' && styles.activeTab]}
                    onPress={() => setActiveTab('products')}
                >
                    <Text style={[styles.tabText, { color: colors.gray }, activeTab === 'products' && styles.activeTabText]}>PRODUCTS</Text>
                    {activeTab === 'products' && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
            </View>

            {!loading && data.length > 0 ? (
                <FlatList
                    data={data}
                    keyExtractor={(item) => (item.id || item._id).toString()}
                    renderItem={activeTab === 'shops' ? renderShopCard : renderProductCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : !loading ? (
                <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? colors.white : COLORS.background }]}>
                        <Ionicons name="heart-outline" size={50} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.emptyText, { color: colors.black }]}>Nothing here yet</Text>
                    <Text style={[styles.emptySubtext, { color: colors.gray }]}>
                        {activeTab === 'shops'
                            ? "Save your go-to shops by tapping the heart icon on their profile."
                            : "Wishlist products you love to easily find them later."}
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreBtn}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.exploreBtnText}>Explore Laro</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff' },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1c1c1c', letterSpacing: -0.5 },

    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 15, position: 'relative' },
    tabText: { fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
    activeTabText: { color: COLORS.primary },
    tabUnderline: { position: 'absolute', bottom: 0, width: '40%', height: 3, backgroundColor: COLORS.primary, borderRadius: 3 },

    listContent: { padding: 15, paddingBottom: 100 },
    favoriteCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f8f8f8' },
    shopImage: { width: 100, height: 100 },
    productImageWrapper: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
    productImage: { width: '80%', height: '80%', resizeMode: 'contain' },
    shopDetails: { flex: 1, padding: 12, justifyContent: 'center' },
    shopName: { fontSize: 16, fontWeight: '900', color: '#1a1a2e', marginBottom: 4 },
    shopCategory: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 8 },
    productPrice: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
    ratingBox: { alignSelf: 'flex-start', backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    ratingText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    heartIcon: { position: 'absolute', top: 12, right: 12, padding: 4 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginBottom: 10 },
    emptySubtext: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 30, fontWeight: '500' },
    exploreBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
    exploreBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});

