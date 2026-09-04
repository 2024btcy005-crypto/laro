import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../api';
import { FavouriteService } from '../services/FavouriteService';
import { Plus, Minus, Heart, Sparkles, Store, ShoppingBag } from 'lucide-react';
import './ProductCard.css';

const isEdibleProduct = (item) => {
    if (!item) return false;
    if (item.isEdible === false) return false;
    if (item.isVeg === null) return false;

    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    const nonEdibleKeywords = [
        'a4', 'sheet', 'print', 'xerox', 'paper', 'notebook', 'binding',
        'pen', 'pencil', 'calculator', 'charger', 'cable', 'bottle', 'water bottle',
        'stapler', 'folder', 'file', 'sanitizer', 'soap', 'shampoo', 'toothpaste',
        'mask', 'bandage', 'thermometer', 'medicine'
    ];

    const nonEdibleCategories = [
        'xerox', 'printing', 'stationery', 'books', 'study', 'electronics',
        'accessories', 'hardware', 'utility', 'general', 'pharmacy', 'medicines', 'healthcare'
    ];

    const foodKeywords = ['milk', 'curd', 'buttermilk', 'butter', 'egg', 'bread', 'chips', 'lays', 'coke', 'campa', 'maggi', 'noodle', 'rice', 'atta', 'dal', 'tea', 'coffee', 'juice', 'soda', 'peanuts', 'chocolate', 'biscuit', 'cookie', 'mango', 'banana', 'apple', 'grapes', 'fruit'];

    if (nonEdibleKeywords.some(k => name.includes(k))) return false;

    if (nonEdibleCategories.some(c => cat === c)) {
        if (foodKeywords.some(f => name.includes(f))) return true;
        return false;
    }

    return true;
};

export default function ProductCard({ product, shop }) {
    const { cart, addToCart, removeFromCart } = useCart();
    const [isFav, setIsFav] = useState(false);
    const [showVariants, setShowVariants] = useState(false);
    const [imgError, setImgError] = useState(false);

    let user = {};
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) user = JSON.parse(storedUser);
    } catch (e) {
        console.error('Failed to parse user', e);
    }

    const effectiveShop = shop || product.shop || { id: product.shopId, name: 'Laro Warehouse' };

    useEffect(() => {
        const checkFav = async () => {
            if (user.id) {
                const status = await FavouriteService.isFavourite(user.id, product.id, 'product');
                setIsFav(status);
            }
        };
        checkFav();
    }, [user.id, product.id]);

    const handleToggleFav = async (e) => {
        e.stopPropagation();
        if (!user.id) {
            alert('Please login to save favorites!');
            return;
        }
        const newFavs = await FavouriteService.toggleFavourite(user.id, product, 'product');
        if (newFavs) setIsFav(!isFav);
    };

    const getItemQuantity = (itemId) => {
        const item = cart.items.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    };

    const currentQty = getItemQuantity(product.id);
    const isEdible = isEdibleProduct(product);
    const isVeg = product.isVeg !== false;
    const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const rating = product.rating || (4.3 + (typeof product.id === 'string' ? product.id.charCodeAt(0) % 6 : 3) * 0.1).toFixed(1);

    const isOutOfStock = product.isAvailable === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0);

    return (
        <div className={`product-card ${product.isBestseller ? 'bestseller-product' : ''}`}>
            <div className="product-image-container">
                <img
                    src={imgError ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' : resolveImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                    onError={() => setImgError(true)}
                />

                {/* Top Badge Overlay */}
                <div className="product-badges-left">
                    {hasDiscount && (
                        <span className="badge-discount">{discountPercent}% OFF</span>
                    )}
                    {product.isB2G1 && (
                        <span className="badge-b2g1">BUY 2 GET 1</span>
                    )}
                    {product.isCombo && (
                        <span className="badge-combo">COMBO</span>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    className={`product-fav-btn ${isFav ? 'active' : ''}`}
                    onClick={handleToggleFav}
                    title={isFav ? "Remove from favorites" : "Save to favorites"}
                >
                    <Heart size={16} fill={isFav ? "#ff4757" : "transparent"} stroke={isFav ? "#ff4757" : "#ffffff"} />
                </button>

                {/* Veg/Non-Veg Tag for food items */}
                {isEdible && (
                    <div className="veg-indicator-corner">
                        <span className={`veg-badge ${isVeg ? 'veg' : 'non-veg'}`}>
                            <span className="dot" />
                        </span>
                    </div>
                )}
            </div>

            <div className="product-details">
                {/* Category & Unit */}
                <div className="product-meta-row">
                    <span className="product-category-tag">{product.category || 'Grocery'}</span>
                    {product.unit && <span className="product-unit-tag">{product.unit}</span>}
                    <span className="product-rating-badge">⭐ {rating}</span>
                </div>

                {/* Product Name */}
                <h3 className="product-title" title={product.name}>
                    {product.name}
                </h3>

                {/* Product Description */}
                {product.description && (
                    <p className="product-desc" title={product.description}>
                        {product.description}
                    </p>
                )}

                {/* Shop / Warehouse badge */}
                <div className="product-shop-badge">
                    <Store size={12} />
                    <span>{effectiveShop.name || 'Laro Warehouse'}</span>
                </div>

                {/* Pricing & Add to Cart Row */}
                <div className="product-action-row">
                    <div className="product-pricing">
                        <div className="price-main-wrap">
                            <span className="price-current">₹{product.price}</span>
                            {hasDiscount && (
                                <span className="price-original">₹{product.originalPrice}</span>
                            )}
                        </div>
                        {product.variants?.length > 0 && (
                            <span className="variants-hint">Customisable</span>
                        )}
                    </div>

                    <div className="product-cart-action">
                        {isOutOfStock ? (
                            <button className="btn-stock-out" disabled>Sold Out</button>
                        ) : currentQty > 0 ? (
                            <div className="product-qty-stepper">
                                <button
                                    type="button"
                                    className="stepper-btn"
                                    onClick={() => removeFromCart(product.id)}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={13} />
                                </button>
                                <span className="stepper-count">{currentQty}</span>
                                <button
                                    type="button"
                                    className="stepper-btn"
                                    onClick={() => addToCart(product, effectiveShop)}
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                        ) : product.variants?.length > 0 ? (
                            <button
                                type="button"
                                className="btn-add-product variants"
                                onClick={() => setShowVariants(!showVariants)}
                            >
                                {showVariants ? 'CLOSE' : 'CHOOSE +'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn-add-product"
                                onClick={() => addToCart(product, effectiveShop)}
                            >
                                ADD +
                            </button>
                        )}
                    </div>
                </div>

                {/* Expandable Variants Selection */}
                {showVariants && product.variants?.length > 0 && (
                    <div className="product-variants-box">
                        <p className="variants-heading">Available Options:</p>
                        {product.variants.map(variant => {
                            const variantQty = getItemQuantity(variant.id);
                            return (
                                <div key={variant.id} className="variant-item-row">
                                    <div className="variant-item-info">
                                        <span className="variant-item-name">{variant.variantName || variant.name}</span>
                                        <span className="variant-item-price">₹{variant.price}</span>
                                    </div>
                                    {variantQty > 0 ? (
                                        <div className="product-qty-stepper sm">
                                            <button
                                                type="button"
                                                className="stepper-btn"
                                                onClick={() => removeFromCart(variant.id)}
                                            >
                                                <Minus size={11} />
                                            </button>
                                            <span className="stepper-count">{variantQty}</span>
                                            <button
                                                type="button"
                                                className="stepper-btn"
                                                onClick={() => addToCart(variant, effectiveShop)}
                                            >
                                                <Plus size={11} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn-variant-add"
                                            onClick={() => addToCart(variant, effectiveShop)}
                                        >
                                            ADD
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
