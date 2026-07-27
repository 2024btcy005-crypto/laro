import { Platform } from 'react-native';
import api from './api';

/**
 * Register mobile push notifications and send Expo/FCM token to backend
 */
export const registerForPushNotificationsAsync = async () => {
    try {
        let token;
        
        // Dynamic import of expo-notifications if available in standard Expo environment
        let Notifications;
        try {
            Notifications = require('expo-notifications');
        } catch (e) {
            console.warn('[PushNotifications] expo-notifications package not installed or native module missing.');
        }

        if (Notifications) {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                }),
            });

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('[PushNotifications] Failed to get push token for push notification!');
                return null;
            }

            token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
            // Fallback mobile device token generation for test/simulator environments
            token = `mobile_expo_token_${Platform.OS}_${Date.now()}`;
        }

        console.log('[PushNotifications] Device Token:', token);

        // Sync device token to backend User record
        if (token) {
            await api.post('/auth/fcm-token', { fcmToken: token });
            console.log('[PushNotifications] Successfully synced device FCM token to backend.');
        }

        return token;
    } catch (error) {
        console.error('[PushNotifications] Error registering push notifications:', error);
        return null;
    }
};
