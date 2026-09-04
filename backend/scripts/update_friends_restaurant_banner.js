require('dotenv').config();
const path = require('path');
const cloudinary = require('../src/config/cloudinaryConfig');
const { Shop } = require('../src/models');

async function updateFriendsRestaurantBanner() {
    const imagePath = 'C:\\Users\\JEDEVIKUMAR\\.gemini\\antigravity-ide\\brain\\6cbc5847-0e74-4437-8ade-7575d1a268bd\\.user_uploaded\\media_1788526740037.jpg';

    try {
        console.log('1. Uploading Friends Restaurant banner to Cloudinary...');
        const result = await cloudinary.uploader.upload(imagePath, {
            folder: 'laro_restaurants',
            public_id: 'friends_restaurant_banner',
            overwrite: true,
            transformation: [{ width: 1200, height: 600, crop: 'limit' }]
        });

        console.log('✅ Cloudinary URL:', result.secure_url);

        console.log('2. Finding Friends Restaurant in DB...');
        const restaurant = await Shop.findOne({
            where: {
                name: 'Friends Restaurant'
            }
        });

        if (!restaurant) {
            console.error('❌ Friends Restaurant not found in database!');
            return;
        }

        console.log(`Found restaurant ID: ${restaurant.id}, old imageUrl: ${restaurant.imageUrl}`);

        await restaurant.update({
            imageUrl: result.secure_url
        });

        console.log('✅ Successfully updated Friends Restaurant with new banner image URL:');
        console.log(result.secure_url);

    } catch (error) {
        console.error('❌ Error updating restaurant image:', error);
    } finally {
        process.exit(0);
    }
}

updateFriendsRestaurantBanner();
