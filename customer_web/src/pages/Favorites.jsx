import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Utensils, Pizza, ChevronLeft, Trash2, ShoppingBag } from 'lucide-react';
import { FavouriteService } from '../services/FavouriteService';
import ShopCard from '../components/ShopCard';
import './Favorites.css';

const FavoriteProductCard = ({ product, onRemove, onAddToCart }) => {
    return (
        <div className="favorite-product-card premium-card">
            <div className="fav-product-image">
                <img src={product.imageUrl || 'https://via.placeholder.com/150?text=Dish'} alt={product.name} />
            </div>
            <div className="fav-product-info">
                <h3 className="fav-product-name">{product.name}</h3>
                <p className="fav-product-category">{product.category || 'Main Course'}</p>
                <p className="fav-product-price">₹{product.price}</p>
            </div>
            <div className="fav-product-actions">
                <button className="remove-fav-btn" onClick={() => onRemove(product)} title="Remove from favorites">
                    <Trash2 size={18} />
                </button>
                <button className="btn-primary-sm add-to-cart-btn" onClick={() => onAddToCart(product)}>
                    <ShoppingBag size={16} />
                    <span>Add</span>
                </button>
            </div>
        </div>
    );
};

export default function Favorites() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('shops'); // 'shops' or 'products'
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user.id) {
            navigate('/login');
            return;
        }
        loadFavorites();
    }, [activeTab, user.id]);

    const loadFavorites = async () => {
        setLoading(true);
        const type = activeTab === 'shops' ? 'shop' : 'product';
        const data = await FavouriteService.getFavourites(user.id, type);
        if (activeTab === 'shops') {
            setShops(data);
        } else {
            setProducts(data);
        }
        setLoading(false);
    };

    const handleRemoveProduct = async (product) => {
        const newFavs = await FavouriteService.toggleFavourite(user.id, product, 'product');
        if (newFavs) setProducts(newFavs);
    };

    const handleAddToCart = (product) => {
        // Since we don't have the shop object here easily, 
        // we might just navigate to the shop detail where the product is.
        // Or if the product object has shopId, we could use that.
        if (product.shopId) {
            navigate(`/shop/${product.shopId}`);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="container favorites-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="back-btn-circle" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="page-title">My Favorites</h1>
                        <p className="page-subtitle">Your go-to spots and selected treats</p>
                    </div>
                </div>
            </header>

            <div className="fav-tabs-container">
                <div className="fav-tabs">
                    <button
                        className={`fav-tab ${activeTab === 'shops' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shops')}
                    >
                        Shops
                        {shops.length > 0 && <span className="tab-count">{shops.length}</span>}
                    </button>
                    <button
                        className={`fav-tab ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                        {products.length > 0 && <span className="tab-count">{products.length}</span>}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-grid">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton-card" style={{ height: '280px' }} />)}
                </div>
            ) : (
                <div className="fav-content">
                    {activeTab === 'shops' ? (
                        shops.length > 0 ? (
                            <div className="shops-grid">
                                {shops.map(shop => (
                                    <ShopCard key={shop.id} shop={shop} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-fav-state">
                                <div className="empty-icon-wrapper">
                                    <Utensils size={48} />
                                </div>
                                <h2>No favorite shops yet</h2>
                                <p>Explored some great places? Heart them to see them here!</p>
                                <button className="btn-primary" onClick={() => navigate('/')}>Explore Shops</button>
                            </div>
                        )
                    ) : (
                        products.length > 0 ? (
                            <div className="products-fav-grid">
                                {products.map(product => (
                                    <FavoriteProductCard
                                        key={product.id}
                                        product={product}
                                        onRemove={handleRemoveProduct}
                                        onAddToCart={handleAddToCart}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-fav-state">
                                <div className="empty-icon-wrapper">
                                    <Pizza size={48} />
                                </div>
                                <h2>Your wishlist is empty</h2>
                                <p>Save the dishes you love to order them again in a snap.</p>
                                <button className="btn-primary" onClick={() => navigate('/')}>Find Food</button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
