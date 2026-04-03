import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Layout from './components/Layout';
import DashboardHome from './pages/DashboardHome';
import Login from './pages/Login';
import ShopManagement from './pages/ShopManagement';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import UserManagement from './pages/UserManagement';
import CategoryManagement from './pages/CategoryManagement';
import Settings from './pages/Settings';
import CouponManagement from './pages/CouponManagement';
import UniversityManagement from './pages/UniversityManagement';

// A component to protect routes and redirect to login if not authenticated
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('token');
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes inside Layout */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardHome />} />
                        <Route path="shops" element={<ShopManagement />} />
                        <Route path="products" element={<ProductManagement />} />
                        <Route path="orders" element={<OrderManagement />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="coupons" element={<CouponManagement />} />
                        <Route path="categories" element={<CategoryManagement />} />
                        <Route path="universities" element={<UniversityManagement />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
