import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Search, MapPin, Sun, Moon, School, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import './NavBar.css';

const NavBar = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isCartBouncing, setIsCartBouncing] = React.useState(false);
    const { getTotalItems } = useCart();
    const { isDarkMode, toggleTheme } = useTheme();
    const totalItems = getTotalItems();
    const [universityName, setUniversityName] = React.useState(localStorage.getItem('selectedUniversityName') || 'Select Campus');
    const token = localStorage.getItem('token');

    React.useEffect(() => {
        if (totalItems > 0) {
            setIsCartBouncing(true);
            const timer = setTimeout(() => setIsCartBouncing(false), 300);
            return () => clearTimeout(timer);
        }
    }, [totalItems]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    let user = {};
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) user = JSON.parse(storedUser);
    } catch (err) {
        console.error('Failed to parse user from localStorage', err);
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedUniversityId');
        localStorage.removeItem('selectedUniversityName');
        navigate('/login');
    };

    const handleChangeCampus = () => {
        localStorage.removeItem('selectedUniversityId');
        localStorage.removeItem('selectedUniversityName');
        window.location.reload(); // Simple way to trigger the modal in Home.jsx
    };

    return (
        <nav className="navbar">
            <div className="container nav-container-wrapper">
                <div className="nav-content">
                    <div className="nav-left">
                        <button
                            className="menu-toggle"
                            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
                            aria-label="Open menu"
                        >
                            <span className="hamburger-box">
                                <span className="hamburger-inner"></span>
                            </span>
                        </button>

                        <Link to="/" className="logo">
                            <span className="logo-text">LARO</span>
                        </Link>

                        <div className="campus-selector" onClick={handleChangeCampus} title="Switch campus">
                            <School size={15} className="icon-green" />
                            <span className="campus-name">{universityName}</span>
                            <ChevronDown size={13} className="icon-gray" />
                        </div>
                    </div>

                    <form className="search-bar desktop-search" onSubmit={handleSearch}>
                        <Search size={18} className="icon-green" />
                        <input
                            type="text"
                            placeholder="Search for snacks, groceries, stationery..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>

                    <div className="nav-actions">
                        {token ? (
                            <>
                                <Link to="/profile" className="nav-item user-profile-link" title="My Profile">
                                    <div className="user-avatar">
                                        {user.name?.charAt(0) || 'U'}
                                    </div>
                                    <span className="nav-label">{user.name || 'Profile'}</span>
                                </Link>
                                <button onClick={handleLogout} className="nav-item logout-btn" title="Logout">
                                    <LogOut size={18} />
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="btn-primary-nav">Login</Link>
                        )}

                        <button onClick={toggleTheme} className="nav-item theme-toggle" title="Toggle theme">
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <Link to="/checkout" className={`cart-btn ${isCartBouncing ? 'cart-bounce' : ''}`} title="Cart">
                            <ShoppingBag size={20} />
                            {totalItems > 0 && (
                                <span className="cart-count">{totalItems}</span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Mobile Search Bar Row (visible on <768px) */}
                <form className="mobile-search-bar" onSubmit={handleSearch}>
                    <Search size={16} className="icon-green" />
                    <input
                        type="text"
                        placeholder="Search for snacks, groceries, stationery..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="mobile-search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            ×
                        </button>
                    )}
                </form>
            </div>
        </nav>
    );
};

export default NavBar;
