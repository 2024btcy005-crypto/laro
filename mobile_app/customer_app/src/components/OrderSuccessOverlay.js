import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import * as Haptics from 'expo-haptics';
import SoundService from '../services/SoundService';
import Confetti from './Confetti';

const { width, height } = Dimensions.get('window');

const OrderSuccessOverlay = ({ visible, onTrackOrder, onHome }) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            SoundService.playSuccess();
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(scale, {
                        toValue: 1,
                        friction: 4,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    })
                ]),
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(buttonScale, {
                    toValue: 1,
                    friction: 6,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            scale.setValue(0);
            opacity.setValue(0);
            textOpacity.setValue(0);
            buttonScale.setValue(0);
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.container}>
                {visible && <Confetti />}

                <Animated.View style={[styles.circle, { transform: [{ scale }], opacity }]}>
                    <Ionicons name="checkmark" size={80} color="#fff" />
                </Animated.View>

                <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 30 }}>
                    <Text style={styles.title}>Order Placed!</Text>
                    <Text style={styles.subtitle}>Your delicious meal is being prepared.</Text>
                </Animated.View>

                <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
                    <TouchableOpacity style={styles.trackButton} onPress={onTrackOrder}>
                        <Text style={styles.trackButtonText}>Track My Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.homeButton} onPress={onHome}>
                        <Text style={styles.homeButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    circle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 20
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1a1a2e',
        marginBottom: 10
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '500'
    },
    buttonContainer: {
        marginTop: 60,
        width: '100%',
        gap: 15
    },
    trackButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 22,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    trackButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900'
    },
    homeButton: {
        paddingVertical: 18,
        alignItems: 'center'
    },
    homeButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '800'
    }
});

export default OrderSuccessOverlay;
