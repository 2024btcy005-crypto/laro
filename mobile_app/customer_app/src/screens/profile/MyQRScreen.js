import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, StatusBar, Image, Dimensions, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

export default function MyQRScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { user } = useSelector(state => state.auth);
    const insets = useSafeAreaInsets();
    const phone = user?.phoneNumber || '9876543210';
    const name = user?.name || 'Alex Thompson';
    const username = name.replace(/\s+/g, '').toLowerCase();

    // Free QR code API colored in Laro Brand Green (#056f36)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${phone}&color=056f36&bgcolor=ffffff&margin=10`;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Send me Laro Coins! My number: +91 ${phone}`,
                title: 'My Laro QR',
            });
        } catch (e) { /* ignore */ }
    };

    const handleDownload = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need permission to save the QR code to your photo library.');
                return;
            }

            const fileUri = `${FileSystem.documentDirectory}laro_qr_${phone}.png`;
            const downloadRes = await FileSystem.downloadAsync(qrUrl, fileUri);
            if (downloadRes.status === 200) {
                await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
                Alert.alert('Success', 'QR code saved to your gallery!');
            } else {
                throw new Error('Failed to download image file');
            }
        } catch (error) {
            console.error('[Download] Error:', error.message);
            Alert.alert('Error', 'Failed to save QR code. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f7f2" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={22} color="#056f36" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My QR</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Content area */}
            <View style={styles.contentBody}>
                
                {/* User display details */}
                <Text style={styles.userDisplayName}>{name}</Text>
                
                <View style={styles.laroIdBadge}>
                    <Text style={styles.laroIdText}>Laro ID: @{username}</Text>
                </View>

                {/* QR Code Card */}
                <View style={styles.qrCardContainer}>
                    {/* Top corner brackets */}
                    <View style={[styles.cornerBracket, { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                    <View style={[styles.cornerBracket, { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3 }]} />
                    
                    {/* QR Code image */}
                    <View style={styles.qrWrapper}>
                        <Image source={{ uri: qrUrl }} style={styles.qrImage} />
                    </View>

                    {/* Bottom corner brackets */}
                    <View style={[styles.cornerBracket, { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                    <View style={[styles.cornerBracket, { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3 }]} />
                </View>

                {/* Instructions Info Card */}
                <View style={styles.instructionsCard}>
                    <Ionicons name="information-circle-outline" size={20} color="#056f36" style={{ marginRight: 10 }} />
                    <Text style={styles.instructionsText}>
                        Show this QR code to receive Laro Coins instantly from vendors or friends.
                    </Text>
                </View>

                {/* Action buttons row */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.shareBtnText}>Share QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                        <Ionicons name="download-outline" size={18} color="#056f36" style={{ marginRight: 8 }} />
                        <Text style={styles.downloadBtnText}>Download</Text>
                    </TouchableOpacity>
                </View>

            </View>
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
        paddingVertical: 12,
        backgroundColor: '#f2f7f2'
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#056f36' },
    headerAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#056f36' },

    contentBody: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 30
    },

    userDisplayName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111',
        marginBottom: 8
    },
    laroIdBadge: {
        backgroundColor: '#d8e5d8',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 30
    },
    laroIdText: {
        fontSize: 12,
        fontWeight: '850',
        color: '#056f36'
    },

    // QR Card styling
    qrCardContainer: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 36,
        width: width - 48,
        height: width - 48,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 30
    },
    cornerBracket: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#056f36' // Green corner brackets matching mockup
    },
    qrWrapper: {
        width: '90%',
        height: '90%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    qrImage: {
        width: '90%',
        height: '90%',
        resizeMode: 'contain'
    },

    // Info card description
    instructionsCard: {
        backgroundColor: '#e6ede6', // Light beige-green container tint
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d0dcd0',
        width: '100%',
        marginBottom: 30
    },
    instructionsText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
        lineHeight: 18
    },

    // Action button rows
    actionButtonsRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12
    },
    shareBtn: {
        flex: 1,
        backgroundColor: '#056f36', // Solid dark green button
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
    shareBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '850'
    },
    downloadBtn: {
        flex: 1,
        backgroundColor: '#e6ede6', // Light grey-green button
        borderWidth: 1.5,
        borderColor: '#d0dcd0',
        borderRadius: 16,
        height: 52,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    downloadBtnText: {
        color: '#056f36',
        fontSize: 14,
        fontWeight: '850'
    }
});
