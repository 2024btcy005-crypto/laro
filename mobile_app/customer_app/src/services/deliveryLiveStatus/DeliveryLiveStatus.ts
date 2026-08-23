import { NativeModules, Platform } from 'react-native';
import { DeliveryLiveStatusData, DeliveryStatus } from './types';

// Native Kotlin Module if loaded via Expo Config Plugin / Development Build
const NativeDeliveryModule = NativeModules.DeliveryLiveStatusModule;

// String hash helper for stable integer Notification ID
const getNotificationId = (orderId: string): number => {
    let hash = 0;
    const str = `order_live_${orderId}`;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

// Map status to user-friendly titles and emojis
const getStatusDetails = (status: DeliveryStatus, restaurantName: string, partnerName?: string, etaMinutes?: number) => {
    const driver = partnerName || 'Delivery Partner';
    const store = restaurantName || 'Laro Kitchen';

    switch (status) {
        case 'PLACED':
            return {
                title: '📦 Order Placed',
                body: `Your order from ${store} is placed.`,
                subtitle: 'Order Received'
            };
        case 'CONFIRMED':
            return {
                title: '✅ Order Confirmed',
                body: `${store} confirmed your order.`,
                subtitle: 'Confirmed'
            };
        case 'PREPARING':
            return {
                title: '🍔 Preparing Your Order',
                body: `${store} is preparing your food (ETA: ${etaMinutes || 25} min).`,
                subtitle: `ETA ${etaMinutes || 25} min`
            };
        case 'READY_FOR_PICKUP':
            return {
                title: '📦 Ready For Pickup',
                body: `Order is packed and ready for pickup.`,
                subtitle: 'Ready'
            };
        case 'PICKED_UP':
            return {
                title: `🛵 ${driver} Picked Up Order`,
                body: `Heading to your location (ETA: ${etaMinutes || 15} min).`,
                subtitle: `ETA ${etaMinutes || 15} min`
            };
        case 'ON_THE_WAY':
            return {
                title: `🛵 ${driver} is On The Way!`,
                body: `Your order from ${store} is on the way (ETA: ${etaMinutes || 12} min).`,
                subtitle: `ETA ${etaMinutes || 12} min`
            };
        case 'NEARBY':
            return {
                title: `📍 ${driver} is Nearby!`,
                body: `Arriving in ~${etaMinutes || 2} min. Get ready!`,
                subtitle: `ETA ${etaMinutes || 2} min`
            };
        case 'DELIVERED':
            return {
                title: '🎉 Order Delivered!',
                body: `Enjoy your items from ${store}!`,
                subtitle: 'Delivered'
            };
        case 'CANCELLED':
            return {
                title: '❌ Order Cancelled',
                body: `Your order from ${store} was cancelled.`,
                subtitle: 'Cancelled'
            };
        default:
            return {
                title: '🛵 Order Status',
                body: `Tracking your order from ${store}.`,
                subtitle: 'Live Order'
            };
    }
};

let NotificationsModule: any = null;
try {
    NotificationsModule = require('expo-notifications');
} catch (e) {
    console.warn('[DeliveryLiveStatus] expo-notifications module not loaded');
}

/**
 * Ensure ongoing notification channel exists on Android
 */
const ensureChannelAsync = async () => {
    if (Platform.OS === 'android' && NotificationsModule) {
        try {
            await NotificationsModule.setNotificationChannelAsync('order_live_status', {
                name: 'Live Order Status',
                importance: NotificationsModule.AndroidImportance.HIGH,
                vibrationPattern: null,
                enableVibrate: false,
                sound: null,
                showBadge: false,
                lightColor: '#056f36',
            });
        } catch (err: any) {
            console.warn('[DeliveryLiveStatus] Channel creation error:', err.message);
        }
    }
};

class DeliveryLiveStatusManager {
    /**
     * Start live delivery status for an order
     */
    async start(data: DeliveryLiveStatusData): Promise<void> {
        console.log('[DeliveryLiveStatus] Start live status:', data.orderId, data.status);

        if (Platform.OS !== 'android') return;

        // Call Kotlin Native Module if available
        if (NativeDeliveryModule?.start) {
            try {
                await NativeDeliveryModule.start(data);
                return;
            } catch (err: any) {
                console.warn('[DeliveryLiveStatus] NativeModule start failed, using fallback:', err.message);
            }
        }

        // Fallback: Ongoing Notification Channel via expo-notifications
        await this.updateFallback(data, true);
    }

    /**
     * Update existing live delivery status in place
     */
    async update(data: DeliveryLiveStatusData): Promise<void> {
        console.log('[DeliveryLiveStatus] Update live status:', data.orderId, data.status, data.etaMinutes);

        if (Platform.OS !== 'android') return;

        if (NativeDeliveryModule?.update) {
            try {
                await NativeDeliveryModule.update(data);
                return;
            } catch (err: any) {
                console.warn('[DeliveryLiveStatus] NativeModule update failed, using fallback:', err.message);
            }
        }

        await this.updateFallback(data, false);
    }

    /**
     * End live delivery status (Mark as DELIVERED)
     */
    async end(data: DeliveryLiveStatusData): Promise<void> {
        console.log('[DeliveryLiveStatus] End live status:', data.orderId);

        if (Platform.OS !== 'android') return;

        if (NativeDeliveryModule?.end) {
            try {
                await NativeDeliveryModule.end(data);
                return;
            } catch (err: any) {
                console.warn('[DeliveryLiveStatus] NativeModule end failed:', err.message);
            }
        }

        // Display final non-ongoing delivery complete notification
        if (NotificationsModule) {
            const notifId = getNotificationId(data.orderId);
            const notifStringId = `order_live_${data.orderId}`;
            const details = getStatusDetails('DELIVERED', data.restaurantName, data.deliveryPartnerName);

            try {
                await NotificationsModule.dismissNotificationAsync(notifStringId).catch(() => {});
                await NotificationsModule.scheduleNotificationAsync({
                    identifier: `order_final_${data.orderId}`,
                    content: {
                        title: details.title,
                        body: details.body,
                        data: { url: data.deepLink || `laro://order/${data.orderId}` },
                        sound: 'default',
                    },
                    trigger: null,
                });
            } catch (e: any) {
                console.warn('[DeliveryLiveStatus] Final notification error:', e.message);
            }
        }
    }

    /**
     * Cancel live status for an order
     */
    async cancel(orderId: string): Promise<void> {
        console.log('[DeliveryLiveStatus] Cancel live status for order:', orderId);

        if (Platform.OS !== 'android') return;

        if (NativeDeliveryModule?.cancel) {
            try {
                await NativeDeliveryModule.cancel(orderId);
                return;
            } catch (err: any) {
                console.warn('[DeliveryLiveStatus] NativeModule cancel failed:', err.message);
            }
        }

        if (NotificationsModule) {
            const notifStringId = `order_live_${orderId}`;
            try {
                await NotificationsModule.dismissNotificationAsync(notifStringId).catch(() => {});
            } catch (e: any) {
                console.warn('[DeliveryLiveStatus] Dismiss notification failed:', e.message);
            }
        }
    }

    /**
     * Helper to present/update ongoing Notification fallback in place
     */
    private async updateFallback(data: DeliveryLiveStatusData, isStart: boolean): Promise<void> {
        if (!NotificationsModule) return;

        await ensureChannelAsync();

        const notifStringId = `order_live_${data.orderId}`;
        const details = getStatusDetails(data.status, data.restaurantName, data.deliveryPartnerName, data.etaMinutes);

        try {
            await NotificationsModule.scheduleNotificationAsync({
                identifier: notifStringId,
                content: {
                    title: details.title,
                    body: details.body,
                    subtitle: details.subtitle,
                    data: {
                        orderId: data.orderId,
                        url: data.deepLink || `laro://order/${data.orderId}`,
                        type: 'DELIVERY_LIVE_STATUS',
                        status: data.status,
                        etaMinutes: data.etaMinutes,
                        isLocalFallback: true,
                    },
                    sound: false,
                    sticky: data.status !== 'DELIVERED' && data.status !== 'CANCELLED',
                    autoDismiss: false,
                    color: '#056f36',
                },
                trigger: null,
            });
            console.log('[DeliveryLiveStatus] Updated notification in place:', notifStringId);
        } catch (err: any) {
            console.warn('[DeliveryLiveStatus] scheduleNotificationAsync error:', err.message);
        }
    }
}

export const DeliveryLiveStatus = new DeliveryLiveStatusManager();
