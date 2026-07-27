const { User } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function assignTokens() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const users = await User.findAll();
        console.log(`Found ${users.length} users in database.`);

        for (const user of users) {
            if (!user.fcmToken) {
                user.fcmToken = `ExponentPushToken[dev_user_${user.id.substring(0, 8)}]`;
                await user.save();
                console.log(`Updated FCM token for user: ${user.name || user.email} (${user.id})`);
            }
        }

        console.log('✅ Successfully updated FCM tokens for all database users!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating tokens:', err);
        process.exit(1);
    }
}

assignTokens();
