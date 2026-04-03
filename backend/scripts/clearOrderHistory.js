const { Order, OrderItem, Payment, Delivery } = require('../src/models');

/**
 * Script to delete all order history from the database.
 * This will truncate Orders, OrderItems, Payments, and Deliveries.
 */
async function clearOrderHistory() {
    console.log('--- Clearing Order History ---');
    try {
        // We delete in order of dependencies if necessary, 
        // but truncating these should be fine as they are primarily related to orders.

        console.log('Deleting OrderItems...');
        await OrderItem.destroy({ where: {}, truncate: false }); // truncate: true might fail with foreign keys

        console.log('Deleting Payments...');
        await Payment.destroy({ where: {}, truncate: false });

        console.log('Deleting Deliveries...');
        await Delivery.destroy({ where: {}, truncate: false });

        console.log('Deleting Orders...');
        await Order.destroy({ where: {}, truncate: false });

        console.log('SUCCESS: All order history has been deleted.');
        process.exit(0);
    } catch (error) {
        console.error('ERROR: Failed to clear order history:', error);
        process.exit(1);
    }
}

clearOrderHistory();
