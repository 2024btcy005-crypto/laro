import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform, 
    ScrollView,
    ActivityIndicator,
    Alert 
} from 'react-native';
import { useDispatch } from 'react-redux';
import { signIn } from '../../store/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LaroAlert from '../../components/LaroAlert';

const PRIMARY_GREEN = '#056f36';
const MUTED_GREEN_BG = '#f3fbf4';
const SCREEN_BG = '#fafdfa';
const BORDER_COLOR = '#dcecdc';
const TEXT_MUTED = '#667066';

export default function RegisterScreen({ navigation }) {
    const route = useRoute();
    const { phoneNumber: initialPhone } = route.params || {};

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'primary',
        onConfirm: () => { }
    });

    const handleRegister = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Name', 'Please enter your full name');
            return;
        }
        if (!email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match');
            return;
        }
        if (!agreeTerms) {
            Alert.alert('Terms & Conditions', 'Please agree to the Terms of Service & Privacy Policy');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/register', {
                phoneNumber: initialPhone,
                name,
                email,
                password,
                role: 'customer'
            });

            const { token, id, name: userName, phoneNumber, role } = response.data;
            const userData = { id, name: userName, phoneNumber, role };

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            // Dispatch signIn with setupPending=true — this tells App.js to start at LinkWallet
            dispatch(signIn({ user: userData, token, setupPending: true }));
        } catch (error) {
            console.error('[REGISTER ERROR]', error.response?.data || error.message);
            setAlertConfig({
                visible: true,
                title: 'Registration Failed',
                message: error.response?.data?.message || 'We could not create your account. Please check your details and try again.',
                type: 'destructive',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Laro</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.logoSection}>
                        <View style={styles.logoBox}>
                            <View style={styles.logoInner}>
                                <Ionicons name="flash" size={32} color="#9D174D" />
                            </View>
                            <View style={styles.campusBadge}>
                                <Text style={styles.campusBadgeText}>CAMPUS</Text>
                            </View>
                        </View>
                        <Text style={styles.mainTitle}>Join Laro</Text>
                        <Text style={styles.subtitle}>The smartest way to get what you need on campus.</Text>
                    </View>

                    <View style={styles.formCard}>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Campus Email</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="school-outline" size={20} color={PRIMARY_GREEN} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="username@university.edu"
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color={PRIMARY_GREEN} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="........"
                                    placeholderTextColor="#999"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY_GREEN} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="........"
                                    placeholderTextColor="#999"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                        </View>

                        <View style={styles.checkboxContainer}>
                            <TouchableOpacity 
                                style={[styles.checkbox, agreeTerms && styles.checkboxActive]} 
                                onPress={() => setAgreeTerms(!agreeTerms)}
                            >
                                {agreeTerms ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                            </TouchableOpacity>
                            <Text style={styles.checkboxText}>
                                {"I agree to the "}
                                <Text style={styles.linkText}>Terms of Service</Text>
                                {" and "}
                                <Text style={styles.linkText}>Privacy Policy</Text>
                                {"."}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.createButton, 
                                (name && email && password && confirmPassword && agreeTerms) ? styles.createButtonActive : styles.createButtonDisabled
                            ]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Account</Text>
                            )}
                            {!loading && (
                                <Ionicons name="chevron-forward" size={18} color="#fff" />
                            )}
                        </TouchableOpacity>

                    </View>

                    <View style={styles.loginRedirectContainer}>
                        <Text style={styles.loginRedirectText}>
                            {"Already have an account? "}
                            <Text style={styles.loginRedirectLink} onPress={() => navigation.navigate('Login')}>
                                {"Log In"}
                            </Text>
                        </Text>
                    </View>

                    <View style={styles.socialProof}>
                        <View style={styles.avatarRow}>
                            <View style={[styles.avatar, { backgroundColor: '#e2ede2', zIndex: 4 }]}>
                                <Text style={styles.avatarText}>JD</Text>
                            </View>
                            <View style={[styles.avatar, { backgroundColor: '#87df9b', zIndex: 3, marginLeft: -12 }]}>
                                <Text style={styles.avatarText}>SN</Text>
                            </View>
                            <View style={[styles.avatar, { backgroundColor: '#a6ebb3', zIndex: 2, marginLeft: -12 }]}>
                                <Text style={styles.avatarText}>KL</Text>
                            </View>
                            <View style={[styles.avatar, { backgroundColor: '#ff9c73', zIndex: 1, marginLeft: -12 }]}>
                                <Text style={styles.avatarText}>+2k</Text>
                            </View>
                        </View>
                        <Text style={styles.socialProofText}>Trusted by 2,000+ students on your campus</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <LaroAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: SCREEN_BG },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 50,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: PRIMARY_GREEN,
    },
    scroll: { 
        flexGrow: 1, 
        paddingHorizontal: 20, 
        paddingBottom: 40 
    },
    logoSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    logoBox: {
        width: 100,
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        position: 'relative',
    },
    logoInner: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: '#fff0f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    campusBadge: {
        position: 'absolute',
        bottom: -8,
        backgroundColor: '#39db80',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    campusBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a2e1d',
        marginTop: 10,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: TEXT_MUTED,
        textAlign: 'center',
        paddingHorizontal: 30,
        lineHeight: 20,
    },
    formCard: {
        backgroundColor: MUTED_GREEN_BG,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.02,
        shadowRadius: 16,
        elevation: 1,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2a3a2d',
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 14,
        height: 54,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1c2c1e',
        height: '100%',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        paddingRight: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: PRIMARY_GREEN,
        borderRadius: 5,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxActive: {
        backgroundColor: PRIMARY_GREEN,
    },
    checkboxText: {
        fontSize: 13,
        color: '#3a4a3d',
        flex: 1,
        lineHeight: 18,
    },
    linkText: {
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
    },
    createButton: {
        height: 54,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 15,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    createButtonActive: {
        backgroundColor: PRIMARY_GREEN,
    },
    createButtonDisabled: {
        backgroundColor: '#a3cfa8',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginRedirectContainer: {
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 25,
    },
    loginRedirectText: {
        fontSize: 15,
        color: TEXT_MUTED,
    },
    loginRedirectLink: {
        color: PRIMARY_GREEN,
        fontWeight: 'bold',
    },
    socialProof: {
        alignItems: 'center',
        marginTop: 10,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: SCREEN_BG,
    },
    avatarText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2a3a2d',
    },
    socialProofText: {
        fontSize: 12,
        color: TEXT_MUTED,
        textAlign: 'center',
    },
});
