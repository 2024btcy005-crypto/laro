import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopAPI, resolveImageUrl, API_BASE_URL } from '../api';
import { useCart } from '../context/CartContext';
import { Star, Clock, MapPin, Plus, Minus, ChevronLeft, ShoppingBag, Heart, Upload, X, FileText, Search } from 'lucide-react';
import { FavouriteService } from '../services/FavouriteService';
import './ShopDetail.css';

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

    const foodKeywords = ['milk', 'curd', 'buttermilk', 'butter', 'egg', 'bread', 'chips', 'lays', 'coke', 'campa', 'maggi', 'noodle', 'rice', 'atta', 'dal', 'tea', 'coffee', 'juice', 'soda', 'peanuts', 'chocolate', 'biscuit', 'cookie', 'pizza', 'burger'];

    if (nonEdibleKeywords.some(k => name.includes(k))) return false;

    if (nonEdibleCategories.some(c => cat === c)) {
        if (foodKeywords.some(f => name.includes(f))) return true;
        return false;
    }

    return true;
};

const MenuItem = ({ item, shop, cart, addToCart, removeFromCart, getItemQuantity, user }) => {
    const [isFav, setIsFav] = useState(false);
    const [showVariants, setShowVariants] = useState(false);

    useEffect(() => {
        const checkFav = async () => {
            if (user.id) {
                const status = await FavouriteService.isFavourite(user.id, item.id, 'product');
                setIsFav(status);
            }
        };
        checkFav();
    }, [user.id, item.id]);

    const handleToggleFav = async (e) => {
        e?.stopPropagation();
        if (!user.id) {
            alert('Please login to save favorites!');
            return;
        }
        const newFavs = await FavouriteService.toggleFavourite(user.id, item, 'product');
        if (newFavs) setIsFav(!isFav);
    };

    const edible = isEdibleProduct(item);
    const isVeg = item.isVeg !== false;
    const rating = item.rating || (4.2 + (typeof item.id === 'string' ? item.id.charCodeAt(0) % 7 : 3) * 0.1).toFixed(1);
    const itemQty = getItemQuantity(item.id);

    return (
        <div className={`menu-item-card ${item.isBestseller ? 'bestseller-card' : ''}`}>
            <div className="item-main-row">
                <div className="item-info">
                    <div className="item-badge-row">
                        {edible && (
                            <span className={`veg-badge ${isVeg ? 'veg' : 'non-veg'}`}>
                                <span className="dot" />
                            </span>
                        )}
                        {item.isBestseller && <span className="bestseller-tag">🔥 MUST TRY</span>}
                        {item.variants?.length > 0 && <span className="customisable-tag">✨ CUSTOMISABLE</span>}
                    </div>
                    {item.isB2G1 && <span className="b2g1-badge">🎁 BUY 2 GET 1 FREE</span>}
                    {item.isCombo && <span className="combo-badge">🔥 COMBO MEAL</span>}
                    <h3 className="item-name">{item.name}</h3>
                    <div className="item-price-rating-row">
                        <span className="item-price">₹{item.price}{item.variants?.length > 0 && <span className="onwards-tag"> onwards</span>}</span>
                        <span className="item-rating-pill">⭐ {rating}</span>
                    </div>
                    {item.description && (
                        <p className="item-desc">{item.description}</p>
                    )}
                </div>

                <div className="item-action">
                    <div className="item-image-sm">
                        <img
                            src={resolveImageUrl(item.imageUrl)}
                            alt={item.name}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop';
                            }}
                        />
                        <button
                            className={`item-fav-btn ${isFav ? 'active' : ''}`}
                            onClick={handleToggleFav}
                            title="Save to favorites"
                            type="button"
                        >
                            <Heart size={15} fill={isFav ? "#ff4757" : "transparent"} stroke={isFav ? "#ff4757" : "#fff"} />
                        </button>

                        <div className="item-button-overlay">
                            {itemQty > 0 ? (
                                <div className="quantity-control">
                                    <button type="button" onClick={() => removeFromCart(item.id)}><Minus size={14} /></button>
                                    <span className="qty-number">{itemQty}</span>
                                    <button type="button" onClick={() => addToCart(item, shop)}><Plus size={14} /></button>
                                </div>
                            ) : (
                                !item.isAvailable ? (
                                    <button className="add-btn disabled" disabled>SOLD OUT</button>
                                ) : (
                                    item.variants?.length > 0 ? (
                                        <button className="add-btn" type="button" onClick={() => setShowVariants(!showVariants)}>
                                            {showVariants ? 'CLOSE' : 'ADD +'}
                                        </button>
                                    ) : (
                                        <button className="add-btn" type="button" onClick={() => addToCart(item, shop)}>ADD +</button>
                                    )
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showVariants && item.variants?.length > 0 && (
                <div className="variant-selection-area">
                    <p className="variant-label">Select Options</p>
                    {item.variants.map(variant => {
                        const variantQty = getItemQuantity(variant.id);
                        return (
                            <div key={variant.id} className="variant-option">
                                <div className="variant-info">
                                    <span className="variant-name">{variant.variantName}</span>
                                    <span className="variant-price">₹{variant.price}</span>
                                </div>
                                {variantQty > 0 ? (
                                    <div className="quantity-control sm">
                                        <button type="button" onClick={() => removeFromCart(variant.id)}><Minus size={12} /></button>
                                        <span>{variantQty}</span>
                                        <button type="button" onClick={() => addToCart(variant, shop)}><Plus size={12} /></button>
                                    </div>
                                ) : (
                                    <button className="add-btn-sm" type="button" onClick={() => addToCart(variant, shop)}>ADD +</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default function ShopDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isShopFav, setIsShopFav] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [landscape, setLandscape] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { cart, addToCart, removeFromCart, getSubtotal, xeroxFile, setXeroxFile } = useCart();

    const XEROX_CATEGORIES = ['xerox', 'printing', 'stationery', 'books', 'stationary'];
    const isXeroxShop = shop?.category && XEROX_CATEGORIES.some(c => shop.category.toLowerCase().includes(c));

    const fileInputRef = useRef(null);
    const [uploadError, setUploadError] = useState(null);
    const [colorMode, setColorMode] = useState('BW'); // 'BW' or 'Color'
    const [sides, setSides] = useState('Single'); // 'Single' or 'Double'
    const [ratio, setRatio] = useState('1:1'); // '1:1', '1:2', etc.
    const [pricing, setPricing] = useState({ bwSingle: 1, bwDouble: 1.5, colorSingle: 5, colorDouble: 8 });

    useEffect(() => {
        if (shop && isXeroxShop) {
            fetchPricing();
        }
    }, [shop]);

    const fetchPricing = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/xerox-pricing/shop/${shop.id}`);
            const data = await res.json();
            if (res.ok) {
                setPricing(data);
            }
        } catch (err) {
            console.error('Failed to fetch pricing');
        }
    };

    const calculateTotalCost = () => {
        if (!xeroxFile || !xeroxFile.pageCount) return 0;
        let rate = 1;
        if (colorMode === 'Color') {
            rate = sides === 'Single' ? pricing.colorSingle : pricing.colorDouble;
        } else {
            rate = sides === 'Single' ? pricing.bwSingle : pricing.bwDouble;
        }
        return (xeroxFile.pageCount * rate).toFixed(2);
    };

    const totalPrice = calculateTotalCost();

    const handleXeroxUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create local preview URL
        if (file.type.startsWith('image/')) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }

        setUploadLoading(true);
        setUploadError(null);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${API_BASE_URL}/upload/xerox`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            setXeroxFile({ url: data.url, originalName: data.originalName, size: data.size, mimetype: data.mimetype, pageCount: data.pageCount });
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setUploadLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchShopDetails();
    }, [id]);

    useEffect(() => {
        const checkShopFav = async () => {
            if (user.id && shop) {
                const status = await FavouriteService.isFavourite(user.id, shop.id, 'shop');
                setIsShopFav(status);
            }
        };
        checkShopFav();
    }, [user.id, shop]);

    const handleToggleShopFav = async () => {
        if (!user.id) {
            alert('Please login to save favorites!');
            return;
        }
        const newFavs = await FavouriteService.toggleFavourite(user.id, shop, 'shop');
        if (newFavs) setIsShopFav(!isShopFav);
    };

    const fetchShopDetails = async () => {
        try {
            setLoading(true);
            const universityId = localStorage.getItem('selectedUniversityId');
            const res = await shopAPI.getShopDetails(id, universityId);
            console.log('[DEBUG] Fetched shop details:', res.data);
            setShop(res.data);
        } catch (err) {
            console.error('Failed to fetch shop details:', err);
        } finally {
            setLoading(false);
        }
    };

    const getItemQuantity = (itemId) => {
        const item = cart.items.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    };

    if (loading) return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <div className="skeleton-hero" />
            <div className="skeleton-grid">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-item" style={{ height: '120px' }} />)}
            </div>
        </div>
    );

    if (!shop) return (
        <div className="container empty-state">
            <h2>Shop not found</h2>
            <button className="btn-primary" onClick={() => navigate('/')}>Back to Shops</button>
        </div>
    );

    return (
        <div className="container shop-detail-page">
            {/* Back Button */}
            <button className="back-link" onClick={() => navigate('/')}>
                <ChevronLeft size={20} />
                <span>Back to Shops</span>
            </button>

            {/* Shop Hero Section */}
            <section className="shop-hero">
                <div className="shop-hero-content">
                    <div className="shop-header-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 className="shop-title">{shop.name}</h1>
                                <p className="shop-category">{shop.category}</p>
                            </div>
                            <button
                                className={`shop-fav-btn ${isShopFav ? 'active' : ''}`}
                                onClick={handleToggleShopFav}
                            >
                                <Heart size={24} fill={isShopFav ? "#ff4757" : "transparent"} stroke={isShopFav ? "#ff4757" : "#64748b"} />
                            </button>
                        </div>
                        <div className="shop-meta-row">
                            <div className="meta-badge rating">
                                <Star size={16} fill="currentColor" />
                                <span>{shop.rating || '4.2'}</span>
                            </div>
                            <div className="meta-badge">
                                <Clock size={16} />
                                <span>{shop.estimatedDeliveryTime || shop.deliveryTime || '30 Min'}</span>
                            </div>
                            {shop.deliveryFee !== undefined && (
                                <div className="meta-badge currency">
                                    <ShoppingBag size={16} />
                                    <span>₹{shop.deliveryFee} Fee</span>
                                </div>
                            )}
                            <div className="meta-badge location">
                                <MapPin size={16} />
                                <span>{shop.address || 'Kochi, Kerala'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="shop-hero-image">
                        <img src={resolveImageUrl(shop.imageUrl) || 'https://via.placeholder.com/600x400?text=Laro+Merchant'} alt={shop.name} />
                    </div>
                </div>
            </section>

            <div className={`shop-content-wrapper ${(isXeroxShop || !shop.products?.length) ? 'full-width' : ''}`}>
                {/* Menu Section */}
                <div className="menu-container">
                    {!isXeroxShop && (
                        <div className="menu-header-row">
                            <h2 className="section-title">Menu</h2>
                            <div className="menu-search-wrapper">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="menu-search-input"
                                />
                                {searchTerm && (
                                    <button className="clear-search" onClick={() => setSearchTerm('')}>
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Category Filter Pills */}
                    {!isXeroxShop && shop.products && (() => {
                        const uniqueCats = Array.from(new Set(shop.products.map(p => p.category || 'General').filter(Boolean)));
                        if (uniqueCats.length <= 1) return null;
                        return (
                            <div className="shop-category-pills">
                                <button
                                    className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('All')}
                                >
                                    All ({shop.products.length})
                                </button>
                                {uniqueCats.map(cat => {
                                    const c = cat.toLowerCase();
                                    const icon = (c.includes('rotti') || c.includes('roti') || c.includes('bread') || c.includes('chapathi') || c.includes('naan')) ? '🫓 ' :
                                        (c.includes('curry') || c.includes('curries') || c.includes('gravy')) ? '🥘 ' :
                                        (c.includes('rice') || c.includes('biryani')) ? '🍚 ' :
                                        (c.includes('veg') && !c.includes('non')) ? '🌱 ' :
                                        (c.includes('non-veg') || c.includes('non veg') || c.includes('chicken')) ? '🍗 ' : '🍽️ ';
                                    return (
                                        <button
                                            key={cat}
                                            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            {icon}{cat} ({shop.products.filter(p => (p.category || 'General') === cat).length})
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    <div className="menu-list">
                        {!isXeroxShop && (
                            (() => {
                                const filtered = (shop.products || []).filter(item => {
                                    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
                                    const matchesCat = selectedCategory === 'All' || (item.category || 'General') === selectedCategory;
                                    return matchesSearch && matchesCat;
                                });

                                if (!shop.products || shop.products.length === 0) {
                                    return <p className="empty-menu-text">No menu items found for this shop.</p>;
                                }

                                if (filtered.length === 0 && searchTerm) {
                                    return (
                                        <div className="no-results-state">
                                            <Search size={40} className="empty-icon" />
                                            <p>No products match "{searchTerm}"</p>
                                            <button className="btn-secondary-sm" onClick={() => setSearchTerm('')}>Clear Search</button>
                                        </div>
                                    );
                                }

                                const grouped = filtered.reduce((acc, item) => {
                                    const cat = item.category || 'General';
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(item);
                                    return acc;
                                }, {});

                                return Object.entries(grouped).map(([categoryName, items]) => {
                                    const c = categoryName.toLowerCase();
                                    const icon = (c.includes('rotti') || c.includes('roti') || c.includes('bread') || c.includes('chapathi') || c.includes('naan')) ? '🫓 ' :
                                        (c.includes('curry') || c.includes('curries') || c.includes('gravy')) ? '🥘 ' :
                                        (c.includes('rice') || c.includes('biryani')) ? '🍚 ' :
                                        (c.includes('veg') && !c.includes('non')) ? '🌱 ' :
                                        (c.includes('non-veg') || c.includes('non veg') || c.includes('chicken')) ? '🍗 ' : '🍽️ ';

                                    return (
                                        <div key={categoryName} className="menu-category-group">
                                            <div className="category-section-header">
                                                <h3 className="category-section-title">
                                                    {icon}{categoryName}
                                                </h3>
                                                <span className="category-count-badge">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                                            </div>
                                        <div className="category-items-grid">
                                            {items.map(item => (
                                                <MenuItem
                                                    key={item.id}
                                                    item={item}
                                                    shop={shop}
                                                    cart={cart}
                                                    addToCart={addToCart}
                                                    removeFromCart={removeFromCart}
                                                    getItemQuantity={getItemQuantity}
                                                    user={user}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })())}
                    </div>

                    {!isXeroxShop && (
                        <div className="shop-bottom-hygiene-card">
                            <div className="hygiene-header">
                                <span className="shield-icon">🛡️</span>
                                <h4>100% Campus Hygiene & Quality Assured</h4>
                            </div>
                            <p className="hygiene-text">
                                Partner Outlet Verified by Laro Quality Control. Freshly prepared under strict safety standards.
                            </p>
                            <div className="hygiene-divider" />
                            <p className="made-with-love">Made with ❤️ for Students</p>
                            <p className="copyright-text">© 2026 Laro Technologies Private Limited. All Rights Reserved.</p>
                        </div>
                    )}
                </div>

                {/* Xerox / Printing: Document Upload Panel */}
                {isXeroxShop && (
                    <div className="xerox-upload-panel premium-card">
                        <div className="xerox-upload-header">
                            <FileText size={24} className="icon-p" />
                            <div className="header-text">
                                <h3>Document Printing</h3>
                                <p>Upload your file and select printing preferences</p>
                            </div>
                        </div>

                        <div className="xerox-main-content">
                            <div className="upload-section">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                    onChange={handleXeroxUpload}
                                />

                                {xeroxFile ? (
                                    <div className="file-preview-card">
                                        <div className="file-info">
                                            <div className="file-icon"><FileText size={20} /></div>
                                            <div className="file-meta">
                                                <span className="file-name">{xeroxFile.originalName}</span>
                                                <span className="file-details">
                                                    {(xeroxFile.size / 1024).toFixed(1)} KB • {xeroxFile.mimetype.split('/')[1].toUpperCase()}
                                                    {xeroxFile.pageCount && <span className="page-count-badge">{xeroxFile.pageCount} Pages</span>}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="remove-file-btn" onClick={() => setXeroxFile(null)}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="dropzone-area" onClick={() => fileInputRef.current?.click()}>
                                        <div className="dropzone-icon">
                                            {uploadLoading ? <div className="spinner-loader" /> : <Upload size={32} />}
                                        </div>
                                        <p>{uploadLoading ? 'Uploading document...' : 'Click to select or drag document here'}</p>
                                        <span>PDF, DOCX, JPG, PNG (Max 10MB)</span>
                                    </div>
                                )}
                                {uploadError && <p className="upload-error-msg">{uploadError}</p>}
                            </div>

                            {xeroxFile && (
                                <div className="print-preview-container">
                                    <div className="preview-label">Live Print Preview</div>
                                    <div className={`preview-paper ${landscape ? 'landscape' : ''} ${colorMode === 'BW' ? 'bw' : ''}`}>
                                        <div className={`preview-content ratio-${ratio.replace(':', '-')}`}>
                                            {ratio === '1:1' ? (
                                                previewUrl ? (
                                                    <img src={previewUrl} alt="Print Preview" className="preview-image" />
                                                ) : (
                                                    <div className="preview-image-placeholder">
                                                        <FileText size={48} color="#cbd5e1" />
                                                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>Document Preview</p>
                                                    </div>
                                                )
                                            ) : (
                                                // Show grid for N-up printing
                                                Array.from({ length: parseInt(ratio.split(':')[1]) }).map((_, i) => (
                                                    <div key={i} className="preview-frame-mini">
                                                        {previewUrl && <img src={previewUrl} alt="Preview" className="preview-image" style={{ opacity: 0.6 }} />}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        className="btn-secondary-sm"
                                        onClick={() => setLandscape(!landscape)}
                                        style={{ marginTop: '10px' }}
                                    >
                                        {landscape ? 'Portrait Mode' : 'Landscape Mode'}
                                    </button>

                                    <p className="preview-hint">
                                        This is a simulated layout. Actual print margin and positioning may vary.
                                    </p>
                                </div>
                            )}

                            {xeroxFile && (
                                <div className="printing-options-section">
                                    <div className="option-group">
                                        <label>Color Mode</label>
                                        <div className="option-pills">
                                            {['BW', 'Color'].map(m => (
                                                <button
                                                    key={m}
                                                    className={`pill ${colorMode === m ? 'active' : ''}`}
                                                    onClick={() => setColorMode(m)}
                                                >{m}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="option-group">
                                        <label>Sidedness</label>
                                        <div className="option-pills">
                                            {['Single', 'Double'].map(s => (
                                                <button
                                                    key={s}
                                                    className={`pill ${sides === s ? 'active' : ''}`}
                                                    onClick={() => setSides(s)}
                                                >{s} Sided</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="option-group">
                                        <label>Pages per Sheet (Ratio)</label>
                                        <div className="option-grid">
                                            {['1:1', '1:2', '1:4', '1:6', '1:9'].map(r => (
                                                <button
                                                    key={r}
                                                    className={`grid-pill ${ratio === r ? 'active' : ''}`}
                                                    onClick={() => setRatio(r)}
                                                >{r}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="xerox-price-summary">
                                        <div className="price-item">
                                            <span>Estimated Price</span>
                                            <span className="price-value">₹{totalPrice}</span>
                                        </div>
                                    </div>

                                    <button
                                        className="btn-primary web-xerox-add-btn"
                                        onClick={() => {
                                            addToCart({
                                                id: `xerox_${Date.now()}`,
                                                name: `Print: ${xeroxFile.originalName}`,
                                                price: parseFloat(totalPrice),
                                                category: 'Xerox',
                                                imageUrl: 'https://cdn-icons-png.flaticon.com/512/2991/2991110.png',
                                                shopId: shop.id,
                                                metadata: {
                                                    url: xeroxFile.url,
                                                    fileName: xeroxFile.originalName,
                                                    pageCount: xeroxFile.pageCount,
                                                    options: { colorMode, sides, ratio },
                                                    pricePerPage: (totalPrice / xeroxFile.pageCount).toFixed(2)
                                                }
                                            }, shop);
                                        }}
                                    >
                                        <Plus size={18} />
                                        <span>Add to Cart - ₹{totalPrice}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Cart Sidebar Preview */}
                {cart.items.length > 0 && cart.shopId === shop.id && (
                    <div className="cart-sidebar">
                        <div className="cart-sidebar-card premium-card">
                            <h3 className="sidebar-title">Your Cart</h3>
                            <p className="sidebar-subtitle">From {shop.name}</p>

                            <div className="sidebar-items">
                                {cart.items.map(item => (
                                    <div key={item.id} className="sidebar-item">
                                        <div className="sidebar-item-content">
                                            <span className="sidebar-item-name">{item.name}</span>
                                            {item.metadata && (
                                                <div className="sidebar-xerox-meta">
                                                    <span>{item.metadata.pageCount} Pages • {item.metadata.options?.colorMode} • {item.metadata.options?.sides}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="sidebar-item-controls">
                                            <button
                                                className="qty-btn-sm"
                                                onClick={() => removeFromCart(item.id)}
                                            >−</button>
                                            <span className="sidebar-item-qty">{item.quantity}</span>
                                            <button
                                                className="qty-btn-sm"
                                                onClick={() => addToCart(item, shop)}
                                            >+</button>
                                            <span className="sidebar-item-price">₹{item.price * item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="sidebar-footer">
                                <div className="subtotal-row">
                                    <span>Subtotal</span>
                                    <span>₹{getSubtotal()}</span>
                                </div>
                                <button className="btn-primary checkout-btn" onClick={() => navigate('/checkout')}>
                                    <span>Go to Checkout</span>
                                    <ShoppingBag size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
