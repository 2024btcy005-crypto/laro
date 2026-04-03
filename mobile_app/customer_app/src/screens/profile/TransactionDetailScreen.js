import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar, ScrollView, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function TransactionDetailScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const { transaction } = route.params;

    const isCredit = transaction.type === 'credit';
    const date = new Date(transaction.createdAt);
    const dateStr = date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const InfoRow = ({ label, value, icon, color = colors.gray }) => (
        <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.gray }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.black }]}>{value}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 15), paddingBottom: 15, backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: isDarkMode ? colors.background : '#f8f9fa' }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Transaction Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Main Card */}
                <View style={[styles.mainCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                    <View style={[styles.statusIcon, { backgroundColor: isCredit ? (isDarkMode ? '#064e3b' : '#f0fdf4') : (isDarkMode ? '#450a0a' : '#fef2f2') }]}>
                        <MaterialCommunityIcons
                            name={isCredit ? "arrow-down-circle" : "arrow-up-circle"}
                            size={48}
                            color={isCredit ? "#15803d" : "#ef4444"}
                        />
                    </View>

                    <Text style={[styles.amountText, { color: colors.black }]}>
                        {isCredit ? '+' : '-'}{transaction.amount} Ł
                    </Text>
                    <Text style={[styles.statusText, { color: isCredit ? '#10b981' : '#f43f5e' }]}>
                        Transaction {isCredit ? 'Credit' : 'Debit'}
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.detailsList}>
                        <InfoRow
                            label="Description"
                            value={transaction.description}
                            icon="document-text-outline"
                            color={COLORS.primary}
                        />
                        <InfoRow
                            label="Date"
                            value={dateStr}
                            icon="calendar-outline"
                        />
                        <InfoRow
                            label="Time"
                            value={timeStr}
                            icon="time-outline"
                        />
                        <InfoRow
                            label="Balance After"
                            value={`${transaction.balanceAfter} Ł`}
                            icon="wallet-outline"
                            color="#f59e0b"
                        />
                    </View>
                </View>

                {/* Reference Order Card */}
                {transaction.order && (
                    <TouchableOpacity
                        style={[styles.orderCard, { backgroundColor: colors.white, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('OrderDetail', { orderId: transaction.orderId })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.orderHeader}>
                            <View style={styles.shopBranding}>
                                <View style={[styles.shopIconBg, { backgroundColor: isDarkMode ? colors.background : `${COLORS.primary}10` }]}>
                                    <Ionicons name="storefront" size={20} color={COLORS.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.shopName, { color: colors.black }]}>{transaction.order.shop?.name || 'Laro Partner'}</Text>
                                    <Text style={[styles.orderRef, { color: colors.gray }]}>Order Ref: #{transaction.orderId.substring(0, 8).toUpperCase()}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                        </View>
                        <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
                            <Text style={styles.orderActionText}>View Order Details</Text>
                        </View>
                    </TouchableOpacity>
                )}

                <View style={styles.supportContainer}>
                    <MaterialIcons name="security" size={20} color={colors.gray} />
                    <Text style={[styles.supportText, { color: colors.gray }]}>Laro Secure Transaction • ID: {transaction.id}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.5 },

    scrollContent: { padding: 20 },

    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
        marginBottom: 20
    },
    statusIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    amountText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#1a1a2e',
        marginBottom: 4
    },
    statusText: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 24
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 24
    },
    detailsList: {
        width: '100%',
        gap: 20
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    infoIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    infoTextContainer: {
        flex: 1
    },
    infoLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2
    },
    infoValue: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '800'
    },

    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 30
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    shopBranding: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    shopIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: `${COLORS.primary}10`,
        justifyContent: 'center',
        alignItems: 'center'
    },
    shopName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1e293b'
    },
    orderRef: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600'
    },
    orderFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
        paddingTop: 12,
        alignItems: 'center'
    },
    orderActionText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary
    },

    supportContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10
    },
    supportText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600'
    }
});
