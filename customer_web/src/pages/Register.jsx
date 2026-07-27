import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { UserPlus, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import './Auth.css';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match. Please try again.');
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.register({
                name: formData.name,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password
            });
            const { token, ...userData } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-wrapper register-wrapper">
                {/* Left Brand Side */}
                <div className="auth-brand-panel">
                    <div className="brand-hero-badge">
                        <Zap size={14} />
                        <span>Join Campus Delivery</span>
                    </div>
                    <h1 className="brand-title">
                        Get Started with <br />
                        Laro Express Today.
                    </h1>
                    <p className="brand-subtitle">
                        Create your account to unlock instant campus deliveries, exclusive food discounts, and print ordering.
                    </p>

                    <div className="brand-bullets">
                        <div className="bullet-item">
                            <div className="bullet-icon"><Sparkles size={16} /></div>
                            <span>Flat student discounts & daily rewards</span>
                        </div>
                        <div className="bullet-item">
                            <div className="bullet-icon"><ShieldCheck size={16} /></div>
                            <span>Direct hostel door delivery in under 15 mins</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="auth-card premium-card register-card">
                    <div className="card-top-bar"></div>
                    <div className="auth-header">
                        <div className="auth-icon-badge">
                            <UserPlus size={26} />
                        </div>
                        <h2>Create Account</h2>
                        <p>Fill in your details to get started</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label htmlFor="name">Full Name</label>
                            <div className="input-field">
                                <User size={18} className="field-icon" />
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Alex Thompson"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-row">
                            <div className="input-group flex-1">
                                <label htmlFor="email">Email</label>
                                <div className="input-field">
                                    <Mail size={18} className="field-icon" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="student@university.edu"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group flex-1">
                                <label htmlFor="phoneNumber">Phone Number</label>
                                <div className="input-field">
                                    <Phone size={18} className="field-icon" />
                                    <input
                                        id="phoneNumber"
                                        type="tel"
                                        placeholder="9876543210"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-field">
                                <Lock size={18} className="field-icon" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-field">
                                <Lock size={18} className="field-icon" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-eye-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <span>Creating account...</span>
                            ) : (
                                <>
                                    <span>Create My Account</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-card-footer">
                        <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
