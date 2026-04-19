const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

// Set up Cloudinary storage for product images
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'laro_products',
        allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

module.exports = upload;
