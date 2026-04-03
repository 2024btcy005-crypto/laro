import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, SafeAreaView, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export default function PartnerSetupScreen({ navigation }) {
    const [vehicleType, setVehicleType] = useState('bicycle');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [universityId, setUniversityId] = useState(null);
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingUni, setFetchingUni] = useState(true);

    const vehicleOptions = [
        { id: 'bicycle', label: 'Bicycle', icon: 'bicycle' },
        { id: 'scooter', label: 'Scooter/MB', icon: 'motorbike' },
        { id: 'car', label: 'Car', icon: 'car' },
    ];

    useEffect(() => {
        fetchUniversities();
    }, []);

    const fetchUniversities = async () => {
        try {
            const response = await api.get('/universities');
            setUniversities(response.data);
            if (response.data.length > 0) {
                setUniversityId(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching universities', error);
            // Non-blocking error since they can maybe choose later or it's handled server side,
            // but we'll log it.
        } finally {
            setFetchingUni(false);
        }
    };

    const handleCompleteSetup = async () => {
        if (!vehicleType) {
            Alert.alert('Error', 'Please select a vehicle type');
            return;
        }

        if (!universityId) {
            Alert.alert('Error', 'Please select a university to operate in');
            return;
        }

        setLoading(true);
        try {
            const response = await api.put('/auth/profile', {
                vehicleType,
                vehicleNumber: vehicleNumber.trim() || 'N/A',
                universityId
            });

            // Update stored partner data
            const storedPartner = await AsyncStorage.getItem('deliveryPartner');
            if (storedPartner) {
                const partner = JSON.parse(storedPartner);
                const updatedPartner = { ...partner, ...response.data.user };
                await AsyncStorage.setItem('deliveryPartner', JSON.stringify(updatedPartner));
            }

            Alert.alert(
                'Setup Complete!',
                'Your profile is ready. Welcome to the Laro Delivery team!',
                [{ text: 'Start Delivering', onPress: () => navigation.replace('Main') }]
            );
        } catch (error) {
            const message = error.response?.data?.message || 'Setup failed. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Finish Setup</Text>
                    <Text style={styles.subtitle}>Help us know your delivery style</Text>
                </View>

                {/* University Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SELECT UNIVERSITY COVERAGE</Text>
                    {fetchingUni ? (
                        <ActivityIndicator color={COLORS.primary} />
                    ) : (
                        <View style={styles.uniGrid}>
                            {universities.map((uni) => (
                                <TouchableOpacity
                                    key={uni.id}
                                    style={[
                                        styles.uniCard,
                                        universityId === uni.id && styles.activeUniCard
                                    ]}
                                    onPress={() => setUniversityId(uni.id)}
                                >
                                    <Ionicons
                                        name="school-outline"
                                        size={24}
                                        color={universityId === uni.id ? COLORS.primary : COLORS.gray}
                                    />
                                    <Text style={[
                                        styles.uniLabel,
                                        universityId === uni.id && styles.activeUniLabel
                                    ]}>
                                        {uni.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Vehicle Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SELECT VEHICLE</Text>
                    <View style={styles.vehicleGrid}>
                        {vehicleOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.vehicleCard,
                                    vehicleType === option.id && styles.activeVehicleCard
                                ]}
                                onPress={() => setVehicleType(option.id)}
                            >
                                <MaterialCommunityIcons
                                    name={option.icon}
                                    size={32}
                                    color={vehicleType === option.id ? COLORS.primary : COLORS.gray}
                                />
                                <Text style={[
                                    styles.vehicleLabel,
                                    vehicleType === option.id && styles.activeVehicleLabel
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {vehicleType !== 'bicycle' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>VEHICLE NUMBER</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="card-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. MH 12 AB 1234"
                                value={vehicleNumber}
                                onChangeText={setVehicleNumber}
                                autoCapitalize="characters"
                            />
                        </View>
                        <Text style={styles.helperText}>This helps customers identify your vehicle.</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.completeButton}
                    onPress={handleCompleteSetup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.completeButtonText}>Complete Setup</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipLink}
                    onPress={() => navigation.replace('Main')}
                >
                    <Text style={styles.skipText}>I'll do this later</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: 30 },
    header: { marginBottom: 40, marginTop: 20 },
    title: { fontSize: 32, fontWeight: '900', color: COLORS.black, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: COLORS.gray, marginTop: 8, fontWeight: '600' },
    section: { marginBottom: 35 },
    sectionTitle: {
        fontSize: 12, fontWeight: '900', color: '#94a3b8',
        marginBottom: 15, letterSpacing: 1.2
    },
    vehicleGrid: { flexDirection: 'row', gap: 12 },
    vehicleCard: {
        flex: 1, backgroundColor: COLORS.white, borderRadius: 20,
        paddingVertical: 20, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: COLORS.lightGray,
    },
    activeVehicleCard: {
        borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}05`,
        borderWidth: 2
    },
    vehicleLabel: { fontSize: 13, fontWeight: '700', color: COLORS.gray, marginTop: 8 },
    activeVehicleLabel: { color: COLORS.primary, fontWeight: '900' },

    uniGrid: { flexDirection: 'column', gap: 10 },
    uniCard: {
        flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16,
        padding: 15, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.lightGray,
    },
    activeUniCard: {
        borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}05`,
        borderWidth: 2
    },
    uniLabel: { fontSize: 15, fontWeight: '700', color: COLORS.gray, marginLeft: 12 },
    activeUniLabel: { color: COLORS.primary, fontWeight: '900' },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.white, borderRadius: 18,
        paddingHorizontal: 18, height: 60,
        borderWidth: 1, borderColor: COLORS.lightGray,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: COLORS.black, fontWeight: '600' },
    helperText: { fontSize: 13, color: COLORS.gray, marginTop: 10, fontStyle: 'italic' },
    completeButton: {
        backgroundColor: COLORS.primary, height: 65, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', marginTop: 10,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3, shadowRadius: 15, elevation: 12
    },
    completeButtonText: { color: COLORS.white, fontSize: 19, fontWeight: '900', letterSpacing: 0.8 },
    skipLink: { alignItems: 'center', marginTop: 25 },
    skipText: { color: COLORS.gray, fontWeight: '700', fontSize: 14 }
});
