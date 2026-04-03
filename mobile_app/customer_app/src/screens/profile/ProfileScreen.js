import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { signOut, updateCredentials } from '../../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, Feather, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';
import { orderAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
    const dispatch = useDispatch();
    const { colors, isDarkMode } = useTheme();
    const user = useSelector(state => state.auth.user);
    const [alertVisible, setAlertVisible] = React.useState(false);
    const [stats, setStats] = React.useState({ orderCount: 0, totalSpent: 0, rating: 0, loyaltyPoints: 0, laroCurrency: 0, loyaltyLevel: 'Learner' });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getUserSummary();
            setStats(response.data);

            // Sync backend user data to Redux for address/profile consistency
            if (response.data.user) {
                dispatch(updateCredentials({ user: response.data.user }));
            }
        } catch (error) {
            console.error('[Profile] Error fetching summary:', error);
        } finally {
            setLoading(false);
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

    const renderMenuItem = (IconComponent, iconName, title, subtitle = '', isLast = false, color = colors.black, route = null) => (
        <TouchableOpacity
            style={[styles.menuItem, !isLast && { borderBottomColor: colors.lightGray, borderBottomWidth: 1 }]}
            onPress={() => route ? navigation.navigate(route) : null}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                <IconComponent name={iconName} size={22} color={color} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color: colors.black }]}>{title}</Text>
                {subtitle ? <Text style={[styles.menuSubtitle, { color: colors.gray }]}>{subtitle}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.white }]}>
                <Text style={[styles.headerTitle, { color: colors.black }]}>My Profile</Text>
                <TouchableOpacity
                    style={[styles.settingsIcon, { backgroundColor: colors.background }]}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="settings-outline" size={22} color={colors.black} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* User Card */}
                <View style={[styles.userCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <View style={styles.userCardMain}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={12} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.userInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.userName, { color: colors.black }]}>{user?.name || 'Guest User'}</Text>
                                <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 6 }} />
                            </View>
                            <Text style={styles.pointsText}>{stats.laroCurrency || 0} Ł</Text>
                        </View>
                    </View>
                    <View style={[styles.userStats, { borderTopColor: colors.lightGray }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.black }]}>{stats.orderCount}</Text>
                            <Text style={[styles.statLabel, { color: colors.gray }]}>Orders</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.lightGray }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.black }]}>₹{parseFloat(stats.totalSpent || 0).toFixed(2)}</Text>
                            <Text style={[styles.statLabel, { color: colors.gray }]}>Spent</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.lightGray }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.black }]}>{stats.rating} ★</Text>
                            <Text style={[styles.statLabel, { color: colors.gray }]}>Rating</Text>
                        </View>
                    </View>
                </View>



                {/* Main Menu Links */}
                <Text style={[styles.sectionLabel, { color: colors.gray }]}>ACCOUNT SETTINGS</Text>
                <View style={[styles.sectionContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    {renderMenuItem(MaterialCommunityIcons, 'wallet-outline', 'Laro Wallet', 'Manage your Laro Coins', false, colors.black, 'LaroCurrency')}
                    {renderMenuItem(Feather, 'package', 'My Orders', 'Track and manage orders', false, colors.black, 'Orders')}
                    {renderMenuItem(Ionicons, 'heart-outline', 'Favorites', 'Your saved items', false, colors.black, 'Favorites')}
                    {renderMenuItem(Ionicons, 'book-outline', 'Address Book', 'Manage delivery addresses', true, colors.black, 'AddressBook')}
                </View>

                <Text style={[styles.sectionLabel, { color: colors.gray }]}>SUPPORT & INFO</Text>
                <View style={[styles.sectionContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    {renderMenuItem(Ionicons, 'help-circle-outline', 'Help Support', 'FAQs and live chat', false, colors.black)}
                    {renderMenuItem(Ionicons, 'information-circle-outline', 'About Laro', 'Version, terms and privacy', true, colors.black, 'About')}
                </View>

                <TouchableOpacity style={[styles.logoutAction, { backgroundColor: colors.white, borderColor: colors.border }]} onPress={handleLogout} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={22} color={colors.primary} />
                    <Text style={[styles.logoutActionText, { color: colors.primary }]}>Log out from Laro</Text>
                </TouchableOpacity>

                <Text style={[styles.versionText, { color: colors.gray }]}>Laro v1.2.0 • Build 2447</Text>
            </ScrollView>

            <LaroAlert
                visible={alertVisible}
                title="Log out?"
                message="Are you sure you want to log out of your Laro account?"
                type="destructive"
                confirmText="Log Out"
                onConfirm={confirmLogout}
                onCancel={() => setAlertVisible(false)}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.8 },
    settingsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },

    scrollContent: { padding: 20, paddingBottom: 100 },

    userCard: { backgroundColor: '#fff', borderRadius: 28, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: '#f0f0f0' },
    userCardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 18, position: 'relative' },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1a1a2e', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    userInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    userName: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.5 },
    userPhone: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },

    userStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '900', color: '#1a1a2e' },
    statLabel: { fontSize: 11, color: '#64748b', fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
    statDivider: { width: 1, height: 20, backgroundColor: '#f1f5f9' },

    loyaltLevelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 },
    pointsText: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 4 },

    sectionLabel: { fontSize: 12, fontWeight: '900', color: '#94a3b8', marginBottom: 12, marginLeft: 5, letterSpacing: 1 },
    sectionContainer: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 25, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20 },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    menuIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, color: '#1a1a2e', fontWeight: '800' },
    menuSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '600' },

    logoutAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, backgroundColor: COLORS.background, borderRadius: 20, gap: 10, marginTop: 10, borderWidth: 1, borderColor: COLORS.secondary },
    logoutActionText: { color: COLORS.primary, fontSize: 16, fontWeight: '900' },

    versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 25, fontWeight: '700' }
});
