const admin = require('../config/firebase');

/**
 * Send a push notification (Supports both Expo Push Tokens & Firebase FCM Tokens)
 * @param {string} token - The FCM registration token or Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional payload data
 */
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!token) {
        console.warn('[PUSH] No token provided for push notification.');
        return;
    }

    // Check if token is an Expo Push Token (mobile app)
    if (typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.includes('ExponentPushToken'))) {
        console.log('[PUSH] Dispatching Expo Push Notification to token:', token);
        try {
            const res = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: token,
                    sound: 'default',
                    title: title,
                    body: body,
                    data: data,
                }),
            });
            const result = await res.json();
            console.log('[EXPO PUSH RESPONSE]', result);
            return result;
        } catch (expoErr) {
            console.error('[EXPO PUSH ERROR]', expoErr);
            throw expoErr;
        }
    }

    // Fallback/Mock mobile tokens generated during dev/test
    if (typeof token === 'string' && token.startsWith('mobile_expo_token_')) {
        console.log('[PUSH DEV MOCK] Simulating push notification to dev token:', token, { title, body });
        return { status: 'mock_delivered', token };
    }

    // Firebase FCM Token (Web Push or Native FCM)
    if (!admin || !admin.apps || admin.apps.length === 0) {
        console.warn('[FIREBASE] Firebase Admin not initialized. Skipping FCM push notification.');
        return;
    }

    const message = {
        notification: {
            title,
            body
        },
        data: {
            ...data
        },
        token: token
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('[FCM PUSH SUCCESS]:', response);
        return response;
    } catch (error) {
        console.error('[FCM PUSH ERROR]:', error);
        throw error;
    }
};

module.exports = {
    sendPushNotification
};
