import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CircularProgress,
    useTheme,
    Fade
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import {
    getDashboardStats,
    getAllItemSales
} from '../api';

export default function DashboardHome() {
    const theme = useTheme();
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
                                    icon: <ShoppingBagIcon sx={{ color: '#fff' }} fontSize="large" />,
                                    gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
                                    shadow: 'rgba(236, 72, 153, 0.4)'
                                };
                            case 'revenue':
                                return {
                                    ...stat,
                                    icon: <AttachMoneyIcon sx={{ color: '#fff' }} fontSize="large" />,
                                    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                                    shadow: 'rgba(190, 24, 93, 0.4)'
                                };
                            case 'shops':
                                return {
                                    ...stat,
                                    icon: <StorefrontIcon sx={{ color: '#fff' }} fontSize="large" />,
                                    gradient: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)',
                                    shadow: 'rgba(244, 114, 182, 0.4)'
                                };
                            case 'users':
                                return {
                                    ...stat,
                                    icon: <PeopleIcon sx={{ color: '#fff' }} fontSize="large" />,
                                    gradient: 'linear-gradient(135deg, #fda4af 0%, #e11d48 100%)',
                                    shadow: 'rgba(225, 29, 72, 0.4)'
                                };
                            default:
                                return stat;
                        }
                    });
                    setStats(statsWithIcons);
                }

                if (itemSalesRes.status === 'fulfilled') {
                    setItemSales(itemSalesRes.value.data);
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress thickness={5} size={60} sx={{ color: '#ec4899' }} />
            </Box>
        );
    }

    return (
        <Fade in={!loading} timeout={800}>
            <Box>
                <Box mb={6}>
                    <Typography
                        variant="h3"
                        gutterBottom
                        sx={{
                            fontWeight: 900,
                            background: 'linear-gradient(to right, #fff, #f472b6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}
                    >
                        Welcome Admin 👋
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>
                        Here's your business pulse for <span style={{ color: '#ec4899', fontWeight: 700 }}>Laro</span>.
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    {stats.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card sx={{
                                height: '100%',
                                background: 'rgba(30, 41, 59, 0.4)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: 5,
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                    transform: 'translateY(-10px)',
                                    border: `1px solid ${stat.shadow}`,
                                    boxShadow: `0 20px 40px -10px ${stat.shadow.replace('0.4', '0.15')}`,
                                },
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{
                                        background: stat.gradient,
                                        width: 56,
                                        height: 56,
                                        borderRadius: 4,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        mb: 3,
                                        boxShadow: `0 10px 20px ${stat.shadow}`,
                                    }}>
                                        {stat.icon}
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.4)', mb: 1, letterSpacing: '0.1em', fontWeight: 700 }}>
                                        {stat.title.toUpperCase()}
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>
                                        {stat.value}
                                    </Typography>

                                    <Box sx={{
                                        position: 'absolute',
                                        top: -20,
                                        right: -20,
                                        width: 100,
                                        height: 100,
                                        background: stat.gradient,
                                        filter: 'blur(50px)',
                                        opacity: 0.1,
                                        zIndex: 0
                                    }} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Box mt={6}>
                    <Paper sx={{
                        p: 4,
                        borderRadius: 6,
                        background: 'rgba(30, 41, 59, 0.3)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', mb: 3 }}>
                            Item Sales Performance
                        </Typography>
                        <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>ITEM</th>
                                        <th style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'center' }}>SOLD</th>
                                        <th style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'right' }}>REVENUE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemSales.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box
                                                        component="img"
                                                        src={item.product?.imageUrl}
                                                        sx={{ width: 32, height: 32, borderRadius: 1, objectFit: 'cover' }}
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/32' }}
                                                    />
                                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                                                        {item.product?.name}
                                                    </Typography>
                                                </Box>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <Typography variant="body2" sx={{ color: '#ec4899', fontWeight: 700 }}>
                                                    {item.totalQuantity}
                                                </Typography>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                                    ₹{parseFloat(item.totalRevenue).toLocaleString()}
                                                </Typography>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Fade>
    );
}
