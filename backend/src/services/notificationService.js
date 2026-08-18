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

/**
 * Notify eligible delivery partners via push notification when a new order is placed
 * @param {object} order - The created order instance with shop info
 */
const notifyEligibleRidersNewOrder = async (order) => {
    try {
        const { User, Shop } = require('../models');
        const shop = await Shop.findByPk(order.shopId);
        const shopName = shop ? shop.name : 'Campus Store';
        const isRestaurant = shop ? shop.shopType === 'RESTAURANT' : false;

        // Fetch active delivery partners
        const whereClause = {
            role: 'delivery',
            isActive: true
        };
        if (order.universityId) {
            whereClause.universityId = order.universityId;
        }

        const riders = await User.findAll({ where: whereClause });

        const title = `🚀 New Delivery Order Available!`;
        const body = `New order from ${shopName} (₹${parseFloat(order.totalAmount || 0).toFixed(2)}). Tap to view and accept delivery!`;

        let notifiedCount = 0;
        for (const rider of riders) {
            let isEligible = false;

            if (rider.deliveryScope === 'ALL' || !rider.deliveryScope) {
                isEligible = true;
            } else if (isRestaurant && rider.deliveryScope === 'RESTAURANTS_ONLY') {
                isEligible = true;
            } else if (!isRestaurant && rider.deliveryScope === 'GROCERIES_ONLY') {
                isEligible = true;
            } else if (rider.deliveryScope === 'SPECIFIC_SHOP' && rider.assignedShopId === order.shopId) {
                isEligible = true;
            } else if (rider.assignedShopId === order.shopId) {
                isEligible = true;
            }

            if (isEligible) {
                notifiedCount++;
                if (rider.fcmToken) {
                    try {
                        await sendPushNotification(rider.fcmToken, title, body, {
                            orderId: order.id,
                            type: 'NEW_DELIVERY_ORDER'
                        });
                    } catch (pushErr) {
                        console.error(`[RIDER PUSH ERR] Failed for rider ${rider.id}:`, pushErr.message);
                    }
                }
            }
        }
        console.log(`[RIDER PUSH] Notified ${notifiedCount} eligible delivery partners for order #${order.id}`);
    } catch (err) {
        console.error('[RIDER PUSH ERROR]', err.message);
    }
};

module.exports = {
    sendPushNotification,
    notifyEligibleRidersNewOrder
};
