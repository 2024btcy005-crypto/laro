import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Mail, Shield, Smartphone, ArrowRight, Trash2, AlertTriangle, X, Moon } from 'lucide-react';
import { authAPI } from '../api';
import { useTheme } from '../context/ThemeContext';
import './Settings.css';

const SettingToggle = ({ icon: Icon, title, description, value, onChange }) => (
    <div className="setting-row">
        <div className="setting-icon-box">
            <Icon size={20} />
        </div>
        <div className="setting-text">
            <h4>{title}</h4>
            <p>{description}</p>
        </div>
        <label className="toggle-switch">
            <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="slider round"></span>
        </label>
    </div>
);

const SettingLink = ({ icon: Icon, title, description, onClick }) => (
    <div className="setting-row clickable" onClick={onClick}>
        <div className="setting-icon-box">
            <Icon size={20} />
        </div>
        <div className="setting-text">
            <h4>{title}</h4>
            <p>{description}</p>
        </div>
        <ArrowRight size={18} className="chevron" />
    </div>
);

export default function Settings() {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [marketing, setMarketing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await authAPI.deleteAccount();
            // Clear local storage
            localStorage.clear();
            // Redirect to registration or landing page
            navigate('/register');
        } catch (error) {
            console.error('Failed to delete account:', error);
            alert('Could not delete account. Please try again later.');
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className="container settings-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="back-btn-circle" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="page-title">Settings</h1>
                        <p className="page-subtitle">Manage your account and preferences</p>
                    </div>
                </div>
            </header>

            <div className="settings-content">
                <section className="settings-section">
                    <h3 className="section-title-sm">APPEARANCE</h3>
                    <div className="settings-group premium-card">
                        <SettingToggle
                            icon={Moon}
                            title="Dark Mode"
                            description="Experience the app in a sleek, dark interface"
                            value={isDarkMode}
                            onChange={toggleTheme}
                        />
                    </div>
                </section>

                <section className="settings-section">
                    <h3 className="section-title-sm">SECURITY & ACCOUNT</h3>
                    <div className="settings-group premium-card">
                        <SettingLink
                            icon={Shield}
                            title="Privacy Controls"
                            description="Manage how your data is used and shared"
                            onClick={() => navigate('/privacy')}
                        />
                        <div className="setting-divider" />
                        <SettingLink
                            icon={Smartphone}
                            title="Linked Devices"
                            description="Manage cross-platform sessions"
                            onClick={() => navigate('/my-qr')}
                        />
                    </div>
                </section>

                <section className="settings-section danger-zone">
                    <h3 className="section-title-sm danger">DANGER ZONE</h3>
                    <div className="settings-group premium-card danger-card">
                        <div className="setting-row">
                            <div className="setting-icon-box danger">
                                <Trash2 size={20} />
                            </div>
                            <div className="setting-text">
                                <h4>Delete Account</h4>
                                <p>Permanently remove your account and all associated data. This action cannot be undone.</p>
                            </div>
                            <button className="btn-danger-sm" onClick={() => setIsDeleteModalOpen(true)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </section>

                <div className="settings-footer">
                    <p className="app-version">App Version 1.0.4 (Global Web)</p>
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="modal-content premium-card confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="confirm-icon-box">
                            <AlertTriangle size={32} />
                        </div>
                        <h2>Delete Account?</h2>
                        <p>Are you absolutely sure you want to delete your account? This will permanently remove your order history, wallet balance, and favorite shops.</p>

                        <div className="confirm-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                            >
                                No, Keep Account
                            </button>
                            <button
                                className="btn-danger-primary"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
