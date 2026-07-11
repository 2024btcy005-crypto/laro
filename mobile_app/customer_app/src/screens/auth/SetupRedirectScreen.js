import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SetupRedirectScreen
 * 
 * This is the entry-point screen for authenticated users.
 * It checks whether a fresh registration setup is pending,
 * and routes the user either to the setup flow (LinkWallet)
 * or directly to the main app (Main).
 */
export default function SetupRedirectScreen({ navigation }) {
    useEffect(() => {
        const checkSetup = async () => {
            try {
                const pending = await AsyncStorage.getItem('laro_setup_pending');
                if (pending === 'true') {
                    navigation.replace('LinkWallet', { isSetup: true });
                } else {
                    navigation.replace('Main');
                }
            } catch (e) {
                navigation.replace('Main');
            }
        };
        checkSetup();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f7f2' }}>
            <ActivityIndicator size="large" color="#056f36" />
        </View>
    );
}
