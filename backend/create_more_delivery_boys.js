const { User, University } = require('./src/models');
const { sequelize } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function createDeliveryBoys() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        let uni = await University.findOne();
        const uniId = uni ? uni.id : null;

        const passwordHash = await bcrypt.hash('rider123', 10);

        const newRiders = [
            {
                name: 'Sunil ShopsRider',
                email: 'rider_shops@zippit.com',
                phoneNumber: '9876500002',
                vehicleType: 'bicycle',
                vehicleNumber: 'TN-74-Z-2002',
                deliveryScope: 'GROCERIES_ONLY',
                assignedShopId: null,
                role: 'delivery',
                universityId: uniId
            },
            {
                name: 'Vijay FoodRider',
                email: 'rider_restaurants@zippit.com',
                phoneNumber: '9876500003',
                vehicleType: 'scooter',
                vehicleNumber: 'TN-74-Z-3003',
                deliveryScope: 'RESTAURANTS_ONLY',
                assignedShopId: null,
                role: 'delivery',
                universityId: uniId
            }
        ];

        for (const rData of newRiders) {
            let rider = await User.findOne({ where: { email: rData.email } });
            if (!rider) {
                rider = await User.create({
                    ...rData,
                    passwordHash,
                    isActive: true
                });
                console.log(`🎉 Created delivery rider: ${rider.name} (${rider.email})`);
            } else {
                await rider.update({ ...rData, passwordHash, isActive: true });
                console.log(`🔄 Updated delivery rider: ${rider.name} (${rider.email})`);
            }
        }

        console.log('\n✅ All Delivery Partners set up successfully!');
    } catch (err) {
        console.error('❌ Error creating delivery riders:', err);
    } finally {
        await sequelize.close();
    }
}

createDeliveryBoys();
