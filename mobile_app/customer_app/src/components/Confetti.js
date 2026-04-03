import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = ['#f43f5e', '#10b981', '#3b82f6', '#fbbf24', '#8b5cf6', '#d946ef'];
const NUM_PARTICLES = 40;

const Particle = ({ delay, color, xPos, duration }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: height + 50,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${Math.floor(Math.random() * 1080)}deg`]
    });

    return (
        <Animated.View
            style={[
                styles.particle,
                { backgroundColor: color },
                {
                    transform: [
                        { translateX: xPos },
                        { translateY },
                        { rotate: spin }
                    ]
                }
            ]}
        />
    );
};

const Confetti = () => {
    const particles = Array.from({ length: NUM_PARTICLES }).map((_, i) => ({
        id: i,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        xPos: Math.random() * width,
        delay: Math.random() * 500, // Stagger start times
        duration: 1500 + Math.random() * 2000 // Fall speeds
    }));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((p) => (
                <Particle key={p.id} {...p} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 10,
        height: 15,
        borderRadius: 2,
    }
});

export default Confetti;
