import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Switch, Image, StatusBar, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from '../../store/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import { registerForPushNotificationsAsync } from '../../services/notificationService';


const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
    const dispatch = useDispatch();
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const user = useSelector(state => state.auth.user);
    
    // States matching mockup preferences
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);

    // Profile details fallbacks
    const profileName = user?.name || 'Alex Rivera';
    const profileEmail = user?.email || 'alex.rivera@university.edu';
    const profileAvatar = user?.avatarUrl || null;

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out of Laro?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('userToken');
                            await AsyncStorage.removeItem('userData');
                            dispatch(signOut());
                        } catch (e) {
                            console.log('Logout failed:', e.message);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account?",
            "Are you absolutely sure? This will permanently remove your account data. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Permanently",
                    style: "destructive",
                    onPress: confirmDeleteAccount
                }
            ]
        );
    };

    const confirmDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await authAPI.deleteAccount();
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            dispatch(signOut());
        } catch (error) {
            console.error('[Settings] Delete account failed:', error);
            Alert.alert("Error", "Could not delete account. Please try again later.");
        } finally {
            setIsDeleting(false);
        }
    };

    const SettingItem = ({ icon, title, valueText, isSwitch, switchValue, onSwitchChange, onPress }) => (
        <TouchableOpacity 
            style={styles.settingItem} 
            onPress={isSwitch ? undefined : onPress} 
            activeOpacity={isSwitch ? 1 : 0.7}
        >
            <View style={styles.itemLeftRow}>
                <Ionicons name={icon} size={20} color="#555" style={styles.itemIcon} />
                <Text style={styles.itemTitle}>{title}</Text>
            </View>

            {isSwitch ? (
                <Switch
                    trackColor={{ false: '#c1ccc1', true: '#056f36' }}
                    thumbColor="#fff"
                    onValueChange={onSwitchChange}
                    value={switchValue}
                />
            ) : (
                <View style={styles.itemRightRow}>
                    {valueText && <Text style={styles.itemValueText}>{valueText}</Text>}
                    <Ionicons name="chevron-forward" size={18} color="#aaa" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#f2f7f2' }]} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Laro</Text>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={24} color="#056f36" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile header block */}
                <View style={styles.profileContainer}>
                    <View style={styles.avatarWrapper}>
                        {profileAvatar ? (
                            <Image source={{ uri: profileAvatar }} style={styles.avatarImg} />
                        ) : (
                            <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={48} color="#056f36" />
                            </View>
                        )}
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Ionicons name="pencil" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>{profileName}</Text>
                    <Text style={styles.profileEmail}>{profileEmail}</Text>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeaderTitle}>ACCOUNT</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem 
                            icon="person-outline" 
                            title="Edit Profile" 
                            onPress={() => Alert.alert('Edit Profile', 'Profile editing features are synced with your University database.')}
                        />
                        <View style={styles.divider} />
                        <SettingItem 
                            icon="lock-closed-outline" 
                            title="Change Password" 
                            onPress={() => Alert.alert('Change Password', 'Security options can be managed in your university portals.')}
                        />
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeaderTitle}>PREFERENCES</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem 
                            icon="moon-outline" 
                            title="Dark Mode" 
                            isSwitch={true}
                            switchValue={isDarkMode}
                            onSwitchChange={toggleTheme}
                        />
                        <View style={styles.divider} />
                        <SettingItem 
                            icon="notifications-outline" 
                            title="Notifications" 
                            isSwitch={true}
                            switchValue={notificationsEnabled}
                            onSwitchChange={async (val) => {
                                setNotificationsEnabled(val);
                                if (val) {
                                    const token = await registerForPushNotificationsAsync();
                                    if (token) {
                                        Alert.alert('Notifications Enabled', 'You will now receive real-time campus deals and order updates!');
                                    }
                                }
                            }}
                        />

                        <View style={styles.divider} />
                        <SettingItem 
                            icon="globe-outline" 
                            title="Language" 
                            valueText="English (US)"
                            onPress={() => Alert.alert('Language', 'English is configured by default for Campus Edition.')}
                        />
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeaderTitle}>SECURITY</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem 
                            icon="shield-checkmark-outline" 
                            title="Two-Factor Authentication" 
                            onPress={() => Alert.alert('MFA', 'Two-Factor Authentication is managed by your university authentication provider.')}
                        />
                    </View>
                </View>

                {/* Danger zone / delete account */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeaderTitle, { color: '#ef4444' }]}>DANGER ZONE</Text>
                    <View style={[styles.sectionCard, styles.dangerBorder]}>
                        <SettingItem 
                            icon="trash-outline" 
                            title="Delete Account" 
                            onPress={handleDeleteAccount}
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="exit-outline" size={20} color="#b91c1c" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>

                {/* Version Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerVersionText}>Version 2.4.1 (Campus Edition)</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#f2f7f2'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: '950', color: '#056f36', textAlign: 'center', flex: 1 },
    notificationButton: { padding: 4 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },

    profileContainer: {
        alignItems: 'center',
        marginVertical: 20
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 14
    },
    avatarImg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#27c96c'
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#056f36',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    profileName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111'
    },
    profileEmail: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        fontWeight: '600'
    },

    section: {
        marginBottom: 20
    },
    sectionHeaderTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4
    },
    sectionCard: {
        backgroundColor: '#edf2ed',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d0dcd0',
        paddingHorizontal: 16,
        paddingVertical: 4
    },
    dangerBorder: {
        borderColor: '#fee2e2',
        backgroundColor: '#fff1f1'
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14
    },
    itemLeftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    itemIcon: {
        marginRight: 12,
        opacity: 0.8
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#222'
    },
    itemRightRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    itemValueText: {
        fontSize: 13,
        color: '#666',
        marginRight: 6,
        fontWeight: '600'
    },
    divider: {
        height: 1,
        backgroundColor: '#d0dcd0'
    },

    logoutBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff1f1',
        borderWidth: 1.5,
        borderColor: '#fca5a5',
        borderRadius: 18,
        height: 52,
        marginTop: 10,
        marginBottom: 25
    },
    logoutBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#b91c1c'
    },

    footerContainer: {
        alignItems: 'center'
    },
    footerVersionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888'
    },
    avatarPlaceholder: {
        backgroundColor: '#edf5ed',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
