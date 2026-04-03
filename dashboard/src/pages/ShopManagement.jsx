import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Grid, IconButton, Chip, Modal, TextField,
    CircularProgress, Alert, useTheme, Fade, Backdrop, Card, CardMedia, CardContent,
    CardActions, Tooltip, Stack, Select, MenuItem, InputLabel, FormControl,
    Switch, FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import PaymentsIcon from '@mui/icons-material/Payments';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import api, { uploadImage, getAllUniversities } from '../api';
import SchoolIcon from '@mui/icons-material/School';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function ShopManagement() {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [universities, setUniversities] = useState([]);

    const [editMode, setEditMode] = useState(false);
    const [currentShopId, setCurrentShopId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', category: '', imageUrl: '',
        openingTime: '', closingTime: '',
        serviceRadius: 5,
        isWarehouse: false,
        minOrderValue: 0,
        deliveryFee: 0,
        estimatedDeliveryTime: '20-30 min',
        isActive: true,
        universityId: ''
    });
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super_admin';

    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    // Xerox Pricing State
    const [pricingOpen, setPricingOpen] = useState(false);
    const [pricingFormData, setPricingFormData] = useState({ bwSingle: 1, bwDouble: 1.5, colorSingle: 5, colorDouble: 8 });
    const [pricingLoading, setPricingLoading] = useState(false);

    useEffect(() => {
        fetchShops();
        fetchUniversities();
    }, []);

    const fetchUniversities = async () => {
        try {
            const res = await getAllUniversities();
            setUniversities(res.data);
        } catch (err) {
            console.error('Failed to fetch universities');
        }
    };

    const fetchShops = async () => {
        try {
            const response = await api.get('/shops?all=true');
            setShops(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch shops. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setEditMode(false);
        setCurrentShopId(null);
        setFormData({
            name: '', category: '', imageUrl: '',
            openingTime: '', closingTime: '',
            serviceRadius: 5,
            isWarehouse: false,
            minOrderValue: 0,
            deliveryFee: 0,
            estimatedDeliveryTime: '20-30 min',
            isActive: true,
            universityId: ''
        });
        setOpen(true);
    };

    const handleEdit = (shop) => {
        setEditMode(true);
        setCurrentShopId(shop._id || shop.id);
        setFormData({
            name: shop.name || '',
            category: shop.category || '',
            imageUrl: shop.imageUrl || '',
            openingTime: shop.openingTime || '',
            closingTime: shop.closingTime || '',
            estimatedDeliveryTime: shop.estimatedDeliveryTime || '',
            isActive: shop.isActive !== undefined ? shop.isActive : true,
            universityId: shop.universityId || '',
            serviceRadius: shop.serviceRadius || 5,
        });
        setOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' || name === 'isWarehouse' || name === 'isActive' ? checked : value });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);
            const res = await uploadImage(uploadFormData);
            setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
        } catch (error) {
            console.error('Upload failed:', error);
            setError('Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        // Sanitize data: convert empty strings to null for fields that expect specific types
        const dataToSave = {
            ...formData,
            universityId: formData.universityId === '' ? null : formData.universityId,
            latitude: 0, // Removed from UI, set to default
            longitude: 0, // Removed from UI, set to default
            openingTime: formData.openingTime === '' ? null : formData.openingTime,
            closingTime: formData.closingTime === '' ? null : formData.closingTime,
            minOrderValue: parseFloat(formData.minOrderValue) || 0,
            deliveryFee: parseFloat(formData.deliveryFee) || 0,
            serviceRadius: parseFloat(formData.serviceRadius) || 5,
        };

        try {
            if (editMode && currentShopId) {
                await api.put(`/shops/${currentShopId}`, dataToSave);
            } else {
                await api.post('/shops', {
                    ...dataToSave,
                    isOpen: true,
                    rating: 0,
                    ratingCount: "0",
                    deliveryTime: "30-40 min",
                    costForTwo: "₹200 for two"
                });
            }
            setOpen(false);
            fetchShops();
        } catch (err) {
            setError(`Failed to ${editMode ? 'update' : 'save'} shop. Please check details.`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this shop?')) {
            try {
                await api.delete(`/shops/${id}`);
                fetchShops();
            } catch (err) {
                setError('Failed to delete shop.');
            }
        }
    };

    const handlePricingOpen = async (shop) => {
        setCurrentShopId(shop._id || shop.id);
        setPricingLoading(true);
        setPricingOpen(true);
        try {
            const response = await api.get(`/xerox-pricing/shop/${shop._id || shop.id}`);
            if (response.data) {
                setPricingFormData({
                    bwSingle: response.data.bwSingle || 1,
                    bwDouble: response.data.bwDouble || 1.5,
                    colorSingle: response.data.colorSingle || 5,
                    colorDouble: response.data.colorDouble || 8
                });
            }
        } catch (err) {
            console.error('Failed to fetch pricing');
        } finally {
            setPricingLoading(false);
        }
    };

    const handlePricingSave = async () => {
        setPricingLoading(true);
        try {
            await api.post(`/xerox-pricing/shop/${currentShopId}`, pricingFormData);
            setPricingOpen(false);
        } catch (err) {
            setError('Failed to update pricing.');
        } finally {
            setPricingLoading(false);
        }
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Fade in={true} timeout={800}>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
                    <Box>
                        <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                            Shops
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your partner outlets and their operational status.
                        </Typography>
                    </Box>
                    {isSuperAdmin && (
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
                            Add New Shop
                        </Button>
                    )}
                </Box>

                <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search shops by name or category..."
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

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
                        <CircularProgress thickness={5} size={60} sx={{ color: theme.palette.primary.main }} />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {filteredShops.length === 0 ? (
                            <Grid item xs={12}>
                                <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <StorefrontIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">No shops found matching your search.</Typography>
                                </Paper>
                            </Grid>
                        ) : filteredShops.map((shop) => (
                            <Grid item xs={12} sm={6} md={4} key={shop._id || shop.id}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 4,
                                    '&:hover .MuiCardMedia-root': { transform: 'scale(1.05)' }
                                }}>
                                    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                                        <CardMedia
                                            component="img"
                                            height="180"
                                            image={shop.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}
                                            alt={shop.name}
                                            sx={{ transition: 'transform 0.5s ease-in-out' }}
                                        />
                                        <Chip
                                            label={shop.isActive ? (shop.isOpen ? "OPEN" : "CLOSED") : "OFFLINE"}
                                            color={shop.isActive ? (shop.isOpen ? "success" : "error") : "default"}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                fontWeight: 900,
                                                fontSize: '0.65rem',
                                                borderRadius: 1,
                                                bgcolor: !shop.isActive ? 'rgba(0,0,0,0.5)' : undefined
                                            }}
                                        />
                                    </Box>
                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                        <Typography variant="h6" fontWeight="800" gutterBottom>
                                            {shop.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            color: 'primary.main',
                                            fontWeight: 700,
                                            mb: 2,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            fontSize: '0.75rem'
                                        }}>
                                            {shop.category}
                                        </Typography>

                                        <Stack direction="row" spacing={2} alignItems="center" sx={{ opacity: 0.6, mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 16 }} />
                                                <Typography variant="caption" fontWeight="600">
                                                    {shop.openingTime} - {shop.closingTime}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <SchoolIcon sx={{ fontSize: 16 }} />
                                                <Typography variant="caption" fontWeight="600">
                                                    {shop.university?.name || 'Global'}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                        Min Order
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="800">₹{shop.minOrderValue}</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                        Delivery
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="800">₹{shop.deliveryFee}</Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </CardContent>
                                    <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
                                        {['Xerox', 'Printing', 'Stationery', 'Books'].includes(shop.category) && (
                                            <Tooltip title="Manage Xerox Pricing">
                                                <IconButton
                                                    onClick={() => handlePricingOpen(shop)}
                                                    sx={{ bgcolor: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6' }}
                                                >
                                                    <PaymentsIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Edit Shop">
                                            <IconButton
                                                onClick={() => handleEdit(shop)}
                                                sx={{ bgcolor: 'rgba(236, 72, 153, 0.05)', color: 'primary.main' }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {isSuperAdmin && (
                                            <Tooltip title="Delete Shop">
                                                <IconButton
                                                    onClick={() => handleDelete(shop._id || shop.id)}
                                                    sx={{ bgcolor: 'rgba(244, 63, 94, 0.05)', color: 'secondary.main' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
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
                            width: 600, maxHeight: '90vh', overflowY: 'auto', bgcolor: 'background.paper',
                            borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', p: 4,
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}>
                            <Typography variant="h5" fontWeight="900" mb={3}>
                                {editMode ? 'Edit Shop' : 'Add New Partner'}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Shop Name" name="name" value={formData.name} onChange={handleChange} variant="filled" sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth variant="filled">
                                        <InputLabel>Category</InputLabel>
                                        <Select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }}
                                        >
                                            <MenuItem disabled><em>── Food & Shops ──</em></MenuItem>
                                            <MenuItem value="Burgers">🍔 Burgers</MenuItem>
                                            <MenuItem value="Pizza">🍕 Pizza</MenuItem>
                                            <MenuItem value="Cafe">☕ Cafe</MenuItem>
                                            <MenuItem value="Stores">🏪 General Store</MenuItem>
                                            <MenuItem value="Beverages">🥤 Beverages</MenuItem>
                                            <MenuItem value="Snacks">🍟 Snacks</MenuItem>
                                            <MenuItem value="Meals">🍱 Meals</MenuItem>
                                            <MenuItem disabled><em>── Stationery & Printing ──</em></MenuItem>
                                            <MenuItem value="Xerox">🖨️ Xerox / Copying</MenuItem>
                                            <MenuItem value="Printing">🖨️ Printing</MenuItem>
                                            <MenuItem value="Stationery">📎 Stationery</MenuItem>
                                            <MenuItem value="Books">📚 Books</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Shop Graphic / Banner</Typography>
                                    <Box sx={{
                                        border: '1px dashed rgba(255,255,255,0.1)',
                                        borderRadius: 2,
                                        p: 2,
                                        textAlign: 'center',
                                        bgcolor: 'rgba(255,255,255,0.02)'
                                    }}>
                                        {formData.imageUrl ? (
                                            <Box sx={{ mb: 2 }}>
                                                <img src={`http://localhost:5000${formData.imageUrl}`} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '8px' }} alt="Preview" />
                                                <Button size="small" onClick={() => fileInputRef.current.click()} sx={{ mt: 1 }}>Change Photo</Button>
                                            </Box>
                                        ) : (
                                            <Button
                                                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={uploading}
                                            >
                                                {uploading ? 'Uploading...' : 'Upload Shop Banner'}
                                            </Button>
                                        )}
                                        <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Image URL (Manual Override)" name="imageUrl" value={formData.imageUrl} onChange={handleChange} variant="filled" size="small" />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField fullWidth label="Opening Time" name="openingTime" type="time" value={formData.openingTime} onChange={handleChange} InputLabelProps={{ shrink: true }} variant="filled" sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }} />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField fullWidth label="Closing Time" name="closingTime" type="time" value={formData.closingTime} onChange={handleChange} InputLabelProps={{ shrink: true }} variant="filled" sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }} />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>Location & Fulfillment</Typography>
                                </Grid>

                                {isSuperAdmin ? null : (
                                    <Grid item xs={8}>
                                        <FormControl fullWidth variant="filled">
                                            <InputLabel>Target University/Campus</InputLabel>
                                            <Select
                                                name="universityId"
                                                value={formData.universityId}
                                                onChange={handleChange}
                                            >
                                                <MenuItem value=""><em>None (Global Access)</em></MenuItem>
                                                {universities.map(uni => (
                                                    <MenuItem key={uni.id} value={uni.id}>{uni.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}

                                <Grid item xs={4}>
                                    <TextField fullWidth label="Service Radius (km)" name="serviceRadius" type="number" value={formData.serviceRadius} onChange={handleChange} variant="filled" />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>Economics & Status</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField fullWidth label="Min Order (₹)" name="minOrderValue" type="number" value={formData.minOrderValue} onChange={handleChange} variant="filled" size="small" />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField fullWidth label="Delivery Fee (₹)" name="deliveryFee" type="number" value={formData.deliveryFee} onChange={handleChange} variant="filled" size="small" />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField fullWidth label="Estimated Time" name="estimatedDeliveryTime" value={formData.estimatedDeliveryTime} onChange={handleChange} variant="filled" size="small" placeholder="20 min" />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={<Switch checked={formData.isWarehouse} onChange={handleChange} name="isWarehouse" color="primary" />}
                                        label={<Typography variant="body2" fontWeight="bold">Warehouse Mode</Typography>}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={<Switch checked={formData.isActive} onChange={handleChange} name="isActive" color="success" />}
                                        label={<Typography variant="body2" fontWeight="bold">Shop Active</Typography>}
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
                                        {editMode ? 'Save Changes' : 'Create Outlet'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Fade>
                </Modal>
                <Modal
                    open={pricingOpen}
                    onClose={() => setPricingOpen(false)}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(10px)', background: 'rgba(8, 12, 20, 0.8)' } }}
                >
                    <Fade in={pricingOpen}>
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: 440, bgcolor: 'background.paper',
                            borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', p: 5,
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}>
                            <Typography variant="h5" fontWeight="900" mb={1}>
                                Xerox Pricing
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={4}>
                                Set base printing rates for {shops.find(s => (s._id || s.id) === currentShopId)?.name}
                            </Typography>

                            {pricingLoading ? (
                                <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
                            ) : (
                                <Grid container spacing={3}>
                                    <Grid item xs={6}>
                                        <TextField fullWidth label="B&W Single" type="number"
                                            value={pricingFormData.bwSingle}
                                            onChange={(e) => setPricingFormData({ ...pricingFormData, bwSingle: e.target.value })}
                                            variant="filled" />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField fullWidth label="B&W Double" type="number"
                                            value={pricingFormData.bwDouble}
                                            onChange={(e) => setPricingFormData({ ...pricingFormData, bwDouble: e.target.value })}
                                            variant="filled" />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField fullWidth label="Color Single" type="number"
                                            value={pricingFormData.colorSingle}
                                            onChange={(e) => setPricingFormData({ ...pricingFormData, colorSingle: e.target.value })}
                                            variant="filled" />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField fullWidth label="Color Double" type="number"
                                            value={pricingFormData.colorDouble}
                                            onChange={(e) => setPricingFormData({ ...pricingFormData, colorDouble: e.target.value })}
                                            variant="filled" />
                                    </Grid>
                                    <Grid item xs={12} sx={{ mt: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handlePricingSave}
                                            sx={{ borderRadius: 2, fontWeight: '900', py: 1.5 }}
                                        >
                                            Save Pricing
                                        </Button>
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    </Fade>
                </Modal>
            </Box>
        </Fade>
    );
}

