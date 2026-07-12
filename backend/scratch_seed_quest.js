const { sequelize } = require('./src/config/db');
const { University, Product, Quest } = require('./src/models');

async function seed() {
    try {
        console.log('Syncing database to create quests table...');
        await sequelize.sync({ alter: true });
        console.log('✅ DB Alter Sync complete.');

        // Find a university
        const uni = await University.findOne();
        if (!uni) {
            console.error('❌ No university found! Please seed universities first.');
            return;
        }
        console.log(`Found University: ${uni.name} (${uni.id})`);

        // Find a product
        const prod = await Product.findOne({ where: { universityId: uni.id } }) || await Product.findOne();
        if (!prod) {
            console.error('❌ No products found in database!');
            return;
        }
        console.log(`Found Product: ${prod.name} (${prod.id})`);

        // Destroy existing quests to start fresh
        await Quest.destroy({ where: {} });

        // Create a Quest
        const quest = await Quest.create({
            title: `Quest: communal ${prod.name} milestone!`,
            description: `Collaborate with students in your campus to complete 300 orders of ${prod.name} and unlock +50 Laro Coins for everyone!`,
            universityId: uni.id,
            productId: prod.id,
            targetCount: 300,
            currentCount: 120, // seed with some progress so it looks great on the screen
            rewardAmount: 50.00,
            status: 'active'
        });

        console.log('✅ Quest seeded successfully:');
        console.log(JSON.stringify(quest, null, 2));

    } catch (err) {
        console.error('❌ Error seeding quest:', err);
    } finally {
        await sequelize.close();
    }
}

seed();
