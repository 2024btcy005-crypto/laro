import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, Animated,
    TouchableOpacity, Dimensions, Platform
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
    const translateY = useRef(new Animated.Value(300)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 65,
                    friction: 9,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            translateY.setValue(300);
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
                        transform: [{ translateY }]
                    }
                ]}>
                    <View style={styles.handleBar} />
                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        {onCancel && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onCancel}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: getConfirmColor() }]}
                            onPress={onConfirm}
                            activeOpacity={0.85}
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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    },
    container: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 28,
        paddingTop: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 20,
    },
    handleBar: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#e2e8f0',
        alignSelf: 'center',
        marginBottom: 8,
    },
    content: { paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
    message: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 21, fontWeight: '500' },
    buttonContainer: { flexDirection: 'row', padding: 18, gap: 12, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    confirmButton: {
        flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
    },
    confirmButtonText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
    cancelButton: {
        flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1'
    },
    cancelButtonText: { color: '#475569', fontSize: 15, fontWeight: '800' }
});

export default LaroAlert;
