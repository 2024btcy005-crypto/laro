import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { signOut, updateCredentials } from '../../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CONSTANTS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';
import { orderAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FavouriteService } from '../../services/FavouriteService';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const dispatch = useDispatch();
    const { colors, isDarkMode } = useTheme();
    const user = useSelector(state => state.auth.user);
    const [alertVisible, setAlertVisible] = useState(false);
    const [stats, setStats] = useState({ orderCount: 0, laroCurrency: 0, loyaltyLevel: 'Learner' });
    const [recentOrder, setRecentOrder] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchProfileData();

            const pollInterval = setInterval(() => {
                fetchProfileData();
            }, 8000); // Dynamic update every 8 seconds

            return () => clearInterval(pollInterval);
        }, [user, initialLoading])
    );

    const fetchProfileData = async () => {
        if (!user) return;
        try {
            if (initialLoading) {
                setLoading(true);
            }
            
            // 1. Fetch Stats & sync details
            const statsRes = await orderAPI.getUserSummary();
            setStats(statsRes.data);

            if (statsRes.data.user) {
                dispatch(updateCredentials({ user: statsRes.data.user }));
            }

            // 2. Fetch Recent Orders for Recent Activity
            const ordersRes = await orderAPI.getMyOrders();
            if (ordersRes.data && ordersRes.data.length > 0) {
                const latest = ordersRes.data[0];
                setRecentOrder({
                    id: latest.id,
                    store: latest.shop?.name || 'Campus Cafe',
                    price: `${CONSTANTS.CURRENCY}${parseFloat(latest.totalAmount || 0).toFixed(2)}`,
                    itemsCount: latest.items?.length || 1,
                    status: latest.status || 'placed',
                    statusLabel: formatStatus(latest.status || 'placed')
                });
            } else {
                setRecentOrder(null);
            }

            // 3. Fetch actual Favorites
            const favs = await FavouriteService.getFavourites(user.id, 'product');
            setFavorites(favs || []);

            // 4. Fetch actual Saved Locations
            const addressKey = `@user_addresses_${user.id}`;
            const storedAddresses = await AsyncStorage.getItem(addressKey);
            setAddresses(storedAddresses ? JSON.parse(storedAddresses) : []);

        } catch (error) {
            console.error('[Profile] Error fetching details:', error);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'placed': return 'PLACED';
            case 'accepted': return 'PREPARING';
            case 'out_for_delivery': return 'IN TRANSIT';
            case 'delivered': return 'DELIVERED';
            default: return status.toUpperCase();
        }
    };

    const handleLogout = () => {
        setAlertVisible(true);
    };

    const confirmLogout = async () => {
        setAlertVisible(false);
        await AsyncStorage.removeItem('userToken');
        dispatch(signOut());
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />

            {/* Custom Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Laro</Text>
                <TouchableOpacity style={styles.cartIcon} onPress={() => navigation.navigate('Cart')}>
                    <Ionicons name="cart-outline" size={26} color="#056f36" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#056f36" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Profile Avatar (No Mock Image - Clean Person Vector Icon) */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarBorder}>
                            <View style={styles.avatarIconBg}>
                                <Ionicons name="person" size={54} color="#056f36" />
                            </View>
                            <TouchableOpacity style={styles.editBadge} onPress={() => navigation.navigate('Settings')}>
                                <Ionicons name="pencil" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                    </View>

                    {/* Stats Boxes */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statGreenValue}>{stats.orderCount || 0}</Text>
                            <Text style={styles.statLabel}>Total Orders</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statBlackValue}>{stats.laroCurrency || 0}</Text>
                            <Text style={styles.statLabel}>Laro Coins</Text>
                        </View>
                    </View>

                    {/* Wallet Card */}
                    <TouchableOpacity style={styles.walletCard} onPress={() => navigation.navigate('LaroCurrency')}>
                        <View style={styles.walletHeader}>
                            <View style={styles.walletTitleRow}>
                                <Ionicons name="radio" size={20} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.walletTitle}>LARO WALLET</Text>
                            </View>
                            <Ionicons name="school" size={24} color="#fff" />
                        </View>
                        
                        <View style={styles.walletFooter}>
                            <View>
                                <Text style={styles.walletUserName}>{user?.name || 'Guest User'}</Text>
                                <Text style={styles.walletUserPhone}>{user?.phoneNumber || user?.phone || 'No phone number'}</Text>
                            </View>
                            <View style={styles.tapPayContainer}>
                                <Ionicons name="finger-print" size={22} color="#fff" />
                                <Text style={styles.tapPayText}>Tap to pay</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Favorite Items Section (Render only if favorites exist or display clean helper) */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Favorite Items</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {favorites.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favoritesScroll}>
                            {favorites.map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.favoriteItemCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                                    <View style={[styles.favoriteImageWrapper, idx === 0 && styles.favoriteActiveBorder]}>
                                        {item.imageUrl ? (
                                            <Image source={{ uri: item.imageUrl }} style={styles.favoriteImage} />
                                        ) : (
                                            <View style={styles.favoritePlaceholderImage}>
                                                <Ionicons name="fast-food" size={24} color="#056f36" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.favoriteItemName} numberOfLines={1}>{item.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyItemsWrapper}>
                            <Text style={styles.emptySectionText}>No favorite items added yet.</Text>
                        </View>
                    )}

                    {/* Saved Locations Section (Render user's actual addresses) */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Saved Locations</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AddressBook')}>
                            <Text style={styles.viewAllText}>+ Add New</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.locationsContainer}>
                        {addresses.length > 0 ? (
                            addresses.slice(0, 3).map((item, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[styles.locationItem, index === addresses.length - 1 && { borderBottomWidth: 0 }]} 
                                    onPress={() => navigation.navigate('AddressBook')}
                                >
                                    <View style={styles.locationIconBg}>
                                        <Ionicons 
                                            name={item.type === 'Office' ? 'briefcase-outline' : (item.type === 'Home' ? 'home-outline' : 'location-outline')} 
                                            size={20} 
                                            color="#056f36" 
                                        />
                                    </View>
                                    <View style={styles.locationTextContainer}>
                                        <Text style={styles.locationName}>{item.name || 'Saved Address'}</Text>
                                        <Text style={styles.locationDetail}>{item.address || `${item.hostel}, Room ${item.room}`}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#bbb" />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyLocationsWrapper}>
                                <Text style={styles.emptySectionText}>No saved locations yet.</Text>
                            </View>
                        )}
                    </View>

                    {/* Recent Activity (Render only if user has recent orders) */}
                    {recentOrder && (
                        <View>
                            <Text style={[styles.sectionTitle, { marginVertical: 15 }]}>Recent Activity</Text>
                            <View style={styles.recentActivityCard}>
                                <View style={styles.recentActivityHeader}>
                                    <View style={styles.recentIconWrapper}>
                                        <Ionicons name="receipt-outline" size={24} color="#056f36" />
                                    </View>
                                    <View style={styles.recentActivityText}>
                                        <Text style={styles.recentStoreName}>{recentOrder.store}</Text>
                                        <Text style={styles.recentOrderDetails}>{recentOrder.itemsCount} {recentOrder.itemsCount === 1 ? 'Item' : 'Items'} • {recentOrder.price}</Text>
                                    </View>
                                    <View style={styles.transitBadge}>
                                        <Text style={styles.transitBadgeText}>{recentOrder.statusLabel}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.recentTrackButton}
                                    onPress={() => navigation.navigate('OrderDetail', { orderId: recentOrder.id })}
                                >
                                    <Ionicons name="location-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                                    <Text style={styles.recentTrackText}>Track Order</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Navigation Menu Links */}
                    <View style={styles.menuLinksContainer}>
                        <TouchableOpacity style={styles.menuLinkItem} onPress={() => navigation.navigate('LaroCurrency')}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="card-outline" size={22} color="#333" style={{ marginRight: 15 }} />
                                <Text style={styles.menuLinkLabel}>Payment Methods</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuLinkItem} onPress={() => navigation.navigate('Settings')}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="shield-checkmark-outline" size={22} color="#333" style={{ marginRight: 15 }} />
                                <Text style={styles.menuLinkLabel}>Security & Privacy</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuLinkItem} onPress={() => navigation.navigate('About')}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="help-circle-outline" size={22} color="#333" style={{ marginRight: 15 }} />
                                <Text style={styles.menuLinkLabel}>Help & Support</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuLinkItem} onPress={() => navigation.navigate('Settings')}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="settings-outline" size={22} color="#333" style={{ marginRight: 15 }} />
                                <Text style={styles.menuLinkLabel}>Settings</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuLinkItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="log-out-outline" size={22} color="#ef4444" style={{ marginRight: 15 }} />
                                <Text style={[styles.menuLinkLabel, { color: '#ef4444' }]}>Sign Out</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    {/* Footer Copyright */}
                    <Text style={styles.footerVersion}>Laro Version 2.4.0 (Build 882)</Text>
                    <Text style={styles.footerCopyright}>copyright 2026 laro technologies private ltd</Text>

                </ScrollView>
            )}

            <LaroAlert
                visible={alertVisible}
                title="Log out?"
                message="Are you sure you want to log out of your Laro account?"
                type="destructive"
                confirmText="Log Out"
                onConfirm={confirmLogout}
                onCancel={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' }, // Soft white-green tint
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 15,
        backgroundColor: '#f2f7f2'
    },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#056f36' },
    cartIcon: { padding: 4 },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 110 },

    avatarSection: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
    avatarBorder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#27c96c',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    avatarIconBg: {
        width: 106,
        height: 106,
        borderRadius: 53,
        backgroundColor: '#e6efe6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#056f36',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f2f7f2'
    },
    userName: { fontSize: 22, fontWeight: '900', color: '#111', marginTop: 12 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: 'center',
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1
    },
    statGreenValue: { fontSize: 24, fontWeight: '900', color: '#056f36' },
    statBlackValue: { fontSize: 24, fontWeight: '900', color: '#111' },
    statLabel: { fontSize: 13, color: '#666', fontWeight: '700', marginTop: 4 },

    walletCard: {
        backgroundColor: '#0c633a',
        borderRadius: 22,
        padding: 20,
        height: 170,
        justifyContent: 'space-between',
        shadowColor: '#0c633a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 4,
        marginBottom: 25
    },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    walletTitleRow: { flexDirection: 'row', alignItems: 'center' },
    walletTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
    walletFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    walletUserName: { color: '#fff', fontSize: 16, fontWeight: '900' },
    walletUserPhone: { color: '#a3d8b8', fontSize: 12, fontWeight: '700', marginTop: 2 },
    tapPayContainer: { alignItems: 'center' },
    tapPayText: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4 },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    viewAllText: { fontSize: 14, color: '#056f36', fontWeight: '800' },

    favoritesScroll: { paddingBottom: 10, gap: 14 },
    favoriteItemCard: { alignItems: 'center', width: 75 },
    favoriteImageWrapper: {
        width: 66,
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    favoriteActiveBorder: { borderColor: '#27c96c' },
    favoriteImage: { width: '100%', height: '100%' },
    favoritePlaceholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#edf5ed',
        justifyContent: 'center',
        alignItems: 'center'
    },
    favoriteItemName: { fontSize: 11, fontWeight: '700', color: '#333', marginTop: 6, textAlign: 'center' },
    
    emptyItemsWrapper: {
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 10
    },
    emptySectionText: { fontSize: 13, color: '#999', fontWeight: '600' },

    locationsContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
        marginBottom: 20
    },
    emptyLocationsWrapper: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2ed'
    },
    locationIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#edf5ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    locationTextContainer: { flex: 1 },
    locationName: { fontSize: 14, fontWeight: '800', color: '#111' },
    locationDetail: { fontSize: 12, color: '#666', marginTop: 1 },

    recentActivityCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
        marginBottom: 25
    },
    recentActivityHeader: { flexDirection: 'row', alignItems: 'center' },
    recentIconWrapper: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#edf5ed',
        justifyContent: 'center',
        alignItems: 'center'
    },
    recentActivityText: { flex: 1, marginLeft: 12 },
    recentStoreName: { fontSize: 15, fontWeight: '800', color: '#111' },
    recentOrderDetails: { fontSize: 12, color: '#666', marginTop: 2 },
    transitBadge: {
        backgroundColor: '#ffebe3',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    transitBadgeText: { fontSize: 10, fontWeight: '900', color: '#ff6633' },
    recentTrackButton: {
        backgroundColor: '#056f36',
        borderRadius: 12,
        height: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15
    },
    recentTrackText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    menuLinksContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
        marginBottom: 25
    },
    menuLinkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2ed'
    },
    menuLinkLabel: { fontSize: 14, fontWeight: '800', color: '#111' },

    footerVersion: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#999' },
    footerCopyright: { textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#bbb', marginTop: 4, marginBottom: 10 }
});
