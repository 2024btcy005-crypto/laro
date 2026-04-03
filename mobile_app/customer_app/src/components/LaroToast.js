import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

const LaroToast = ({ visible, message, type = 'success', onHide }) => {
    const [isVisible, setIsVisible] = useState(visible);
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();

            const timer = setTimeout(() => {
                hideToast();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setIsVisible(false);
            if (onHide) onHide();
        });
    }, [onHide]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            default: return 'notifications';
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#f43f5e';
            default: return COLORS.primary;
        }
    };

    return (
        <Animated.View style={[
            styles.container,
            {
                transform: [{ translateY }],
                opacity: opacity,
                backgroundColor: getBgColor()
            }
        ]}>
            <Ionicons name={getIcon()} size={24} color="#fff" />
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    message: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 12,
        flex: 1
    }
});

export default LaroToast;
