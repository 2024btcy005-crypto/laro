import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, Animated,
    TouchableOpacity, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');

const LaroAlert = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "primary" // primary, destructive, success, warning
}) => {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const getTheme = () => {
        switch (type) {
            case 'destructive':
            case 'error':
                return { color: '#f43f5e', icon: 'alert-circle' };
            case 'success':
                return { color: '#10b981', icon: 'checkmark-circle' };
            case 'warning':
                return { color: '#f59e0b', icon: 'warning' };
            default:
                return { color: COLORS.primary, icon: 'information-circle' };
        }
    };

    const theme = getTheme();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.container,
                    {
                        opacity: opacityAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}>
                    <View style={styles.content}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.color + '15' }]}>
                            <Ionicons name={theme.icon} size={42} color={theme.color} />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        {onCancel && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onCancel}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: theme.color }]}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    container: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.25,
        shadowRadius: 35,
        elevation: 30,
    },
    content: {
        padding: 32,
        alignItems: 'center'
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500'
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        height: 60,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    cancelButton: {
        flex: 1,
        height: 60,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#f1f5f9'
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '800'
    }
});

export default LaroAlert;
