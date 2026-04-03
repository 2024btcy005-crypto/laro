const { Order, User, Shop, Product, OrderItem } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function testOrder() {
    try {
        console.log('Testing order creation...');
        const user = await User.findOne();
        const shop = await Shop.findOne();
        const product = await Product.findOne({ where: { shopId: shop.id } });

        if (!user || !shop || !product) {
            console.error('Missing test data');
            return;
        }

        const t = await sequelize.transaction();
        try {
            const order = await Order.create({
                customerId: user.id,
                shopId: shop.id,
                totalAmount: 100,
                deliveryAddress: 'Test Address',
                paymentMethod: 'cod',
                paymentStatus: 'pending',
                deliveryOtp: '1234',
                status: 'placed'
            }, { transaction: t });

            console.log('Order created successfully:', order.id);
            await t.rollback();
        } catch (e) {
            console.error('FAILED TO CREATE ORDER:', e);
            if (t) await t.rollback();
        }
    } catch (e) {
        console.error('DEBUG SCRIPT CRASHED:', e);
    } finally {
        process.exit();
    }
}

testOrder();
