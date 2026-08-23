import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

let NotificationsModule = null;
try {
    NotificationsModule = require('expo-notifications');
} catch (e) {}

/**
 * Request standard Android POST_NOTIFICATIONS permission
 */
export const requestNotificationPermissionsAsync = async () => {
    if (!NotificationsModule) return false;
    try {
        const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await NotificationsModule.requestPermissionsAsync({
                ios: { allowAlert: true, allowBadge: true, allowSound: true },
                android: {},
            });
            finalStatus = status;
        }
        return finalStatus === 'granted';
    } catch (err) {
        console.warn('[LiveStatusPermissions] Permission request error:', err.message);
        return false;
    }
};

export default function LiveStatusPermissionModal({ visible, onClose }) {
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        if (visible) {
            checkPermissions();
        }
    }, [visible]);

    const checkPermissions = async () => {
        const granted = await requestNotificationPermissionsAsync();
        setPermissionGranted(granted);
    };

    const handleOpenSettings = async () => {
        try {
            await Linking.openSettings();
        } catch (e) {
            console.warn('Could not open settings', e);
        }
        onClose();
    };

    const handleRequestAgain = async () => {
        const granted = await requestNotificationPermissionsAsync();
        if (granted) {
            setPermissionGranted(true);
            onClose();
        } else {
            handleOpenSettings();
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header Icon */}
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="lightning-bolt-circle" size={44} color="#056f36" />
                    </View>

                    <Text style={styles.modalTitle}>Live Delivery Status</Text>
                    <Text style={styles.modalSubTitle}>
                        Track your order in real-time on your status bar, lockscreen & dynamic status notch!
                    </Text>

                    {/* Features Bullet Points */}
                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#056f36" style={{ marginRight: 10 }} />
                            <Text style={styles.featureText}>Live Status Pill & Progress Bar</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#056f36" style={{ marginRight: 10 }} />
                            <Text style={styles.featureText}>Xiaomi HyperIsland & OEM Live Alerts</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#056f36" style={{ marginRight: 10 }} />
                            <Text style={styles.featureText}>Real-Time Driver ETA & Arrival Updates</Text>
                        </View>
                    </View>

                    {/* OEM System Settings Note for Android */}
                    {Platform.OS === 'android' && (
                        <View style={styles.oemNoteBox}>
                            <Ionicons name="information-circle" size={18} color="#0284c7" style={{ marginRight: 8 }} />
                            <Text style={styles.oemNoteText}>
                                For Xiaomi/Redmi/Samsung devices: Ensure <Text style={{ fontWeight: '800' }}>Floating Notifications</Text> and <Text style={{ fontWeight: '800' }}>Lock screen status</Text> are enabled in Settings.
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleRequestAgain}
                        activeOpacity={0.9}
                    >
                        <MaterialCommunityIcons name="shield-check" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryBtnText}>
                            {permissionGranted ? 'Open System Permissions Settings' : 'Allow Live Status Permissions'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.secondaryBtnText}>Got It, Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justify: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justify: 'center',
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#bbf7d0',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    modalSubTitle: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 18,
        paddingHorizontal: 10,
    },
    featuresList: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#334155',
    },
    oemNoteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#bae6fd',
        marginBottom: 20,
    },
    oemNoteText: {
        flex: 1,
        fontSize: 12,
        color: '#0369a1',
        lineHeight: 16,
    },
    primaryBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justify: 'center',
        backgroundColor: '#056f36',
        paddingVertical: 15,
        borderRadius: 22,
        marginBottom: 10,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '900',
    },
    secondaryBtn: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '800',
    },
});
