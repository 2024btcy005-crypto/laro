import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Grid, IconButton, Chip, Modal, TextField,
    CircularProgress, Alert, useTheme, Fade, Backdrop, Tooltip, Stack, Select, MenuItem, InputLabel, FormControl,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { getAllCoupons, createCoupon, deleteCoupon } from '../api';

export default function CouponManagement() {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        expiryDate: '',
        usageLimit: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await getAllCoupons();
            setCoupons(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch coupons. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            minOrderAmount: '',
            maxDiscountAmount: '',
            expiryDate: '',
            usageLimit: ''
        });
        setOpen(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            if (!formData.code || !formData.discountValue || !formData.expiryDate) {
                setError('Please fill in all required fields (Code, Discount, and Expiry Date).');
                return;
            }
            await createCoupon(formData);
            setOpen(false);
            fetchCoupons();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save coupon. Please check details.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                await deleteCoupon(id);
                fetchCoupons();
            } catch (err) {
                setError('Failed to delete coupon.');
            }
        }
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Fade in={true} timeout={800}>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
                    <Box>
                        <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                            Coupons & Offers
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your promotional codes and customer discounts.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpen}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            fontSize: '0.9rem',
                            boxShadow: '0 10px 20px rgba(236, 72, 153, 0.2)',
                        }}
                    >
                        Create New Coupon
                    </Button>
                </Box>

                <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search coupons by code..."
                        variant="outlined"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)' }
                        }}
                    />
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
                        <CircularProgress thickness={5} size={60} sx={{ color: theme.palette.primary.main }} />
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>CODE</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>TYPE</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>VALUE</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>MIN ORDER</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>USED</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>EXPIRY</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCoupons.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                            <ConfirmationNumberIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                                            <Typography variant="body1" color="text.secondary">No coupons found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCoupons.map((coupon) => {
                                    const isExpired = new Date(coupon.expiryDate) < new Date();
                                    return (
                                        <TableRow key={coupon.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                                            <TableCell sx={{ fontWeight: 700, color: 'primary.light' }}>{coupon.code}</TableCell>
                                            <TableCell sx={{ textTransform: 'capitalize' }}>{coupon.discountType}</TableCell>
                                            <TableCell fontWeight="bold">
                                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                            </TableCell>
                                            <TableCell>₹{coupon.minOrderAmount}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="600">
                                                    {coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{new Date(coupon.expiryDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isExpired ? "EXPIRED" : (coupon.isActive ? "ACTIVE" : "INACTIVE")}
                                                    size="small"
                                                    color={isExpired ? "secondary" : (coupon.isActive ? "success" : "default")}
                                                    sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Delete Coupon">
                                                    <IconButton
                                                        onClick={() => handleDelete(coupon.id)}
                                                        sx={{ color: 'secondary.main', bgcolor: 'rgba(244, 63, 94, 0.05)' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(10px)', background: 'rgba(8, 12, 20, 0.8)' } }}
                >
                    <Fade in={open}>
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: 500, bgcolor: 'background.paper',
                            borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', p: 5,
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}>
                            <Typography variant="h5" fontWeight="900" mb={4}>
                                Create New Coupon
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Coupon Code (e.g. SUMMER20)"
                                        name="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        variant="filled"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth variant="filled">
                                        <InputLabel>Discount Type</InputLabel>
                                        <Select name="discountType" value={formData.discountType} onChange={handleChange}>
                                            <MenuItem value="percentage">Percentage (%)</MenuItem>
                                            <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Discount Value"
                                        name="discountValue"
                                        type="number"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        variant="filled"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Min Order Amount (₹)"
                                        name="minOrderAmount"
                                        type="number"
                                        value={formData.minOrderAmount}
                                        onChange={handleChange}
                                        variant="filled"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Max Discount (₹)"
                                        name="maxDiscountAmount"
                                        type="number"
                                        value={formData.maxDiscountAmount}
                                        onChange={handleChange}
                                        variant="filled"
                                        disabled={formData.discountType === 'fixed'}
                                        helperText="Only for Percentage"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Expiry Date"
                                        name="expiryDate"
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        variant="filled"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Usage Limit"
                                        name="usageLimit"
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={handleChange}
                                        variant="filled"
                                        placeholder="Unlimited if empty"
                                    />
                                </Grid>
                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={handleSave}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: '900',
                                            py: 2,
                                            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                        }}
                                    >
                                        Create Coupon
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Fade>
                </Modal>
            </Box>
        </Fade>
    );
}
