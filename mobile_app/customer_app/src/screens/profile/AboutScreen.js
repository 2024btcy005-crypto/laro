import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'react-native';

export default function AboutScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const renderLink = (title, url) => (
        <TouchableOpacity
            style={styles.linkRow}
            onPress={() => url ? Linking.openURL(url) : null}
        >
            <Text style={[styles.linkText, { color: colors.black }]}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={26} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>About</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <Text style={styles.appTitle}>Laro</Text>
                    <Text style={[styles.appVersion, { color: colors.gray }]}>Version 1.0.4</Text>
                </View>

                <View style={[styles.linksCard, { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1 }]}>
                    {renderLink('Terms of Service', 'https://laro.in/terms')}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    {renderLink('Privacy Policy', 'https://laro.in/privacy')}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    {renderLink('Contact Support', 'mailto:anegondhikumar2@gmail.com')}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    {renderLink('Open Source Licenses', null)}
                </View>

                <Text style={styles.footerText}>© 2026 Laro Technologies Pvt. Ltd.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#1c1c1c', letterSpacing: -0.5 },

    scrollContent: { padding: 15 },
    logoContainer: { alignItems: 'center', marginVertical: 40 },
    appTitle: { fontSize: 32, fontWeight: '900', color: '#9D174D', letterSpacing: -1, marginBottom: 5 },
    appVersion: { fontSize: 14, color: '#888', fontWeight: '500' },

    linksCard: { backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginBottom: 30 },
    linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    linkText: { fontSize: 15, color: '#1c1c1c', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },

    footerText: { textAlign: 'center', color: '#888', fontSize: 12 }
});
