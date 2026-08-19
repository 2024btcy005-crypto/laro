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
        let Constants;
        try {
            Notifications = require('expo-notifications');
            Constants = require('expo-constants').default;
        } catch (e) {
            console.warn('[PushNotifications] expo-notifications package not installed or native module missing.');
        }

        if (Notifications) {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: false,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                }),
            });

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#006d33',
                });
            }

            try {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus === 'granted') {
                    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || '26511b09-ff05-4cec-a69a-90668ba66022';
                    try {
                        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
                        console.log('[PushNotifications] Expo Push Token obtained:', token);
                    } catch (expoPushErr) {
                        console.warn('[PushNotifications] getExpoPushTokenAsync failed. Attempting native device push token:', expoPushErr.message);
                        try {
                            const deviceTokenObj = await Notifications.getDevicePushTokenAsync();
                            token = deviceTokenObj?.data || (typeof deviceTokenObj === 'string' ? deviceTokenObj : null);
                            console.log('[PushNotifications] Native Device Push Token obtained:', token);
                        } catch (devicePushErr) {
                            console.warn('[PushNotifications] getDevicePushTokenAsync failed:', devicePushErr.message);
                        }
                    }
                }
            } catch (tokenErr) {
                console.warn('[PushNotifications] Error obtaining push token:', tokenErr.message);
                token = `mobile_expo_token_${Platform.OS}_${Date.now()}`;
            }
        } else {
            token = `mobile_expo_token_${Platform.OS}_${Date.now()}`;
        }

        if (!token) {
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
