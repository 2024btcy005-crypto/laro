import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Home, ShoppingBag, User, Wallet,
    MapPin, Settings, HelpCircle, LogOut,
    Heart, Award, QrCode
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

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
        onClose();
        navigate('/login');
    };

    const menuItems = [
        { icon: <Home size={22} />, label: 'Home', path: '/' },
        { icon: <ShoppingBag size={22} />, label: 'My Orders', path: '/profile', protected: true },
        { icon: <Heart size={22} />, label: 'Favorites', path: '/favorites', protected: true },
        { icon: <Award size={22} />, label: 'Loyalty', path: '/loyalty', protected: true },
        { icon: <QrCode size={22} />, label: 'My QR', path: '/my-qr', protected: true },
        { icon: <Wallet size={22} />, label: 'Laro Wallet', path: '/profile', protected: true },
        { icon: <MapPin size={22} />, label: 'Addresses', path: '/profile', protected: true },
    ];

    const sidebarVariants = {
        open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } }
    };

    const backdropVariants = {
        open: { opacity: 1 },
        closed: { opacity: 0 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="sidebar-backdrop"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={backdropVariants}
                        onClick={onClose}
                    />
                    <motion.div
                        className="sidebar-container"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidebarVariants}
                    >
                        <div className="sidebar-header">
                            <span className="sidebar-logo">LARO</span>
                            <button className="close-btn" onClick={onClose}>
                                <X size={24} />
                            </button>
                        </div>

                        {token && (
                            <div className="sidebar-user-section">
                                <div className="sidebar-avatar">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                                <div className="user-info">
                                    <p className="user-name">{user.name}</p>
                                    <p className="user-handle">View Profile</p>
                                </div>
                            </div>
                        )}

                        <nav className="sidebar-nav">
                            {menuItems.map((item, index) => (
                                (!item.protected || token) && (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        className="sidebar-link"
                                        onClick={onClose}
                                    >
                                        <span className="link-icon">{item.icon}</span>
                                        <span className="link-label">{item.label}</span>
                                    </Link>
                                )
                            ))}

                            <div className="sidebar-divider" />

                            <Link to="/about" className="sidebar-link secondary" onClick={onClose}>
                                <HelpCircle size={20} />
                                <span>About Laro</span>
                            </Link>
                            <Link to="/settings" className="sidebar-link secondary" onClick={onClose}>
                                <Settings size={20} />
                                <span>Settings</span>
                            </Link>

                            {token && (
                                <button className="sidebar-link logout" onClick={handleLogout}>
                                    <LogOut size={20} />
                                    <span>Logout</span>
                                </button>
                            )}
                        </nav>

                        {!token && (
                            <div className="sidebar-footer">
                                <button
                                    className="btn-primary full-width"
                                    onClick={() => { onClose(); navigate('/login'); }}
                                >
                                    Join Laro
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
