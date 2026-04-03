import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/api';
import { COLORS } from '../theme';
import LaroAlert from '../components/LaroAlert';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'react-native';

const STATUS_STEPS = [
    { key: 'assigned', label: 'Order Assigned', emoji: '📋' },
    { key: 'picked', label: 'Picked Up', emoji: '🏃' },
    { key: 'delivered', label: 'Delivered', emoji: '✅' },
];

export default function ActiveDeliveryScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const { order } = route.params;

    // Map initial status to step index
    const getInitialStep = () => {
        const index = STATUS_STEPS.findIndex(s => s.key === order.status);
        return index !== -1 ? index : 0;
    };

    const [currentStep, setCurrentStep] = useState(getInitialStep());
    const [loading, setLoading] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        confirmType: 'primary',
        confirmText: 'Confirm',
        onConfirm: () => { }
    });
    const [refreshing, setRefreshing] = useState(false);
    const [localOrder, setLocalOrder] = useState(order);

    // OTP Modal State
    const [showOtpPrompt, setShowOtpPrompt] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState('');

    const fetchLatestOrder = async () => {
        try {
            setRefreshing(true);
            const response = await api.get('/delivery/active-orders');
            const matchingOrder = response.data.find(item => item.order.id === order.id);
            if (matchingOrder) {
                const formatted = {
                    id: matchingOrder.order.id,
                    shopName: matchingOrder.order.shop?.name || 'Unknown Shop',
                    customerName: matchingOrder.order.customer?.name || 'Guest User',
                    customerPhone: matchingOrder.order.customer?.phoneNumber || 'N/A',
                    shopAddress: matchingOrder.order.shop?.address || 'Shop Address N/A',
                    deliveryAddress: matchingOrder.order.deliveryAddress,
                    totalAmount: matchingOrder.order.totalAmount,
                    paymentMethod: matchingOrder.order.paymentMethod,
                    status: matchingOrder.status,
                    items: matchingOrder.order.items?.map(i => ({
                        id: i.id,
                        name: i.product?.name || 'Unknown Item',
                        quantity: i.quantity,
                        price: i.priceAtTime,
                        metadata: i.metadata
                    })) || []
                };
                setLocalOrder(formatted);
                setCurrentStep(STATUS_STEPS.findIndex(s => s.key === matchingOrder.status));
            }
        } catch (error) {
            console.error('[FETCH LATEST ORDER ERROR]', error.response?.data || error.message);
        } finally {
            setRefreshing(false);
        }
    };

    const handleNextStep = () => {
        const nextStep = currentStep + 1;
        if (nextStep >= STATUS_STEPS.length) return;

        const nextKey = STATUS_STEPS[nextStep].key;
        const stepLabel = STATUS_STEPS[nextStep].label;

        if (nextKey === 'delivered') {
            setShowOtpPrompt(true);
            setOtpValue('');
            setOtpError('');
            return;
        }

        setAlertConfig({
            visible: true,
            title: 'Update Progress',
            message: `Are you ready to mark this order as "${stepLabel}"?`,
            confirmType: 'primary',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                try {
                    setLoading(true);
                    await api.put(`/delivery/orders/${order.id}/status`, { status: nextKey });
                    setCurrentStep(nextStep);

                    if (nextKey === 'delivered') {
                        setTimeout(() => {
                            setAlertConfig({
                                visible: true,
                                title: '🎉 Excellent Work!',
                                message: 'The order has been delivered successfully. Ready for the next one?',
                                confirmType: 'success',
                                confirmText: 'Back to Dashboard',
                                onConfirm: () => {
                                    setAlertConfig(prev => ({ ...prev, visible: false }));
                                    navigation.popToTop();
                                }
                            });
                        }, 500);
                    }
                } catch (error) {
                    console.error('[STATUS UPDATE ERROR]', error.response?.data || error.message);
                    setAlertConfig({
                        visible: true,
                        title: 'Update Failed',
                        message: 'We could not update the status. Please check your internet connection.',
                        confirmType: 'destructive',
                        confirmText: 'Try Again',
                        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const submitOtp = async () => {
        if (!otpValue || otpValue.length !== 4) {
            setOtpError('Please enter a valid 4-digit code.');
            return;
        }

        try {
            setLoading(true);
            await api.put(`/delivery/orders/${order.id}/status`, { status: 'delivered', otp: otpValue });
            setCurrentStep(currentStep + 1);
            setShowOtpPrompt(false);

            setTimeout(() => {
                setAlertConfig({
                    visible: true,
                    title: '🎉 Excellent Work!',
                    message: 'The order has been delivered successfully. Ready for the next one?',
                    confirmType: 'success',
                    confirmText: 'Back to Dashboard',
                    onConfirm: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        navigation.popToTop();
                    }
                });
            }, 500);
        } catch (error) {
            console.error('[OTP SUBMIT ERROR]', error.response?.data || error.message);
            setOtpError(error.response?.data?.message || 'Invalid delivery code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelivery = () => {
        setAlertConfig({
            visible: true,
            title: 'Cancel Delivery?',
            message: 'Are you sure you want to unassign yourself from this delivery? The order will be returned to the available pool.',
            confirmType: 'destructive',
            confirmText: 'Unassign Me',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                try {
                    setLoading(true);
                    await api.post(`/delivery/orders/${order.id}/cancel-assignment`);
                    navigation.popToTop();
                } catch (error) {
                    console.error('[CANCEL DELIVERY ERROR]', error.response?.data || error.message);
                    setAlertConfig({
                        visible: true,
                        title: 'Cancellation Failed',
                        message: 'We could not cancel this delivery assignment. Please try again.',
                        confirmType: 'destructive',
                        confirmText: 'Okay',
                        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const nextAction = currentStep < STATUS_STEPS.length - 1
        ? `Mark as "${STATUS_STEPS[currentStep + 1].label}"`
        : null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchLatestOrder} colors={[colors.primary]} />
                }
            >

                {/* Order Info Card */}
                <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.black }]}>🛒 Order Details</Text>
                    <View style={[styles.row, { borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.gray }]}>Order ID</Text>
                        <Text style={[styles.value, { color: colors.black }]}>#{localOrder.id}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Shop</Text>
                        <Text style={styles.value}>{localOrder.shopName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Customer</Text>
                        <Text style={styles.value}>{localOrder.customerName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Contact</Text>
                        <Text style={styles.value}>{localOrder.customerPhone}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Pickup From</Text>
                        <Text style={styles.value}>{localOrder.shopAddress}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Delivery To</Text>
                        <Text style={styles.value}>{localOrder.deliveryAddress}</Text>
                    </View>
                    <View style={[styles.row, { borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.gray }]}>Amount</Text>
                        <Text style={[styles.value, { color: colors.primary, fontWeight: 'bold' }]}>₹{parseFloat(localOrder.totalAmount || 0).toFixed(2)}</Text>
                    </View>
                    <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <Text style={styles.label}>Payment Mode</Text>
                        <Text style={[
                            styles.value,
                            { color: localOrder.paymentMethod === 'cod' ? '#d97706' : '#16a34a', fontWeight: '900' }
                        ]}>
                            {localOrder.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'PREPAID'}
                        </Text>
                    </View>
                </View>

                {/* Ordered Items */}
                <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.black }]}>📦 Ordered Items</Text>
                    {localOrder.items && localOrder.items.length > 0 ? (
                        localOrder.items.map((item, index) => (
                            <View key={item.id || index}>
                                <View style={[styles.row, { borderColor: colors.border }, (index === localOrder.items.length - 1 && !item.metadata?.url) && { borderBottomWidth: 0 }]}>
                                    <Text style={[styles.itemQuantity, { color: colors.primary }]}>{item.quantity} x</Text>
                                    <Text style={[styles.itemName, { color: colors.black }]}>{item.name}</Text>
                                    <Text style={[styles.itemPrice, { color: colors.gray }]}>₹{parseFloat(item.price || 0).toFixed(2)}</Text>
                                </View>
                                {item.metadata?.url && (
                                    <TouchableOpacity
                                        style={[styles.xeroxDownloadBtn, { backgroundColor: isDarkMode ? '#1e1b4b' : colors.primary + '10', borderColor: colors.primary + '20' }]}
                                        onPress={() => {
                                            // Open URL in browser
                                            const url = item.metadata.url.startsWith('http')
                                                ? item.metadata.url
                                                : `${api.defaults.baseURL.replace('/api', '')}${item.metadata.url}`;
                                            console.log('[DEBUG] Opening Xerox URL:', url);
                                            require('react-native').Linking.openURL(url);
                                        }}
                                    >
                                        <Ionicons name="cloud-download" size={18} color={colors.primary} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.xeroxDownloadText, { color: colors.primary }]}>Download Xerox Document</Text>
                                            <View style={styles.xeroxBadgeContainer}>
                                                <Text style={[styles.xeroxBadge, { backgroundColor: isDarkMode ? colors.background : '#f0f0f0', color: colors.primary }]}>{item.metadata.pageCount} Pages</Text>
                                                <Text style={[styles.xeroxBadge, { backgroundColor: isDarkMode ? colors.background : '#f0f0f0', color: colors.primary }]}>{item.metadata.options?.colorMode}</Text>
                                                <Text style={[styles.xeroxBadge, { backgroundColor: isDarkMode ? colors.background : '#f0f0f0', color: colors.primary }]}>{item.metadata.options?.sides}</Text>
                                                {item.metadata.options?.ratio && <Text style={[styles.xeroxBadge, { backgroundColor: isDarkMode ? colors.background : '#f0f0f0', color: colors.primary }]}>{item.metadata.options.ratio}</Text>}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    ) : (
                        <View>
                            <Text style={{ color: colors.gray, fontStyle: 'italic' }}>No items found</Text>
                            <TouchableOpacity onPress={fetchLatestOrder} style={{ marginTop: 10 }}>
                                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Pull down to refresh</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Progress Stepper */}
                <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.black }]}>📍 Delivery Progress</Text>
                    {STATUS_STEPS.map((step, index) => {
                        const isDone = index <= currentStep;
                        const isLast = index === STATUS_STEPS.length - 1;
                        return (
                            <View key={step.key} style={styles.stepRow}>
                                {!isLast && <View style={[styles.stepLine, { backgroundColor: colors.border }, isDone && { backgroundColor: colors.primary }]} />}
                                <View style={[styles.stepDot, { backgroundColor: isDarkMode ? colors.white : colors.lightGray, borderColor: colors.border }, isDone && { backgroundColor: colors.white, borderColor: colors.primary }]}>
                                    <Text style={styles.stepEmoji}>{step.emoji}</Text>
                                </View>
                                <View style={styles.stepInfo}>
                                    <Text style={[styles.stepLabel, { color: colors.gray }, isDone && { color: colors.black }]}>{step.label}</Text>
                                    {index === currentStep && <Text style={[styles.stepCurrent, { color: colors.primary }]}>Current Milestone</Text>}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Action Button */}
            {nextAction && (
                <View style={[styles.bottomBar, { backgroundColor: colors.white }]}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
                        onPress={handleNextStep}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={[styles.actionButtonText, { color: colors.white }]}>{nextAction}</Text>
                        )}
                    </TouchableOpacity>

                    {currentStep === 0 && (
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: isDarkMode ? colors.border : '#fee2e2' }, loading && { opacity: 0.7 }]}
                            onPress={handleCancelDelivery}
                            disabled={loading}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.error }]}>Cancel Delivery</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.confirmType}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />

            {/* OTP Prompt Modal */}
            <Modal visible={showOtpPrompt} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
                        <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="shield-checkmark" size={42} color={colors.primary} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.black }]}>Secure Handoff</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.gray }]}>Ask the customer for their 4-digit Delivery Code to finalize this order.</Text>

                        <TextInput
                            style={[styles.otpInput, { backgroundColor: isDarkMode ? colors.background : '#f8fafc', color: colors.primary, borderColor: colors.border }]}
                            keyboardType="numeric"
                            maxLength={4}
                            value={otpValue}
                            onChangeText={(text) => {
                                setOtpValue(text.replace(/[^0-9]/g, ''));
                                setOtpError('');
                            }}
                            placeholder="----"
                            placeholderTextColor={colors.gray}
                        />

                        {otpError ? <Text style={[styles.errorText, { color: colors.error }]}>{otpError}</Text> : null}

                        <View style={styles.modalButtonGroup}>
                            <TouchableOpacity
                                style={[styles.modalBtnCancel, { backgroundColor: isDarkMode ? colors.background : '#f8fafc', borderColor: colors.border }, loading && { opacity: 0.7 }]}
                                onPress={() => setShowOtpPrompt(false)}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modalBtnCancelText, { color: colors.gray }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtnConfirm, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
                                onPress={submitOtp}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.modalBtnConfirmText, { color: colors.white }]}>Verify Code</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    card: {
        borderRadius: 28, padding: 24, marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 6,
    },
    cardTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, letterSpacing: 0.5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
    label: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    value: { fontSize: 15, fontWeight: '700', maxWidth: '65%', textAlign: 'right' },

    itemQuantity: { fontSize: 15, fontWeight: '900', width: 45 },
    itemName: { fontSize: 15, fontWeight: '700', flex: 1 },
    itemPrice: { fontSize: 15, fontWeight: '700' },

    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30 },
    stepDot: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', zIndex: 2, borderWidth: 1 },
    // stepDotDone: provided via inline styles to handle theme
    // stepDotPending: provided via inline styles
    stepEmoji: { fontSize: 22 },
    stepInfo: { flex: 1, marginLeft: 18, paddingTop: 6 },
    stepLabel: { fontSize: 17, fontWeight: '800' },
    // stepLabelDone: { color: COLORS.secondary },
    stepCurrent: { fontSize: 11, fontWeight: '900', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.2 },

    // Line connecting steps
    stepLine: { position: 'absolute', left: 23, top: 48, bottom: -30, width: 3, zIndex: 1 },
    // stepLineDone: { backgroundColor: COLORS.primary },

    bottomBar: {
        paddingHorizontal: 25, paddingVertical: 25,
        borderTopLeftRadius: 35, borderTopRightRadius: 35,
        shadowColor: '#000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 25
    },
    actionButton: {
        paddingVertical: 20, borderRadius: 22, alignItems: 'center',
        shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 12
    },
    actionButtonText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    cancelButton: {
        marginTop: 15,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 22,
    },
    cancelButtonText: { fontSize: 16, fontWeight: '800' },

    // OTP Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: {
        borderRadius: 32,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.25,
        shadowRadius: 35,
        elevation: 30
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
    modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 30, lineHeight: 20, fontWeight: '500' },
    otpInput: {
        width: '100%',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        paddingVertical: 20,
        borderRadius: 22,
        borderWidth: 2,
        marginBottom: 15,
        letterSpacing: 10
    },
    errorText: { fontSize: 13, fontWeight: '700', marginBottom: 20 },
    modalButtonGroup: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 10 },
    modalBtnCancel: {
        flex: 1,
        height: 60,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5
    },
    modalBtnCancelText: { fontSize: 16, fontWeight: '800' },
    modalBtnConfirm: {
        flex: 1,
        height: 60,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8
    },
    modalBtnConfirmText: { fontSize: 16, fontWeight: '900' },
    xeroxDownloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 5,
        marginBottom: 10,
        gap: 8,
        borderWidth: 1
    },
    xeroxDownloadText: {
        fontWeight: '800',
        fontSize: 13,
        marginBottom: 4,
    },
    xeroxBadgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    xeroxBadge: {
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
});
