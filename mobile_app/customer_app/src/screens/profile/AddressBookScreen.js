import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { updateCredentials } from '../../store/authSlice';
import { COLORS } from '../../theme';
import LaroAlert from '../../components/LaroAlert';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'react-native';
import api from '../../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

    React.useEffect(() => {
        loadAddresses();
        fetchUniversities();
        if (isSetup) {
            handleAddOrEdit();
        }
    }, [isSetup, user?.address]);

    const fetchUniversities = async () => {
        try {
            const response = await api.get('/universities');
            if (Array.isArray(response.data)) {
                setUniversities(response.data);
            } else {
                console.warn('[AddressBook] Universities response is not an array:', response.data);
                setUniversities([]);
            }
        } catch (err) {
            console.error('Failed to fetch universities:', err);
            setUniversities([]);
        }
    };

    const loadAddresses = async () => {
        try {
            const storedAddresses = await AsyncStorage.getItem(addressKey);
            let currentAddresses = [];

            try {
                currentAddresses = storedAddresses ? JSON.parse(storedAddresses) : [];
                if (!Array.isArray(currentAddresses)) currentAddresses = [];
            } catch (e) {
                console.error('[AddressBook] Failed to parse stored addresses:', e);
                currentAddresses = [];
            }

            if (user?.address && typeof user.address === 'string' && user.address.trim() !== '') {
                const fullAddress = user.address;
                const parts = fullAddress.split(',').map(p => p.trim());

                // If local is empty OR backend address is not in our local list, add/update it
                const match = currentAddresses.find(a => a && a.address === fullAddress);

                if (!match) {
                    console.log('[AddressBook] Syncing backend address to local:', fullAddress);
                    const cloudAddr = {
                        id: 'cloud_' + Date.now().toString(),
                        type: 'Home',
                        name: user.name || 'Student',
                        phone: user.phoneNumber || '',
                        hostel: parts[0] || '',
                        room: parts[1] || '',
                        address: fullAddress,
                        isDefault: currentAddresses.length === 0 // Make default if nothing else exists
                    };

                    // Add to list and deduplicate
                    currentAddresses = [cloudAddr, ...currentAddresses];

                    const uniqueAddresses = [];
                    const seen = new Set();
                    for (const item of currentAddresses) {
                        if (item && item.address && !seen.has(item.address)) {
                            seen.add(item.address);
                            uniqueAddresses.push(item);
                        }
                    }

                    setAddresses(uniqueAddresses);
                    await AsyncStorage.setItem(addressKey, JSON.stringify(uniqueAddresses));
                } else {
                    setAddresses(currentAddresses);
                }
            } else {
                setAddresses(currentAddresses);
            }
        } catch (error) {
            console.error('Failed to load addresses:', error);
            setAddresses([]);
        }
    };

    const syncAddressToBackend = async (addrObj) => {
        const fullAddress = `${addrObj.hostel}, ${addrObj.room}, ${addrObj.universityName || 'Campus'}`;
        if (user?.address === fullAddress) return;

        try {
            await authAPI.updateProfile({ address: fullAddress });
            dispatch(updateCredentials({ user: { address: fullAddress } }));
        } catch (error) {
            console.error('[AddressBook] Failed to sync address to backend:', error);
        }
    };

    const saveAddressesAndSetState = async (newAddresses) => {
        setAddresses(newAddresses);
        try {
            await AsyncStorage.setItem(addressKey, JSON.stringify(newAddresses));

            // Sync default to backend
            const defaultAddress = newAddresses.find(a => a.isDefault);
            if (defaultAddress) {
                syncAddressToBackend(defaultAddress);
            }
        } catch (error) {
            console.error('Failed to save addresses:', error);
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
                name: '',
                phone: '',
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

        if (editingItem) {
            saveAddressesAndSetState(addresses.map(a => a.id === editingItem.id ? updatedItem : a));
        } else {
            saveAddressesAndSetState([...addresses, updatedItem]);
        }

        setModalVisible(false);

        if (isSetup) {
            const hasPhone = !!user?.phoneNumber;
            const nextScreen = hasPhone ? 'Main' : 'LinkWallet';

            Alert.alert(
                'Address Saved',
                hasPhone ? 'Your delivery address has been set successfully!' : 'Address saved! Next: Activate your Laro Wallet.',
                [
                    {
                        text: 'Continue',
                        onPress: () => navigation.navigate(nextScreen, { isSetup: true })
                    }
                ]
            );
        }
    };

    const renderAddress = (item) => {
        if (!item || !item.id) return null;
        return (
            <View key={item.id} style={[styles.addressCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                <View style={styles.addressTypeHeader}>
                    <Ionicons name={item.type === 'Home' ? 'home-outline' : 'business-outline'} size={20} color={colors.black} />
                    <Text style={[styles.addressType, { color: colors.black }]}>{item.type}</Text>
                </View>
                {item.name ? <Text style={[styles.addressName, { color: colors.black }]}>{item.name} • {item.phone}</Text> : null}
                <Text style={[styles.addressText, { color: colors.gray }]}>{item.address}</Text>
                <View style={[styles.addressActions, { borderTopColor: colors.border }]}>
                    {item.isDefault ? (
                        <Text style={styles.defaultText}>Default Address</Text>
                    ) : (
                        <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
                            <Text style={styles.actionText}>Set as Default</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.editDeleteActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleAddOrEdit(item)}>
                            <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>
                        <Text style={[styles.actionDivider, { color: colors.border }]}>|</Text>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                            <Text style={[styles.actionTextDelete, { color: colors.gray }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.white} />
            <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={26} color={colors.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.black }]}>Address Book</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={[styles.addAddressContainer, { backgroundColor: colors.white, borderColor: isDarkMode ? colors.border : '#fff0f6' }]} onPress={() => handleAddOrEdit()}>
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                    <Text style={styles.addAddressText}>Add New Address</Text>
                </TouchableOpacity>

                <Text style={[styles.savedAddressesTitle, { color: colors.gray }]}>SAVED ADDRESSES</Text>
                {addresses.map(renderAddress)}
            </ScrollView>

            <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.white }]}>
                        <Text style={[styles.modalTitle, { color: colors.black }]}>{editingItem ? 'Edit Address' : 'New Address'}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TextInput style={[styles.modalInputSingle, { backgroundColor: colors.background, color: colors.black, borderColor: colors.border }]} placeholder="Full Name" placeholderTextColor={colors.gray} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
                            <TextInput style={[styles.modalInputSingle, { backgroundColor: colors.background, color: colors.black, borderColor: colors.border }]} placeholder="Mobile Number" placeholderTextColor={colors.gray} keyboardType="phone-pad" maxLength={10} value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} />

                            <Text style={[styles.optionLabel, { color: colors.gray, marginTop: 5, marginBottom: 10 }]}>Campus / University</Text>
                            <TouchableOpacity
                                style={[styles.modalInputSingle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setUniModalVisible(true)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <MaterialCommunityIcons name="school" size={20} color={colors.primary} />
                                    <Text style={{ color: formData.universityName ? colors.black : colors.gray, fontSize: 15, fontWeight: '600' }}>
                                        {formData.universityName || 'Select Campus'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color={colors.gray} />
                            </TouchableOpacity>

                            <View style={styles.rowInputs}>
                                <TextInput style={[styles.modalInputSingle, { flex: 1, marginRight: 10, backgroundColor: colors.background, color: colors.black, borderColor: colors.border }]} placeholder="Hostel (e.g. Hostel 4)" placeholderTextColor={colors.gray} value={formData.hostel} onChangeText={(text) => setFormData({ ...formData, hostel: text })} />
                                <TextInput style={[styles.modalInputSingle, { flex: 1, backgroundColor: colors.background, color: colors.black, borderColor: colors.border }]} placeholder="Room No." placeholderTextColor={colors.gray} value={formData.room} onChangeText={(text) => setFormData({ ...formData, room: text })} />
                            </View>

                            <View style={styles.typeSelector}>
                                {['Home', 'Work', 'Other'].map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.typeButton, { borderColor: colors.border }, formData.type === type && [styles.typeButtonActive, { backgroundColor: isDarkMode ? '#1e1b4b' : '#fff0f6' }]]}
                                        onPress={() => setFormData({ ...formData, type })}
                                    >
                                        <Text style={[styles.typeButtonText, { color: colors.gray }, formData.type === type && styles.typeButtonTextActive]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalButtonsRow}>
                                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                                    <Text style={[styles.modalCancelText, { color: colors.gray }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveAddress}>
                                    <Text style={styles.modalSaveText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* University Selection Modal */}
            <Modal visible={uniModalVisible} transparent={true} animationType="slide" onRequestClose={() => setUniModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.uniModalContent, { backgroundColor: colors.white }]}>
                        <View style={styles.uniModalHeader}>
                            <Text style={[styles.modalTitle, { marginBottom: 0, color: colors.black }]}>Select Campus</Text>
                            <TouchableOpacity onPress={() => setUniModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.black} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={universities}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.uniItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setFormData({ ...formData, universityId: item.id, universityName: item.name });
                                        setUniModalVisible(false);
                                    }}
                                >
                                    <MaterialCommunityIcons name="school-outline" size={22} color={colors.primary} />
                                    <Text style={[styles.uniItemText, { color: colors.black }]}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingBottom: 20 }}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#1c1c1c', letterSpacing: -0.5 },

    scrollContent: { padding: 15 },
    addAddressContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#fff0f6', borderStyle: 'dashed', marginBottom: 25 },
    addAddressText: { color: COLORS.primary, fontSize: 16, fontWeight: '900', marginLeft: 10 },

    savedAddressesTitle: { fontSize: 12, color: '#aaa', fontWeight: '900', marginBottom: 15, letterSpacing: 1 },

    addressCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 15, borderWidth: 1, borderColor: '#f8f8f8' },
    addressTypeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    addressType: { fontSize: 16, fontWeight: '900', color: '#1c1c1c', marginLeft: 8 },
    addressText: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 18 },

    addressActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8f8f8', paddingTop: 15 },
    defaultText: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
    editDeleteActions: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { paddingHorizontal: 5 },
    actionText: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
    actionTextDelete: { color: '#aaa', fontSize: 13, fontWeight: 'bold' },
    actionDivider: { color: '#eee', marginHorizontal: 8 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 26, 46, 0.75)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a2e', marginBottom: 20 },
    modalInputSingle: { borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 12, padding: 14, fontSize: 15, color: '#1a1a2e', backgroundColor: '#f8fafc', marginBottom: 15 },
    rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
    typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    typeButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
    typeButtonActive: { backgroundColor: '#fff0f6', borderColor: COLORS.primary },
    typeButtonText: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
    typeButtonTextActive: { color: COLORS.primary, fontWeight: '900' },
    addressName: { fontSize: 15, fontWeight: '900', color: '#1a1a2e', marginBottom: 4 },
    modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    modalCancelButton: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
    modalCancelText: { color: '#94a3b8', fontSize: 15, fontWeight: 'bold' },
    modalSaveButton: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15, justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10 },
    modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '900' },
    optionLabel: { fontSize: 14, fontWeight: '800', color: '#64748b' },
    uniModalContent: { width: '90%', maxHeight: '70%', borderRadius: 24, padding: 25 },
    uniModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    uniItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, gap: 12 },
    uniItemText: { fontSize: 16, fontWeight: '600' }
});
