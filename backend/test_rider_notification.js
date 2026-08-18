const { notifyEligibleRidersNewOrder } = require('./src/services/notificationService');
const { Order, Shop, User } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function testRiderNotification() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Give dev push tokens to riders for testing
        await User.update(
            { fcmToken: 'ExponentPushToken[test_food_rider_token]' },
            { where: { email: 'rider_restaurants@zippit.com' } }
        );
        await User.update(
            { fcmToken: 'ExponentPushToken[test_grocery_rider_token]' },
            { where: { email: 'rider_shops@zippit.com' } }
        );

        // Find a restaurant shop
        const foodShop = await Shop.findOne({ where: { shopType: 'RESTAURANT' } });
        // Find a grocery shop
        const groceryShop = await Shop.findOne({ where: { shopType: 'GROCERY' } });

        console.log('\n--- 🍕 TEST 1: Food Restaurant Order Notification ---');
        if (foodShop) {
            const fakeFoodOrder = {
                id: 'ord-food-test-101',
                shopId: foodShop.id,
                totalAmount: 149.00,
                universityId: foodShop.universityId
            };
            await notifyEligibleRidersNewOrder(fakeFoodOrder);
        }

        console.log('\n--- 🛒 TEST 2: Grocery Supermart Order Notification ---');
        if (groceryShop) {
            const fakeGroceryOrder = {
                id: 'ord-grocery-test-202',
                shopId: groceryShop.id,
                totalAmount: 85.00,
                universityId: groceryShop.universityId
            };
            await notifyEligibleRidersNewOrder(fakeGroceryOrder);
        }

    } catch (err) {
        console.error('❌ Error testing rider notification:', err);
    } finally {
        await sequelize.close();
    }
}

testRiderNotification();
