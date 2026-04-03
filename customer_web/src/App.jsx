import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import MyQR from './pages/MyQR';
import Loyalty from './pages/Loyalty';
import Settings from './pages/Settings';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <NavBar />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p>&copy; 2026 Laro. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Terms & Conditions</Link>
            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes - require login */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/shop/:id" element={
              <ProtectedRoute>
                <Layout>
                  <ShopDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/checkout" element={
              <ProtectedRoute>
                <Layout>
                  <Checkout />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/favorites" element={
              <ProtectedRoute>
                <Layout>
                  <Favorites />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/my-qr" element={
              <ProtectedRoute>
                <Layout>
                  <MyQR />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/loyalty" element={
              <ProtectedRoute>
                <Layout>
                  <Loyalty />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/about" element={
              <ProtectedRoute>
                <Layout>
                  <About />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/terms" element={
              <ProtectedRoute>
                <Layout>
                  <TermsAndConditions />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/privacy" element={
              <ProtectedRoute>
                <Layout>
                  <PrivacyPolicy />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Catch-all: redirect to home (which will redirect to login if not authed) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
