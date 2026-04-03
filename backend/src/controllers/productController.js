const { Product, Shop } = require('../models');
const { Op } = require('sequelize');

// @desc    Search products globally
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res) => {
    try {
        const { keyword = '', universityId } = req.query;

        let whereClause = {
            name: {
                [Op.iLike]: `%${keyword}%`
            },
            isAvailable: true
        };

        const products = await Product.findAll({
            where: whereClause,
            include: [{
                model: Shop,
                as: 'shop',
                where: universityId ? { universityId } : {},
                required: universityId ? true : false
            }]
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new product for a shop
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const { shopId, name, description, price, imageUrl, category } = req.body;

        // Campus Admin Isolation Check
        if (req.user && req.user.role === 'campus_admin') {
            const shop = await Shop.findByPk(shopId);
            if (!shop || shop.universityId !== req.user.universityId) {
                return res.status(403).json({ message: 'Cannot add products to a shop outside your university' });
            }
        }

        const product = await Product.create({
            shopId,
            name,
            description,
            price,
            imageUrl,
            category: category || 'General'
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: ['shop']
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchProducts,
    createProduct,
    getProductById
};
