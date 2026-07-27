import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import './Auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await authAPI.login({ email, password });
            const { token, ...userData } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-wrapper">
                {/* Brand Side Panel */}
                <div className="auth-brand-panel">
                    <div className="brand-hero-badge">
                        <Zap size={14} />
                        <span>Laro Campus Express</span>
                    </div>
                    <h1 className="brand-title">
                        Fast Deliveries. <br />
                        Smart Campus Living.
                    </h1>
                    <p className="brand-subtitle">
                        Order food, drinks, books, and printing directly to your room in 10 minutes.
                    </p>

                    <div className="brand-bullets">
                        <div className="bullet-item">
                            <div className="bullet-icon"><Sparkles size={16} /></div>
                            <span>Instant order tracking & student rewards</span>
                        </div>
                        <div className="bullet-item">
                            <div className="bullet-icon"><ShieldCheck size={16} /></div>
                            <span>Zero hassle, direct to hostel delivery</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="auth-card premium-card">
                    <div className="card-top-bar"></div>
                    <div className="auth-header">
                        <div className="auth-icon-badge">
                            <LogIn size={26} />
                        </div>
                        <h2>Welcome Back</h2>
                        <p>Sign in to manage your campus orders</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-field">
                                <Mail size={18} className="field-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="student@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <div className="label-row">
                                <label htmlFor="password">Password</label>
                                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
                            </div>
                            <div className="input-field">
                                <Lock size={18} className="field-icon" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        <div className="auth-actions-row">
                            <label className="custom-checkbox">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="checkbox-box"></span>
                                <span className="checkbox-text">Keep me logged in</span>
                            </label>
                        </div>

                        <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <span>Authenticating...</span>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-card-footer">
                        <p>Don't have an account? <Link to="/register" className="auth-link">Join Laro Now</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
