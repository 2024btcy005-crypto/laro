const { User, University, Shop } = require('./src/models');
const { sequelize } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function createDeliveryBoy() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Find default university
        let uni = await University.findOne();

        const uniId = uni ? uni.id : null;
        console.log('Using University:', uni ? uni.name : 'None');

        // Find first restaurant if available
        const shop = await Shop.findOne({ where: { shopType: 'RESTAURANT' } });
        const shopId = shop ? shop.id : null;

        const email = 'rider@zippit.com';
        const rawPassword = 'rider123';
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        let rider = await User.findOne({ where: { email } });

        if (!rider) {
            rider = await User.create({
                name: 'Rajesh Rider',
                email: email,
                phoneNumber: '9876500001',
                passwordHash: passwordHash,
                role: 'delivery',
                isActive: true,
                vehicleType: 'scooter',
                vehicleNumber: 'TN-74-Z-1008',
                universityId: uniId,
                assignedShopId: shopId
            });
            console.log('🎉 Delivery Partner created successfully!');
        } else {
            rider.role = 'delivery';
            rider.passwordHash = passwordHash;
            rider.universityId = uniId;
            rider.assignedShopId = shopId;
            await rider.save();
            console.log('🔄 Delivery Partner updated successfully!');
        }

        const fullRider = await User.findByPk(rider.id, {
            include: [
                { model: University, as: 'university' },
                { model: Shop, as: 'assignedShop' }
            ]
        });

        console.log('\n--- DELIVERY BOY DETAILS ---');
        console.log('Name:', fullRider.name);
        console.log('Email:', fullRider.email);
        console.log('Password:', rawPassword);
        console.log('Phone:', fullRider.phoneNumber);
        console.log('Role:', fullRider.role);
        console.log('Campus:', fullRider.university ? fullRider.university.name : 'All');
        console.log('Assigned Shop:', fullRider.assignedShop ? `${fullRider.assignedShop.name} (${fullRider.assignedShop.category})` : 'Global Rider (All Shops)');

    } catch (err) {
        console.error('❌ Error creating delivery boy:', err);
    } finally {
        await sequelize.close();
    }
}

createDeliveryBoy();
