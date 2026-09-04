import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { shopAPI } from '../api';
import ProductCard from '../components/ProductCard';
import PhoneSetupBanner from '../components/PhoneSetupBanner';
import UniversitySelection from '../components/UniversitySelection';
import {
    Search, SlidersHorizontal, Utensils, Pizza, Coffee, Store, Zap,
    BookOpen, FileText, Printer, Layers, X, School, Clock, ShoppingBag,
    Heart, Sparkles, ChevronRight, ArrowRight, Package, Flame, Milk
} from 'lucide-react';
import './Home.css';

const ESSENTIALS_CATEGORIES = [
    { id: 'all', name: 'All Essentials', icon: <Layers size={18} /> },
    { id: 'Snacks & drinks', name: 'Snacks & Drinks', icon: <Coffee size={18} /> },
    { id: 'Dairy', name: 'Dairy & Fresh', icon: <Milk size={18} /> },
    { id: 'Grocery & kitchen', name: 'Grocery & Kitchen', icon: <ShoppingBag size={18} /> },
    { id: 'Instant Food', name: 'Instant Food', icon: <Zap size={18} /> },
    { id: 'Personal Care', name: 'Personal Care', icon: <Sparkles size={18} /> },
];

const STATIONERY_CATEGORIES = [
    { id: 'all', name: 'All Stationery', icon: <Layers size={18} /> },
    { id: 'A4 Sheets', name: 'A4 & Paper', icon: <FileText size={18} /> },
    { id: 'Notebooks', name: 'Notebooks & Books', icon: <BookOpen size={18} /> },
    { id: 'Xerox', name: 'Xerox & Print', icon: <Printer size={18} /> },
    { id: 'Stationery', name: 'Pens & Tools', icon: <Package size={18} /> },
];

const STATIONERY_KEYWORDS = ['stationery', 'stationary', 'xerox', 'printing', 'print', 'book', 'paper', 'a4', 'sheet', 'pen', 'pencil', 'notebook', 'file', 'binding'];
const RESTAURANT_CATEGORIES = ['restaurant', 'food & canteen', 'cafe', 'pizzeria', 'fast food', 'dining', 'canteen', 'biryani', 'burger', 'pizza'];

export default function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const urlSearch = queryParams.get('search') || '';

    const [shops, setShops] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [mode, setMode] = useState('grocery'); // 'grocery' | 'stationery'
    const [coords, setCoords] = useState({ lat: null, lng: null });
    const [selectedUniversity, setSelectedUniversity] = useState(() => {
        const id = localStorage.getItem('selectedUniversityId');
        const name = localStorage.getItem('selectedUniversityName');
        return (id && id !== 'null' && id !== 'undefined') ? { id, name } : null;
    });
    const [showUniSelection, setShowUniSelection] = useState(() => {
        const id = localStorage.getItem('selectedUniversityId');
        return !(id && id !== 'null' && id !== 'undefined');
    });

    const CATEGORIES = mode === 'grocery' ? ESSENTIALS_CATEGORIES : STATIONERY_CATEGORIES;

    useEffect(() => {
        let isFetched = false;

        const executeFetch = (lat, lng) => {
            if (isFetched) return;
            isFetched = true;
            fetchData(lat, lng, selectedUniversity?.id);
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
                    console.warn("[Home] Geolocation error or fallback:", error.message);
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
    }, [selectedUniversity?.id]);

    const fetchData = async (lat, lng, universityId) => {
        try {
            setLoading(true);
            const res = await shopAPI.getShops(lat || coords.lat, lng || coords.lng, universityId);
            const rawShops = res.data || [];

            // FILTER OUT RESTAURANT SHOPS - ONLY KEEP GROCERY, WAREHOUSE & STATIONERY
            const nonRestaurantShops = rawShops.filter(s => {
                if (s.shopType === 'RESTAURANT') return false;
                const cat = (s.category || '').toLowerCase();
                if (RESTAURANT_CATEGORIES.some(rc => cat === rc || (cat.includes(rc) && !cat.includes('grocery') && !cat.includes('store')))) {
                    return false;
                }
                return true;
            });

            setShops(nonRestaurantShops);

            // Flatten products from non-restaurant shops only
            const flattenedProducts = [];
            const seenProductIds = new Set();

            nonRestaurantShops.forEach(shop => {
                if (shop.products && Array.isArray(shop.products)) {
                    shop.products.forEach(p => {
                        if (!seenProductIds.has(p.id)) {
                            seenProductIds.add(p.id);
                            flattenedProducts.push({
                                ...p,
                                shop: {
                                    id: shop.id,
                                    name: shop.name,
                                    deliveryFee: shop.deliveryFee,
                                    estimatedDeliveryTime: shop.estimatedDeliveryTime,
                                    isWarehouse: shop.isWarehouse
                                }
                            });
                        }
                    });
                }
            });

            setAllProducts(flattenedProducts);
        } catch (err) {
            console.error('Failed to fetch store items:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on mode, category, and search query
    const filteredProducts = useMemo(() => {
        return allProducts.filter(item => {
            const itemCat = (item.category || '').toLowerCase();
            const itemName = (item.name || '').toLowerCase();
            const itemDesc = (item.description || '').toLowerCase();
            const shopName = (item.shop?.name || '').toLowerCase();

            // 1. Mode Filter (Stationery vs Grocery/Essentials)
            const isStationeryItem = STATIONERY_KEYWORDS.some(k => itemCat.includes(k) || itemName.includes(k));
            if (mode === 'stationery') {
                if (!isStationeryItem) return false;
            } else {
                if (isStationeryItem) return false;
            }

            // 2. Search Query Filter
            if (urlSearch.trim()) {
                const q = urlSearch.toLowerCase();
                const matchesSearch = itemName.includes(q) ||
                    itemCat.includes(q) ||
                    itemDesc.includes(q) ||
                    shopName.includes(q);
                if (!matchesSearch) return false;
            }

            // 3. Category Filter
            if (activeCategory !== 'all') {
                const targetCat = activeCategory.toLowerCase();
                if (targetCat === 'dairy') {
                    const dairyKeywords = ['dairy', 'milk', 'curd', 'butter', 'egg', 'paneer', 'cheese', 'yogurt', 'fresh'];
                    return dairyKeywords.some(k => itemCat.includes(k) || itemName.includes(k));
                }
                if (targetCat === 'snacks & drinks') {
                    const snackKeywords = ['snack', 'drink', 'beverage', 'cola', 'soda', 'chips', 'biscuit', 'cookie', 'juice', 'tea', 'coffee', 'chocolate'];
                    return snackKeywords.some(k => itemCat.includes(k) || itemName.includes(k));
                }
                if (targetCat === 'instant food') {
                    const instantKeywords = ['instant', 'maggi', 'noodle', 'pasta', 'soup', 'ready'];
                    return instantKeywords.some(k => itemCat.includes(k) || itemName.includes(k));
                }
                if (targetCat === 'grocery & kitchen') {
                    const kitchenKeywords = ['grocery', 'kitchen', 'atta', 'rice', 'dal', 'oil', 'sugar', 'salt', 'spice', 'pulse'];
                    return kitchenKeywords.some(k => itemCat.includes(k) || itemName.includes(k));
                }
                if (targetCat === 'personal care') {
                    const careKeywords = ['personal', 'care', 'soap', 'shampoo', 'paste', 'brush', 'sanitizer', 'facewash'];
                    return careKeywords.some(k => itemCat.includes(k) || itemName.includes(k));
                }
                if (targetCat === 'a4 sheets') {
                    return itemCat.includes('a4') || itemName.includes('a4') || itemName.includes('sheet') || itemName.includes('paper');
                }
                if (targetCat === 'notebooks') {
                    return itemCat.includes('book') || itemCat.includes('notebook') || itemName.includes('book') || itemName.includes('notebook') || itemName.includes('register');
                }
                if (targetCat === 'xerox') {
                    return itemCat.includes('xerox') || itemCat.includes('print') || itemName.includes('xerox') || itemName.includes('print');
                }
                if (targetCat === 'stationery') {
                    return itemCat.includes('stationery') || itemCat.includes('stationary') || itemName.includes('pen') || itemName.includes('pencil') || itemName.includes('stapler') || itemName.includes('eraser') || itemName.includes('scale');
                }

                // Fallback exact/loose match
                return itemCat.includes(targetCat) || itemName.includes(targetCat);
            }

            return true;
        });
    }, [allProducts, mode, activeCategory, urlSearch]);

    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setActiveCategory('all');
    };

    const handleClearSearch = () => {
        navigate('/');
    };

    return (
        <div className="container home-page-container">
            {showUniSelection && (
                <UniversitySelection onSelect={(uni) => {
                    setSelectedUniversity(uni);
                    setShowUniSelection(false);
                }} />
            )}
            <PhoneSetupBanner />

            {/* Mode Switcher Pills */}
            <div className="mode-toggle-container">
                <div className="mode-toggle-pill">
                    <button
                        className={`mode-toggle-btn ${mode === 'grocery' ? 'active' : ''}`}
                        onClick={() => handleModeSwitch('grocery')}
                    >
                        <ShoppingBag size={16} />
                        <span>Essentials & Groceries</span>
                    </button>
                    <button
                        className={`mode-toggle-btn ${mode === 'stationery' ? 'active' : ''}`}
                        onClick={() => handleModeSwitch('stationery')}
                    >
                        <BookOpen size={16} />
                        <span>Stationery & Xerox</span>
                    </button>
                </div>
            </div>

            {/* Campus Food Delivery Banner Promo */}
            <div className="restaurant-delivery-banner">
                <div className="rdb-left">
                    <div className="rdb-icon-wrap">
                        <Utensils size={20} color="#056f36" />
                    </div>
                    <div className="rdb-text">
                        <h4 className="rdb-title">Hungry for hot cooked meals?</h4>
                        <p className="rdb-sub">Order from campus canteens, cafes & restaurants</p>
                    </div>
                </div>
                <Link to="/food-delivery" className="rdb-action-btn">
                    <span>Explore Food Delivery</span>
                    <ArrowRight size={16} />
                </Link>
            </div>

            {/* Category Chips Section */}
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
                <button className="filter-btn" onClick={() => setActiveCategory('all')}>
                    <SlidersHorizontal size={16} />
                    <span>Reset Filter</span>
                </button>
            </section>

            {/* Page Title & Fast Delivery Meta */}
            <header className="page-header">
                {urlSearch ? (
                    <div className="search-result-info">
                        <h1 className="page-title">Items matching "{urlSearch}"</h1>
                        <button className="clear-search-btn" onClick={handleClearSearch}>
                            <X size={16} />
                            <span>Clear Search</span>
                        </button>
                    </div>
                ) : (
                    <div className="header-title-block">
                        <h1 className="page-title">
                            {mode === 'stationery'
                                ? (activeCategory === 'all' ? 'Stationery & Study Supplies' : `${CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory}`)
                                : (activeCategory === 'all' ? 'Hostel Essentials & Groceries' : `${CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory}`)
                            }
                        </h1>
                    </div>
                )}
                <p className="page-subtitle">{filteredProducts.length} items available for instant delivery</p>

                {/* Nearest Warehouse/Store Indicator */}
                {shops.length > 0 && (
                    <div className="nearest-store-indicator">
                        <div className="ns-main">
                            <Zap size={14} className="zap-icon" color="#fbbf24" fill="#fbbf24" />
                            <span>Instant Delivery from <strong>{shops[0].name}</strong></span>
                            {selectedUniversity && (
                                <span className="ns-uni-tag">
                                    <School size={12} /> {selectedUniversity.name}
                                </span>
                            )}
                        </div>
                        <div className="ns-meta">
                            <span className="ns-badge"><Clock size={12} /> 10-15 min delivery</span>
                            <span className="ns-badge"><ShoppingBag size={12} /> ₹{shops[0].deliveryFee || 0} delivery</span>
                        </div>
                    </div>
                )}
            </header>

            {/* Products Grid Section */}
            <section className="products-section">
                {loading ? (
                    <div className="loading-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="skeleton-card" style={{ height: '310px' }} />
                        ))}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                shop={product.shop}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-results-container">
                        <Search size={48} className="empty-icon-lg" />
                        <h3>No items found</h3>
                        <p>
                            {urlSearch
                                ? `We couldn't find any products matching "${urlSearch}".`
                                : mode === 'stationery'
                                    ? 'No stationery items found in this category right now.'
                                    : `No items found in the "${CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory}" category.`
                            }
                        </p>
                        <button
                            className="btn-primary"
                            onClick={urlSearch ? handleClearSearch : () => setActiveCategory('all')}
                        >
                            {urlSearch ? 'Clear Search' : 'Show All Items'}
                        </button>
                    </div>
                )}
            </section>

            {/* Brand Footer Section */}
            <footer className="brand-footer-section">
                <div className="brand-footer-content">
                    <h2 className="brand-footer-title">
                        Hostel<br />life, easy!
                    </h2>
                    <p className="brand-footer-sub">
                        Crafted with <Heart size={16} className="heart-icon" /> in Kanyakumari, India
                    </p>
                </div>
            </footer>
        </div>
    );
}
