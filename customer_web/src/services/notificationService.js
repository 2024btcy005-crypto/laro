import { API_BASE_URL } from '../api';

/**
 * Register web notification permissions and sync FCM/WebPush token with the backend
 */
export const registerWebPushNotifications = async () => {
    try {
        if (!('Notification' in window)) {
            console.warn('[WebPush] This browser does not support desktop notifications.');
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('[WebPush] Notification permission was denied or dismissed.');
            return null;
        }

        // Generate or retrieve mock/browser Web Push token
        let webToken = localStorage.getItem('webFcmToken');
        if (!webToken) {
            webToken = `web_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('webFcmToken', webToken);
        }

        // Send token to backend if logged in
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`${API_BASE_URL}/auth/fcm-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ fcmToken: webToken })
            });
            console.log('[WebPush] Successfully registered FCM/Web token with backend.');
        }

        return webToken;
    } catch (err) {
        console.error('[WebPush] Error registering notification token:', err);
        return null;
    }
};

/**
 * Show a local browser notification alert
 */
export const displayLocalNotification = (title, body, icon = '/favicon.ico') => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon });
    }
};
