import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, ShieldAlert, FileText, Mail, Heart } from 'lucide-react';
import './About.css';

const AboutLink = ({ icon: Icon, title, onClick }) => (
    <div className="about-link-row" onClick={onClick}>
        <div className="about-icon-box">
            <Icon size={18} />
        </div>
        <span className="about-link-text">{title}</span>
        <ExternalLink size={16} className="ext-icon" />
    </div>
);

export default function About() {
    const navigate = useNavigate();

    return (
        <div className="container about-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="back-btn-circle" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="page-title">About Laro</h1>
                        <p className="page-subtitle">Your pocket companion for quick needs</p>
                    </div>
                </div>
            </header>

            <div className="about-content">
                <div className="app-branding">
                    <div className="app-logo-large">Ł</div>
                    <h2 className="app-name-large">Laro</h2>
                    <p className="app-tagline">Swift Commerce • Seamless Living</p>
                    <div className="version-badge">VERSION 1.0.4</div>
                </div>

                <div className="about-links-group premium-card">
                    <AboutLink icon={FileText} title="Terms of Service" onClick={() => navigate('/terms')} />
                    <div className="about-divider" />
                    <AboutLink icon={ShieldAlert} title="Privacy Policy" onClick={() => navigate('/privacy')} />
                    <div className="about-divider" />
                    <AboutLink icon={Mail} title="Contact Support" onClick={() => window.location.href = 'mailto:anegondhikumar2@gmail.com'} />
                </div>

                <div className="made-with-love">
                    <p>Designed and built with</p>
                    <Heart size={16} fill="#ff4757" color="#ff4757" />
                    <p>for the Laro Community</p>
                </div>

                <footer className="about-footer">
                    <p>© 2026 Laro Technologies Pvt. Ltd.</p>
                    <p>All Rights Reserved.</p>
                </footer>
            </div>
        </div>
    );
}
