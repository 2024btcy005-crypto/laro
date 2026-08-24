const { Shop, Product, University } = require('../src/models');
const { sequelize } = require('../src/config/db');

async function seedLaro() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const university = await University.findOne();
        const uniId = university ? university.id : null;

        const shop = await Shop.create({
            name: 'Laro',
            category: 'Food & Canteen',
            shopType: 'RESTAURANT',
            description: 'The official Laro signature restaurant, delivering the finest meals on campus.',
            imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop',
            isOpen: true,
            rating: 5.0,
            ratingCount: '100',
            deliveryTime: '15 min',
            costForTwo: '₹300 for two',
            openingTime: '08:00:00',
            closingTime: '23:00:00',
            universityId: uniId
        });

        console.log('Shop created successfully:', shop.id);

        await Product.bulkCreate([
            { shopId: shop.id, name: 'Laro Signature Burger', price: 150, originalPrice: 199, category: 'Burgers', universityId: uniId, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop' },
            { shopId: shop.id, name: 'Laro Special Pizza', price: 250, originalPrice: 300, category: 'Pizzas', universityId: uniId, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop' },
            { shopId: shop.id, name: 'Laro Classic Fries', price: 90, originalPrice: 110, category: 'Sides', universityId: uniId, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop' }
        ]);

        console.log('Products created successfully for shop Laro.');
    } catch (e) {
        console.error('Error creating restaurant:', e);
    } finally {
        await sequelize.close();
    }
}
seedLaro();
