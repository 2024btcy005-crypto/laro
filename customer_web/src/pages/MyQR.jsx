import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Share2, Info } from 'lucide-react';
import './MyQR.css';

export default function MyQR() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Use the user's phone number as the QR data (the same as mobile)
    const qrData = user.phoneNumber || user.id || 'LaroUser';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=9d174d&bgcolor=ffffff&margin=10`;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `LaroQR_${user.name || 'User'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container my-qr-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="back-btn-circle" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="page-title">My QR Code</h1>
                        <p className="page-subtitle">Show this to receive Laro Coins instantly</p>
                    </div>
                </div>
            </header>

            <div className="qr-main-container">
                <div className="qr-card premium-card">
                    <div className="qr-card-header">
                        <div className="user-avatar-sm">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="user-meta">
                            <h2 className="user-name">{user.name}</h2>
                            <p className="user-phone">{user.phoneNumber || 'Phone not linked'}</p>
                        </div>
                    </div>

                    <div className="qr-code-wrapper">
                        <div className="qr-frame">
                            <img src={qrUrl} alt="My Laro QR Code" className="qr-image" />
                            <div className="qr-logo-overlay">Ł</div>
                        </div>
                    </div>

                    <div className="qr-card-footer">
                        <p className="qr-instruction">
                            Scan this code using the Laro app to transfer coins directly to this wallet.
                        </p>
                    </div>
                </div>

                <div className="qr-actions">
                    <button className="qr-action-btn secondary" onClick={handleDownload}>
                        <Download size={20} />
                        <span>Save to Device</span>
                    </button>
                    <button className="qr-action-btn secondary" onClick={() => alert('Sharing coming soon!')}>
                        <Share2 size={20} />
                        <span>Share Code</span>
                    </button>
                </div>

                <div className="qr-info-box">
                    <div className="info-icon">
                        <Info size={18} />
                    </div>
                    <p>
                        Your unique QR code is linked to your phone number.
                        Anyone with the Laro app can scan this to pay you securely.
                    </p>
                </div>
            </div>
        </div>
    );
}
