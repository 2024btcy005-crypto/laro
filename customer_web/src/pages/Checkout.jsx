import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, walletAPI, configAPI, couponAPI } from '../api';
import { useCart } from '../context/CartContext';
import { ShoppingBag, MapPin, CreditCard, ChevronRight, CheckCircle, AlertTriangle, Banknote, Ticket, X } from 'lucide-react';
import './Checkout.css';

export default function Checkout() {
    const navigate = useNavigate();
    const { cart, getSubtotal, clearCart } = useCart();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [address, setAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('laro_coins'); // laro_coins or cod
    const [config, setConfig] = useState({
        taxRate: 5.0,
        handlingCharge: 2.00,
        defaultDeliveryFee: 0.00
    });
    const [loyaltyLevel, setLoyaltyLevel] = useState('Learner');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [showCouponSuccess, setShowCouponSuccess] = useState(false);

    const subtotal = getSubtotal();

    // Legend Perk: 5% discount on Medicines
    let legendDiscount = 0;
    if (loyaltyLevel === 'Legend') {
        const medicineTotal = cart.items
            .filter(item => item.category === 'Medicines')
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        legendDiscount = Math.round(medicineTotal * 0.05);
    }

    const taxes = Math.round(subtotal * (config.taxRate / 100));
    const handlingFee = parseFloat(config.handlingCharge);
    const deliveryFee = parseFloat(config.defaultDeliveryFee);
    const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = Math.max(0, subtotal + taxes + handlingFee + deliveryFee - legendDiscount - couponDiscount);

    useEffect(() => {
        if (cart.items.length === 0 && !success) {
            navigate('/');
        }
        fetchBalance();
    }, [cart.items, navigate, success]);

    const fetchBalance = async () => {
        try {
            const res = await orderAPI.getUserSummary();
            setBalance(res.data.laroCurrency || 0);
            setLoyaltyLevel(res.data.loyaltyLevel || 'Learner');

            // Prioritize local default address
            const userId = res.data.user?.id;
            const addressKey = `@user_addresses_${userId || 'guest'}`;
            const storedAddresses = localStorage.getItem(addressKey);

            if (storedAddresses) {
                const addresses = JSON.parse(storedAddresses);
                const defaultAddr = addresses.find(a => a.isDefault);
                if (defaultAddr) {
                    setAddress(`${defaultAddr.hostel}, ${defaultAddr.room}, Joy University`);
                    return;
                }
            }

            // Fallback to backend address
            if (res.data.user?.address) {
                setAddress(res.data.user.address);
            }
        } catch (err) {
            console.error('Failed to fetch balance:', err);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await configAPI.getConfig();
            if (res.data) {
                setConfig({
                    taxRate: res.data.taxRate || 5.0,
                    handlingCharge: res.data.handlingCharge || 2.00,
                    defaultDeliveryFee: res.data.defaultDeliveryFee || 0.00
                });
            }
        } catch (err) {
            console.error('Failed to fetch config:', err);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await couponAPI.validateCoupon(couponCode, subtotal);
            setAppliedCoupon(res.data);
            setCouponCode('');
            setShowCouponSuccess(true);
            setTimeout(() => setShowCouponSuccess(false), 3000);
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon code');
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    const handlePlaceOrder = async () => {
        if (!address) {
            setError('Please add a delivery address in your profile before checking out.');
            return;
        }

        if (paymentMethod === 'laro_coins' && balance < total) {
            setError('Insufficient Laro Coins. Please recharge your wallet or choose Cash on Delivery.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await orderAPI.createOrder({
                shopId: cart.shopId,
                orderItems: cart.items.map(i => ({
                    productId: i.id,
                    quantity: i.quantity,
                    metadata: i.metadata
                })),
                totalAmount: total,
                deliveryAddress: address,
                paymentMethod: paymentMethod,
                couponCode: appliedCoupon?.code,
                universityId: localStorage.getItem('selectedUniversityId')
            });
            setSuccess(true);
            clearCart();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div className="success-icon-wrapper">
                    <CheckCircle size={80} color="var(--laro-green)" />
                </div>
                <h1 className="page-title">Order Placed Successfully!</h1>
                <p className="page-subtitle">Your delicious meal is on its way to you.</p>
                <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={() => navigate('/profile')}>Track Order</button>
                    <button className="btn-secondary" onClick={() => navigate('/')} style={{ border: '1px solid var(--border)', padding: '12px 24px', borderRadius: '12px', fontWeight: '700' }}>Back Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container checkout-page">
            <header className="page-header">
                <h1 className="page-title">Checkout</h1>
                <p className="page-subtitle">Confirm your details and place your order</p>
            </header>

            <div className="checkout-grid">
                <div className="checkout-main">
                    {/* Address Section */}
                    <section className="checkout-section premium-card">
                        <div className="section-header">
                            <MapPin size={22} color="var(--primary)" />
                            <h3>Delivery Address</h3>
                        </div>
                        <div className="address-content">
                            {address ? (
                                <>
                                    <p className="current-address">{address}</p>
                                    <button className="change-link" onClick={() => navigate('/profile')}>Change in Profile</button>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                    <p className="current-address" style={{ color: 'var(--red)', fontWeight: 'bold' }}>No address found!</p>
                                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => navigate('/profile')}>+ Add Address First</button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Payment Section */}
                    <section className="checkout-section premium-card">
                        <div className="section-header">
                            <CreditCard size={22} color="var(--primary)" />
                            <h3>Payment Method</h3>
                        </div>
                        <div className="payment-options">
                            <div
                                className={`payment-method ${paymentMethod === 'laro_coins' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('laro_coins')}
                            >
                                <div className="payment-icon wallet">Ł</div>
                                <div className="payment-info">
                                    <p className="method-name">Laro Wallet</p>
                                    <p className="method-balance">Balance: Ł {balance}</p>
                                </div>
                                {paymentMethod === 'laro_coins' && (
                                    <div className="check-mark">
                                        <CheckCircle size={20} fill="var(--primary)" color="white" />
                                    </div>
                                )}
                            </div>

                            <div
                                className={`payment-method ${paymentMethod === 'cod' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('cod')}
                            >
                                <div className="payment-icon cod">
                                    <Banknote size={20} />
                                </div>
                                <div className="payment-info">
                                    <p className="method-name">Cash on Delivery</p>
                                    <p className="method-balance">Pay when you receive</p>
                                </div>
                                {paymentMethod === 'cod' && (
                                    <div className="check-mark">
                                        <CheckCircle size={20} fill="var(--primary)" color="white" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {paymentMethod === 'laro_coins' && balance < total && (
                            <div className="insufficient-warning">
                                <AlertTriangle size={18} />
                                <span>Insufficient balance. You need Ł {total - balance} more.</span>
                            </div>
                        )}
                    </section>
                </div>

                <div className="checkout-sidebar">
                    <div className="bill-summary premium-card">
                        <h3 className="section-title-sm">Bill Summary</h3>
                        <div className="bill-items">
                            <div className="bill-section">
                                <p className="bill-section-title">Item Details</p>
                                {cart.items.map(item => (
                                    <div key={item.id} className="bill-item-wrapper">
                                        <div className="bill-row item">
                                            <div className="item-name-qty">
                                                <span className="qty">{item.quantity} ×</span>
                                                <span className="name">{item.name}</span>
                                            </div>
                                            <span className="price">₹{item.price * item.quantity}</span>
                                        </div>
                                        {item.metadata && (
                                            <div className="item-meta-info">
                                                <span>{item.metadata.pageCount} Pages • {item.metadata.options?.colorMode} • {item.metadata.options?.sides}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="bill-divider" />

                            <div className="bill-section">
                                <div className="bill-row">
                                    <span>Item Total</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div className="bill-row">
                                    <span>Delivery Fee</span>
                                    {deliveryFee === 0 ? <span style={{ color: 'var(--laro-green)' }}>FREE</span> : <span>₹{deliveryFee}</span>}
                                </div>
                                <div className="bill-row">
                                    <span>Handling Fee</span>
                                    <span>₹{handlingFee}</span>
                                </div>
                                <div className="bill-row">
                                    <span>Taxes & Charges</span>
                                    <span>₹{taxes}</span>
                                </div>
                                {legendDiscount > 0 && (
                                    <div className="bill-row" style={{ color: '#fbbf24' }}>
                                        <span>Legend Medicine Discount (5%)</span>
                                        <span>-₹{legendDiscount}</span>
                                    </div>
                                )}
                                {appliedCoupon && (
                                    <div className="bill-row" style={{ color: 'var(--laro-green)', fontWeight: '700' }}>
                                        <span>Coupon Discount ({appliedCoupon.code})</span>
                                        <span>-₹{couponDiscount}</span>
                                    </div>
                                )}
                            </div>

                            <div className="bill-divider" />

                            <div className="coupon-section">
                                <p className="bill-section-title">Coupons & Offers</p>
                                {!appliedCoupon ? (
                                    <div className="coupon-input-group">
                                        <div className="input-wrapper">
                                            <Ticket size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter Promo Code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                            />
                                        </div>
                                        <button
                                            className="apply-btn"
                                            onClick={handleApplyCoupon}
                                            disabled={couponLoading || !couponCode}
                                        >
                                            {couponLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="applied-coupon">
                                        <div className="coupon-info">
                                            <CheckCircle size={16} color="var(--laro-green)" />
                                            <span className="coupon-text"><strong>{appliedCoupon.code}</strong> applied!</span>
                                        </div>
                                        <button className="remove-btn" onClick={removeCoupon}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                                {couponError && <p className="coupon-error">{couponError}</p>}
                            </div>

                            <div className="bill-divider total" />
                            <div className="bill-row final-total">
                                <div className="total-label-box">
                                    <span>Total Amount</span>
                                    <p className="inclusive-tax">Inclusive of all taxes</p>
                                </div>
                                <span>₹{total}</span>
                            </div>
                        </div>

                        {error && <p className="order-error">{error}</p>}

                        <button
                            className="btn-primary place-order-btn"
                            onClick={handlePlaceOrder}
                            disabled={loading || (paymentMethod === 'laro_coins' && balance < total)}
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    <span>Place Order</span>
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                        <p className="order-safety-text">
                            {paymentMethod === 'laro_coins'
                                ? 'Safe and secure payments with Laro Wallet'
                                : 'Pay securely with cash at your doorstep'}
                        </p>
                    </div>
                </div>
            </div>

            {showCouponSuccess && appliedCoupon && (
                <div className="coupon-success-popup">
                    <div className="coupon-success-content">
                        <div className="coupon-success-icon">✨</div>
                        <div className="coupon-success-text">
                            <h3>Coupon Applied!</h3>
                            <p>You saved <strong>₹{appliedCoupon.discountAmount}</strong></p>
                        </div>
                        <button className="coupon-success-close" onClick={() => setShowCouponSuccess(false)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
}
