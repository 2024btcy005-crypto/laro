const { Product, User } = require('./src/models');
const { Op } = require('sequelize');

async function test() {
    try {
        const vitAdmin = await User.findOne({ where: { role: 'campus_admin' } });
        if (!vitAdmin) {
            console.log('No campus admin found');
            return;
        }

        console.log(`Testing as: ${vitAdmin.email} (Uni: ${vitAdmin.universityId})`);

        const isSuperAdmin = vitAdmin.role === 'super_admin';
        const uniFilter = isSuperAdmin ? {} : { universityId: vitAdmin.universityId };

        const products = await Product.findAll({
            where: uniFilter,
            attributes: ['id', 'name', 'universityId']
        });

        console.log(`Found ${products.length} products`);
        products.forEach(p => console.log(`- ${p.name} (Uni: ${p.universityId})`));
    } catch (err) {
        console.error(err);
    }
}

test();
