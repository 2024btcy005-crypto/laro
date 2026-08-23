import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { shopAPI, orderAPI } from '../api';
import ShopCard from '../components/ShopCard';
import { 
    Search, Utensils, Pizza, Coffee, Store, Zap, Clock, ShoppingBag, 
    ChevronRight, Compass, Heart, Star, Sparkles, Filter, ChevronLeft, MapPin
} from 'lucide-react';
import './FoodDelivery.css';

const FOOD_CATEGORIES = [
    { id: 'all', name: 'All Cuisines', icon: <Utensils size={18} /> },
    { id: 'Burgers', name: 'Burgers & Fries', icon: <Zap size={18} /> },
    { id: 'Pizza', name: 'Pizzas', icon: <Pizza size={18} /> },
    { id: 'Cafe', name: 'Cafe & Drinks', icon: <Coffee size={18} /> },
    { id: 'Stores', name: 'Convenience', icon: <Store size={18} /> },
];

const STATIONERY_SHOP_MODES = ['Stationery', 'Books', 'Xerox', 'Printing', 'Stationary'];

export default function FoodDelivery() {
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [filteredShops, setFilteredShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeOrders, setActiveOrders] = useState([]);
    
    const [selectedUniversity, setSelectedUniversity] = useState(() => {
        const id = localStorage.getItem('selectedUniversityId');
        const name = localStorage.getItem('selectedUniversityName');
        return id ? { id, name } : null;
    });

    const [coords, setCoords] = useState({ lat: null, lng: null });

    useEffect(() => {
        // Fetch location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setCoords({ lat, lng });
                    fetchShops(lat, lng, selectedUniversity?.id);
                },
                (error) => {
                    fetchShops(null, null, selectedUniversity?.id);
                }
            );
        } else {
            fetchShops(null, null, selectedUniversity?.id);
        }
        
        fetchActiveOrders();
    }, [selectedUniversity?.id]);

    useEffect(() => {
        applyFilter();
    }, [activeCategory, shops, searchQuery]);

    const fetchShops = async (lat, lng, universityId) => {
        try {
            setLoading(true);
            const res = await shopAPI.getShops(lat || coords.lat, lng || coords.lng, universityId);
            // Filter to only have food joints & restaurants (exclude warehouses & stationery)
            const foodOnly = (res.data || []).filter(
                s => !s.isWarehouse &&
                    s.shopType !== 'GROCERY' &&
                    s.shopType !== 'STATIONERY' &&
                    (!s.category || !STATIONERY_SHOP_MODES.some(m => s.category.toLowerCase().includes(m.toLowerCase())))
            );
            setShops(foodOnly);
        } catch (err) {
            console.error('Failed to fetch food shops:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveOrders = async () => {
        try {
            const res = await orderAPI.getMyOrders();
            if (res.data && Array.isArray(res.data)) {
                // filter active orders
                const active = res.data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
                setActiveOrders(active);
            }
        } catch (err) {
            console.error('Failed to fetch active orders:', err);
        }
    };

    const applyFilter = () => {
        let base = shops;

        // Apply search query
        if (searchQuery.trim()) {
            base = base.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply category chip
        if (activeCategory !== 'all') {
            base = base.filter(shop => shop.category === activeCategory);
        }

        setFilteredShops(base);
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'placed': return 'Order Placed';
            case 'accepted': return 'Preparing Food';
            case 'out_for_delivery': return 'Out for Delivery';
            default: return 'Processing';
        }
    };

    return (
        <div className="food-delivery-container container">
            {/* Header Banner */}
            <div className="food-hero-banner">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <span className="badge-promo"><Sparkles size={14} /> 50% Cashback on First Order</span>
                    <h1 className="hero-title">Delicious Meals, Delivered Hot to Your Dorm</h1>
                    <p className="hero-subtitle">Bringing your favorite campus eateries straight to your doorstep.</p>
                    <div className="hero-search-box">
                        <Search className="search-icon" size={20} />
                        <input 
                            type="text" 
                            placeholder="Craving burgers, pizza, or coffees? Search here..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Categories */}
            <section className="food-categories-sec">
                <h2 className="section-title-sm">Explore Cuisines</h2>
                <div className="food-categories-scroll">
                    {FOOD_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`food-cat-card ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <div className="food-cat-icon-circle">
                                {cat.icon}
                            </div>
                            <span className="food-cat-name">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Main Section */}
            <div className="food-main-layout">
                <div className="food-main-header">
                    <div>
                        <h2 className="main-heading">Popular Restaurants</h2>
                        <p className="sub-heading">{filteredShops.length} restaurants open near you</p>
                    </div>
                    {selectedUniversity && (
                        <div className="campus-badge">
                            <MapPin size={14} />
                            <span>{selectedUniversity.name}</span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="loading-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton-card" />
                        ))}
                    </div>
                ) : filteredShops.length > 0 ? (
                    <div className="shops-grid">
                        {filteredShops.map(shop => (
                            <ShopCard key={shop.id} shop={shop} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-food-state">
                        <Compass size={48} className="empty-icon" />
                        <h3>No Food Joints Found</h3>
                        <p>
                            {searchQuery 
                                ? `We couldn't find any restaurants matching "${searchQuery}".`
                                : `No restaurants found in the selected category "${activeCategory}".`
                            }
                        </p>
                        <button className="btn-primary" onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
                            Browse All Restaurants
                        </button>
                    </div>
                )}
            </div>

            {/* Active Order Live Tracker Widget */}
            {activeOrders.length > 0 && (
                <div className="live-order-tracker-card premium-card">
                    <div className="tracker-header">
                        <div className="pulse-indicator"></div>
                        <span>Live Order Tracking</span>
                    </div>
                    {activeOrders.map(order => (
                        <div key={order.id} className="tracker-body">
                            <div className="tracker-info">
                                <h4 className="tracker-shop-name">{order.shop?.name || 'Laro Kitchen'}</h4>
                                <p className="tracker-status">{getStatusLabel(order.status)}</p>
                            </div>
                            <Link to="/profile" className="btn-track-arrow">
                                <span>Track</span>
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
