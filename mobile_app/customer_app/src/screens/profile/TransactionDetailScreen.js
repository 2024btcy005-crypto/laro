import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, ScrollView, Dimensions,
    Clipboard, Share, Image
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, CONSTANTS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import LaroToast from '../../components/LaroToast';

const { width } = Dimensions.get('window');

export default function TransactionDetailScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    
    // Parse transaction with rich fallback mock data matching user screenshot
    const { transaction = {} } = route.params || {};
    
    const id = transaction.id || transaction._id || 'TXN-4829-BZ-9021-LP';
    const amount = transaction.amount !== undefined ? transaction.amount : 200;
    const isCredit = transaction.type === 'credit';
    const description = transaction.description || 'Payment for Coffee';
    const createdAt = transaction.createdAt || '2023-10-20T11:45:00';
    const balanceAfter = transaction.balanceAfter !== undefined ? transaction.balanceAfter : 800;
    const fee = transaction.fee !== undefined ? transaction.fee : '0.00';
    const paymentMethodName = transaction.paymentMethod || 'Laro Wallet';
    
    // Parse helper for peer transfer description
    const parsePeerName = (desc) => {
        if (!desc) return null;
        const sentMatch = desc.match(/to\s+([^]+)$/i);
        if (sentMatch && sentMatch[1]) return sentMatch[1].replace(/Ł/g, '').trim();
        const recMatch = desc.match(/from\s+([^]+)$/i);
        if (recMatch && recMatch[1]) return recMatch[1].replace(/Ł/g, '').trim();
        return null;
    };

    const isPeerTransfer = !!transaction.peerUser || description.toLowerCase().includes('sent') || description.toLowerCase().includes('received');
    
    // Parse recipient/sender name from description or peerUser
    const parsedName = transaction.peerUser?.name || parsePeerName(description) || 'Laro Partner';
    
    const orderId = transaction.orderId || (transaction.order?.id) || 'LARO-8821';
    const shopName = isPeerTransfer ? parsedName : (transaction.order?.shop?.name || (description.toLowerCase().includes('coffee') || description.toLowerCase().includes('cafe') ? 'The Graduate Café' : 'Laro Partner'));
    const shopImageUrl = isPeerTransfer 
        ? (transaction.peerUser?.avatarUrl || null) 
        : (transaction.order?.shop?.imageUrl || null);

    const subtitleText = isPeerTransfer ? 'Wallet Transfer' : `Order #${orderId.toUpperCase()}`;
    const taglineText = isPeerTransfer 
        ? `Successfully shared coins with ${shopName}!` 
        : `Enjoy your break at ${shopName}!`;

    const date = new Date(createdAt);
    
    // Date & Time formatting
    const formatTransactionDate = (d) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    const formatTransactionTime = (d) => {
        let hours = d.getHours();
        let minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'AM' : 'PM'; // Mockup shows 11:45 AM
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
    };

    const dateStr = formatTransactionDate(date);
    const timeStr = formatTransactionTime(date);

    // Toast configuration
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleCopyTxId = () => {
        Clipboard.setString(id);
        setToastMessage('Transaction ID copied!');
        setToastVisible(true);
    };

    const handleShareReceipt = async () => {
        try {
            await Share.share({
                message: `Receipt from Zippit:\nShop: ${shopName}\nTransaction ID: ${id}\nAmount: ${isCredit ? '+' : '-'}${amount} Laro\nDate: ${dateStr}`,
            });
        } catch (error) {
            console.log('Share error:', error.message);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#f2f7f2' }]} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />
            
            <LaroToast
                visible={toastVisible}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Laro</Text>
                <TouchableOpacity style={styles.helpButtonHeader}>
                    <Ionicons name="help-circle-outline" size={26} color="#056f36" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Checkmark Section */}
                <View style={styles.statusSection}>
                    <View style={styles.checkmarkCircle}>
                        <Ionicons name="checkmark-sharp" size={32} color="#fff" />
                    </View>
                    <Text style={styles.statusLabelText}>TRANSACTION SUCCESSFUL</Text>
                    <Text style={[styles.amountText, { color: isCredit ? '#056f36' : '#b91c1c' }]}>
                        {isCredit ? '+' : '-'}{amount} <Text style={styles.amountUnit}>Laro</Text>
                    </Text>
                </View>

                {/* Main Details Card */}
                <View style={styles.detailsCard}>
                    {/* Shop branding row */}
                    <View style={styles.shopRow}>
                        {shopImageUrl ? (
                            <Image source={{ uri: shopImageUrl }} style={styles.shopLogo} />
                        ) : isPeerTransfer ? (
                            <View style={[styles.shopLogo, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarPlaceholderText}>
                                    {shopName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.shopLogo, styles.storePlaceholder]}>
                                <Ionicons name="storefront" size={22} color="#056f36" />
                            </View>
                        )}
                        <View style={styles.shopTextWrapper}>
                            <Text style={styles.shopNameText}>{shopName}</Text>
                            <Text style={styles.orderRefText}>{subtitleText}</Text>
                        </View>
                        <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>Completed</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Meta info grid */}
                    <View style={styles.metaGrid}>
                        <View style={styles.metaRow}>
                            <View style={styles.metaCol}>
                                <Text style={styles.metaLabel}>DATE</Text>
                                <Text style={styles.metaValue}>{dateStr}</Text>
                            </View>
                            <View style={styles.metaCol}>
                                <Text style={styles.metaLabel}>TIME</Text>
                                <Text style={styles.metaValue}>{timeStr}</Text>
                            </View>
                        </View>

                        <View style={styles.metaRow}>
                            <View style={styles.metaCol}>
                                <Text style={styles.metaLabel}>PAYMENT</Text>
                                <View style={styles.paymentMethodRow}>
                                    <View style={styles.paymentIconWrapper}>
                                        <Ionicons name="card" size={14} color="#056f36" />
                                    </View>
                                    <Text style={styles.metaValue}>{paymentMethodName}</Text>
                                </View>
                            </View>
                            <View style={styles.metaCol}>
                                <Text style={styles.metaLabel}>FEE</Text>
                                <Text style={[styles.metaValue, { color: '#056f36', fontWeight: '800' }]}>{fee}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Transaction ID */}
                    <View style={styles.transactionIdContainer}>
                        <Text style={styles.txIdLabel}>TRANSACTION ID</Text>
                        <TouchableOpacity style={styles.txIdCopyRow} onPress={handleCopyTxId}>
                            <Text style={styles.txIdText} numberOfLines={1}>{id}</Text>
                            <Ionicons name="copy-outline" size={18} color="#056f36" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Optional Bonus Discount Banner */}
                <View style={styles.bonusBanner}>
                    <View style={styles.giftIconCircle}>
                        <FontAwesome5 name="gift" size={16} color="#056f36" />
                    </View>
                    <View style={styles.bonusTextWrapper}>
                        <Text style={styles.bonusTitleText}>Redeemed for Coffee</Text>
                        <Text style={styles.bonusDescText}>Applied campus referral discount to this order. You saved 50 Laro coins.</Text>
                    </View>
                </View>

                {/* Bottom Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.shareReceiptBtn} onPress={handleShareReceipt}>
                        <Ionicons name="share-social-outline" size={18} color="#111" style={{ marginRight: 8 }} />
                        <Text style={styles.shareReceiptBtnText}>Share Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.getHelpBtn} onPress={() => navigation.navigate('About')}>
                        <Ionicons name="headset-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.getHelpBtnText}>Get Help</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer Tagline */}
                <View style={styles.footerContainer}>
                    <Text style={styles.taglineText}>{taglineText}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#f2f7f2'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#056f36', textAlign: 'center', flex: 1 },
    helpButtonHeader: { padding: 4 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 50 },

    statusSection: {
        alignItems: 'center',
        marginVertical: 15
    },
    checkmarkCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#27c96c',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#27c96c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
        marginBottom: 16
    },
    statusLabelText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#555',
        letterSpacing: 1.5,
        marginBottom: 8
    },
    amountText: {
        fontSize: 38,
        fontWeight: '950',
        letterSpacing: -1
    },
    amountUnit: {
        fontSize: 22,
        fontWeight: '800'
    },

    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 15
    },
    shopRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    shopLogo: {
        width: 48,
        height: 48,
        borderRadius: 14
    },
    shopTextWrapper: {
        flex: 1,
        marginLeft: 12
    },
    shopNameText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#111'
    },
    orderRefText: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
        fontWeight: '700'
    },
    completedBadge: {
        backgroundColor: '#e6ede6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    completedBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36'
    },

    divider: {
        height: 1,
        backgroundColor: '#edf2ed',
        marginVertical: 18
    },

    metaGrid: {
        gap: 16
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    metaCol: {
        flex: 1
    },
    metaLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#888',
        letterSpacing: 0.5,
        marginBottom: 4
    },
    metaValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#111'
    },
    paymentMethodRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    paymentIconWrapper: {
        marginRight: 6
    },

    transactionIdContainer: {
        marginTop: 2
    },
    txIdLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#888',
        letterSpacing: 0.5,
        marginBottom: 6
    },
    txIdCopyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f2f7f2',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e6ede6'
    },
    txIdText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '800',
        color: '#333'
    },

    bonusBanner: {
        backgroundColor: '#edf5ed',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#d0dcd0',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20
    },
    giftIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#d8e5d8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    bonusTextWrapper: {
        flex: 1
    },
    bonusTitleText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#056f36'
    },
    bonusDescText: {
        fontSize: 11,
        color: '#555',
        marginTop: 3,
        lineHeight: 15,
        fontWeight: '700'
    },

    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 25
    },
    shareReceiptBtn: {
        flex: 1,
        backgroundColor: '#e6ede6',
        borderRadius: 16,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d0dcd0'
    },
    shareReceiptBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#111'
    },
    getHelpBtn: {
        flex: 1,
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    getHelpBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#fff'
    },

    footerContainer: {
        alignItems: 'center',
        marginTop: 10
    },
    taglineText: {
        fontSize: 12,
        fontStyle: 'italic',
        fontWeight: '700',
        color: '#666',
        marginBottom: 10
    },
    avatarPlaceholder: {
        backgroundColor: '#d8e5d8',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarPlaceholderText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#056f36'
    },
    storePlaceholder: {
        backgroundColor: '#e6ede6',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
