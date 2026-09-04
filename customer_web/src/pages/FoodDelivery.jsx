import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { shopAPI, orderAPI } from '../api';
import ShopCard from '../components/ShopCard';
import UniversitySelection from '../components/UniversitySelection';
import { 
    Search, Utensils, Pizza, Coffee, Store, Zap, Clock, ShoppingBag, 
    ChevronRight, Compass, Heart, Star, Sparkles, Filter, ChevronLeft, MapPin, RotateCcw, Flame
} from 'lucide-react';
import './FoodDelivery.css';

const FOOD_CATEGORIES = [
    { id: 'all', name: 'All Restaurants', icon: <Utensils size={16} /> },
    { id: 'biryani', name: 'Biryani & Rice', icon: <Flame size={16} /> },
    { id: 'curry', name: 'Curries & Gravies', icon: <Utensils size={16} /> },
    { id: 'starter', name: 'Starters & Snacks', icon: <Zap size={16} /> },
    { id: 'burger', name: 'Burgers & Pizzas', icon: <Pizza size={16} /> },
    { id: 'cafe', name: 'Cafe & Drinks', icon: <Coffee size={16} /> },
];

const STATIONERY_KEYWORDS = ['stationery', 'books', 'xerox', 'printing', 'stationary', 'paper', 'a4'];

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
        return (id && id !== 'null' && id !== 'undefined') ? { id, name } : null;
    });
    const [showUniSelection, setShowUniSelection] = useState(() => {
        const id = localStorage.getItem('selectedUniversityId');
        return !(id && id !== 'null' && id !== 'undefined');
    });

    const [coords, setCoords] = useState({ lat: null, lng: null });

    useEffect(() => {
        let isFetched = false;

        const executeFetch = (lat, lng) => {
            if (isFetched) return;
            isFetched = true;
            fetchShops(lat, lng, selectedUniversity?.id);
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setCoords({ lat, lng });
                    executeFetch(lat, lng);
                },
                (error) => {
                    console.warn("[FoodDelivery] Geolocation fallback:", error.message);
                    executeFetch(null, null);
                },
                { timeout: 3500, enableHighAccuracy: false }
            );

            const fallbackTimer = setTimeout(() => {
                executeFetch(null, null);
            }, 4000);

            return () => clearTimeout(fallbackTimer);
        } else {
            executeFetch(null, null);
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
            const rawShops = res.data || [];

            // Filter exclusively for Restaurants & Dining spots (exclude warehouses, grocery & stationery)
            const restaurantShops = rawShops.filter(s => {
                if (s.isWarehouse) return false;
                if (s.shopType === 'RESTAURANT') return true;
                
                const cat = (s.category || '').toLowerCase();
                const isStationery = STATIONERY_KEYWORDS.some(k => cat.includes(k));
                if (isStationery) return false;
                if (s.shopType === 'GROCERY' || s.shopType === 'STATIONERY') return false;
                
                return true;
            });

            setShops(restaurantShops);
        } catch (err) {
            console.error('Failed to fetch restaurants:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await orderAPI.getMyOrders();
            if (res.data && Array.isArray(res.data)) {
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
            const q = searchQuery.toLowerCase();
            base = base.filter(s => {
                const nameMatch = s.name.toLowerCase().includes(q);
                const catMatch = (s.category || '').toLowerCase().includes(q);
                const productMatch = s.products && Array.isArray(s.products) && s.products.some(p => 
                    p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
                );
                return nameMatch || catMatch || productMatch;
            });
        }

        // Apply category chip
        if (activeCategory !== 'all') {
            const target = activeCategory.toLowerCase();
            base = base.filter(shop => {
                const shopCat = (shop.category || '').toLowerCase();
                const shopName = (shop.name || '').toLowerCase();
                if (shopCat.includes(target) || shopName.includes(target)) return true;
                
                if (shop.products && Array.isArray(shop.products)) {
                    return shop.products.some(p => 
                        (p.category || '').toLowerCase().includes(target) || 
                        (p.name || '').toLowerCase().includes(target)
                    );
                }
                return false;
            });
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
            {showUniSelection && (
                <UniversitySelection onSelect={(uni) => {
                    setSelectedUniversity(uni);
                    setShowUniSelection(false);
                }} />
            )}

            {/* Hero Header Section */}
            <div className="food-hero-section-third">
                <div className="hero-content-box">
                    <h1 className="hero-bold-title">CAMPUS FOOD DELIVERY</h1>
                    <p className="hero-calligraphy-sub">
                        {selectedUniversity?.name || 'Joy University, Kanyakumari'}
                    </p>
                    <div className="curved-swoosh-wrapper">
                        <svg width="220" height="18" viewBox="0 0 220 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M 5,6 Q 110,1 215,7 C 222,8 218,15 185,15" stroke="#056f36" strokeWidth="2.4" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                <div className="redesigned-search-pill">
                    <div className="search-icon-badge">
                        <Search size={18} color="#ffffff" />
                    </div>
                    <input 
                        type="text" 
                        className="redesigned-search-input"
                        placeholder="Search restaurants, biryani, burgers, rotis..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Food Cuisine Category Chips */}
            <div className="hero-pill-chips-row" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '24px' }}>
                {FOOD_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`hero-pill-chip ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '50px',
                            fontSize: '13px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            background: activeCategory === cat.id ? '#056f36' : 'var(--white)',
                            color: activeCategory === cat.id ? '#ffffff' : 'var(--black)',
                            border: '1px solid var(--border)',
                            boxShadow: activeCategory === cat.id ? '0 4px 12px rgba(5, 111, 54, 0.25)' : 'none'
                        }}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Main Restaurants Section */}
            <div className="food-main-layout">
                <div className="food-main-header">
                    <div>
                        <h2 className="main-heading">Campus Dining & Canteens</h2>
                        <p className="sub-heading">{filteredShops.length} restaurants serving your campus</p>
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
                            <div key={i} className="skeleton-card" style={{ height: '280px' }} />
                        ))}
                    </div>
                ) : filteredShops.length > 0 ? (
                    <div className="shops-grid">
                        {filteredShops.map(shop => (
                            <ShopCard key={shop.id} shop={shop} />
                        ))}
                    </div>
                ) : (
                    <div className="rich-empty-state">
                        <div className="outline-art-wrapper">
                            <div className="dashed-circle-orbit">
                                <Utensils size={44} color="#056f36" className="outline-center-icon" />
                                <Sparkles size={16} color="#fbbf24" className="sparkle-accent-top" />
                                <Search size={14} color="#94a3b8" className="search-accent-bottom" />
                            </div>
                            <div className="outline-status-pill">0 RESTAURANTS</div>
                        </div>

                        <h3 className="empty-title">No Restaurants Found</h3>
                        <p className="empty-desc">
                            {searchQuery 
                                ? `We couldn't find any dining spots matching "${searchQuery}".`
                                : `No restaurants found matching the selected cuisine.`
                            }
                        </p>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '16px', background: '#056f36', color: '#fff', padding: '10px 24px', borderRadius: '50px', fontWeight: 700 }}
                            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                        >
                            View All Restaurants
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
