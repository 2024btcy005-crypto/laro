import React from 'react';
import {
    View, Text, StyleSheet, SafeAreaView,
    TouchableOpacity, ScrollView, StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function ProfileDetailScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const { title, type } = route.params || { title: 'Details', type: 'generic' };

    const renderContent = () => {
        switch (type) {
            case 'personal':
                return (
                    <View style={styles.card}>
                        <DetailItem label="Full Name" value="Partner Name" />
                        <DetailItem label="Email" value="partner@example.com" />
                        <DetailItem label="Phone" value="+91 9876543210" />
                        <DetailItem label="Address" value="123, Laro Street, City" isLast />
                    </View>
                );
            case 'documents':
                return (
                    <View style={styles.card}>
                        <StatusItem icon="id-card-outline" label="Aadhar Card" status="Verified" color="#10b981" />
                        <StatusItem icon="car-outline" label="Driving License" status="Verified" color="#10b981" />
                        <StatusItem icon="document-text-outline" label="PAN Card" status="Pending" color="#f59e0b" isLast />
                    </View>
                );

            default:
                return (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="construct-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>This section is under maintenance.</Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <View style={[styles.header, { paddingTop: 10, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderContent()}
            </ScrollView>
        </SafeAreaView>
    );
}

const DetailItem = ({ label, value, isLast }) => (
    <View style={[styles.item, isLast && { borderBottomWidth: 0 }]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const StatusItem = ({ icon, label, status, color, isLast }) => (
    <View style={[styles.item, isLast && { borderBottomWidth: 0 }]}>
        <View style={styles.row}>
            <Ionicons name={icon} size={20} color={COLORS.secondary} style={{ marginRight: 12 }} />
            <Text style={styles.label}>{label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
            <Text style={[styles.badgeText, { color }]}>{status}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.secondary
    },
    scrollContent: {
        padding: 20
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 10
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    label: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600'
    },
    value: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '700'
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60
    },
    emptyText: {
        marginTop: 15,
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '600'
    }
});
