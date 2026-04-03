let io;

const setIo = (socketIoInstance) => {
    io = socketIoInstance;
};

const notifyShopNewOrder = (shopId, orderData) => {
    if (io) {
        // Emit to a specific room for the shop
        io.to(`shop_${shopId}`).emit('new_order', orderData);
    }
};

const notifyCustomerOrderStatus = (customerId, statusData) => {
    if (io) {
        io.to(`customer_${customerId}`).emit('order_status_update', statusData);
    }
};

const notifyDeliveryPartnersNewOrder = (orderData) => {
    if (io) {
        // Broadcast to all active delivery partners
        io.to('delivery_partners').emit('new_delivery_request', orderData);
    }
};

module.exports = {
    setIo,
    notifyShopNewOrder,
    notifyCustomerOrderStatus,
    notifyDeliveryPartnersNewOrder
};
