import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ChevronRight, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './FloatingCartFAB.css';

export default function FloatingCartFAB() {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart, getTotalItems, getSubtotal } = useCart();
    const [bouncing, setBouncing] = useState(false);

    const totalItems = getTotalItems();
    const subtotal = getSubtotal();

    // Trigger subtle bounce / pop animation when item count increases
    useEffect(() => {
        if (totalItems > 0) {
            setBouncing(true);
            const timer = setTimeout(() => setBouncing(false), 400);
            return () => clearTimeout(timer);
        }
    }, [totalItems, subtotal]);

    // Do not show FAB on checkout or login/register pages
    if (totalItems === 0 || location.pathname === '/checkout' || location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    return (
        <div className={`floating-cart-fab-wrapper ${bouncing ? 'fab-pop' : ''}`}>
            <button 
                className="floating-cart-fab"
                onClick={() => navigate('/checkout')}
                aria-label={`View Cart with ${totalItems} items, Total ₹${subtotal}`}
                type="button"
            >
                <div className="fab-left-section">
                    <div className="fab-bag-icon-wrapper">
                        <ShoppingBag size={20} color="#ffffff" />
                        <span className="fab-item-count-badge">{totalItems}</span>
                    </div>
                    <div className="fab-info-text">
                        <div className="fab-price-row">
                            <span className="fab-total-price">₹{subtotal}</span>
                            <span className="fab-items-count-text">({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                        </div>
                        <span className="fab-shop-label">
                            {cart.shopName ? `From ${cart.shopName}` : 'Instant Delivery'}
                        </span>
                    </div>
                </div>

                <div className="fab-right-section">
                    <span className="fab-action-text">View Cart</span>
                    <div className="fab-arrow-circle">
                        <ArrowRight size={16} color="#056f36" />
                    </div>
                </div>
            </button>
        </div>
    );
}
