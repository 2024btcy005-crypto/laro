package com.zippit.laro.deliverylivestatus

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat

class DeliveryNotificationManager(private val context: Context) {

    private val notificationManager: NotificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    companion object {
        const val CHANNEL_ID = "order_live_status"
        const val CHANNEL_NAME = "Live Delivery Status"
    }

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Ongoing live order delivery tracking status"
                setSound(null, null)
                enableVibration(false)
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun getNotificationId(orderId: String): Int {
        return Math.abs(orderId.hashCode())
    }

    fun startLiveStatus(
        orderId: String,
        restaurantName: String,
        deliveryPartnerName: String?,
        status: String,
        etaMinutes: Int,
        progress: Float,
        deepLink: String
    ) {
        updateLiveStatus(orderId, restaurantName, deliveryPartnerName, status, etaMinutes, progress, deepLink)
    }

    fun updateLiveStatus(
        orderId: String,
        restaurantName: String,
        deliveryPartnerName: String?,
        status: String,
        etaMinutes: Int,
        progress: Float,
        deepLink: String
    ) {
        val notificationId = getNotificationId(orderId)

        val (title, body, subText) = formatStatusText(status, restaurantName, deliveryPartnerName, etaMinutes)

        // Intent for Deep Link (laro://order/{orderId})
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val pendingIntent = PendingIntent.getActivity(context, notificationId, intent, pendingIntentFlags)

        val smallIconResId = context.resources.getIdentifier(
            "notification", "drawable", context.packageName
        ).takeIf { it != 0 } ?: android.R.drawable.ic_dialog_info

        val maxProgress = 100
        val currentProgress = (progress * 100).toInt().coerceIn(0, 100)

        val isOngoing = status != "DELIVERED" && status != "CANCELLED"

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(smallIconResId)
            .setContentTitle(title)
            .setContentText(body)
            .setSubText(subText)
            .setContentIntent(pendingIntent)
            .setOngoing(isOngoing)
            .setAutoCancel(!isOngoing)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(0xFF056F36.toInt())

        if (isOngoing && progress > 0) {
            builder.setProgress(maxProgress, currentProgress, false)
        }

        notificationManager.notify(notificationId, builder.build())
    }

    fun endLiveStatus(orderId: String, status: String) {
        val notificationId = getNotificationId(orderId)
        notificationManager.cancel(notificationId)
    }

    fun cancelLiveStatus(orderId: String) {
        val notificationId = getNotificationId(orderId)
        notificationManager.cancel(notificationId)
    }

    private fun formatStatusText(
        status: String,
        restaurantName: String,
        deliveryPartnerName: String?,
        etaMinutes: Int
    ): Triple<String, String, String> {
        val driver = deliveryPartnerName ?: "Delivery Partner"
        val store = restaurantName.ifEmpty { "Laro Kitchen" }

        return when (status.uppercase()) {
            "PLACED" -> Triple("📦 Order Placed", "Your order from $store is placed.", "Order Placed")
            "CONFIRMED" -> Triple("✅ Order Confirmed", "$store confirmed your order.", "Confirmed")
            "PREPARING" -> Triple("🍔 Preparing Your Order", "$store is preparing your food (ETA $etaMinutes min).", "ETA $etaMinutes min")
            "READY_FOR_PICKUP" -> Triple("📦 Ready for Pickup", "Order is packed and ready for pickup.", "Ready")
            "PICKED_UP" -> Triple("🛵 $driver Picked Up Order", "Heading to your location (ETA $etaMinutes min).", "ETA $etaMinutes min")
            "ON_THE_WAY" -> Triple("🛵 $driver is On The Way", "Your order from $store is on the way (ETA $etaMinutes min).", "ETA $etaMinutes min")
            "NEARBY" -> Triple("📍 $driver is Nearby!", "Arriving in ~$etaMinutes min. Get ready!", "ETA $etaMinutes min")
            "DELIVERED" -> Triple("🎉 Order Delivered!", "Enjoy your items from $store!", "Delivered")
            "CANCELLED" -> Triple("❌ Order Cancelled", "Your order from $store was cancelled.", "Cancelled")
            else -> Triple("🛵 Order Status", "Tracking order from $store.", "Live Order")
        }
    }
}
