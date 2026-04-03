import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Award, Star, Clock, Info,
    Crown, Compass, BookOpen, ShieldCheck, CheckCircle2, Lock
} from 'lucide-react';
import { orderAPI } from '../api';
import './Loyalty.css';

const TIER_CONFIG = [
    {
        level: 'Learner',
        min: 0,
        next: 100,
        color: '#94a3b8',
        icon: <BookOpen size={40} />,
        perks: ['Standard Laro Support', 'Birthday Rewards']
    },
    {
        level: 'Explorer',
        min: 100,
        next: 300,
        color: '#3b82f6',
        icon: <Compass size={40} />,
        perks: ['Priority Delivery', 'Explorer Badge', 'Early Shop Access']
    },
    {
        level: 'Pro',
        min: 300,
        next: 1000,
        color: '#8b5cf6',
        icon: <ShieldCheck size={40} />,
        perks: ['Zero Handling Fee', 'Mystery Munchies Access', 'Pro Support']
    },
    {
        level: 'Legend',
        min: 1000,
        next: Infinity,
        color: '#fbbf24',
        icon: <Crown size={40} />,
        perks: ['5% Permanent Medicine Discount', 'Flash Support', 'Exclusive Gold Profile', 'VIP Event Invites']
    }
];

export default function Loyalty() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ loyaltyPoints: 0, loyaltyLevel: 'Learner', laroCurrency: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLoyaltyData();
    }, []);

    const fetchLoyaltyData = async () => {
        try {
            setLoading(true);
            const res = await orderAPI.getUserSummary();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch loyalty:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentTier = TIER_CONFIG.find(t => t.level === stats.loyaltyLevel) || TIER_CONFIG[0];
    const nextTier = TIER_CONFIG[TIER_CONFIG.indexOf(currentTier) + 1];

    const getProgress = () => {
        if (currentTier.level === 'Legend') return 100;
        const totalInTier = currentTier.next - currentTier.min;
        const progressInTier = stats.loyaltyPoints - currentTier.min;
        return Math.min(Math.max((progressInTier / totalInTier) * 100, 0), 100);
    };

    if (loading) return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <div className="skeleton-card" style={{ height: '400px', maxWidth: '800px', margin: '0 auto' }} />
        </div>
    );

    return (
        <div className="container loyalty-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="back-btn-circle" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="page-title">Laro Milestones</h1>
                        <p className="page-subtitle">Unlock premium perks as you dine</p>
                    </div>
                </div>
            </header>

            <div className="loyalty-grid">
                <div className="loyalty-main">
                    {/* Progress Card */}
                    <div className="milestone-card premium-card" style={{ borderTop: `6px solid ${currentTier.color}` }}>
                        <div className="tier-display">
                            <div className="tier-icon-circle" style={{ backgroundColor: `${currentTier.color}15`, color: currentTier.color }}>
                                {currentTier.icon}
                            </div>
                            <div className="tier-info">
                                <p className="tier-label">CURRENT RANK</p>
                                <h2 className="tier-name">Laro {stats.loyaltyLevel}</h2>
                            </div>
                        </div>

                        <div className="points-display">
                            <h3 className="points-value">{stats.loyaltyPoints || 0}</h3>
                            <p className="points-label">MILESTONE POINTS</p>
                        </div>

                        {currentTier.level !== 'Legend' && nextTier ? (
                            <div className="progress-section">
                                <div className="progress-stats">
                                    <span>Next: Laro {nextTier.level}</span>
                                    <span>{nextTier.min - (stats.loyaltyPoints || 0)} more points needed</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${getProgress()}%`, backgroundColor: currentTier.color }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="legend-status-msg">
                                <Star fill="#fbbf24" color="#fbbf24" size={20} />
                                <span>You've reached the absolute peak! Enjoy your Legend perks.</span>
                            </div>
                        )}
                    </div>

                    {/* Benefits Section */}
                    <section className="benefits-section">
                        <h3 className="section-title-sm">YOUR ACTIVE BENEFITS</h3>
                        <div className="benefits-list">
                            {currentTier.perks.map((perk, idx) => (
                                <div key={idx} className="benefit-item">
                                    <div className="benefit-check" style={{ backgroundColor: currentTier.color }}>
                                        <CheckCircle2 size={16} color="white" />
                                    </div>
                                    <span>{perk}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="loyalty-sidebar">
                    <h3 className="section-title-sm">MILESTONE ROADMAP</h3>
                    <div className="roadmap-list">
                        {TIER_CONFIG.map((tier, idx) => {
                            const isReached = stats.loyaltyPoints >= tier.min;
                            const isActive = stats.loyaltyLevel === tier.level;

                            return (
                                <div key={idx} className={`roadmap-item ${isActive ? 'active' : ''} ${!isReached ? 'locked' : ''}`}>
                                    <div className="roadmap-icon" style={{ color: tier.color, backgroundColor: `${tier.color}10` }}>
                                        {tier.icon}
                                    </div>
                                    <div className="roadmap-info">
                                        <p className="roadmap-tier">Laro {tier.level}</p>
                                        <p className="roadmap-desc">{tier.min === 0 ? 'Welcome Tier' : `${tier.min}+ Points`}</p>
                                    </div>
                                    <div className="roadmap-status">
                                        {isReached ? <CheckCircle2 size={20} color="var(--laro-green)" /> : <Lock size={18} color="#cbd5e1" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="loyalty-info-card">
                        <div className="info-header">
                            <Info size={18} />
                            <span>How it works</span>
                        </div>
                        <ul className="info-points">
                            <li>Earn 1 point for every ₹10 spent.</li>
                            <li>Tiers are updated instantly after every order.</li>
                            <li>Perks like Legend discounts are applied automatically at checkout.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
