import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    TextField,
    MenuItem,
    CircularProgress,
    useTheme,
    Fade
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { getAllOrders, deleteOrder } from '../api';

const statusColors = {
    'placed': 'info',
    'accepted': 'primary',
    'preparing': 'warning',
    'out_for_delivery': 'warning',
    'delivered': 'success',
    'cancelled': 'error'
};

export default function OrderManagement() {
    const theme = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const response = await getAllOrders(params);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (orderId) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await deleteOrder(orderId);
                setOrders(orders.filter(order => order.id !== orderId));
            } catch (error) {
                console.error('Error deleting order:', error);
                alert('Failed to delete order.');
            }
        }
    };

    return (
        <Fade in={true} timeout={800}>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                    <Box>
                        <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: '-0.02em', mb: 1, color: '#111827' }}>
                            Order Flow
                        </Typography>

                        <Typography variant="body1" sx={{ color: '#6b7280', mt: 1 }}>
                            Monitoring <span style={{ color: '#006d33', fontWeight: 700 }}>{orders.length}</span> active transactions today.
                        </Typography>
                    </Box>

                    <TextField
                        select
                        size="small"
                        label="Filter Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ width: 200 }}
                    >
                        <MenuItem value="">All Deliveries</MenuItem>
                        <MenuItem value="placed">🎁 Placed</MenuItem>
                        <MenuItem value="accepted">✅ Accepted</MenuItem>
                        <MenuItem value="preparing">👨‍🍳 Preparing</MenuItem>
                        <MenuItem value="out_for_delivery">🛵 En Route</MenuItem>
                        <MenuItem value="delivered">🎉 Delivered</MenuItem>
                        <MenuItem value="cancelled">❌ Cancelled</MenuItem>
                    </TextField>
                </Box>

                <TableContainer component={Paper} sx={{
                    borderRadius: 4,
                    bgcolor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden'
                }}>
                    {loading ? (
                        <Box sx={{ p: 10, textAlign: 'center' }}>
                            <CircularProgress sx={{ color: '#006d33' }} thickness={5} size={50} />
                        </Box>
                    ) : (

                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', py: 2, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Order ID</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', py: 2, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Partners</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', py: 2, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Amount</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', py: 2, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Track Status</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', py: 2, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Timeline</TableCell>
                                    <TableCell align="right" sx={{ color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', py: 2, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order) => {
                                    const statusConfig = {
                                        'placed': { label: 'PENDING', color: '#b45309', bg: '#fef3c7' },
                                        'accepted': { label: 'CONFIRMED', color: '#0284c7', bg: '#e0f2fe' },
                                        'preparing': { label: 'KITCHEN', color: '#d97706', bg: '#fef3c7' },
                                        'out_for_delivery': { label: 'ON ROAD', color: '#006d33', bg: '#e6f7ed' },
                                        'delivered': { label: 'COMPLETED', color: '#006d33', bg: '#e6f7ed' },
                                        'cancelled': { label: 'VOID', color: '#ef4444', bg: '#fee2e2' }
                                    };
                                    const cfg = statusConfig[order.status] || statusConfig['placed'];

                                    return (
                                        <TableRow
                                            key={order.id}
                                            sx={{
                                                '&:hover': { bgcolor: '#f9fafb' },
                                                transition: 'background 0.2s',
                                                '& td, & th': { borderBottom: '1px solid #f3f4f6' }
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#006d33' }}>
                                                    #{String(order.id).substring(0, 8).toUpperCase()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                                                        {order.customer?.name || 'Guest User'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                                        from {order.shop?.name || 'Local Outlet'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#111827' }}>
                                                    ₹{parseFloat(order.totalAmount).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cfg.label}
                                                    sx={{
                                                        fontWeight: 800,
                                                        borderRadius: 2,
                                                        fontSize: '0.65rem',
                                                        letterSpacing: '0.1em',
                                                        background: cfg.bg,
                                                        color: cfg.color,
                                                        height: 24
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#006d33',
                                                            background: '#e6f7ed',
                                                            '&:hover': { background: '#38c567', color: '#fff' }
                                                        }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#ef4444',
                                                            background: '#fee2e2',
                                                            '&:hover': { background: '#ef4444', color: '#fff' }
                                                        }}
                                                        onClick={() => handleDelete(order.id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {orders.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                            <Box sx={{ opacity: 0.2 }}>
                                                <ShoppingBagIcon sx={{ fontSize: 64, mb: 2, color: '#fff' }} />
                                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>No Orders Synced</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>
            </Box>
        </Fade>
    );
}
