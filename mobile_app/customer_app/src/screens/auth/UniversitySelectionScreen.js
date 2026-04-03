import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, StatusBar, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setUniversity } from '../../store/authSlice';
import api from '../../services/api';
import { COLORS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export default function UniversitySelectionScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const dispatch = useDispatch();
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        fetchUniversities();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchUniversities = async () => {
        try {
            setLoading(true);
            const response = await api.get('/universities');
            setUniversities(response.data);
            setError(null);
        } catch (err) {
            console.error('[UniversitySelection] Fetch Error:', err);
            setError('Failed to load campuses. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (university) => {
        try {
            const uniData = { id: university.id, name: university.name };
            await AsyncStorage.setItem('laro_university', JSON.stringify(uniData));
            dispatch(setUniversity(uniData));
            // Explicitly navigate to Main to ensure the transition triggers if conditional rendering is slow
            setTimeout(() => {
                navigation.navigate('Main');
            }, 100);
        } catch (err) {
            console.error('Error saving university:', err);
        }
    };

    const filteredUniversities = universities.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderUniversity = ({ item }) => (
        <TouchableOpacity
            style={[styles.uniCard, { backgroundColor: colors.white, borderColor: colors.border }]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="school" size={26} color={colors.primary} />
            </View>
            <View style={styles.textDetails}>
                <Text style={[styles.uniName, { color: colors.black }]}>{item.name}</Text>
                <Text style={[styles.uniAddress, { color: colors.gray }]} numberOfLines={1}>
                    {item.address || 'Campus Location'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <Text style={[styles.title, { color: colors.black }]}>Select your campus</Text>
                <Text style={[styles.subtitle, { color: colors.gray }]}>Choose your university to see available stores and products near you.</Text>
            </Animated.View>

            <View style={[styles.searchBox, { backgroundColor: colors.white, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.gray} />
                <TextInput
                    style={[styles.searchInput, { color: colors.black }]}
                    placeholder="Search for your university..."
                    placeholderTextColor={colors.gray}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.gray }]}>Fetching campuses...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle" size={50} color={colors.gray} />
                    <Text style={[styles.errorText, { color: colors.gray }]}>{error}</Text>
                    <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchUniversities}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredUniversities}
                    keyExtractor={item => item.id}
                    renderItem={renderUniversity}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.errorText, { color: colors.gray }]}>No campuses found matching your search.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 24, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
    subtitle: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20
    },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600' },
    listContent: { paddingHorizontal: 24, paddingBottom: 40 },
    uniCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    textDetails: { flex: 1, marginLeft: 16 },
    uniName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    uniAddress: { fontSize: 13, fontWeight: '500' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { marginTop: 16, fontWeight: '600' },
    errorText: { textAlign: 'center', marginVertical: 16, lineHeight: 22, fontWeight: '500' },
    retryBtn: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '800' }
});
