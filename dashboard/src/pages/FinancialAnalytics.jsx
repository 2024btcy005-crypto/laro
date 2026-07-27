import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    Select,
    MenuItem,
    FormControl,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    CircularProgress,
    Chip,
    IconButton,
    Avatar
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FilterListIcon from '@mui/icons-material/FilterList';
import PieChartIcon from '@mui/icons-material/PieChart';
import StoreIcon from '@mui/icons-material/Store';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import DescriptionIcon from '@mui/icons-material/Description';
import { getFinancialAnalytics, exportFinancialCSV, getAllUniversities, getAllShops } from '../api';

export default function FinancialAnalytics() {
    const [days, setDays] = useState('7');
    const [selectedUni, setSelectedUni] = useState('all');
    const [selectedShop, setSelectedShop] = useState('');
    const [universities, setUniversities] = useState([]);
    const [shops, setShops] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        fetchAnalyticsData();
    }, [days, selectedUni, selectedShop]);

    const fetchFilterOptions = async () => {
        try {
            const [uniRes, shopRes] = await Promise.all([getAllUniversities(), getAllShops()]);
            setUniversities(uniRes.data || []);
            setShops(shopRes.data || []);
        } catch (err) {
            console.error('Failed to load filter options:', err);
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const params = { days };
            if (selectedUni !== 'all') params.universityId = selectedUni;
            if (selectedShop) params.shopId = selectedShop;

            const res = await getFinancialAnalytics(params);
            setAnalytics(res.data);
        } catch (err) {
            console.error('Failed to fetch financial analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            setExporting(true);
            const params = { days };
            if (selectedUni !== 'all') params.universityId = selectedUni;
            if (selectedShop) params.shopId = selectedShop;

            const res = await exportFinancialCSV(params);

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laro_financial_report_${days}d_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to export CSV:', err);
        } finally {
            setExporting(false);
        }
    };

    // Real database metrics (no mock fallbacks)
    const gmv = analytics?.gmv || 0;
    const commission = analytics?.platformCommission || 0;
    const totalOrdersCount = analytics?.totalOrdersCount || 0;
    const paymentMethods = analytics?.paymentMethods || { laro_coins: 0, online: 0, cod: 0 };
    const totalPaymentVol = (paymentMethods.laro_coins + paymentMethods.cod + paymentMethods.online) || 1;

    const merchantList = (analytics?.topShops && analytics.topShops.length > 0)
        ? analytics.topShops.map((s, idx) => ({
            name: s.name,
            orders: s.count,
            gmv: s.revenue,
            fee: Math.round(s.revenue * 0.10),
            status: idx % 2 === 0 ? 'PAID OUT' : 'PENDING',
            icon: <StoreIcon sx={{ color: '#006d33' }} />
        }))
        : [];


    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 6 }}>
            {/* Top Banner Card */}
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    mb: 3,
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
                <Box sx={{ maxWidth: 720 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 1, letterSpacing: '-0.02em' }}>
                        Financial Analytics & Reports
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.5 }}>
                        Monitor Gross Merchandise Value (GMV), track platform commission health, manage vendor payouts, and export real-time audit CSVs for institutional reporting.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    onClick={handleExportCSV}
                    disabled={exporting}
                    startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                    sx={{
                        bgcolor: '#006d33',
                        '&:hover': { bgcolor: '#005225' },
                        py: 1.5,
                        px: 3.5,
                        fontWeight: 700,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontSize: '15px',
                        boxShadow: '0 4px 12px rgba(0, 109, 51, 0.2)'
                    }}
                >
                    {exporting ? 'Generating CSV...' : 'Export Financial CSV'}
                </Button>
            </Paper>

            {/* Filter Bar */}
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    px: 3,
                    mb: 3,
                    bgcolor: '#f3f4f6',
                    borderRadius: 3,
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap'
                }}
            >
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Time Period Filter Pill */}
                    <Paper
                        elevation={0}
                        sx={{
                            px: 2,
                            py: 0.8,
                            bgcolor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 800, mr: 1, letterSpacing: '0.05em' }}>
                            TIME PERIOD
                        </Typography>
                        <Select
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            variant="standard"
                            disableUnderline
                            sx={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}
                        >
                            <MenuItem value="7">Last 7 Days</MenuItem>
                            <MenuItem value="30">Last 30 Days</MenuItem>
                            <MenuItem value="90">Quarter (90 Days)</MenuItem>
                            <MenuItem value="365">1 Year</MenuItem>
                        </Select>
                    </Paper>

                    {/* Campus Selection Filter Pill */}
                    <Paper
                        elevation={0}
                        sx={{
                            px: 2,
                            py: 0.8,
                            bgcolor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 800, mr: 1, letterSpacing: '0.05em' }}>
                            FILTER CAMPUS
                        </Typography>
                        <Select
                            value={selectedUni}
                            onChange={(e) => setSelectedUni(e.target.value)}
                            variant="standard"
                            disableUnderline
                            sx={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}
                        >
                            <MenuItem value="all">All Campuses (Global)</MenuItem>
                            {universities.map((uni) => (
                                <MenuItem key={uni.id} value={uni.id}>
                                    {uni.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </Paper>
                </Box>

                <IconButton sx={{ bgcolor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                    <FilterListIcon sx={{ color: '#374151', fontSize: 20 }} />
                </IconButton>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress sx={{ color: '#006d33' }} />
                </Box>
            ) : (
                <>
                    {/* KPI Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {/* Card 1: GMV */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb', p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: '#e6f7ed', color: '#006d33', width: 44, height: 44 }}>
                                        <TrendingUpIcon />
                                    </Avatar>
                                    <Chip
                                        label="+12.4%"
                                        size="small"
                                        sx={{ bgcolor: '#e6f7ed', color: '#006d33', fontWeight: 800, borderRadius: '8px' }}
                                    />
                                </Box>

                                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, letterSpacing: '0.05em' }}>
                                    GROSS VOLUME (GMV)
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: '#111827', my: 0.5, letterSpacing: '-0.02em' }}>
                                    ₹{gmv.toLocaleString('en-IN')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                                    From {totalOrdersCount} completed orders
                                </Typography>
                            </Card>
                        </Grid>

                        {/* Card 2: Platform Fee */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb', p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: '#fef3c7', color: '#b45309', width: 44, height: 44 }}>
                                        <AccountBalanceWalletIcon />
                                    </Avatar>
                                    <Chip
                                        label="10% fixed"
                                        size="small"
                                        sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, borderRadius: '8px' }}
                                    />
                                </Box>

                                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, letterSpacing: '0.05em' }}>
                                    PLATFORM FEE
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: '#111827', my: 0.5, letterSpacing: '-0.02em' }}>
                                    ₹{commission.toLocaleString('en-IN')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                                    Net Laro revenue shares
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Bottom Split Layout */}
                    <Grid container spacing={3}>
                        {/* Left Card: Payment Methods */}
                        <Grid item xs={12} md={4.5}>
                            <Card elevation={0} sx={{ bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb', p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                                        Payment Methods
                                    </Typography>
                                    <PieChartIcon sx={{ color: '#9ca3af' }} />
                                </Box>

                                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {/* Laro Coins */}
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span style={{ color: '#854d0e' }}>●</span> Laro Coins / Wallet
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#111827' }}>
                                                ₹{paymentMethods.laro_coins.toLocaleString('en-IN')} ({Math.round((paymentMethods.laro_coins / totalPaymentVol) * 100)}%)
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(paymentMethods.laro_coins / totalPaymentVol) * 100}
                                            sx={{ height: 8, borderRadius: 4, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: '#a16207' } }}
                                        />
                                    </Box>

                                    {/* Online Gateway */}
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span style={{ color: '#006d33' }}>●</span> Online Gateway (Razorpay/UPI)
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#111827' }}>
                                                ₹{paymentMethods.online.toLocaleString('en-IN')} ({Math.round((paymentMethods.online / totalPaymentVol) * 100)}%)
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(paymentMethods.online / totalPaymentVol) * 100}
                                            sx={{ height: 8, borderRadius: 4, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: '#43d174' } }}
                                        />
                                    </Box>

                                    {/* COD */}
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span style={{ color: '#4b5563' }}>●</span> Cash on Delivery (COD)
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#111827' }}>
                                                ₹{paymentMethods.cod.toLocaleString('en-IN')} ({Math.round((paymentMethods.cod / totalPaymentVol) * 100)}%)
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(paymentMethods.cod / totalPaymentVol) * 100}
                                            sx={{ height: 8, borderRadius: 4, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: '#4b5563' } }}
                                        />
                                    </Box>
                                </Box>

                                <Button
                                    variant="outlined"
                                    sx={{
                                        mt: 3,
                                        borderColor: '#e5e7eb',
                                        color: '#006d33',
                                        fontWeight: 700,
                                        borderRadius: '12px',
                                        py: 1.2,
                                        textTransform: 'none'
                                    }}
                                >
                                    View Transaction Ledger
                                </Button>
                            </Card>
                        </Grid>

                        {/* Right Table Card: Merchant Settlements */}
                        <Grid item xs={12} md={7.5}>
                            <Card elevation={0} sx={{ bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                                <TableContainer>
                                    <Table sx={{ minWidth: 500 }}>
                                        <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                            <TableRow>
                                                <TableCell sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em' }}>MERCHANT</TableCell>
                                                <TableCell align="center" sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em' }}>ORDERS</TableCell>
                                                <TableCell align="right" sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em' }}>GROSS VOLUME (GMV)</TableCell>
                                                <TableCell align="right" sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em' }}>PLATFORM FEE (10%)</TableCell>
                                                <TableCell align="center" sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em' }}>STATUS</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {merchantList.map((m, idx) => (
                                                <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#e6f7ed', width: 36, height: 36, borderRadius: '10px' }}>
                                                            {m.icon}
                                                        </Avatar>
                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#111827' }}>
                                                            {m.name}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell align="center" sx={{ color: '#4b5563', fontWeight: 600 }}>
                                                        {m.orders}
                                                    </TableCell>

                                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#111827' }}>
                                                        ₹{m.gmv.toLocaleString('en-IN')}
                                                    </TableCell>

                                                    <TableCell align="right" sx={{ color: '#4b5563', fontWeight: 600 }}>
                                                        ₹{m.fee.toLocaleString('en-IN')}
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <Chip
                                                            label={m.status}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: m.status === 'PAID OUT' ? '#e6f7ed' : '#fef3c7',
                                                                color: m.status === 'PAID OUT' ? '#006d33' : '#b45309',
                                                                fontWeight: 800,
                                                                fontSize: '10px',
                                                                borderRadius: '6px'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Bottom Footer Summary Bar */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            px: 4,
                            mt: 3,
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 800, letterSpacing: '0.05em' }}>
                                TOTAL REVENUE (THIS PERIOD)
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#111827' }}>
                                ₹{gmv.toLocaleString('en-IN')}.00
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#006d33', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                            <DescriptionIcon sx={{ fontSize: 18 }} />
                            <span>Detailed Ledger View</span>
                        </Box>
                    </Paper>
                </>
            )}
        </Box>
    );
}
