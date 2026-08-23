const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

let storage;

try {
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    const cloudinary = require('./cloudinaryConfig');

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        storage = new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: 'laro_products',
                allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
                transformation: [{ width: 800, height: 800, crop: 'limit' }]
            }
        });
    }
} catch (e) {
    console.warn('[MulterConfig] Cloudinary storage init failed, using local disk storage fallback:', e.message);
}

// Fallback to local disk storage if Cloudinary is unavailable
if (!storage) {
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname) || '.jpg';
            cb(null, `product-${uniqueSuffix}${ext}`);
        }
    });
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
});

module.exports = upload;
