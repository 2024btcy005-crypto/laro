package com.zippit.laro.deliverylivestatus

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Promise

class DeliveryLiveStatusModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val notificationManager = DeliveryNotificationManager(reactContext)

    override fun getName(): String {
        return "DeliveryLiveStatusModule"
    }

    @ReactMethod
    fun start(data: ReadableMap, promise: Promise) {
        try {
            val orderId = data.getString("orderId") ?: ""
            val restaurantName = data.getString("restaurantName") ?: ""
            val deliveryPartnerName = if (data.hasKey("deliveryPartnerName")) data.getString("deliveryPartnerName") else null
            val status = data.getString("status") ?: "PLACED"
            val etaMinutes = if (data.hasKey("etaMinutes")) data.getInt("etaMinutes") else 15
            val progress = if (data.hasKey("progress")) data.getDouble("progress").toFloat() else 0.1f
            val deepLink = data.getString("deepLink") ?: "laro://order/$orderId"

            notificationManager.startLiveStatus(orderId, restaurantName, deliveryPartnerName, status, etaMinutes, progress, deepLink)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun update(data: ReadableMap, promise: Promise) {
        try {
            val orderId = data.getString("orderId") ?: ""
            val restaurantName = data.getString("restaurantName") ?: ""
            val deliveryPartnerName = if (data.hasKey("deliveryPartnerName")) data.getString("deliveryPartnerName") else null
            val status = data.getString("status") ?: "ON_THE_WAY"
            val etaMinutes = if (data.hasKey("etaMinutes")) data.getInt("etaMinutes") else 15
            val progress = if (data.hasKey("progress")) data.getDouble("progress").toFloat() else 0.5f
            val deepLink = data.getString("deepLink") ?: "laro://order/$orderId"

            notificationManager.updateLiveStatus(orderId, restaurantName, deliveryPartnerName, status, etaMinutes, progress, deepLink)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun end(data: ReadableMap, promise: Promise) {
        try {
            val orderId = data.getString("orderId") ?: ""
            val status = data.getString("status") ?: "DELIVERED"

            notificationManager.endLiveStatus(orderId, status)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("END_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancel(orderId: String, promise: Promise) {
        try {
            notificationManager.cancelLiveStatus(orderId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }
}
