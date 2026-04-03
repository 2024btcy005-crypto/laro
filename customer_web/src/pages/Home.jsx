import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { shopAPI } from '../api';
import ShopCard from '../components/ShopCard';
import PhoneSetupBanner from '../components/PhoneSetupBanner';
import UniversitySelection from '../components/UniversitySelection';
import { Search, SlidersHorizontal, Utensils, Pizza, Coffee, Store, Zap, BookOpen, FileText, Printer, Layers, X, School, Clock, ShoppingBag } from 'lucide-react';
import './Home.css';

const FOOD_CATEGORIES = [
    { id: 'all', name: 'All', icon: <Utensils size={18} /> },
    { id: 'Burgers', name: 'Burgers', icon: <Zap size={18} /> },
    { id: 'Pizza', name: 'Pizza', icon: <Pizza size={18} /> },
    { id: 'Cafe', name: 'Cafe', icon: <Coffee size={18} /> },
    { id: 'Stores', name: 'Stores', icon: <Store size={18} /> },
];

const STATIONERY_CATEGORIES = [
    { id: 'all', name: 'All', icon: <Layers size={18} /> },
    { id: 'Stationery', name: 'Stationery', icon: <BookOpen size={18} /> },
    { id: 'Books', name: 'Books', icon: <BookOpen size={18} /> },
    { id: 'A4 Sheets', name: 'A4 Sheets', icon: <FileText size={18} /> },
    { id: 'Xerox', name: 'Xerox', icon: <Printer size={18} /> },
];

const STATIONERY_SHOP_MODES = ['Stationery', 'Books', 'Xerox', 'Printing', 'Stationary'];

export default function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const urlSearch = queryParams.get('search') || '';

    const [shops, setShops] = useState([]);
    const [filteredShops, setFilteredShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [mode, setMode] = useState('food'); // 'food' | 'stationery'
    const [coords, setCoords] = useState({ lat: null, lng: null });
    const [selectedUniversity, setSelectedUniversity] = useState(() => {
        const id = localStorage.getItem('selectedUniversityId');
        const name = localStorage.getItem('selectedUniversityName');
        return id ? { id, name } : null;
    });
    const [showUniSelection, setShowUniSelection] = useState(!localStorage.getItem('selectedUniversityId'));

    const CATEGORIES = mode === 'food' ? FOOD_CATEGORIES : STATIONERY_CATEGORIES;

    useEffect(() => {
        // Request browser geolocation
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    console.log(`[Home] Location granted: ${lat}, ${lng}`);
                    setCoords({ lat, lng });
                    fetchShops(lat, lng, selectedUniversity?.id);
                },
                (error) => {
                    console.warn("[Home] Geolocation denied or failed:", error.message);
                    fetchShops(null, null, selectedUniversity?.id); // fallback to all shops
                }
            );
        } else {
            fetchShops(null, null, selectedUniversity?.id);
        }
    }, [selectedUniversity?.id]);

    useEffect(() => {
        applyFilter();
    }, [activeCategory, shops, mode, urlSearch]);

    const applyFilter = () => {
        let base = shops;

        // Filter by URL Search
        if (urlSearch) {
            base = base.filter(s =>
                s.name.toLowerCase().includes(urlSearch.toLowerCase()) ||
                (s.category && s.category.toLowerCase().includes(urlSearch.toLowerCase()))
            );
        }

        if (mode === 'stationery') {
            base = base.filter(s => s.category && STATIONERY_SHOP_MODES.some(m => s.category.toLowerCase().includes(m.toLowerCase())));
        } else {
            // food mode: show shops that are NOT stationery
            base = base.filter(s => !s.category || !STATIONERY_SHOP_MODES.some(m => s.category.toLowerCase().includes(m.toLowerCase())));
        }

        if (activeCategory !== 'all') {
            base = base.filter(shop => shop.category === activeCategory);
        }
        setFilteredShops(base);
    };

    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setActiveCategory('all');
    };

    const handleClearSearch = () => {
        navigate('/');
    };

    const fetchShops = async (lat, lng, universityId) => {
        try {
            setLoading(true);
            const res = await shopAPI.getShops(lat || coords.lat, lng || coords.lng, universityId);
            setShops(res.data || []);
        } catch (err) {
            console.error('Failed to fetch shops:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            {showUniSelection && (
                <UniversitySelection onSelect={(uni) => {
                    setSelectedUniversity(uni);
                    setShowUniSelection(false);
                }} />
            )}
            <PhoneSetupBanner />

            {/* Mode Toggle */}
            <div className="mode-toggle-container">
                <div className="mode-toggle-pill">
                    <button
                        className={`mode-toggle-btn ${mode === 'food' ? 'active' : ''}`}
                        onClick={() => handleModeSwitch('food')}
                    >
                        <Utensils size={16} />
                        <span>Food & Shops</span>
                    </button>
                    <button
                        className={`mode-toggle-btn ${mode === 'stationery' ? 'active' : ''}`}
                        onClick={() => handleModeSwitch('stationery')}
                    >
                        <BookOpen size={16} />
                        <span>Stationery</span>
                    </button>
                </div>
            </div>

            {/* Category Section */}
            <section className="categories-section">
                <div className="categories-container">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className="cat-icon">{cat.icon}</span>
                            <span className="cat-name">{cat.name}</span>
                        </button>
                    ))}
                </div>
                <button className="filter-btn">
                    <SlidersHorizontal size={18} />
                    <span>Filters</span>
                </button>
            </section>

            <header className="page-header">
                {urlSearch ? (
                    <div className="search-result-info">
                        <h1 className="page-title">Results for "{urlSearch}"</h1>
                        <button className="clear-search-btn" onClick={handleClearSearch}>
                            <X size={16} />
                            <span>Clear Search</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className="page-title">
                            {mode === 'stationery'
                                ? (activeCategory === 'all' ? 'Stationery & Printing' : `${activeCategory}`)
                                : (activeCategory === 'all' ? 'All Shops' : `${activeCategory} Spots`)
                            }
                        </h1>
                    </>
                )}
                <p className="page-subtitle">{filteredShops.length} places near you</p>
                {/* Nearest Warehouse/Store Indicator */}
                {filteredShops.length > 0 && filteredShops[0].distance && (
                    <div className="nearest-store-indicator">
                        <div className="ns-main">
                            <Zap size={14} className="zap-icon" color="#fbbf24" fill="#fbbf24" />
                            <span>Serving from <strong>{filteredShops[0].name}</strong> ({filteredShops[0].distance} km away)</span>
                            {selectedUniversity && (
                                <span className="ns-uni-tag">
                                    <School size={12} /> {selectedUniversity.name}
                                </span>
                            )}
                        </div>
                        <div className="ns-meta">
                            <span className="ns-badge"><Clock size={12} /> {filteredShops[0].estimatedDeliveryTime || '25 min'}</span>
                            <span className="ns-badge"><ShoppingBag size={12} /> ₹{filteredShops[0].deliveryFee || 0} delivery</span>
                        </div>
                    </div>
                )}
            </header>

            <section className="shops-section">
                {loading ? (
                    <div className="loading-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => (
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
                    <div className="empty-results-container">
                        <Search size={48} className="empty-icon-lg" />
                        <h3>No shops found</h3>
                        <p>
                            {urlSearch
                                ? `We couldn't find any shops matching "${urlSearch}".`
                                : mode === 'stationery'
                                    ? 'Add stationery shops in the admin dashboard with a Stationery/Books/Xerox category.'
                                    : `We couldn't find any shops in the "${activeCategory}" category.`
                            }
                        </p>
                        <button
                            className="btn-primary"
                            onClick={urlSearch ? handleClearSearch : () => setActiveCategory('all')}
                        >
                            {urlSearch ? 'Clear Search' : 'Show all shops'}
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
