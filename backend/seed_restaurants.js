const { Shop, Product, University, Category } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function seedRestaurants() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Get first university if available
        const university = await University.findOne();
        const uniId = university ? university.id : null;

        console.log('Seeding campus restaurants & canteens...');

        const restaurantData = [
            {
                name: 'The Campus Pizzeria & Italian Bistro',
                category: 'Food & Canteen',
                shopType: 'RESTAURANT',
                description: 'Freshly baked wood-fired pizzas, cheesy garlic breads, and authentic pastas delivered straight to your hostel.',
                imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop',
                isOpen: true,
                rating: 4.8,
                ratingCount: '420',
                deliveryTime: '15-20 min',
                costForTwo: '₹250 for two',
                openingTime: '09:00:00',
                closingTime: '23:00:00',
                universityId: uniId,
                items: [
                    { name: 'Farmhouse Cheese Loaded Pizza (8 inch)', price: 199, originalPrice: 249, category: 'Pizzas', imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop' },
                    { name: 'Cheesy Garlic Breadsticks', price: 99, originalPrice: 129, category: 'Sides', imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500&auto=format&fit=crop' },
                    { name: 'Creamy Alfredo White Pasta', price: 149, originalPrice: 179, category: 'Pastas', imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281358?w=500&auto=format&fit=crop' },
                    { name: 'Gooey Choco Lava Cake', price: 69, originalPrice: 89, category: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop' }
                ]
            },
            {
                name: 'Block B Burger Joint & Fries',
                category: 'Food & Canteen',
                shopType: 'RESTAURANT',
                description: 'Juicy grilled smash burgers, peri peri fries, and thick milkshakes for late night hostel cravings.',
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop',
                isOpen: true,
                rating: 4.6,
                ratingCount: '310',
                deliveryTime: '10-15 min',
                costForTwo: '₹180 for two',
                openingTime: '10:00:00',
                closingTime: '01:00:00',
                universityId: uniId,
                items: [
                    { name: 'Smoky BBQ Cheese Smash Burger', price: 129, originalPrice: 159, category: 'Burgers', imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop' },
                    { name: 'Crispy Peri Peri French Fries', price: 79, originalPrice: 99, category: 'Sides', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop' },
                    { name: 'Thick Oreo Chocolate Milkshake', price: 89, originalPrice: 110, category: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop' }
                ]
            },
            {
                name: 'Night Study Brew & Cafe',
                category: 'Bakery & Cafe',
                shopType: 'RESTAURANT',
                description: 'Rich espresso, iced cold coffee, grilled sandwiches, and fresh pastries for exam study sessions.',
                imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop',
                isOpen: true,
                rating: 4.9,
                ratingCount: '580',
                deliveryTime: '10 min',
                costForTwo: '₹150 for two',
                openingTime: '07:00:00',
                closingTime: '02:00:00',
                universityId: uniId,
                items: [
                    { name: 'Classic Iced Cold Coffee with Ice Cream', price: 89, originalPrice: 110, category: 'Coffee', imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop' },
                    { name: '3-Layer Grilled Cheese & Corn Sandwich', price: 79, originalPrice: 99, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop' },
                    { name: 'Hazelnut Cappuccino', price: 99, originalPrice: 129, category: 'Coffee', imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop' },
                    { name: 'Belgian Chocolate Glazed Donut', price: 59, originalPrice: 79, category: 'Bakery', imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop' }
                ]
            },
            {
                name: 'Annapoorna Campus Dhaba & Thalis',
                category: 'Food & Canteen',
                shopType: 'RESTAURANT',
                description: 'Homely North & South Indian meals, paneer dishes, garlic naans, and authentic biryanis.',
                imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop',
                isOpen: true,
                rating: 4.7,
                ratingCount: '890',
                deliveryTime: '15-20 min',
                costForTwo: '₹200 for two',
                openingTime: '08:00:00',
                closingTime: '22:30:00',
                universityId: uniId,
                items: [
                    { name: 'Special Executive Paneer Thali', price: 149, originalPrice: 180, category: 'Thalis', imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop' },
                    { name: 'Dum Hyderabadi Chicken Biryani', price: 179, originalPrice: 219, category: 'Biryani', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop' },
                    { name: 'Paneer Butter Masala (Half)', price: 120, originalPrice: 140, category: 'Curries', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop' },
                    { name: 'Butter Garlic Naan (2 Pcs)', price: 49, originalPrice: 60, category: 'Breads', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop' }
                ]
            },
            {
                name: 'Fresh Juice & Smoothie Bar',
                category: 'Food & Canteen',
                shopType: 'RESTAURANT',
                description: '100% natural cold pressed juices, energy fruit bowls, and protein shakes for active campus life.',
                imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b7?w=600&auto=format&fit=crop',
                isOpen: true,
                rating: 4.8,
                ratingCount: '240',
                deliveryTime: '10 min',
                costForTwo: '₹120 for two',
                openingTime: '07:30:00',
                closingTime: '21:00:00',
                universityId: uniId,
                items: [
                    { name: 'Fresh Mango & Passion Fruit Smoothie', price: 79, originalPrice: 99, category: 'Smoothies', imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop' },
                    { name: 'Cold Pressed Watermelon Mint Juice', price: 59, originalPrice: 79, category: 'Juices', imageUrl: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=500&auto=format&fit=crop' },
                    { name: 'High Protein Peanut Butter Banana Shake', price: 99, originalPrice: 120, category: 'Protein Shakes', imageUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=500&auto=format&fit=crop' }
                ]
            },
            {
                name: 'Campus Daily Supermart & Groceries',
                category: 'Groceries',
                shopType: 'GROCERY',
                description: 'Daily fresh dairy, instant snacks, cold beverages, toiletries, and instant campus essentials delivered in 10 mins.',
                imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop',
                isOpen: true,
                rating: 4.9,
                ratingCount: '1150',
                deliveryTime: '10 min',
                costForTwo: '₹150 for two',
                openingTime: '06:00:00',
                closingTime: '23:59:00',
                universityId: uniId,
                items: [
                    { name: 'Single Farm Egg (1 Pc)', price: 7, originalPrice: 8, category: 'Dairy & Eggs', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=500&auto=format&fit=crop' },
                    { name: 'Campa Cola (250ml)', price: 15, originalPrice: 20, category: 'Beverages', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop' },
                    { name: 'Campa Orange (250ml)', price: 15, originalPrice: 20, category: 'Beverages', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop' },
                    { name: 'Campa Lemon (250ml)', price: 15, originalPrice: 20, category: 'Beverages', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1625772290748-39126ddd91f1?w=500&auto=format&fit=crop' },
                    { name: 'Campa Jeera Masala Soda (250ml)', price: 15, originalPrice: 20, category: 'Beverages', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop' },
                    { name: 'Amul Taaza Toned Milk (500ml)', price: 27, originalPrice: 28, category: 'Dairy', imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop' },
                    { name: 'Lays Magic Masala Chips (50g)', price: 20, originalPrice: 20, category: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop' },
                    { name: 'Maggi 2-Minute Masala Noodles (4-Pack)', price: 56, originalPrice: 60, category: 'Instant Food', imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&auto=format&fit=crop' }
                ]
            }
        ];

        for (const shopInfo of restaurantData) {
            const { items, ...shopFields } = shopInfo;
            
            // Check if shop already exists
            let shop = await Shop.findOne({ where: { name: shopFields.name } });
            if (!shop) {
                shop = await Shop.create({
                    ...shopFields,
                    isWarehouse: false
                });
                console.log(`Created restaurant: ${shop.name}`);
            } else {
                console.log(`Restaurant already exists: ${shop.name}`);
            }

            // Create items
            for (const item of items) {
                const existingProduct = await Product.findOne({ where: { shopId: shop.id, name: item.name } });
                if (!existingProduct) {
                    await Product.create({
                        ...item,
                        shopId: shop.id,
                        universityId: uniId,
                        isAvailable: true
                    });
                    console.log(`  Added dish: ${item.name}`);
                }
            }
        }

        console.log('✅ Successfully seeded campus restaurants and food dishes!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding restaurants:', err);
        process.exit(1);
    }
}

seedRestaurants();
