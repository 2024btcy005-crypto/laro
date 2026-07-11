import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, FlatList, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { updateCredentials, clearSetupPending } from '../../store/authSlice';
import { COLORS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function AddressBookScreen({ navigation, route }) {
    const { colors, isDarkMode } = useTheme();
    const isSetup = route?.params?.isSetup || false;
    const { user, selectedUniversity } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const addressKey = `@user_addresses_${user?.id || 'guest'}`;
    const [addresses, setAddresses] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', hostel: '', room: '', type: 'Home', universityId: '', universityName: '' });
    const [editingItem, setEditingItem] = useState(null);
    const [universities, setUniversities] = useState([]);
    const [uniModalVisible, setUniModalVisible] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'primary',
        confirmText: 'OK',
        onConfirm: () => { }
    });

    useEffect(() => {
        loadAddresses();
        fetchUniversities();
    }, [user?.address]);

    const fetchUniversities = async () => {
        try {
            const response = await api.get('/universities');
            if (Array.isArray(response.data)) {
                setUniversities(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch universities:', err);
        }
    };

    const loadAddresses = async () => {
        try {
            const storedAddresses = await AsyncStorage.getItem(addressKey);
            let currentAddresses = storedAddresses ? JSON.parse(storedAddresses) : [];
            
            // Sync with backend address if present
            if (user?.address && typeof user.address === 'string' && user.address.trim() !== '') {
                const match = currentAddresses.find(a => a && a.address === user.address);
                if (!match) {
                    const parts = user.address.split(',').map(p => p.trim());
                    const cloudAddr = {
                        id: 'cloud_' + Date.now().toString(),
                        type: 'Home',
                        name: user.name || 'Student',
                        phone: user.phoneNumber || '',
                        hostel: parts[0] || 'Main Dormitory',
                        room: parts[1] || 'Room 402',
                        address: user.address,
                        isDefault: currentAddresses.length === 0
                    };
                    currentAddresses = [cloudAddr, ...currentAddresses];
                    await AsyncStorage.setItem(addressKey, JSON.stringify(currentAddresses));
                }
            }
            setAddresses(currentAddresses);
        } catch (e) {
            console.error('[AddressBook] Failed to load addresses:', e);
        }
    };

    const saveAddressesAndSetState = async (newAddresses) => {
        try {
            await AsyncStorage.setItem(addressKey, JSON.stringify(newAddresses));
            setAddresses(newAddresses);

            // Sync default address to backend profile
            const defaultAddress = newAddresses.find(a => a.isDefault);
            if (defaultAddress) {
                const backendAddressFormat = `${defaultAddress.hostel}, ${defaultAddress.room}, ${defaultAddress.universityName}`;
                await api.put('/auth/profile', { address: backendAddressFormat });
                dispatch(updateCredentials({ user: { ...user, address: backendAddressFormat } }));
            }
        } catch (e) {
            console.error('[AddressBook] Failed to save addresses:', e);
        }
    };

    const handleDelete = (id) => {
        setAlertConfig({
            visible: true,
            title: 'Delete Address?',
            message: 'Are you sure you want to permanently remove this delivery address?',
            type: 'destructive',
            confirmText: 'Delete',
            onConfirm: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                let newAddresses = addresses.filter(a => a.id !== id);
                if (newAddresses.length > 0 && !newAddresses.some(a => a.isDefault)) {
                    newAddresses = newAddresses.map((a, index) => index === 0 ? { ...a, isDefault: true } : a);
                }
                saveAddressesAndSetState(newAddresses);
            }
        });
    };

    const handleSetDefault = (id) => {
        saveAddressesAndSetState(addresses.map(a => {
            if (a.id === id) return { ...a, isDefault: true };
            return { ...a, isDefault: false };
        }));
    };

    const handleAddOrEdit = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData({
                name: item.name || '',
                phone: item.phone || '',
                hostel: item.hostel || '',
                room: item.room || '',
                type: item.type || 'Home',
                universityId: item.universityId || '',
                universityName: item.universityName || ''
            });
        } else {
            setFormData({
                name: user?.name || '',
                phone: user?.phoneNumber || '',
                hostel: '',
                room: '',
                type: 'Home',
                universityId: selectedUniversity?.id || '',
                universityName: selectedUniversity?.name || ''
            });
        }
        setModalVisible(true);
    };

    const handleSaveAddress = () => {
        if (!formData.name.trim() || !formData.phone.trim() || !formData.hostel.trim() || !formData.room.trim() || !formData.universityId) {
            setAlertConfig({
                visible: true,
                title: 'Missing Info',
                message: 'Please fill in all the details including campus selection.',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }
        const fullAddress = `${formData.hostel}, ${formData.room}, ${formData.universityName}`;
        const updatedItem = {
            id: editingItem ? editingItem.id : Date.now().toString(),
            ...formData,
            address: fullAddress,
            isDefault: editingItem ? editingItem.isDefault : addresses.length === 0
        };

        let newAddresses = [];
        if (editingItem) {
            newAddresses = addresses.map(a => a.id === editingItem.id ? updatedItem : a);
        } else {
            newAddresses = [...addresses, updatedItem];
        }

        saveAddressesAndSetState(newAddresses);
        setModalVisible(false);
    };

    const renderAddress = (item) => {
        if (!item || !item.id) return null;
        
        let iconName = "home";
        let iconBg = "#e8f5e9";
        let iconColor = "#2e7d32";
        
        if (item.type === 'Work') {
            iconName = "book";
            iconBg = "#ffebee";
            iconColor = "#c62828";
        } else if (item.type === 'Other') {
            iconName = "people";
            iconBg = "#e8f0fe";
            iconColor = "#1a73e8";
        }

        return (
            <View 
                key={item.id} 
                style={[
                    styles.addressCard, 
                    item.isDefault ? styles.defaultCardBorder : styles.regularCardBorder
                ]}
            >
                {/* Top header row of card */}
                <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIconWrapper, { backgroundColor: iconBg }]}>
                        <Ionicons name={iconName} size={20} color={iconColor} />
                    </View>
                    {item.isDefault && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                    )}
                </View>

                {/* Body Content */}
                <Text style={styles.addressTitleText}>{item.hostel}</Text>
                <Text style={styles.addressDetailText}>{item.room}</Text>
                <Text style={styles.addressSubDetailText}>{item.name} • {item.phone}</Text>

                {/* Bottom Actions Row */}
                <View style={styles.cardActionsRow}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleAddOrEdit(item)}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    
                    {!item.isDefault && (
                        <TouchableOpacity style={styles.setDefaultBtn} onPress={() => handleSetDefault(item.id)}>
                            <Text style={styles.setDefaultBtnText}>Set Default</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />
            
            {/* Header */}
            <View style={styles.header}>
                {!isSetup ? (
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')}
                    >
                        <Ionicons name="chevron-back" size={24} color="#056f36" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
                <Text style={styles.headerTitle}>{isSetup ? 'Add Address' : 'Address Book'}</Text>
                {isSetup ? (
                    <View style={{ paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 11, color: '#888', fontWeight: '700' }}>3 / 3</Text>
                    </View>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, isSetup && { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
                {/* Title Section */}
                <Text style={styles.mainTitle}>{isSetup ? 'Your Campus Address' : 'My Locations'}</Text>
                <Text style={styles.subTitle}>{isSetup ? 'Add your dorm or hostel address for fast delivery. You can always edit it later.' : 'Manage your campus delivery drop-off points.'}</Text>

                {/* List of locations */}
                {addresses.length > 0 ? (
                    addresses.map(renderAddress)
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="location-outline" size={60} color="#bbb" />
                        <Text style={styles.emptyText}>No saved locations found.</Text>
                    </View>
                )}

                {/* Add New Address Button */}
                <TouchableOpacity style={styles.addAddressBtn} onPress={() => handleAddOrEdit()}>
                    <Ionicons name="location" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addAddressText}>Add New Address</Text>
                </TouchableOpacity>

                {/* Tip footer */}
                <Text style={styles.tipText}>Tip: You can add up to 10 saved campus locations.</Text>
            </ScrollView>

            {/* Address Form Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{editingItem ? 'Edit Location' : 'New Location'}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            
                            <TextInput 
                                style={styles.modalInput} 
                                placeholder="Full Name" 
                                placeholderTextColor="#999" 
                                value={formData.name} 
                                onChangeText={(text) => setFormData({ ...formData, name: text })} 
                            />
                            
                            <TextInput 
                                style={styles.modalInput} 
                                placeholder="Mobile Number" 
                                placeholderTextColor="#999" 
                                keyboardType="phone-pad" 
                                maxLength={10} 
                                value={formData.phone} 
                                onChangeText={(text) => setFormData({ ...formData, phone: text })} 
                            />

                            <Text style={styles.optionLabel}>Campus / University</Text>
                            <TouchableOpacity
                                style={styles.selectUniButton}
                                onPress={() => setUniModalVisible(true)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Ionicons name="school-outline" size={20} color="#056f36" />
                                    <Text style={[styles.selectUniText, formData.universityName && { color: '#111' }]}>
                                        {formData.universityName || 'Select Campus'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>

                            <View style={styles.rowInputs}>
                                <TextInput 
                                    style={[styles.modalInput, { flex: 1, marginRight: 10 }]} 
                                    placeholder="Hostel / Building Block" 
                                    placeholderTextColor="#999" 
                                    value={formData.hostel} 
                                    onChangeText={(text) => setFormData({ ...formData, hostel: text })} 
                                />
                                <TextInput 
                                    style={[styles.modalInput, { flex: 1 }]} 
                                    placeholder="Room No. / Details" 
                                    placeholderTextColor="#999" 
                                    value={formData.room} 
                                    onChangeText={(text) => setFormData({ ...formData, room: text })} 
                                />
                            </View>

                            <Text style={styles.optionLabel}>Location Tag</Text>
                            <View style={styles.typeSelector}>
                                {[
                                    { type: 'Home', label: 'Home' },
                                    { type: 'Work', label: 'Study/Work' },
                                    { type: 'Other', label: 'Other' }
                                ].map(item => (
                                    <TouchableOpacity
                                        key={item.type}
                                        style={[
                                            styles.typeButton, 
                                            formData.type === item.type && styles.typeButtonActive
                                        ]}
                                        onPress={() => setFormData({ ...formData, type: item.type })}
                                    >
                                        <Text style={[
                                            styles.typeButtonText, 
                                            formData.type === item.type && styles.typeButtonTextActive
                                        ]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalButtonsRow}>
                                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveAddress}>
                                    <Text style={styles.modalSaveText}>Save Location</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* University Selection Modal */}
            <Modal visible={uniModalVisible} transparent={true} animationType="slide" onRequestClose={() => setUniModalVisible(false)}>
                <View style={styles.uniModalOverlay}>
                    <View style={styles.uniModalContainer}>
                        <View style={styles.uniModalHeader}>
                            <Text style={styles.uniModalTitle}>Select Campus</Text>
                            <TouchableOpacity onPress={() => setUniModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={universities}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.uniItem}
                                    onPress={() => {
                                        setFormData({ ...formData, universityId: item.id, universityName: item.name });
                                        setUniModalVisible(false);
                                    }}
                                >
                                    <Ionicons name="school" size={20} color="#056f36" style={{ marginRight: 15 }} />
                                    <Text style={styles.uniItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 30, alignItems: 'center' }}>
                                    <Text style={{ color: '#999' }}>No campuses available.</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />

            {/* Setup Done Button — only shown during onboarding flow */}
            {isSetup && (
                <View style={styles.bottomStickyBar}>
                    {addresses.length === 0 && (
                        <Text style={{ textAlign: 'center', color: '#999', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                            Add an address above to continue
                        </Text>
                    )}
                    <TouchableOpacity
                        style={[styles.doneBtn, addresses.length === 0 && styles.doneBtnDisabled]}
                        disabled={addresses.length === 0}
                        onPress={() => {
                            dispatch(clearSetupPending());
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main' }],
                            });
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={20} color={addresses.length === 0 ? '#aaa' : '#fff'} style={{ marginRight: 8 }} />
                        <Text style={[styles.doneBtnText, addresses.length === 0 && { color: '#aaa' }]}>Done, Let's Go!</Text>
                    </TouchableOpacity>
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f7f2' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#f2f7f2'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#056f36' },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 },

    mainTitle: { fontSize: 24, fontWeight: '900', color: '#111' },
    subTitle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 25 },

    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1
    },
    defaultCardBorder: { borderColor: '#27c96c' },
    regularCardBorder: { borderColor: '#f0f4f0' },

    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    cardIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    defaultBadge: {
        backgroundColor: '#27c96c',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8
    },
    defaultBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },

    addressTitleText: { fontSize: 16, fontWeight: '900', color: '#111' },
    addressDetailText: { fontSize: 13, color: '#666', marginTop: 4, fontWeight: '600' },
    addressSubDetailText: { fontSize: 12, color: '#999', marginTop: 2, fontWeight: '500' },

    cardActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 12
    },
    editBtn: {
        flex: 1,
        backgroundColor: '#f0f4f0',
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    editBtnText: { color: '#056f36', fontSize: 13, fontWeight: '800' },
    setDefaultBtn: {
        flex: 1.2,
        backgroundColor: '#fff',
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    setDefaultBtnText: { color: '#666', fontSize: 13, fontWeight: '800' },
    deleteBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center'
    },

    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
        marginTop: 10,
        fontWeight: '700'
    },

    addAddressBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 52,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3
    },
    addAddressText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    tipText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        marginTop: 15
    },

    // Modal Form styling
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: '85%'
    },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 20 },
    modalInput: {
        height: 48,
        borderWidth: 1.5,
        borderColor: '#edf2ed',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 14,
        color: '#111',
        marginBottom: 12,
        fontWeight: '700'
    },
    optionLabel: { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 0.5, marginTop: 4, marginBottom: 8 },
    selectUniButton: {
        height: 48,
        borderWidth: 1.5,
        borderColor: '#edf2ed',
        borderRadius: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    selectUniText: { color: '#999', fontSize: 14, fontWeight: '700' },
    rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
    
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20
    },
    typeButton: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#edf2ed',
        justifyContent: 'center',
        alignItems: 'center'
    },
    typeButtonActive: {
        backgroundColor: '#edf5ed',
        borderColor: '#27c96c'
    },
    typeButtonText: { color: '#666', fontSize: 12, fontWeight: '800' },
    typeButtonTextActive: { color: '#056f36' },

    modalButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
        marginBottom: 15
    },
    modalCancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalCancelText: { color: '#666', fontSize: 14, fontWeight: '800' },
    modalSaveButton: {
        flex: 1.5,
        backgroundColor: '#056f36',
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalSaveText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    // Campus selection modal
    uniModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    uniModalContainer: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        maxHeight: '60%'
    },
    uniModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f4f0',
        paddingBottom: 15,
        marginBottom: 10
    },
    uniModalTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
    uniItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f7faf7'
    },
    uniItemText: { fontSize: 14, color: '#333', fontWeight: '800' },
    bottomStickyBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e6ede6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 6
    },
    doneBtn: {
        backgroundColor: '#056f36',
        borderRadius: 16,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '850'
    },
    doneBtnDisabled: {
        backgroundColor: '#e0e0e0',
        shadowOpacity: 0,
        elevation: 0,
    }
});
