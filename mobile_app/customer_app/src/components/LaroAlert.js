import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, Animated,
    TouchableOpacity, Dimensions
} from 'react-native';
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
    type = "primary" // primary, destructive, success
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
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const getConfirmColor = () => {
        switch (type) {
            case 'destructive': return '#f43f5e';
            case 'success': return '#10b981';
            default: return COLORS.primary;
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
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
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        {onCancel && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onCancel}
                            >
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: getConfirmColor() }]}
                            onPress={onConfirm}
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
        backgroundColor: 'rgba(26, 26, 46, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3, shadowRadius: 40, elevation: 24,
    },
    content: { padding: 30, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginBottom: 12, textAlign: 'center' },
    message: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
    buttonContainer: { flexDirection: 'row', padding: 20, gap: 12, backgroundColor: '#f8fafc' },
    confirmButton: {
        flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
    },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    cancelButton: {
        flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0'
    },
    cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '800' }
});

export default LaroAlert;
