const admin = require('../config/firebase');

/**
 * Send a push notification using Firebase Cloud Messaging
 * @param {string} token - The FCM registration token of the user's device
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional payload data
 */
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!admin || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn('Firebase Admin not initialized or missing credentials. Skipping push notification.');
        return;
    }

    if (!token) {
        console.warn('No FCM token provided for push notification.');
        return;
    }

    const message = {
        notification: {
            title,
            body
        },
        data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standardize click action if needed for RN
        },
        token: token
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

module.exports = {
    sendPushNotification
};
