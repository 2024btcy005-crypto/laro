import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, ScrollView, Alert, StatusBar, Linking, Switch,
    Modal, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/api';
import { COLORS } from '../theme';
import LaroAlert from '../components/LaroAlert';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const [partner, setPartner] = useState(null);
    const [stats, setStats] = useState({
        earnings: 0,
        rating: 5.0,
        acceptanceRate: 100,
        completedCount: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [alertVisible, setAlertVisible] = useState(false);

    useEffect(() => {
        loadPartnerData();
        fetchStats();
    }, []);

    const loadPartnerData = async () => {
        try {
            const data = await AsyncStorage.getItem('deliveryPartner');
            if (data) {
                setPartner(JSON.parse(data));
            }
        } catch (error) {
            console.error('Failed to load partner data', error);
        }
    };

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const response = await api.get('/delivery/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch delivery stats', error.response?.data || error.message);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleLogout = () => {
        setAlertVisible(true);
    };

    const confirmLogout = async () => {
        setAlertVisible(false);
        await AsyncStorage.multiRemove(['deliveryToken', 'deliveryPartner']);
        navigation.replace('Login');
    };

    const [universities, setUniversities] = useState([]);
    const [showUniModal, setShowUniModal] = useState(false);
    const [fetchingUni, setFetchingUni] = useState(false);
    const [updatingUni, setUpdatingUni] = useState(false);

    const checkAndFetchUniversities = async () => {
        if (universities.length === 0) {
            setFetchingUni(true);
            try {
                const response = await api.get('/universities');
                setUniversities(response.data);
            } catch (error) {
                console.error('Failed to fetch universities', error);
            } finally {
                setFetchingUni(false);
            }
        }
        setShowUniModal(true);
    };

    const changeUniversity = async (uniId) => {
        setUpdatingUni(true);
        try {
            await api.put('/delivery/profile', { universityId: uniId });
            const updatedPartner = { ...partner, universityId: uniId };
            setPartner(updatedPartner);
            await AsyncStorage.setItem('deliveryPartner', JSON.stringify(updatedPartner));
            setShowUniModal(false);
            Alert.alert('Success', 'University context updated. Pull to refresh home feed.');
        } catch (error) {
            Alert.alert('Error', 'Failed to update university');
        } finally {
            setUpdatingUni(false);
        }
    };

    const StatCard = ({ label, value, icon, iconColor }) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: `${iconColor}15` }]}>
                <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    const MenuItem = ({ icon, label, onPress, color = colors.secondary, isLast = false, rightElement }) => (
        <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.lightGray }, isLast && { borderBottomWidth: 0 }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconBox, { backgroundColor: `${color}10` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.black }, color === '#f44336' && { color: '#f44336' }]}>{label}</Text>
            {rightElement || <Ionicons name="chevron-forward" size={18} color={colors.gray} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Premium Header */}
            <View style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerTop}>
                    <View style={styles.profileInfo}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarMain}>
                                <Text style={styles.avatarText}>
                                    {partner?.name?.charAt(0) || 'P'}
                                </Text>
                            </View>
                            <View style={styles.onlineStatus} />
                        </View>
                        <View style={styles.nameContainer}>
                            <Text style={styles.welcomeText}>Welcome back,</Text>
                            <Text style={styles.partnerName}>{partner?.name || 'Laro Partner'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.notificationBtn}>
                        <Ionicons name="notifications-outline" size={24} color="#fff" />
                        <View style={styles.notificationDot} />
                    </TouchableOpacity>
                </View>

                {/* Stats Dashboard */}
                <View style={styles.statsContainer}>
                    <StatCard
                        label="Completed"
                        value={loadingStats ? "..." : stats.completedCount}
                        icon="check-outline"
                        iconColor={colors.primary}
                    />
                    <StatCard
                        label="Rating"
                        value={loadingStats ? "..." : stats.rating.toFixed(1)}
                        icon="star-outline"
                        iconColor="#f59e0b"
                    />
                    <StatCard
                        label="Acceptance"
                        value={loadingStats ? "..." : `${stats.acceptanceRate}%`}
                        icon="check-decagram-outline"
                        iconColor="#10b981"
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT OVERVIEW</Text>
                    <View style={styles.card}>
                        <MenuItem
                            icon="person-outline"
                            label="Personal Details"
                            onPress={() => navigation.navigate('ProfileDetail', { title: 'Personal Details', type: 'personal' })}
                        />
                        <MenuItem
                            icon="time-outline"
                            label="Delivery History"
                            onPress={() => navigation.navigate('DeliveryHistory')}
                        />
                        <MenuItem
                            icon="briefcase-outline"
                            label="Work Preferences"
                            onPress={() => navigation.navigate('ProfileDetail', { title: 'Work Preferences', type: 'generic' })}
                        />
                        <MenuItem
                            icon="document-text-outline"
                            label="Documents & KYC"
                            onPress={() => navigation.navigate('ProfileDetail', { title: 'Documents & KYC', type: 'documents' })}
                            isLast
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PARTNER REWARDS</Text>
                    <View style={styles.card}>
                        <MenuItem
                            icon="gift-outline"
                            label="Incentives & Rewards"
                            onPress={() => navigation.navigate('ProfileDetail', { title: 'Rewards', type: 'generic' })}
                        />
                        <MenuItem
                            icon="card-outline"
                            label="Bank Account"
                            onPress={() => navigation.navigate('ProfileDetail', { title: 'Bank Account', type: 'generic' })}
                            isLast
                            rightElement={<Text style={styles.verifiedText}>Verified</Text>}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SUPPORT & SYSTEM</Text>
                    <View style={styles.card}>
                        <MenuItem
                            icon="help-buoy-outline"
                            label="Help Center"
                            onPress={() => navigation.navigate('ProfileDetail', { title: 'Help Center', type: 'generic' })}
                        />
                        <MenuItem
                            icon="document-text-outline"
                            label="Terms & Conditions"
                            onPress={() => Linking.openURL('https://laro.in/terms')}
                        />
                        <MenuItem
                            icon="shield-checkmark-outline"
                            label="Privacy Policy"
                            onPress={() => Linking.openURL('https://laro.in/privacy')}
                        />
                        <MenuItem
                            icon="information-circle-outline"
                            label="About Laro Delivery"
                            onPress={() => navigation.navigate('ProfileDetail', { title: 'About Us', type: 'generic' })}
                        />
                        <MenuItem
                            icon="moon-outline"
                            label="Dark Mode"
                            onPress={toggleTheme}
                            rightElement={
                                <Switch
                                    value={isDarkMode}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: '#d1d1d1', true: colors.primary }}
                                    thumbColor="#fff"
                                />
                            }
                        />
                        <MenuItem
                            icon="school-outline"
                            label="Change Campus/University"
                            onPress={checkAndFetchUniversities}
                        />
                        <MenuItem
                            icon="settings-outline"
                            label="Settings"
                            onPress={() => navigation.navigate('ProfileDetail', { title: 'Settings', type: 'generic' })}
                        />
                        <MenuItem
                            icon="log-out-outline"
                            label="Sign Out"
                            onPress={handleLogout}
                            color="#f44336"
                            isLast
                        />
                    </View>
                </View>

                <Text style={styles.versionText}>Version 1.0.4 (Premium)</Text>
            </ScrollView>

            <LaroAlert
                visible={alertVisible}
                title="Logout?"
                message="Are you sure you want to sign out of your Laro Partner account?"
                type="destructive"
                confirmText="Sign Out"
                onConfirm={confirmLogout}
                onCancel={() => setAlertVisible(false)}
            />

            <Modal visible={showUniModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select University</Text>
                        <Text style={styles.modalSubtitle}>Syncing your profile with a new campus will reload your orders.</Text>

                        {fetchingUni ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
                        ) : (
                            <ScrollView style={{ maxHeight: 300, width: '100%', marginTop: 10 }}>
                                {universities.map(uni => (
                                    <TouchableOpacity
                                        key={uni.id}
                                        style={[
                                            styles.uniOption,
                                            partner?.universityId === uni.id && styles.uniOptionSelected
                                        ]}
                                        onPress={() => changeUniversity(uni.id)}
                                        disabled={updatingUni}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialCommunityIcons
                                                name="school"
                                                size={24}
                                                color={partner?.universityId === uni.id ? COLORS.primary : "#666"}
                                                style={{ marginRight: 15 }}
                                            />
                                            <Text style={[
                                                styles.uniOptionText,
                                                partner?.universityId === uni.id && { color: COLORS.primary, fontWeight: 'bold' }
                                            ]}>
                                                {uni.name}
                                            </Text>
                                        </View>
                                        {partner?.universityId === uni.id && (
                                            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowUniModal(false)} disabled={updatingUni}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    headerGradient: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 20,
        paddingBottom: 80,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 15
    },
    avatarMain: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary
    },
    onlineStatus: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10b981',
        borderWidth: 3,
        borderColor: COLORS.secondary
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '600'
    },
    partnerName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900'
    },
    notificationBtn: {
        width: 45,
        height: 45,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        borderWidth: 1.5,
        borderColor: COLORS.secondary
    },

    statsContainer: {
        position: 'absolute',
        bottom: -40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b'
    },
    statLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '700',
        marginTop: 2
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40
    },
    section: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#94a3b8',
        marginBottom: 12,
        letterSpacing: 1.2,
        marginLeft: 5
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b'
    },
    verifiedText: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: 'bold',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#cbd5e1',
        fontWeight: '600',
        marginTop: 10
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a2e',
        marginBottom: 8
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 15
    },
    uniOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        marginBottom: 10,
        backgroundColor: '#fff'
    },
    uniOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`
    },
    uniOptionText: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500'
    },
    modalCancelBtn: {
        marginTop: 20,
        paddingVertical: 12,
        width: '100%',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        alignItems: 'center'
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#64748b'
    }
});

