import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Shield, Gavel, AlertCircle, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import './LegalPage.css';

export default function TermsAndConditions() {
    const navigate = useNavigate();

    return (
        <div className="container legal-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="back-btn-circle" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="page-title">Terms & Conditions</h1>
                        <p className="page-subtitle">Rules and guidelines for using Laro</p>
                    </div>
                </div>
            </header>

            <div className="legal-content">
                <span className="last-updated">Last Updated: March 22, 2026</span>

                <div className="legal-card premium-card">
                    <section className="legal-section">
                        <h2><FileText size={24} /> 1. Introduction</h2>
                        <p>Welcome to Laro. These Terms and Conditions govern your use of the Laro mobile application and website. By accessing or using our services, you agree to be bound by these terms. If you do not agree with any part of these terms, you may not use our services.</p>
                    </section>

                    <section className="legal-section">
                        <h2><Shield size={24} /> 2. User Accounts</h2>
                        <p>To use most features of Laro, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to create an account.</p>
                        <ul>
                            <li>Provide accurate and complete information.</li>
                            <li>Keep your account information updated.</li>
                            <li>Notify us immediately of any unauthorized use.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2><ShoppingBag size={24} /> 3. Ordering & Payment</h2>
                        <p>When you place an order through Laro, you are offering to purchase products from a merchant. All orders are subject to availability and confirmation of the order price.</p>
                        <ul>
                            <li>Prices are inclusive of applicable taxes unless stated otherwise.</li>
                            <li>Payment can be made via credit/debit cards, digital wallets, or other supported methods.</li>
                            <li>Laro reserves the right to cancel orders in case of pricing errors or fraudulent activity.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2><Truck size={24} /> 4. Delivery</h2>
                        <p>Delivery times are estimates and not guarantees. Laro works with independent delivery partners to ensure your orders reach you as quickly as possible.</p>
                        <p>You agree to provide a clear and accessible delivery address. If a delivery failes due to incorrect information or your unavailability, additional charges may apply.</p>
                    </section>

                    <section className="legal-section">
                        <h2><AlertCircle size={24} /> 5. Cancellations & Refunds</h2>
                        <p>Orders can only be cancelled before they are accepted by the merchant. Once preparation has started, cancellations may not be eligible for a full refund.</p>
                        <p>Refunds for missing or incorrect items will be processed after verification by our support team and may be issued as Laro wallet credits or original payment method.</p>
                    </section>

                    <section className="legal-section">
                        <h2><Gavel size={24} /> 6. Limitation of Liability</h2>
                        <p>Laro provides a platform connecting users, merchants, and delivery partners. We are not liable for the quality of goods provided by merchants or any disputes arising between you and third-party providers.</p>
                    </section>

                    <section className="legal-section">
                        <h2><CreditCard size={24} /> 7. Governing Law</h2>
                        <p>These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Laro operates. Any disputes shall be subject to the exclusive jurisdiction of the local courts.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
