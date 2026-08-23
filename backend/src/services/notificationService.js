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

        const { Op } = require('sequelize');
        const whereClause = {
            role: 'delivery',
            isActive: true
        };
        if (order.universityId) {
            whereClause[Op.or] = [
                { universityId: order.universityId },
                { universityId: null }
            ];
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
                const token = rider.fcmToken || 'ExponentPushToken[dev_test_token]';
                try {
                    await sendPushNotification(token, title, body, {
                        orderId: order.id,
                        type: 'NEW_DELIVERY_ORDER'
                    });
                } catch (pushErr) {
                    console.error(`[RIDER PUSH ERR] Failed for rider ${rider.id}:`, pushErr.message);
                }
            }
        }
        console.log(`[RIDER PUSH] Notified ${notifiedCount} eligible delivery partners for order #${order.id}`);
    } catch (err) {
        console.error('[RIDER PUSH ERROR]', err.message);
    }
};

const { notifyCustomerWalletUpdate } = require('./socketService');

/**
 * Send push & real-time notification for Laro Wallet Transactions (Credit/Debit)
 * @param {object} user - User model instance or object containing id and pushToken/fcmToken
 * @param {object} txData - { type: 'credit'|'debit', amount, description, balanceAfter }
 */
const notifyWalletTransaction = async (user, { type, amount, description, balanceAfter }) => {
    if (!user) return;
    try {
        const isCredit = type === 'credit';
        const icon = isCredit ? '🎉' : '💸';
        const actionText = isCredit ? 'Credited' : 'Debited';
        const title = `${icon} ${amount} Laro Coins ${actionText}!`;
        const body = `${description}. New balance: ${balanceAfter} Ł.`;

        // 1. Send Push Notification if user has token
        const pushToken = user.pushToken || user.fcmToken;
        if (pushToken) {
            await sendPushNotification(pushToken, title, body, {
                type: 'WALLET_TRANSACTION',
                txType: type,
                amount,
                balanceAfter
            });
        }

        // 2. Send Real-time Socket Event to Customer Room
        notifyCustomerWalletUpdate(user.id, {
            type,
            amount,
            description,
            balanceAfter,
            title,
            body
        });

        console.log(`[WALLET NOTIFICATION] ${type.toUpperCase()} sent to User #${user.id}: ${title}`);
    } catch (err) {
        console.error('[WALLET NOTIFICATION ERROR]', err.message);
    }
};

/**
 * Send event-driven push notification with DELIVERY_LIVE_STATUS data payload
 * @param {object} customer - User model instance or customer data object
 * @param {object} liveStatusData - { orderId, restaurantName, deliveryPartnerName, status, etaMinutes, progress, deepLink }
 */
const sendLiveDeliveryStatusNotification = async (customer, liveStatusData) => {
    if (!customer) return;
    try {
        const pushToken = customer.fcmToken || customer.pushToken;
        const { orderId, restaurantName, deliveryPartnerName, status, etaMinutes, progress, deepLink } = liveStatusData;

        let title = '🛵 Live Delivery Update';
        let body = `${restaurantName || 'Laro Kitchen'} • Status: ${status}`;

        switch (status) {
            case 'PLACED':
                title = '📦 Order Placed!';
                body = `Your order #${String(orderId).slice(0, 8)} has been placed.`;
                break;
            case 'CONFIRMED':
                title = '✅ Order Confirmed!';
                body = `${restaurantName || 'Store'} has confirmed your order.`;
                break;
            case 'PREPARING':
                title = '🍔 Preparing Your Order';
                body = `${restaurantName || 'Kitchen'} is preparing your food (ETA: ${etaMinutes || 25} min).`;
                break;
            case 'READY_FOR_PICKUP':
                title = '📦 Ready For Pickup';
                body = `Order is packed and ready for delivery partner pickup.`;
                break;
            case 'PICKED_UP':
                title = `🛵 ${deliveryPartnerName || 'Driver'} Picked Up Order`;
                body = `Your order is collected and heading to your location (ETA: ${etaMinutes || 15} min).`;
                break;
            case 'ON_THE_WAY':
                title = `🛵 ${deliveryPartnerName || 'Delivery Partner'} is On The Way!`;
                body = `Heading to your hostel/address (ETA: ${etaMinutes || 10} min).`;
                break;
            case 'NEARBY':
                title = `📍 ${deliveryPartnerName || 'Driver'} is Nearby!`;
                body = `Arriving in ~${etaMinutes || 2} min. Get ready to receive your order!`;
                break;
            case 'DELIVERED':
                title = '🎉 Order Delivered!';
                body = `Enjoy your meal/items! Thank you for ordering on Laro.`;
                break;
            case 'CANCELLED':
                title = '❌ Order Cancelled';
                body = `Your order #${String(orderId).slice(0, 8)} has been cancelled.`;
                break;
        }

        if (pushToken) {
            await sendPushNotification(pushToken, title, body, {
                type: 'DELIVERY_LIVE_STATUS',
                orderId,
                restaurantName: restaurantName || 'Laro',
                deliveryPartnerName: deliveryPartnerName || 'Delivery Partner',
                status,
                etaMinutes: String(etaMinutes || 0),
                progress: String(progress || 0),
                deepLink: deepLink || `laro://order/${orderId}`
            });
        }
        console.log(`[LIVE_STATUS_PUSH] Sent ${status} notification to User #${customer.id} for Order ${orderId}`);
    } catch (err) {
        console.error('[LIVE_STATUS_PUSH ERROR]', err.message);
    }
};

module.exports = {
    sendPushNotification,
    notifyEligibleRidersNewOrder,
    notifyWalletTransaction,
    sendLiveDeliveryStatusNotification
};
