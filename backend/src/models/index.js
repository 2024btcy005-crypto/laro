const User = require('./User');
const Shop = require('./Shop');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Delivery = require('./Delivery');
const Review = require('./Review');
const Config = require('./Config');
const WalletTransaction = require('./WalletTransaction');
const Coupon = require('./Coupon');
const XeroxPricing = require('./XeroxPricing');
const Category = require('./Category');
const Advertisement = require('./Advertisement');
const University = require('./University');

// === Define Associations ===

// Users -> Orders (Customer)
User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

// Users -> Deliveries (Delivery Partner)
User.hasMany(Delivery, { foreignKey: 'partnerId', as: 'deliveries' });
Delivery.belongsTo(User, { foreignKey: 'partnerId', as: 'partner' });

// Shops -> Products
Shop.hasMany(Product, { foreignKey: 'shopId', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// Shops -> Orders
Shop.hasMany(Order, { foreignKey: 'shopId', as: 'orders' });
Order.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// Orders -> OrderItems
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'order_items' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Product -> Variants (Self-reference)
Product.hasMany(Product, { foreignKey: 'variantOf', as: 'variants', onDelete: 'CASCADE' });
Product.belongsTo(Product, { foreignKey: 'variantOf', as: 'parent' });

// Orders -> Payments
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Orders -> Deliveries
Order.hasOne(Delivery, { foreignKey: 'orderId', as: 'delivery', onDelete: 'CASCADE' });
Delivery.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Orders -> Reviews
Order.hasOne(Review, { foreignKey: 'orderId', as: 'review', onDelete: 'CASCADE' });
Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Shops -> Reviews
Shop.hasMany(Review, { foreignKey: 'shopId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// Users -> WalletTransactions
User.hasMany(WalletTransaction, { foreignKey: 'userId', as: 'walletTransactions' });
WalletTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Peer User association for transfers
WalletTransaction.belongsTo(User, { foreignKey: 'peerId', as: 'peerUser' });

// Orders -> WalletTransactions
Order.hasMany(WalletTransaction, { foreignKey: 'orderId', as: 'walletTransactions' });
WalletTransaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Shops -> XeroxPricing
Shop.hasOne(XeroxPricing, { foreignKey: 'shopId', as: 'xeroxPricing', onDelete: 'CASCADE' });
XeroxPricing.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// Category -> Products
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryModel' });

// University Associations
University.hasMany(User, { foreignKey: 'universityId', as: 'users' });
User.belongsTo(University, { foreignKey: 'universityId', as: 'university' });

University.hasMany(Shop, { foreignKey: 'universityId', as: 'shops' });
Shop.belongsTo(University, { foreignKey: 'universityId', as: 'university' });

University.hasMany(Product, { foreignKey: 'universityId', as: 'products' });
Product.belongsTo(University, { foreignKey: 'universityId', as: 'university' });

University.hasMany(Order, { foreignKey: 'universityId', as: 'orders' });
Order.belongsTo(University, { foreignKey: 'universityId', as: 'university' });

module.exports = {
    User,
    Shop,
    Product,
    Order,
    OrderItem,
    Payment,
    Delivery,
    Review,
    Config,
    WalletTransaction,
    Coupon,
    XeroxPricing,
    Category,
    Advertisement,
    University
};

