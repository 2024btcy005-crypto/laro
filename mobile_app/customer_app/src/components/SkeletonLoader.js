import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export function SkeletonLoader({ width: customWidth, height: customHeight, borderRadius = 12, style }) {
    const opacityAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, {
                    toValue: 0.85,
                    duration: 750,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.3,
                    duration: 750,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [opacityAnim]);

    return (
        <Animated.View
            style={[
                styles.skeletonBox,
                {
                    width: customWidth || '100%',
                    height: customHeight || 20,
                    borderRadius,
                    opacity: opacityAnim,
                },
                style,
            ]}
        />
    );
}

export function HomeScreenSkeleton() {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { paddingTop: (insets?.top || 0) + 10 }]}>
            {/* Top Location Header */}
            <View style={styles.headerRow}>
                <View style={{ gap: 4 }}>
                    <SkeletonLoader width={65} height={10} borderRadius={4} />
                    <SkeletonLoader width={175} height={16} borderRadius={6} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <SkeletonLoader width={48} height={28} borderRadius={14} />
                    <SkeletonLoader width={36} height={36} borderRadius={18} />
                </View>
            </View>

            {/* Search Bar Placeholder */}
            <SkeletonLoader width="100%" height={44} borderRadius={14} style={{ marginVertical: 14 }} />

            {/* Horizontal Filter Chips Row Placeholder */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                <SkeletonLoader width={80} height={34} borderRadius={12} />
                <SkeletonLoader width={95} height={34} borderRadius={12} />
                <SkeletonLoader width={85} height={34} borderRadius={12} />
                <SkeletonLoader width={90} height={34} borderRadius={12} />
            </View>

            {/* Hero Banner Slider Placeholder */}
            <SkeletonLoader width="100%" height={150} borderRadius={18} style={{ marginBottom: 20 }} />

            {/* Outlet Feed Section Header & 2-Column Grid Cards Placeholder */}
            <View style={{ gap: 14 }}>
                <SkeletonLoader width={140} height={18} borderRadius={6} style={{ marginBottom: 4 }} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ width: '48.5%' }}>
                            <SkeletonLoader width="100%" height={125} borderRadius={16} />
                            <View style={{ marginTop: 8, gap: 5 }}>
                                <SkeletonLoader width="85%" height={14} borderRadius={5} />
                                <SkeletonLoader width="60%" height={12} borderRadius={4} />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                    <SkeletonLoader width={45} height={14} borderRadius={4} />
                                    <SkeletonLoader width={50} height={26} borderRadius={13} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

export function FoodStoreCardSkeleton() {
    return (
        <View style={styles.cardSkeletonContainer}>
            <SkeletonLoader width="100%" height={180} borderRadius={18} />
            <View style={{ marginTop: 10, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <SkeletonLoader width={180} height={18} borderRadius={6} />
                    <SkeletonLoader width={46} height={18} borderRadius={6} />
                </View>
                <SkeletonLoader width={240} height={14} borderRadius={6} />
            </View>
        </View>
    );
}

export function OrderCardSkeleton() {
    return (
        <View style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            gap: 12,
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonLoader width={150} height={18} borderRadius={6} />
                <SkeletonLoader width={84} height={24} borderRadius={12} />
            </View>
            <SkeletonLoader width={210} height={14} borderRadius={6} />
            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 2 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonLoader width={90} height={16} borderRadius={6} />
                <SkeletonLoader width={110} height={36} borderRadius={18} />
            </View>
        </View>
    );
}

export function ProfileScreenSkeleton() {
    return (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16, gap: 18 }}>
            {/* Top Hero Banner Skeleton */}
            <View style={{
                width: '100%',
                height: 140,
                borderRadius: 24,
                backgroundColor: '#056f36',
                opacity: 0.88,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
            }}>
                <SkeletonLoader width={64} height={64} borderRadius={32} />
                <View style={{ gap: 8 }}>
                    <SkeletonLoader width={130} height={18} borderRadius={6} />
                    <SkeletonLoader width={170} height={14} borderRadius={6} />
                    <SkeletonLoader width={110} height={22} borderRadius={11} />
                </View>
            </View>

            {/* Twin Stat Pod Cards Skeleton */}
            <View style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ flex: 1, height: 84, borderRadius: 18, backgroundColor: '#f0fdf4', padding: 14, gap: 8 }}>
                    <SkeletonLoader width={70} height={12} borderRadius={4} />
                    <SkeletonLoader width={50} height={22} borderRadius={6} />
                </View>
                <View style={{ flex: 1, height: 84, borderRadius: 18, backgroundColor: '#fffbeb', padding: 14, gap: 8 }}>
                    <SkeletonLoader width={70} height={12} borderRadius={4} />
                    <SkeletonLoader width={60} height={22} borderRadius={6} />
                </View>
            </View>

            {/* Navigation Menu Skeleton Items */}
            <View style={{ gap: 10, marginTop: 6 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: 52,
                        paddingHorizontal: 16,
                        borderRadius: 16,
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <SkeletonLoader width={22} height={22} borderRadius={11} />
                            <SkeletonLoader width={140} height={14} borderRadius={6} />
                        </View>
                        <SkeletonLoader width={16} height={16} borderRadius={8} />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    skeletonBox: {
        backgroundColor: '#e2e8f0',
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoriesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    cardSkeletonContainer: {
        width: '100%',
        marginBottom: 16,
    },
});

export default SkeletonLoader;
