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
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 900,
                                background: 'linear-gradient(to right, #fff, #f472b6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Order Flow
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1 }}>
                            Monitoring <span style={{ color: '#ec4899', fontWeight: 700 }}>{orders.length}</span> active transactions today.
                        </Typography>
                    </Box>

                    <TextField
                        select
                        size="small"
                        label="Filter Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.5)' } }}
                        sx={{
                            width: 200,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 4,
                                background: 'rgba(30, 41, 59, 0.5)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                color: '#fff',
                                '& fieldset': { border: 'none' }
                            }
                        }}
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
                    borderRadius: 6,
                    background: 'rgba(30, 41, 59, 0.3)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden'
                }}>
                    {loading ? (
                        <Box sx={{ p: 10, textAlign: 'center' }}>
                            <CircularProgress sx={{ color: '#ec4899' }} thickness={5} size={50} />
                        </Box>
                    ) : (
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700, textTransform: 'uppercase', py: 3, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Order ID</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700, textTransform: 'uppercase', py: 3, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Partners</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700, textTransform: 'uppercase', py: 3, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Amount</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700, textTransform: 'uppercase', py: 3, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Track Status</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700, textTransform: 'uppercase', py: 3, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Timeline</TableCell>
                                    <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700, textTransform: 'uppercase', py: 3, fontSize: '0.75rem', letterSpacing: '0.1em' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order) => {
                                    const statusConfig = {
                                        'placed': { label: 'PENDING', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
                                        'accepted': { label: 'CONFIRMED', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
                                        'preparing': { label: 'KITCHEN', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                                        'out_for_delivery': { label: 'ON ROAD', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
                                        'delivered': { label: 'COMPLETED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                                        'cancelled': { label: 'VOID', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
                                    };
                                    const cfg = statusConfig[order.status] || statusConfig['placed'];

                                    return (
                                        <TableRow
                                            key={order.id}
                                            sx={{
                                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' },
                                                transition: 'background 0.2s',
                                                '& td, & th': { borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#ec4899' }}>
                                                    #{String(order.id).substring(0, 8).toUpperCase()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                                                        {order.customer?.name || 'Guest User'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                                        from {order.shop?.name || 'Local Outlet'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#fff' }}>
                                                    ₹{parseFloat(order.totalAmount).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cfg.label}
                                                    sx={{
                                                        fontWeight: 900,
                                                        borderRadius: 2,
                                                        fontSize: '0.65rem',
                                                        letterSpacing: '0.1em',
                                                        background: cfg.bg,
                                                        color: cfg.color,
                                                        border: `1px solid ${cfg.color}33`,
                                                        height: 24
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#ec4899',
                                                            background: 'rgba(236, 72, 153, 0.1)',
                                                            '&:hover': { background: 'rgba(236, 72, 153, 0.2)' }
                                                        }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#ef4444',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            '&:hover': { background: 'rgba(239, 68, 68, 0.2)' }
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
