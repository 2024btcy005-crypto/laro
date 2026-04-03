import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Card, CardContent, Typography, TextField, Button, CircularProgress, Alert, Snackbar, InputAdornment, Box, Autocomplete, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CampaignIcon from '@mui/icons-material/Campaign';
import { Switch, FormControlLabel } from '@mui/material';
import { getAdvertisement, updateAdvertisement, uploadImage, getAllProducts, getAllShops, getAllCoupons } from '../api';
import api from '../api';

const Settings = () => {
    const [config, setConfig] = useState({
        taxRate: '',
        handlingCharge: '',
        defaultDeliveryFee: ''
    });
    const [ad, setAd] = useState({
        title: '',
        imageUrl: '',
        linkUrl: '',
        isActive: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingAd, setSavingAd] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [linkType, setLinkType] = useState('external'); // 'external', 'product', 'shop', 'coupon'
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchConfig(), fetchAd(), fetchListData()]);
            setLoading(false);
        };
        loadAll();
    }, []);

    const fetchListData = async () => {
        try {
            const [prodRes, shopRes, coupRes] = await Promise.all([
                getAllProducts(),
                getAllShops(),
                getAllCoupons()
            ]);
            setProducts(prodRes.data);
            setShops(shopRes.data);
            setCoupons(coupRes.data);
        } catch (error) {
            console.error('Error fetching selection data:', error);
        }
    };

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await api.get('/config');
            if (response.data) {
                setConfig({
                    taxRate: response.data.taxRate.toString(),
                    handlingCharge: response.data.handlingCharge.toString(),
                    defaultDeliveryFee: response.data.defaultDeliveryFee.toString()
                });
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            showAlert('Failed to load configurations.', 'error');
        } finally {
            // Loading handled in loadAll
        }
    };

    const fetchAd = async () => {
        try {
            const response = await getAdvertisement();
            if (response.data) {
                setAd(response.data);
            }
        } catch (error) {
            console.error('Error fetching ad settings:', error);
            showAlert('Failed to load advertisement settings.', 'error');
        }
    };

    const handleSaveConfig = async () => {
        try {
            setSaving(true);
            const payload = {
                taxRate: parseFloat(config.taxRate),
                handlingCharge: parseFloat(config.handlingCharge),
                defaultDeliveryFee: parseFloat(config.defaultDeliveryFee)
            };

            await api.put('/config', payload);
            showAlert('Configurations updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving config:', error);
            showAlert('Failed to save configurations.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAd = async () => {
        try {
            setSavingAd(true);
            await updateAdvertisement(ad);
            showAlert('Advertisement settings updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving ad:', error);
            showAlert('Failed to update advertisement.', 'error');
        } finally {
            setSavingAd(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await uploadImage(formData);
            setAd(prev => ({ ...prev, imageUrl: res.data.url }));
            showAlert('Image uploaded successfully!', 'success');
        } catch (error) {
            console.error('Upload failed:', error);
            showAlert('Failed to upload image.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const showAlert = (message, severity) => {
        setAlert({ open: true, message, severity });
    };

    const handleCloseAlert = () => {
        setAlert(prev => ({ ...prev, open: false }));
    };

    if (loading) {
        return (
            <Container style={{ display: 'flex', justifyContent: 'center', marginTop: '10%' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                Application Settings
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
                Manage global billing configurations that apply across the entire customer application.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card elevation={3} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                Checkout Variables
                            </Typography>
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Tax Rate (%)"
                                        name="taxRate"
                                        type="number"
                                        value={config.taxRate}
                                        onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                        helperText="Percentage applied to item total"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Handling Charge"
                                        name="handlingCharge"
                                        type="number"
                                        value={config.handlingCharge}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                        }}
                                        helperText="Fixed platform fee"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Base Delivery Fee"
                                        name="defaultDeliveryFee"
                                        type="number"
                                        value={config.defaultDeliveryFee}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                        }}
                                        helperText="Standard delivery fee"
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    onClick={handleSaveConfig}
                                    disabled={saving}
                                    sx={{ borderRadius: 2, px: 4 }}
                                >
                                    Save Changes
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card elevation={3} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Promotional Popup (Mobile App)
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={ad.isActive}
                                            onChange={(e) => setAd(prev => ({ ...prev, isActive: e.target.checked }))}
                                            color="primary"
                                        />
                                    }
                                    label={ad.isActive ? "Active" : "Inactive"}
                                />
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Marketing Title"
                                        placeholder="e.g. MEGA SUMMER SALE"
                                        value={ad.title}
                                        onChange={(e) => setAd(prev => ({ ...prev, title: e.target.value }))}
                                        helperText="Internal title for reference"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Link Type</InputLabel>
                                        <Select
                                            value={linkType}
                                            label="Link Type"
                                            onChange={(e) => setLinkType(e.target.value)}
                                        >
                                            <MenuItem value="external">External URL</MenuItem>
                                            <MenuItem value="product">In-App Product</MenuItem>
                                            <MenuItem value="shop">In-App Shop</MenuItem>
                                            <MenuItem value="coupon">In-App Coupon</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {linkType === 'external' ? (
                                        <TextField
                                            fullWidth
                                            label="Call to Action (Link URL)"
                                            placeholder="https://zippit.app/offers"
                                            value={ad.linkUrl}
                                            onChange={(e) => setAd(prev => ({ ...prev, linkUrl: e.target.value }))}
                                            helperText="External website or link"
                                        />
                                    ) : linkType === 'product' ? (
                                        <Autocomplete
                                            options={products}
                                            getOptionLabel={(option) => `${option.name} (${option.category})`}
                                            renderInput={(params) => <TextField {...params} label="Select Product" />}
                                            onChange={(e, newValue) => {
                                                if (newValue) setAd(prev => ({ ...prev, linkUrl: `zippit://product/${newValue.id || newValue._id}` }));
                                            }}
                                        />
                                    ) : linkType === 'shop' ? (
                                        <Autocomplete
                                            options={shops}
                                            getOptionLabel={(option) => option.name}
                                            renderInput={(params) => <TextField {...params} label="Select Shop" />}
                                            onChange={(e, newValue) => {
                                                if (newValue) setAd(prev => ({ ...prev, linkUrl: `zippit://shop/${newValue.id || newValue._id}` }));
                                            }}
                                        />
                                    ) : (
                                        <Autocomplete
                                            options={coupons}
                                            getOptionLabel={(option) => `${option.code} - ${option.discountValue}${option.discountType === 'percentage' ? '%' : '₹'} OFF`}
                                            renderInput={(params) => <TextField {...params} label="Select Coupon" />}
                                            onChange={(e, newValue) => {
                                                if (newValue) setAd(prev => ({ ...prev, linkUrl: `zippit://coupon/${newValue.id || newValue._id}` }));
                                            }}
                                        />
                                    )}
                                    {linkType !== 'external' && <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main', fontWeight: 'bold' }}>Generated Link: {ad.linkUrl}</Typography>}
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                        Advertisement Secondary Preview
                                    </Typography>
                                    <Box sx={{
                                        width: '100%',
                                        height: 200,
                                        borderRadius: 2,
                                        border: '2px dashed rgba(255,255,255,0.1)',
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        {ad.imageUrl ? (
                                            <>
                                                <img src={`http://localhost:5000${ad.imageUrl}`} alt="Preview" style={{ height: '100%', objectFit: 'contain' }} />
                                                <Button
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => fileInputRef.current.click()}
                                                    sx={{ position: 'absolute', bottom: 10, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
                                                >
                                                    Change Image
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={uploading}
                                            >
                                                Upload Ad Banner (Best: 1080x1920)
                                            </Button>
                                        )}
                                        <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    startIcon={savingAd ? <CircularProgress size={20} color="inherit" /> : <CampaignIcon />}
                                    onClick={handleSaveAd}
                                    disabled={savingAd || uploading}
                                    sx={{ borderRadius: 2, px: 4 }}
                                >
                                    Update Popup
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Alert Snackbar */}
            <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleCloseAlert}>
                <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Settings;
