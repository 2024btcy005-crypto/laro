import React, { useState, useEffect } from 'react';
import { orderAPI, walletAPI, authAPI } from '../api';
import { User, Wallet, History, ShoppingBag, ArrowUpRight, ArrowDownLeft, ChevronRight, MapPin, Edit3, Phone, X, Clock, Search, CheckCircle, Home, Briefcase, Plus, Trash2, Building2 } from 'lucide-react';
import './Profile.css';

const TransactionItem = ({ tx, onClick }) => {
    const isCredit = tx.type === 'credit' || tx.type === 'REFUND';
    return (
        <div className="transaction-row clickable" onClick={() => onClick(tx)}>
            <div className={`tx-icon ${isCredit ? 'credit' : 'debit'}`}>
                {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            </div>
            <div className="tx-details">
                <p className="tx-desc">{tx.description || (isCredit ? 'Refund' : 'Order Payment')}</p>
                <p className="tx-date">{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className={`tx-amount ${isCredit ? 'credit' : 'debit'}`}>
                {isCredit ? '+' : '-'}Ł {Math.abs(tx.amount)}
            </div>
        </div>
    );
};

const OrderItem = ({ order, onClick }) => {
    return (
        <div className="order-row premium-card clickable" onClick={() => onClick(order)}>
            <div className="order-shop-icon">
                <ShoppingBag size={20} color="var(--primary)" />
            </div>
            <div className="order-info">
                <div className="order-header-row">
                    <h4>{order.shop?.name || 'Laro Order'}</h4>
                    <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                </div>
                <p className="order-items-summary">
                    {order.items?.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ') || 'No items listed'}
                </p>
                <div className="order-footer-row">
                    <p className="order-total">₹{order.totalAmount}</p>
                    <p className="order-time">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            <ChevronRight size={20} color="#cbd5e1" />
        </div>
    );
};

export default function Profile() {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    });
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');

    // Address Book State
    const addressKey = `@user_addresses_${user?.id || 'guest'}`;
    const [addresses, setAddresses] = useState([]);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressForm, setAddressForm] = useState({ name: '', phone: '', hostel: '', room: '', type: 'Home' });
    const [editingAddressId, setEditingAddressId] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user.name || '',
        phoneNumber: user.phoneNumber || user.phone || '',
        address: user.address || ''
    });
    const [updating, setUpdating] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Transfer State
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferStep, setTransferStep] = useState(1); // 1: Search, 2: Amount, 3: Success
    const [transferForm, setTransferForm] = useState({ phone: '', amount: '' });
    const [recipient, setRecipient] = useState(null);
    const [transferLoading, setTransferLoading] = useState(false);
    const [recentRecipients, setRecentRecipients] = useState([]);
    const [recentLoading, setRecentLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        loadLocalAddresses();
        fetchRecentRecipients();
    }, []);

    const fetchRecentRecipients = async () => {
        try {
            setRecentLoading(true);
            const res = await walletAPI.getRecentRecipients();
            setRecentRecipients(res.data || []);
        } catch (err) {
            console.error('Failed to fetch recent recipients:', err);
        } finally {
            setRecentLoading(false);
        }
    };

    const loadLocalAddresses = () => {
        try {
            const stored = localStorage.getItem(addressKey);
            if (stored) {
                setAddresses(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load local addresses');
        }
    };

    const saveLocalAddresses = (newAddresses) => {
        setAddresses(newAddresses);
        localStorage.setItem(addressKey, JSON.stringify(newAddresses));

        // Sync default to backend
        const defaultAddress = newAddresses.find(a => a.isDefault);
        if (defaultAddress) {
            syncAddressToBackend(defaultAddress);
        }
    };

    const syncAddressToBackend = async (addrObj) => {
        const fullAddress = `${addrObj.hostel}, ${addrObj.room}, Joy University`;
        if (user.address === fullAddress) return; // Already in sync

        try {
            await authAPI.updateProfile({ address: fullAddress });
            // Update local user state
            const updatedUser = { ...user, address: fullAddress };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            console.error('Failed to sync address to backend:', err);
        }
    };

    const handleSetDefaultAddress = (id) => {
        const newAddresses = addresses.map(a => ({
            ...a,
            isDefault: a.id === id
        }));
        saveLocalAddresses(newAddresses);
    };

    const handleDeleteAddress = (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        let newAddresses = addresses.filter(a => a.id !== id);
        if (newAddresses.length > 0 && !newAddresses.some(a => a.isDefault)) {
            newAddresses[0].isDefault = true;
        }
        saveLocalAddresses(newAddresses);
    };

    const handleOpenAddressModal = (addr = null) => {
        if (addr) {
            setAddressForm({
                name: addr.name,
                phone: addr.phone,
                hostel: addr.hostel,
                room: addr.room,
                type: addr.type
            });
            setEditingAddressId(addr.id);
        } else {
            setAddressForm({ name: '', phone: '', hostel: '', room: '', type: 'Home' });
            setEditingAddressId(null);
        }
        setIsAddressModalOpen(true);
    };

    const handleSaveAddress = (e) => {
        e.preventDefault();
        const fullAddress = `${addressForm.hostel}, ${addressForm.room}, Joy University`;
        const updatedItem = {
            id: editingAddressId || Date.now().toString(),
            ...addressForm,
            address: fullAddress,
            isDefault: editingAddressId ? addresses.find(a => a.id === editingAddressId).isDefault : addresses.length === 0
        };

        if (editingAddressId) {
            saveLocalAddresses(addresses.map(a => a.id === editingAddressId ? updatedItem : a));
        } else {
            saveLocalAddresses([...addresses, updatedItem]);
        }
        setIsAddressModalOpen(false);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const res = await authAPI.updateProfile(editForm);
            const updatedUser = { ...user, ...res.data.user };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setIsEditModalOpen(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Update failed:', err);
            alert(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const handleSearchUser = async (e) => {
        e.preventDefault();
        try {
            setTransferLoading(true);
            const res = await walletAPI.findUser(transferForm.phone);
            handleSelectRecent(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'User not found');
        } finally {
            setTransferLoading(false);
        }
    };

    const handleSelectRecent = (user) => {
        setRecipient(user);
        setTransferForm(prev => ({ ...prev, phone: user.phoneNumber || user.phone }));
        setTransferStep(2);
    };

    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        try {
            setTransferLoading(true);
            const res = await walletAPI.transfer({
                recipientPhone: transferForm.phone,
                amount: transferForm.amount
            });
            setTransferStep(3); // Success Step
            fetchDashboardData(); // Refresh balance and history
            fetchRecentRecipients(); // Refresh recent list
        } catch (err) {
            alert(err.response?.data?.message || 'Transfer failed');
        } finally {
            setTransferLoading(false);
        }
    };

    const handleCloseTransferModal = () => {
        setIsTransferModalOpen(false);
        setTransferStep(1);
        setTransferForm({ phone: '', amount: '' });
        setRecipient(null);
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, historyRes, ordersRes] = await Promise.all([
                orderAPI.getUserSummary(),
                walletAPI.getHistory(),
                orderAPI.getMyOrders()
            ]);
            setSummary(summaryRes.data);
            if (summaryRes.data.user) {
                const updatedUser = { ...user, ...summaryRes.data.user };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            setHistory(historyRes.data || []);
            setOrders(ordersRes.data || []);
            if (summaryRes.data.user) {
                const updatedUser = { ...user, ...summaryRes.data.user };
                setUser(updatedUser);
                setEditForm({
                    name: updatedUser.name || '',
                    phoneNumber: updatedUser.phoneNumber || updatedUser.phone || '',
                    address: updatedUser.address || ''
                });
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container profile-page">
            <div className="profile-grid">
                {/* Sidebar Info */}
                <aside className="profile-sidebar">
                    <div className="user-profile-card premium-card">
                        <div className="profile-avatar-large">
                            {user.name?.trim().charAt(0) || 'U'}
                        </div>
                        <button className="edit-icon-btn" onClick={() => setIsEditModalOpen(true)}>
                            <Edit3 size={18} />
                        </button>
                        <h2 className="profile-name">{user.name?.trim()}</h2>
                        <p className="profile-email">{user.email}</p>
                        <p className="profile-phone">+91 {user.phoneNumber || user.phone}</p>

                        <div className="sidebar-divider" />

                        <div className="wallet-summary-box">
                            <div className="wallet-label-row">
                                <Wallet size={16} color="var(--primary)" />
                                <span>Laro Wallet</span>
                            </div>
                            <p className="wallet-balance-lg">Ł {summary?.laroCurrency || 0}</p>
                            <button className="btn-primary transfer-btn-sm" onClick={() => setIsTransferModalOpen(true)}>
                                Transfer Coins
                            </button>
                        </div>
                    </div>

                    <div className="profile-nav premium-card">
                        <button
                            className={`pnav-item ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <ShoppingBag size={18} />
                            <span>Orders</span>
                        </button>
                        <button
                            className={`pnav-item ${activeTab === 'wallet' ? 'active' : ''}`}
                            onClick={() => setActiveTab('wallet')}
                        >
                            <History size={18} />
                            <span>Wallet History</span>
                        </button>
                        <button
                            className={`pnav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('addresses')}
                        >
                            <MapPin size={18} />
                            <span>Addresses</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="profile-main">
                    {activeTab === 'orders' ? (
                        <div className="section-container">
                            <header className="section-header-row">
                                <h3 className="section-title-sm">My Orders</h3>
                                <span className="count-badge">{orders.length}</span>
                            </header>
                            <div className="orders-list">
                                {loading ? (
                                    <div className="skeleton-list">
                                        {[1, 2, 3].map(i => <div key={i} className="skeleton-item" style={{ height: '100px', marginBottom: '16px' }} />)}
                                    </div>
                                ) : orders.length > 0 ? (
                                    orders.map(order => <OrderItem key={order.id} order={order} onClick={setSelectedOrder} />)
                                ) : (
                                    <div className="empty-state-card">
                                        <ShoppingBag size={40} />
                                        <h4>No orders yet</h4>
                                        <p>When you place an order, it will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'wallet' ? (
                        <div className="section-container">
                            <header className="section-header-row">
                                <h3 className="section-title-sm">Transaction History</h3>
                                <span className="count-badge">{history.length}</span>
                            </header>
                            <div className="transactions-list premium-card">
                                {loading ? (
                                    <div style={{ padding: '20px' }}>Loading transactions...</div>
                                ) : history.length > 0 ? (
                                    history.map(tx => <TransactionItem key={tx.id} tx={tx} onClick={setSelectedTransaction} />)
                                ) : (
                                    <div className="empty-state-card" style={{ border: 'none' }}>
                                        <History size={40} />
                                        <h4>Clear history</h4>
                                        <p>Your wallet transactions will be listed here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="section-container">
                            <header className="section-header-row">
                                <h3 className="section-title-sm">My Saved Addresses</h3>
                                <button className="add-address-btn-top" onClick={() => handleOpenAddressModal()}>
                                    <Plus size={18} />
                                    <span>Add New</span>
                                </button>
                            </header>
                            <div className="addresses-list">
                                {loading ? (
                                    <div style={{ padding: '20px' }}>Loading addresses...</div>
                                ) : addresses.length > 0 ? (
                                    addresses.map(addr => (
                                        <div key={addr.id} className={`address-card-wide premium-card ${addr.isDefault ? 'is-default' : ''}`}>
                                            <div className="address-icon-box">
                                                {addr.type === 'Home' ? <Home size={22} /> :
                                                    addr.type === 'Work' ? <Briefcase size={22} /> :
                                                        <Building2 size={22} />}
                                            </div>
                                            <div className="address-info-box">
                                                <div className="address-header-row">
                                                    <h4>{addr.type}</h4>
                                                    {addr.isDefault && <span className="default-badge">DEFAULT</span>}
                                                </div>
                                                <p className="address-contact-raw">{addr.name} • {addr.phone}</p>
                                                <p className="address-full">{addr.address}</p>
                                                <div className="address-actions-row">
                                                    {!addr.isDefault && (
                                                        <button className="action-link-btn" onClick={() => handleSetDefaultAddress(addr.id)}>Set Default</button>
                                                    )}
                                                    <button className="action-link-btn" onClick={() => handleOpenAddressModal(addr)}>Edit</button>
                                                    <button className="action-link-btn delete" onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state-card">
                                        <MapPin size={40} />
                                        <h4>No address saved yet</h4>
                                        <p>Add your delivery address so it shows up on checkout.</p>
                                        <button
                                            className="btn-primary"
                                            style={{ marginTop: '20px', padding: '12px 32px' }}
                                            onClick={() => handleOpenAddressModal()}
                                        >
                                            + Add Address
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Profile</h2>
                            <button className="close-modal-btn-top" onClick={() => setIsEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="edit-form">
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Phone Number</label>
                                <div className="input-wrapper">
                                    <Phone size={18} className="input-icon" />
                                    <input
                                        type="tel"
                                        placeholder="10 digit number"
                                        value={editForm.phoneNumber}
                                        onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={updating}
                                    style={{ flex: 1.5 }}
                                >
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Address Modal */}
            {isAddressModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h2>
                            <button className="close-modal-btn-top" onClick={() => setIsAddressModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAddress} className="edit-form address-form">
                            <div className="input-group">
                                <label>Recipient Full Name</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Rahul Kumar"
                                        value={addressForm.name}
                                        onChange={e => setAddressForm({ ...addressForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Contact Number</label>
                                <div className="input-wrapper">
                                    <Phone size={18} className="input-icon" />
                                    <input
                                        type="tel"
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                        value={addressForm.phone}
                                        onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row-grid">
                                <div className="input-group">
                                    <label>Hostel Name</label>
                                    <div className="input-wrapper">
                                        <Building2 size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Hostel 4"
                                            value={addressForm.hostel}
                                            onChange={e => setAddressForm({ ...addressForm, hostel: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Room Number</label>
                                    <div className="input-wrapper">
                                        <MapPin size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="e.g. 205"
                                            value={addressForm.room}
                                            onChange={e => setAddressForm({ ...addressForm, room: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Address Label</label>
                                <div className="type-selector-badges">
                                    {['Home', 'Work', 'Other'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            className={`type-badge-btn ${addressForm.type === type ? 'active' : ''}`}
                                            onClick={() => setAddressForm({ ...addressForm, type })}
                                        >
                                            {type === 'Home' ? <Home size={14} /> : type === 'Work' ? <Briefcase size={14} /> : <MapPin size={14} />}
                                            <span>{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setIsAddressModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Address</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}>
                            <X size={20} />
                        </button>
                        <div className="detail-modal-header">
                            <ShoppingBag className="header-icon" />
                            <div>
                                <h2>{selectedOrder.shop?.name || 'Laro Order'}</h2>
                                <p className="order-id-label">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="order-status-timeline">
                            <div className={`timeline-step active`}>
                                <div className="step-dot" />
                                <div className="step-info">
                                    <p className="step-label">{selectedOrder.status}</p>
                                    <p className="step-time">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>

                        {selectedOrder.deliveryOtp && (
                            <div className="otp-display-box" style={{ margin: '0 32px 24px', padding: '16px', background: 'var(--light-gray)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px dashed var(--border)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>Delivery OTP</span>
                                    <span style={{ fontSize: '13px', color: 'var(--black)', fontWeight: '600' }}>Share this with your delivery partner</span>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: '950', color: 'var(--primary)', letterSpacing: '4px', background: 'var(--white)', padding: '8px 16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    {selectedOrder.deliveryOtp}
                                </div>
                            </div>
                        )}

                        {selectedOrder.delivery?.partner && (
                            <div className="delivery-partner-box" style={{ margin: '0 32px 24px', padding: '16px', background: 'var(--white)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px' }}>
                                    {selectedOrder.delivery.partner.name?.charAt(0).toUpperCase() || 'P'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>Assigned Partner</span>
                                    <span style={{ display: 'block', fontSize: '16px', color: 'var(--black)', fontWeight: 'bold', marginTop: '4px' }}>{selectedOrder.delivery.partner.name}</span>
                                </div>
                                <a href={`tel:${selectedOrder.delivery.partner.phoneNumber}`} style={{ width: '40px', height: '40px', borderRadius: '20px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                                    <Phone size={18} />
                                </a>
                            </div>
                        )}

                        <div className="order-items-breakdown">
                            <h3>Items Ordered</h3>
                            {selectedOrder.items?.map(item => (
                                <div key={item.id} className="detail-item-row">
                                    <span className="item-qty">{item.quantity}x</span>
                                    <span className="item-name">{item.product?.name || 'Item'}</span>
                                    <span className="item-price">₹{item.priceAtTime * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <div className="order-summary-box">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{selectedOrder.totalAmount}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total Paid</span>
                                <span>₹{selectedOrder.totalAmount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
                    <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setSelectedTransaction(null)}>
                            <X size={20} />
                        </button>
                        <div className="detail-modal-header">
                            <History className="header-icon" />
                            <div>
                                <h2>Transaction Details</h2>
                                <p className="order-id-label">ID: {selectedTransaction.id}</p>
                            </div>
                        </div>

                        <div className="tx-detail-card">
                            <div className="tx-detail-row">
                                <span className="label">Amount</span>
                                <span className={`value amount ${selectedTransaction.type === 'debit' ? 'debit' : 'credit'}`}>
                                    {selectedTransaction.type === 'debit' ? '-' : '+'} Ł {Math.abs(selectedTransaction.amount)}
                                </span>
                            </div>
                            <div className="tx-detail-row">
                                <span className="label">Type</span>
                                <span className="value capitalize">{selectedTransaction.type}</span>
                            </div>
                            <div className="tx-detail-row">
                                <span className="label">Description</span>
                                <span className="value">{selectedTransaction.description}</span>
                            </div>
                            <div className="tx-detail-row">
                                <span className="label">Date & Time</span>
                                <span className="value">
                                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Coins Modal */}
            {isTransferModalOpen && (
                <div className="modal-overlay" onClick={handleCloseTransferModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={handleCloseTransferModal}>
                            <X size={20} />
                        </button>
                        <div className="modal-header">
                            <h2>{transferStep === 3 ? 'Transfer Successful' : 'Transfer Coins'}</h2>
                        </div>

                        {transferStep === 1 ? (
                            <div className="transfer-step-1">
                                {recentRecipients.length > 0 && (
                                    <div className="recent-recipients-web">
                                        <p className="input-label-sm">RECENT CONTACTS</p>
                                        <div className="recent-scroll-web">
                                            {recentRecipients.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="recent-user-chip"
                                                    onClick={() => handleSelectRecent(item)}
                                                >
                                                    <div className="recent-avatar-sm">
                                                        {item.name?.charAt(0)}
                                                    </div>
                                                    <span className="recent-name-sm">{item.name?.split(' ')[0]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSearchUser} className="edit-form">
                                    <div className="input-group">
                                        <label>Recipient's Phone Number</label>
                                        <div className="input-wrapper">
                                            <Phone size={18} className="input-icon" />
                                            <input
                                                type="tel"
                                                placeholder="Enter phone number"
                                                value={transferForm.phone}
                                                onChange={e => setTransferForm({ ...transferForm, phone: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={transferLoading}>
                                        {transferLoading ? 'Searching...' : 'Continue'}
                                    </button>
                                </form>
                            </div>
                        ) : transferStep === 2 ? (
                            <form onSubmit={handleTransferSubmit} className="edit-form">
                                <div className="recipient-preview">
                                    <div className="recipient-avatar">
                                        {recipient?.name?.charAt(0)}
                                    </div>
                                    <div className="recipient-info">
                                        <p className="recipient-name">{recipient?.name}</p>
                                        <p className="recipient-phone">{transferForm.phone}</p>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Amount (Ł)</label>
                                    <div className="input-wrapper">
                                        <Wallet size={18} className="input-icon" />
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min="1"
                                            max={summary?.laroCurrency || 0}
                                            value={transferForm.amount}
                                            onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <p className="balance-hint">Your Balance: Ł {summary?.laroCurrency || 0}</p>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setTransferStep(1)}
                                        style={{ flex: 1 }}
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={transferLoading || !transferForm.amount || transferForm.amount > summary?.laroCurrency}
                                        style={{ flex: 1.5 }}
                                    >
                                        {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="transfer-success-view">
                                <div className="success-anim-container">
                                    <CheckCircle size={80} className="success-icon-anim" />
                                    <div className="coin-pulse" />
                                </div>
                                <div className="success-details">
                                    <h3>Sent Successfully!</h3>
                                    <p className="success-amount">Ł {transferForm.amount}</p>
                                    <p className="success-to">to {recipient?.name}</p>
                                </div>
                                <button className="btn-primary w-full" onClick={handleCloseTransferModal} style={{ marginTop: '24px' }}>
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
