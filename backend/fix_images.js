const { sequelize } = require('./src/config/db');
const { Product } = require('./src/models');

async function fixImages() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Map some categories to generic images
        const categoryImages = {
            'Snacks': 'https://images.unsplash.com/photo-1566478433002-3f746643c14a?w=400&q=80',
            'Drinks': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
            'Dairy': 'https://images.unsplash.com/photo-1550583724-12558142ab46?w=400&q=80',
            'Printing': 'https://images.unsplash.com/photo-1599427389274-846178c19985?w=400&q=80',
            'Stationery': 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&q=80',
            'Medicines': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
            'Healthcare': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80'
        };

        const products = await Product.findAll({ where: { imageUrl: null } });
        console.log(`Found ${products.length} products without images.`);

        for (const p of products) {
            const img = categoryImages[p.category] || 'https://via.placeholder.com/150?text=Product';
            await p.update({ imageUrl: img });
        }

        console.log('✅ All product images updated.');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
}

fixImages();
