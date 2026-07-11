import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, Dimensions,
    TouchableOpacity, Animated, StatusBar, Image, ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../theme';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const insets = useSafeAreaInsets();

    const goToNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < 2) {
            setCurrentIndex(currentIndex + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = async () => {
        await AsyncStorage.setItem('laro_onboarded', 'true');
        navigation.replace('Login');
    };

    // SLIDE 1: Welcome to Laro (Landing Welcome Card)
    const renderSlide1 = () => (
        <View style={styles.slideContainer}>
            {/* Campus Background Image */}
            <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1000&q=80' }} 
                style={StyleSheet.absoluteFillObject} 
            />
            {/* Dark overlay for readability */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />

            {/* Top Close circular button */}
            <TouchableOpacity 
                style={[styles.closeFloatBtn, { top: insets.top + 10, left: 20 }]}
                onPress={handleFinish}
            >
                <Ionicons name="close" size={20} color="#056f36" />
            </TouchableOpacity>

            {/* Bottom Card */}
            <View style={[styles.welcomeCard, { paddingBottom: insets.bottom + 24 }]}>
                <Text style={styles.welcomeTitle}>
                    Welcome to <Text style={{ color: '#056f36' }}>Laro</Text>
                </Text>
                
                <Text style={styles.welcomeSubtitle}>
                    Hyperlocal campus delivery at your fingertips. From dorm room snacks to late-night library fuel.
                </Text>

                <TouchableOpacity style={styles.welcomeCtaBtn} onPress={goToNext}>
                    <Text style={styles.welcomeCtaText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <View style={styles.verifiedRow}>
                    <Ionicons name="shield-checkmark" size={14} color="#777" style={{ marginRight: 6 }} />
                    <Text style={styles.verifiedText}>Trusted by 50+ Universities Nationwide</Text>
                </View>
            </View>
        </View>
    );

    // SLIDE 2: Your Campus, Delivered (Onboarding Slide with Badges & Clocktower)
    const renderSlide2 = () => (
        <View style={styles.lightSlideContainer}>
            {/* Header Laro Logo and Skip */}
            <View style={[styles.slideHeader, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.laroLogo}>Laro</Text>
                <TouchableOpacity onPress={handleFinish}>
                    <Text style={styles.skipText}>SKIP</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.slideScrollContent} showsVerticalScrollIndicator={false}>
                {/* Clocktower Illustration Circle Container */}
                <View style={styles.illustrationCircleWrapper}>
                    <View style={styles.circleGraphicContainer}>
                        <Image 
                            source={{ uri: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80' }} 
                            style={styles.circleImage} 
                        />
                        {/* Overlay elements representing clocktower / delivery */}
                        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5, 111, 54, 0.05)' }]} />
                    </View>

                    {/* Floating Badges */}
                    <View style={[styles.floatingBadgeCard, { top: 0, right: -10 }]}>
                        <View style={[styles.badgeIconCircle, { backgroundColor: '#e6f4ea' }]}>
                            <Ionicons name="cafe" size={14} color="#27c96c" />
                        </View>
                        <Text style={styles.badgeLabel}>Latte Ready</Text>
                    </View>

                    <View style={[styles.floatingBadgeCard, { bottom: 30, left: -20 }]}>
                        <View style={[styles.badgeIconCircle, { backgroundColor: '#fce8e6' }]}>
                            <Ionicons name="book" size={14} color="#ea4335" />
                        </View>
                        <Text style={styles.badgeLabel}>Book</Text>
                    </View>
                </View>

                {/* Onboarding text content */}
                <Text style={styles.slideTitle}>Your Campus,{'\n'}Delivered.</Text>
                <Text style={styles.slideSubtitle}>
                    Order from your favorite campus cafes, bookstores, and supply shops.
                </Text>

                {/* Categories Row */}
                <View style={styles.categoriesRow}>
                    <View style={[styles.categoryPill, { backgroundColor: '#d8e5d8' }]}>
                        <Ionicons name="cafe-outline" size={14} color="#056f36" style={{ marginRight: 4 }} />
                        <Text style={styles.categoryText}>Cafes</Text>
                    </View>

                    <View style={[styles.categoryPill, { backgroundColor: '#d8e5d8' }]}>
                        <Ionicons name="book-outline" size={14} color="#056f36" style={{ marginRight: 4 }} />
                        <Text style={styles.categoryText}>Books</Text>
                    </View>

                    <View style={[styles.categoryPill, { backgroundColor: '#faefe6' }]}>
                        <Ionicons name="create-outline" size={14} color="#e07a2c" style={{ marginRight: 4 }} />
                        <Text style={[styles.categoryText, { color: '#e07a2c' }]}>Supplies</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions sticky area */}
            <View style={[styles.bottomActionsArea, { paddingBottom: insets.bottom + 20 }]}>
                {/* Dots row */}
                <View style={styles.dotsRow}>
                    <View style={styles.dot} />
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                </View>

                <TouchableOpacity style={styles.slideNextBtn} onPress={goToNext}>
                    <Text style={styles.slideNextText}>Next</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </View>
    );

    // SLIDE 3: By Students, For Students (Rider Intro slide)
    const renderSlide3 = () => (
        <View style={styles.lightSlideContainer}>
            {/* Header */}
            <View style={[styles.slideHeader, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.laroLogo}>Laro</Text>
                <TouchableOpacity onPress={handleFinish}>
                    <Text style={styles.skipText}>SKIP</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.slideScrollContent} showsVerticalScrollIndicator={false}>
                {/* Rider cycle Illustration circle */}
                <View style={styles.illustrationCircleWrapper}>
                    <View style={styles.circleGraphicContainer}>
                        <Image 
                            source={{ uri: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80' }} 
                            style={styles.circleImage} 
                        />
                        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(39, 201, 108, 0.05)' }]} />
                    </View>

                    {/* Floating Badges */}
                    <View style={[styles.floatingBadgeCard, { top: 0, right: -10, paddingRight: 14 }]}>
                        <View style={[styles.badgeIconCircle, { backgroundColor: '#e6f4ea' }]}>
                            <Ionicons name="bicycle" size={14} color="#056f36" />
                        </View>
                        <View>
                            <Text style={[styles.badgeLabel, { fontSize: 8, color: '#888' }]}>Active Riders</Text>
                            <Text style={[styles.badgeLabel, { fontSize: 13, fontWeight: '950', marginTop: 1 }]}>124</Text>
                        </View>
                    </View>

                    <View style={[styles.floatingBadgeCard, { bottom: 30, left: -20 }]}>
                        <View style={[styles.badgeIconCircle, { backgroundColor: '#fef7e0' }]}>
                            <Ionicons name="star" size={14} color="#f4b400" />
                        </View>
                        <View>
                            <Text style={[styles.badgeLabel, { fontSize: 8, color: '#888' }]}>Top Rated</Text>
                            <Text style={[styles.badgeLabel, { fontSize: 13, fontWeight: '950', marginTop: 1 }]}>4.9/5</Text>
                        </View>
                    </View>
                </View>

                {/* Texts */}
                <Text style={styles.slideTitle}>By Students,{'\n'}For Students.</Text>
                <Text style={styles.slideSubtitle}>
                    Our deliveries are handled by student riders who know the campus best.
                </Text>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomActionsArea, { paddingBottom: insets.bottom + 15 }]}>
                {/* Dots row */}
                <View style={styles.dotsRow}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={[styles.dot, styles.dotActive]} />
                </View>

                <TouchableOpacity style={styles.slideNextBtn} onPress={handleFinish}>
                    <Text style={styles.slideNextText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {/* Fleet Link */}
                <TouchableOpacity style={{ marginTop: 12 }} onPress={handleFinish}>
                    <Text style={styles.fleetLinkText}>Want to join the fleet? Learn more</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle={currentIndex === 0 ? "light-content" : "dark-content"} />
            {currentIndex === 0 && renderSlide1()}
            {currentIndex === 1 && renderSlide2()}
            {currentIndex === 2 && renderSlide3()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' },
    slideContainer: { flex: 1, width, height, position: 'relative' },
    
    // Slide 1 Welcome styling
    closeFloatBtn: {
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        zIndex: 10
    },
    welcomeCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 24,
        alignItems: 'center'
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '950',
        color: '#111',
        marginBottom: 10
    },
    welcomeSubtitle: {
        fontSize: 13,
        color: '#555',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '650',
        marginBottom: 25,
        paddingHorizontal: 15
    },
    welcomeCtaBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 52,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20
    },
    welcomeCtaText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '850'
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    verifiedText: {
        fontSize: 11,
        color: '#777',
        fontWeight: '700'
    },

    // Slide 2 & 3 light layout styling
    lightSlideContainer: {
        flex: 1,
        backgroundColor: '#f2f7f2',
        paddingHorizontal: 24
    },
    slideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f2f7f2',
        marginBottom: 15
    },
    laroLogo: {
        fontSize: 24,
        fontWeight: '950',
        color: '#056f36',
        letterSpacing: -0.5
    },
    skipText: {
        fontSize: 12,
        fontWeight: '850',
        color: '#777',
        letterSpacing: 0.5
    },

    slideScrollContent: {
        alignItems: 'center',
        paddingTop: 10
    },

    illustrationCircleWrapper: {
        position: 'relative',
        width: 250,
        height: 250,
        marginBottom: 40,
        marginTop: 20
    },
    circleGraphicContainer: {
        width: 250,
        height: 250,
        borderRadius: 125,
        borderWidth: 2,
        borderColor: '#e6ede6',
        borderStyle: 'dashed',
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center'
    },
    circleImage: {
        width: '100%',
        height: '100%',
        borderRadius: 120,
        resizeMode: 'cover'
    },

    floatingBadgeCard: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 4
    },
    badgeIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6
    },
    badgeLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#111'
    },

    slideTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111',
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 12
    },
    slideSubtitle: {
        fontSize: 13,
        color: '#555',
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '650',
        paddingHorizontal: 20
    },

    // Slide 2 categories
    categoriesRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 20,
        marginBottom: 40
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    categoryText: {
        fontSize: 11,
        color: '#056f36',
        fontWeight: '850'
    },

    // Bottom Sticky Actions
    bottomActionsArea: {
        backgroundColor: '#f2f7f2',
        alignItems: 'center',
        paddingTop: 10
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        marginBottom: 18
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#bbb'
    },
    dotActive: {
        width: 24,
        backgroundColor: '#056f36'
    },
    slideNextBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 52,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    slideNextText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '850'
    },
    fleetLinkText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
        textDecorationLine: 'underline'
    }
});
