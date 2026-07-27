import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CircularProgress,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Fade
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
    getDashboardStats,
    getAllItemSales
} from '../api';

export default function DashboardHome() {
    const [stats, setStats] = useState([]);
    const [itemSales, setItemSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, itemSalesRes] = await Promise.allSettled([
                    getDashboardStats(),
                    getAllItemSales()
                ]);

                if (statsRes.status === 'fulfilled') {
                    const statsWithIcons = statsRes.value.data.stats.map(stat => {
                        switch (stat.type) {
                            case 'orders':
                                return {
                                    ...stat,
                                    icon: <ShoppingBagIcon sx={{ color: '#006d33' }} />,
                                    bgcolor: '#e6f7ed'
                                };
                            case 'revenue':
                                return {
                                    ...stat,
                                    icon: <AttachMoneyIcon sx={{ color: '#006d33' }} />,
                                    bgcolor: '#e6f7ed'
                                };
                            case 'shops':
                                return {
                                    ...stat,
                                    icon: <StorefrontIcon sx={{ color: '#006d33' }} />,
                                    bgcolor: '#e6f7ed'
                                };
                            case 'users':
                                return {
                                    ...stat,
                                    icon: <PeopleIcon sx={{ color: '#006d33' }} />,
                                    bgcolor: '#e6f7ed'
                                };
                            default:
                                return stat;
                        }
                    });
                    setStats(statsWithIcons);
                }

                if (itemSalesRes.status === 'fulfilled') {
                    setItemSales(itemSalesRes.value.data || []);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress thickness={4} size={50} sx={{ color: '#006d33' }} />
            </Box>
        );
    }

    return (
        <Fade in={!loading} timeout={500}>
            <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 6 }}>
                {/* Header Welcome Banner */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3.5,
                        mb: 4,
                        bgcolor: '#ffffff',
                        borderRadius: 4,
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2
                    }}
                >
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 0.5, letterSpacing: '-0.02em' }}>
                            Overview & Pulse
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '14px' }}>
                            Real-time order throughput, active campus canteens, and registered student users.
                        </Typography>
                    </Box>

                    <Chip
                        label="CAMPUS STATUS: OPERATIONAL"
                        size="small"
                        sx={{ bgcolor: '#e6f7ed', color: '#006d33', fontWeight: 800, fontSize: '11px', px: 1 }}
                    />
                </Paper>

                {/* Minimal KPI Metric Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {stats.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    bgcolor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 4,
                                    p: 2.5,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: '#43d174',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: stat.bgcolor || '#f3f4f6', width: 42, height: 42 }}>
                                        {stat.icon}
                                    </Avatar>
                                </Box>

                                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, letterSpacing: '0.05em' }}>
                                    {stat.title.toUpperCase()}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mt: 0.5 }}>
                                    {stat.value}
                                </Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Item Sales Performance Table */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        bgcolor: '#ffffff',
                        borderRadius: 4,
                        border: '1px solid #e5e7eb'
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                            Top Performing Items
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                            Updated live from database
                        </Typography>
                    </Box>

                    <TableContainer>
                        <Table sx={{ minWidth: 500 }}>
                            <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em' }}>ITEM NAME</TableCell>
                                    <TableCell align="center" sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em' }}>UNITS SOLD</TableCell>
                                    <TableCell align="right" sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em' }}>TOTAL REVENUE</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>

                                {itemSales.length > 0 ? (
                                    itemSales.map((item, idx) => (
                                        <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                                                <Box
                                                    component="img"
                                                    src={item.product?.imageUrl}
                                                    sx={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover', bgcolor: '#f3f4f6' }}
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop' }}
                                                />
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                                                    {item.product?.name || 'Campus Menu Item'}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="center">
                                                <Chip
                                                    label={`${item.totalQuantity} sold`}
                                                    size="small"
                                                    sx={{ bgcolor: '#e6f7ed', color: '#006d33', fontWeight: 700, fontSize: '11px' }}
                                                />
                                            </TableCell>

                                            <TableCell align="right" sx={{ fontWeight: 800, color: '#111827' }}>
                                                ₹{parseFloat(item.totalRevenue || 0).toLocaleString('en-IN')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ color: '#6b7280', py: 4 }}>
                                            No item sales recorded yet in PostgreSQL database.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </Fade>
    );
}
