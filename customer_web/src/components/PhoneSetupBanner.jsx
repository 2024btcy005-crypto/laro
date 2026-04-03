import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ChevronRight, X, Smartphone, ShieldCheck } from 'lucide-react';
import './PhoneSetupBanner.css';

export default function PhoneSetupBanner() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const hasDismissed = localStorage.getItem('phone_setup_dismissed');

        // Show banner if phone is missing and not dismissed
        if (!user.phoneNumber && !user.phone && !hasDismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = (e) => {
        e.stopPropagation();
        setIsVisible(false);
        localStorage.setItem('phone_setup_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="phone-banner-container" onClick={() => navigate('/profile')}>
            <div className="phone-banner-content">
                <div className="phone-icon-bg">
                    <Smartphone size={24} color="white" />
                </div>
                <div className="phone-text-content">
                    <h3>Unlock All Mobile Features</h3>
                    <p>Link your phone number to use Laro QR and track Rewards hub features.</p>
                </div>
                <div className="phone-banner-actions">
                    <button className="link-now-btn">
                        <span>Link Phone</span>
                        <ChevronRight size={18} />
                    </button>
                    <button className="dismiss-btn" onClick={handleDismiss}>
                        <X size={18} />
                    </button>
                </div>
            </div>
            <div className="banner-decoration">
                <ShieldCheck size={120} className="decoration-icon" />
            </div>
        </div>
    );
}
