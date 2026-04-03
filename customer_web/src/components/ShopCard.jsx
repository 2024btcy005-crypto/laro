import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Heart } from 'lucide-react';
import { resolveImageUrl } from '../api';
import './ShopCard.css';

const ShopCard = ({ shop }) => {
    const navigate = useNavigate();
    const [isFav, setIsFav] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const checkFav = async () => {
            if (user.id) {
                const status = await FavouriteService.isFavourite(user.id, shop.id, 'shop');
                setIsFav(status);
            }
        };
        checkFav();
    }, [user.id, shop.id]);

    const handleToggleFav = async (e) => {
        e.stopPropagation();
        if (!user.id) {
            alert('Please login to save favorites!');
            return;
        }
        const newFavs = await FavouriteService.toggleFavourite(user.id, shop, 'shop');
        if (newFavs) {
            setIsFav(!isFav);
        }
    };

    return (
        <div className="shop-card premium-card" onClick={() => navigate(`/shop/${shop.id}`)}>
            <div className="shop-image-wrapper">
                <img
                    src={resolveImageUrl(shop.imageUrl)}
                    alt={shop.name}
                    className="shop-image"
                />
                <button
                    className={`fav-toggle-btn ${isFav ? 'active' : ''}`}
                    onClick={handleToggleFav}
                    title={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                    <Heart size={20} fill={isFav ? "#ff4757" : "transparent"} stroke={isFav ? "#ff4757" : "white"} />
                </button>
                {shop.promoted && <div className="promoted-badge">Promoted</div>}
                {shop.discount && <div className="discount-badge">{shop.discount}</div>}
            </div>

            <div className="shop-info">
                <div className="shop-header">
                    <h3 className="shop-name">{shop.name}</h3>
                    <div className="shop-rating">
                        <Star size={14} fill="currentColor" />
                        <span>{shop.rating || 'New'}</span>
                    </div>
                </div>

                <p className="shop-category">{shop.category}</p>

                <div className="shop-footer">
                    <div className="shop-meta">
                        <Clock size={14} />
                        <span>{shop.estimatedDeliveryTime || shop.deliveryTime || '25-30 min'}</span>
                    </div>
                    {shop.deliveryFee !== undefined && (
                        <>
                            <div className="dot" />
                            <span className="delivery-fee">₹{shop.deliveryFee} delivery</span>
                        </>
                    )}
                    {shop.distance && (
                        <>
                            <div className="dot" />
                            <span className="distance">{shop.distance} km</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopCard;
