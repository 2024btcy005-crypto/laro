import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, Animated, Dimensions,
    TouchableOpacity, Platform, StatusBar, Image, PanResponder, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;
const DRAWER_HEIGHT = 380;
const CLOSED_DRAWER_OFFSET = 45; // Only show a tiny hint of the handle
const HAS_NOTCH = height >= 812; // Check for notch devices

export default function LaroScannerOverlay({ 
    onScannerClose, 
    isTorchOn, 
    onTorchToggle,
    recentRecipients = [],
    currentBalance = 0,
    userPhone = '',
    onRecipientPress
}) {
    const [showMyQR, setShowMyQR] = useState(false);
    
    // Drawer Animation State
    const drawerY = useRef(new Animated.Value(DRAWER_HEIGHT - CLOSED_DRAWER_OFFSET)).current;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // PanResponder for Drawer
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
            onPanResponderMove: (_, gesture) => {
                const newValue = isDrawerOpen 
                    ? Math.max(0, gesture.dy) 
                    : Math.max(0, (DRAWER_HEIGHT - CLOSED_DRAWER_OFFSET) + gesture.dy);
                drawerY.setValue(newValue);
            },
            onPanResponderRelease: (_, gesture) => {
                const threshold = DRAWER_HEIGHT / 4;
                if (isDrawerOpen) {
                    if (gesture.dy > threshold) {
                        closeDrawer();
                    } else {
                        openDrawer();
                    }
                } else {
                    if (gesture.dy < -threshold) {
                        openDrawer();
                    } else {
                        closeDrawer();
                    }
                }
            },
        })
    ).current;

    const openDrawer = () => {
        setIsDrawerOpen(true);
        Animated.spring(drawerY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
        }).start();
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        Animated.spring(drawerY, {
            toValue: DRAWER_HEIGHT - CLOSED_DRAWER_OFFSET,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
        }).start();
    };

    const qrUrl = userPhone
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${userPhone}&color=1a1a1a&bgcolor=ffffff&margin=10`
        : null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Zen Header Controls (Floating) */}
            <View style={styles.topControls}>
                <TouchableOpacity style={styles.ghostCircle} onPress={onScannerClose} activeOpacity={0.7}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostCircle} onPress={onTorchToggle} activeOpacity={0.7}>
                    <MaterialCommunityIcons 
                        name={isTorchOn ? "flashlight" : "flashlight-off"} 
                        size={22} 
                        color={isTorchOn ? "#4ade80" : "#fff"} 
                    />
                </TouchableOpacity>
            </View>

            {/* Zen Central Focus */}
            <View style={styles.centerContainer}>
                <View style={styles.maskArea}>
                    <View style={styles.scanFrame}>
                        <View style={styles.hairline} />
                        <View style={styles.guideTextContainer}>
                            <Text style={styles.guideText}>Place QR code within frame</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Zen Bottom Drawer */}
            <Animated.View 
                style={[styles.drawer, { transform: [{ translateY: drawerY }] }]}
                {...panResponder.panHandlers}
            >
                <BlurView intensity={80} tint="dark" style={styles.drawerBlur}>
                    {/* Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                        {!isDrawerOpen && (
                            <Text style={styles.handleLabel}>SWIPE UP FOR DASHBOARD</Text>
                        )}
                    </View>

                    {/* Drawer Content */}
                    <View style={styles.drawerContent}>
                        {/* Balance Section */}
                        <View style={styles.drawerBalance}>
                            <Text style={styles.balanceHeader}>AVAILABLE Ł BALANCE</Text>
                            <Text style={styles.balanceAmount}>{currentBalance.toLocaleString()}</Text>
                        </View>

                        {/* Recents Section */}
                        <View style={styles.recentsSection}>
                            <Text style={styles.sectionTitle}>QUICK PAY</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentsList}>
                                {recentRecipients.length > 0 ? (
                                    recentRecipients.map((item) => (
                                        <TouchableOpacity 
                                            key={item.id} 
                                            style={styles.recentItem}
                                            onPress={() => onRecipientPress?.(item)}
                                        >
                                            <View style={styles.avatar}>
                                                <Text style={styles.initial}>{item.name.charAt(0)}</Text>
                                            </View>
                                            <Text style={styles.name}>{item.name.split(' ')[0]}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noRecents}>
                                        <Text style={styles.noRecentsText}>No recent history found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>

                        {/* Bottom Action */}
                        <TouchableOpacity style={styles.myQrBtn} onPress={() => setShowMyQR(true)}>
                            <MaterialCommunityIcons name="qrcode" size={20} color="#fff" />
                            <Text style={styles.myQrBtnText}>MY RECEIVE QR</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Animated.View>

            {/* My QR Zen Modal */}
            {showMyQR && (
                <View style={[StyleSheet.absoluteFill, styles.qrOverlay]}>
                    <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />
                    <TouchableOpacity style={styles.qrCloseArea} onPress={() => setShowMyQR(false)} />
                    <View style={styles.qrModal}>
                        <View style={styles.qrTop}>
                            <Text style={styles.qrTitle}>My Receiving QR</Text>
                            <TouchableOpacity onPress={() => setShowMyQR(false)}>
                                <Ionicons name="close-circle" size={28} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.qrPlaceholder}>
                            {qrUrl && <Image source={{ uri: qrUrl }} style={{ width: 220, height: 220 }} resizeMode="contain" />}
                        </View>
                        <Text style={styles.qrPhone}>+91 {userPhone}</Text>
                        <Text style={styles.qrDesc}>Show this to any Laro user to receive coins instantly.</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    
    topControls: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        zIndex: 100,
    },
    ghostCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    maskArea: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    scanFrame: {
        width: SCAN_SIZE,
        height: SCAN_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hairline: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 0.5,
        borderColor: '#fff',
        borderRadius: 2,
    },
    guideTextContainer: {
        position: 'absolute',
        bottom: -40,
    },
    guideText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },

    drawer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: DRAWER_HEIGHT,
        zIndex: 200,
    },
    drawerBlur: {
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    handleContainer: {
        height: CLOSED_DRAWER_OFFSET,
        alignItems: 'center',
        paddingTop: 10,
    },
    handle: {
        width: 45,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginBottom: 10,
    },
    handleLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    drawerContent: {
        paddingHorizontal: 25,
        paddingBottom: HAS_NOTCH ? 55 : 35, // Extra space for home bar & breathing room
    },
    drawerBalance: {
        marginBottom: 25,
    },
    balanceHeader: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    recentsSection: {
        marginBottom: 25,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 15,
    },
    recentsList: {
        gap: 20,
    },
    recentItem: {
        alignItems: 'center',
        width: 60,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    initial: { color: '#fff', fontWeight: 'bold' },
    name: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
    noRecents: { height: 50, justifyContent: 'center' },
    noRecentsText: { color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', fontSize: 12 },

    myQrBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10,
    },
    myQrBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    },

    qrOverlay: { alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    qrCloseArea: { ...StyleSheet.absoluteFillObject },
    qrModal: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
    },
    qrTop: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
    qrTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
    qrPlaceholder: { padding: 15, backgroundColor: '#f8fafc', borderRadius: 24, marginBottom: 20 },
    qrPhone: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginBottom: 6 },
    qrDesc: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
