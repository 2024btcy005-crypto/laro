const { Shop, Product, University } = require('./src/models');
const { Op } = require('sequelize');

async function test() {
    try {
        console.log('Testing getShops logic...');
        const universityId = undefined; // simulate ?all=true

        const whereClause = { isActive: true };

        const shops = await Shop.findAll({
            where: whereClause,
            include: [
                {
                    model: University,
                    as: 'university',
                    attributes: ['id', 'name']
                },
                {
                    model: Product,
                    as: 'products',
                    where: {
                        isAvailable: true,
                        variantOf: null,
                        universityId: universityId || null
                    },
                    required: false
                }
            ]
        });
        console.log(`Successfully fetched ${shops.length} shops`);
    } catch (err) {
        console.error('CRASH DETECTED:');
        console.error(err);
    }
}

test();
