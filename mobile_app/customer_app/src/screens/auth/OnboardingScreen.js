import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Dimensions,
    TouchableOpacity, Animated, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        bg: '#0f0f1a',
        accentBg: '#1e1b4b',
        accent: '#818cf8',
        icon: 'bicycle',
        iconLib: 'MaterialCommunity',
        title: 'Welcome to Laro',
        subtitle: 'Fast, reliable delivery right to your doorstep — from shops you love, in minutes.',
        badge: '🛵  Delivery at your command',
    },
    {
        id: '2',
        bg: '#0d1f0d',
        accentBg: '#14532d',
        accent: '#4ade80',
        icon: 'wallet-outline',
        iconLib: 'MaterialCommunity',
        title: 'Earn Laro Coins',
        subtitle: 'Spend ₹20 and earn 1 Ł. Watch your wallet grow with every single order.',
        badge: '💰  1 Ł per ₹20 spent',
    },
    {
        id: '3',
        bg: '#1a0e00',
        accentBg: '#451a03',
        accent: '#fb923c',
        icon: 'trophy-outline',
        iconLib: 'MaterialCommunity',
        title: 'Climb the Ranks',
        subtitle: 'From Learner to Legend — unlock exclusive discounts, perks, and gold status.',
        badge: '🏆  Learner → Explorer → Champion → Legend',
    },
];

export default function OnboardingScreen({ navigation }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const goToNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleFinish();
        }
    };

    const handleFinish = async () => {
        await AsyncStorage.setItem('laro_onboarded', 'true');
        navigation.replace('Login');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const slide = SLIDES[currentIndex];

    const renderSlide = ({ item }) => (
        <View style={[styles.slide, { width }]}>
            {/* Background Glow Orb */}
            <View style={[styles.glowOrb, { backgroundColor: item.accentBg }]} />
            <View style={[styles.glowOrb2, { backgroundColor: item.accentBg }]} />

            {/* Icon Circle */}
            <View style={[styles.iconCircleOuter, { borderColor: item.accent + '33' }]}>
                <View style={[styles.iconCircleInner, { backgroundColor: item.accentBg }]}>
                    <MaterialCommunityIcons name={item.icon} size={64} color={item.accent} />
                </View>
            </View>

            {/* Badge Pill */}
            <View style={[styles.badge, { borderColor: item.accent + '44', backgroundColor: item.accent + '18' }]}>
                <Text style={[styles.badgeText, { color: item.accent }]}>{item.badge}</Text>
            </View>

            {/* Text Content */}
            <View style={styles.textBlock}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
        </View>
    );

    // Dot indicators
    const renderDots = () => (
        <View style={styles.dotsRow}>
            {SLIDES.map((s, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                });
                return (
                    <Animated.View
                        key={s.id}
                        style={[styles.dot, { width: dotWidth, opacity, backgroundColor: slide.accent }]}
                    />
                );
            })}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: slide.bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={slide.bg} />

            {/* Skip Button */}
            <SafeAreaView style={styles.topBar} edges={['top']}>
                <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
                    <Text style={styles.skipText}>Skip</Text>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                scrollEventThrottle={16}
            />

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
                {renderDots()}

                <TouchableOpacity
                    onPress={goToNext}
                    style={[styles.nextBtn, { backgroundColor: slide.accent }]}
                    activeOpacity={0.85}
                >
                    {currentIndex < SLIDES.length - 1 ? (
                        <>
                            <Text style={styles.nextBtnText}>Next</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </>
                    ) : (
                        <>
                            <Text style={styles.nextBtnText}>Get Started</Text>
                            <Ionicons name="rocket-outline" size={18} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.legalText}>By continuing, you agree to Laro's Terms & Privacy Policy</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    skipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    skipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },

    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingTop: 100,
        paddingBottom: 220,
    },
    glowOrb: {
        position: 'absolute',
        top: -80,
        right: -80,
        width: 280,
        height: 280,
        borderRadius: 140,
        opacity: 0.6,
    },
    glowOrb2: {
        position: 'absolute',
        bottom: 100,
        left: -100,
        width: 220,
        height: 220,
        borderRadius: 110,
        opacity: 0.4,
    },
    iconCircleOuter: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    iconCircleInner: {
        width: 150,
        height: 150,
        borderRadius: 75,
        alignItems: 'center',
        justifyContent: 'center',
    },

    badge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
        borderWidth: 1,
        marginBottom: 28,
    },
    badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

    textBlock: { alignItems: 'center', gap: 12 },
    title: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.8, textAlign: 'center' },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, fontWeight: '500' },

    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
        gap: 20,
    },
    dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    dot: { height: 8, borderRadius: 4 },

    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 50,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    legalText: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '500',
        paddingHorizontal: 20,
    },
});
