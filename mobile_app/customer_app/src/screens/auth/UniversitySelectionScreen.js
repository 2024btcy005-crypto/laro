import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, StatusBar, Animated, Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setUniversity } from '../../store/authSlice';
import api from '../../services/api';
import { COLORS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function UniversitySelectionScreen({ navigation, route }) {
    const { colors, isDarkMode } = useTheme();
    const isSetup = route?.params?.isSetup || false;
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    
    // States
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);
    const [selectedUni, setSelectedUni] = useState(null);

    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        fetchUniversities();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchUniversities = async () => {
        try {
            setLoading(true);
            const response = await api.get('/universities');
            setUniversities(response.data);
            
            // Set Stanford as default selected if present
            if (response.data && response.data.length > 0) {
                const stanford = response.data.find(u => u.name.toLowerCase().includes('stanford'));
                setSelectedUni(stanford || response.data[0]);
            }
            setError(null);
        } catch (err) {
            console.error('[UniversitySelection] Fetch Error:', err);
            setError('Failed to load campuses. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async () => {
        if (!selectedUni) return;
        try {
            const uniData = { id: selectedUni.id || selectedUni._id, name: selectedUni.name };
            await AsyncStorage.setItem('laro_university', JSON.stringify(uniData));
            dispatch(setUniversity(uniData));
            setTimeout(() => {
                if (isSetup) {
                    navigation.replace('AddressBook', { isSetup: true });
                } else {
                    navigation.navigate('Main');
                }
            }, 100);
        } catch (err) {
            console.error('Error saving university:', err);
        }
    };

    const filteredUniversities = universities.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderUniversity = ({ item }) => {
        const isSelected = selectedUni && (selectedUni.id === item.id || selectedUni._id === item._id);
        
        // Custom location mapping if not provided in database
        let locationText = item.address || 'California, USA';
        if (item.name.toLowerCase().includes('stanford')) locationText = 'Stanford, CA';
        else if (item.name.toLowerCase().includes('mit')) locationText = 'Cambridge, MA';
        else if (item.name.toLowerCase().includes('berkeley')) locationText = 'Berkeley, CA';
        else if (item.name.toLowerCase().includes('harvard')) locationText = 'Cambridge, MA';
        else if (item.name.toLowerCase().includes('joy')) locationText = 'Delhi NCR, India';

        // Logo initials or icon container
        const initials = item.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        return (
            <TouchableOpacity
                style={[
                    styles.uniCard, 
                    isSelected && styles.uniCardSelected
                ]}
                onPress={() => setSelectedUni(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.logoContainer, isSelected && styles.logoContainerSelected]}>
                    <Text style={[styles.logoText, isSelected && styles.logoTextSelected]}>{initials}</Text>
                </View>
                
                <View style={styles.textDetails}>
                    <Text style={styles.uniName}>{item.name}</Text>
                    <Text style={styles.uniAddress} numberOfLines={1}>{locationText}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={isSelected ? '#056f36' : '#bbb'} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />

            {/* Header branding */}
            <View style={styles.topBrandingBar}>
                <Text style={styles.laroLogoText}>Laro</Text>
                <TouchableOpacity style={styles.helpButton}>
                    <Ionicons name="help-circle-outline" size={24} color="#056f36" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Search / Title banner */}
                <Animated.View style={[styles.heroHeader, { opacity: fadeAnim }]}>
                    {isSetup && (
                        <View style={{ alignSelf: 'flex-start', backgroundColor: '#e6ede6', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 10 }}>
                            <Text style={{ fontSize: 12, color: '#056f36', fontWeight: '800' }}>Step 2 of 3 — Pick Campus</Text>
                        </View>
                    )}
                    <Text style={styles.title}>Find Your Campus</Text>
                    <Text style={styles.subtitle}>Select your university to view exclusive local deals and delivery options.</Text>
                </Animated.View>

                {/* Search box input */}
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#056f36" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Stanford Univers"
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Section title */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>POPULAR CAMPUSES</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#056f36" />
                        <Text style={styles.loadingText}>Fetching campuses...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Ionicons name="alert-circle" size={50} color="#999" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchUniversities}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredUniversities}
                        keyExtractor={item => (item.id || item._id).toString()}
                        renderItem={renderUniversity}
                        scrollEnabled={false}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.errorText}>No campuses found matching your search.</Text>
                            </View>
                        }
                    />
                )}
            </ScrollView>

            {/* Bottom sticky action button */}
            <View style={[styles.bottomStickyBar, { paddingBottom: insets.bottom + 15 }]}>
                <TouchableOpacity 
                    style={[styles.confirmBtn, !selectedUni && styles.confirmBtnDisabled]}
                    onPress={handleSelect}
                    disabled={!selectedUni}
                >
                    <Text style={styles.confirmBtnText}>Confirm Selection</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
                {isSetup && (
                    <TouchableOpacity
                        style={{ paddingVertical: 10, alignItems: 'center', marginTop: 4 }}
                        onPress={() => navigation.replace('AddressBook', { isSetup: true })}
                    >
                        <Text style={{ fontSize: 13, color: '#666', fontWeight: '700' }}>Skip for now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' },
    
    // Top branding logo bar
    topBrandingBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#f2f7f2'
    },
    laroLogoText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: -0.5
    },
    helpButton: { padding: 4 },

    // Content headers
    heroHeader: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 15 },
    title: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 8 },
    subtitle: { fontSize: 13, lineHeight: 18, color: '#555', fontWeight: '600' },

    // Search Box
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e6ede6',
        backgroundColor: '#fff',
        marginBottom: 20
    },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111' },

    // Section title headers
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.8
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#056f36'
    },

    listContent: { paddingHorizontal: 24 },
    
    // Selectable Card Item
    uniCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#fff',
        backgroundColor: '#fff',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.01,
        shadowRadius: 5,
        elevation: 1,
        marginHorizontal: 24
    },
    uniCardSelected: {
        borderColor: '#27c96c',
        backgroundColor: '#edf5ed'
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f2f7f2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e6ede6'
    },
    logoContainerSelected: {
        backgroundColor: '#27c96c',
        borderColor: '#27c96c'
    },
    logoText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#056f36'
    },
    logoTextSelected: {
        color: '#fff'
    },
    textDetails: { flex: 1, marginLeft: 16 },
    uniName: { fontSize: 15, fontWeight: '900', color: '#111', marginBottom: 2 },
    uniAddress: { fontSize: 12, color: '#666', fontWeight: '600' },
    
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { marginTop: 16, fontWeight: '800', color: '#666' },
    errorText: { textAlign: 'center', color: '#666', fontSize: 13, fontWeight: '700' },
    retryBtn: { marginTop: 12, backgroundColor: '#056f36', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '850', fontSize: 13 },

    // Bottom Sticky Bar
    bottomStickyBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f4f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 10
    },
    confirmBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 52,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    confirmBtnDisabled: {
        backgroundColor: '#d0dcd0',
        shadowOpacity: 0,
        elevation: 0
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '850'
    }
});
