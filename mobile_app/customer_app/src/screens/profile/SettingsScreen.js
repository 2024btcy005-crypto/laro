import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { signOut } from '../../store/authSlice';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
    const dispatch = useDispatch();
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [marketingEnabled, setMarketingEnabled] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account?",
            "Are you absolutely sure? This will permanently remove your order history, wallet balance, and favorite shops. This action cannot be undone.",
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
            // Auth state change will handle navigation to Login
        } catch (error) {
            console.error('[Settings] Delete account failed:', error);
            Alert.alert("Error", "Could not delete account. Please try again later.");
        } finally {
            setIsDeleting(false);
        }
    };

    const renderSettingRow = (title, subtitle, value, onValueChange) => (
        <View style={[styles.settingRow, { backgroundColor: colors.white }]}>
            <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.black }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: colors.gray }]}>{subtitle}</Text>}
            </View>
            <Switch
                trackColor={{ false: '#d1d1d1', true: colors.primary }}
                thumbColor="#fff"
                onValueChange={onValueChange}
                value={value}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={26} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.gray }]}>APPEARANCE</Text>
                <View style={[styles.sectionCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    {renderSettingRow('Dark Mode', 'Enjoy a premium dark interface', isDarkMode, toggleTheme)}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.gray }]}>NOTIFICATIONS</Text>
                <View style={[styles.sectionCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    {renderSettingRow('Order Updates', 'Get texts and push notifications about your orders', notificationsEnabled, setNotificationsEnabled)}
                    <View style={[styles.divider, { backgroundColor: colors.lightGray }]} />
                    {renderSettingRow('Offers and Deals', 'Receive promotional emails and messages', marketingEnabled, setMarketingEnabled)}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: '#ef4444' }]}>DANGER ZONE</Text>
                <View style={[styles.sectionCard, styles.dangerCard]}>
                    <TouchableOpacity
                        style={styles.settingRow}
                        onPress={handleDeleteAccount}
                        disabled={isDeleting}
                    >
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingTitle, { color: '#b91c1c' }]}>Delete Account</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.gray }]}>Permanently remove all your data</Text>
                        </View>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },

    section: { padding: 15, marginTop: 10 },
    sectionHeader: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, letterSpacing: 0.5 },
    sectionCard: { borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, borderWidth: 1 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    settingTextContainer: { flex: 1, paddingRight: 15 },
    settingTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
    settingSubtitle: { fontSize: 13 },
    divider: { height: 1, marginHorizontal: 16 },
    dangerCard: { borderColor: '#fee2e2', borderWidth: 1 }
});
