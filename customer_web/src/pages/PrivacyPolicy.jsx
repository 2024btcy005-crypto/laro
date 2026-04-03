import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Database, Eye, Share2, Lock, UserCircle, BellRing } from 'lucide-react';
import './LegalPage.css';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="container legal-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="back-btn-circle" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="page-title">Privacy Policy</h1>
                        <p className="page-subtitle">How we handle your data at Laro</p>
                    </div>
                </div>
            </header>

            <div className="legal-content">
                <span className="last-updated">Last Updated: March 22, 2026</span>

                <div className="legal-card premium-card">
                    <section className="legal-section">
                        <h2><ShieldCheck size={24} /> 1. Commitment to Privacy</h2>
                        <p>At Laro, your privacy is our top priority. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.</p>
                    </section>

                    <section className="legal-section">
                        <h2><Database size={24} /> 2. Information We Collect</h2>
                        <p>We collect information that you provide directly to us, such as when you create an account, place an order, or contact support.</p>
                        <ul>
                            <li>**Personal Details:** Name, email address, phone number, and delivery address.</li>
                            <li>**Payment Information:** Payment card details (processed securely by third-party processors).</li>
                            <li>**Transaction Data:** Details about the orders you place and your interaction with merchants.</li>
                            <li>**Location Data:** We collect location information to provide accurate delivery services.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2><Eye size={24} /> 3. How We Use Your Information</h2>
                        <p>We use the information we collect to operate, maintain, and provide the features of our platform.</p>
                        <ul>
                            <li>To process and deliver your orders.</li>
                            <li>To communicate with you about your account and orders.</li>
                            <li>To personalize your experience and show you relevant offers.</li>
                            <li>To improve our platform and develop new features.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2><Share2 size={24} /> 4. Sharing Your Information</h2>
                        <p>We do not sell your personal information. We share your data only with third parties who help us provide our services.</p>
                        <ul>
                            <li>**Merchants:** To prepare and coordinate your order.</li>
                            <li>**Delivery Partners:** To deliver your orders to your location.</li>
                            <li>**Service Providers:** For payment processing, marketing, and analytics.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2><Lock size={24} /> 5. Data Security</h2>
                        <p>We use industry-standard security measures to protect your data from unauthorized access or disclosure. This includes encryption, secure servers, and regular security audits.</p>
                    </section>

                    <section className="legal-section">
                        <h2><UserCircle size={24} /> 6. Your Rights</h2>
                        <p>You have the right to access, correct, or delete your personal information. You can manage most of your data through the Laro app settings. If you need further assistance, please contact our support team.</p>
                    </section>

                    <section className="legal-section">
                        <h2><BellRing size={24} /> 7. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our platform or via email.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
