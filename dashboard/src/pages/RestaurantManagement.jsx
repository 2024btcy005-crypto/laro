import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    IconButton,
    Chip,
    Modal,
    TextField,
    CircularProgress,
    Alert,
    useTheme,
    Fade,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Tooltip,
    Stack,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Switch,
    FormControlLabel,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import KitchenIcon from '@mui/icons-material/Kitchen';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import api, { uploadImage, getAllUniversities, resolveImageUrl } from '../api';

export default function RestaurantManagement() {
    const theme = useTheme();
    const [tabIndex, setTabIndex] = useState(0);
    const [restaurants, setRestaurants] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Add / Edit Restaurant Modal State
    const [openModal, setOpenModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Food & Canteen',
        imageUrl: '',
        openingTime: '08:00 AM',
        closingTime: '10:00 PM',
        estimatedDeliveryTime: '20-30 min',
        minOrderValue: 0,
        deliveryFee: 15,
        costForTwo: '₹200 for two',
        isOpen: true,
        universityId: ''
    });

    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super_admin';

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [shopsRes, productsRes, ordersRes, unisRes] = await Promise.all([
                api.get('/shops?all=true'),
                api.get('/admin/products'),
                api.get('/admin/orders'),
                getAllUniversities()
            ]);

            // Filter shops exclusively for food outlets / canteens / cafes / bakeries (excluding general retail stores)
            const foodShops = (shopsRes.data || []).filter(s => {
                const cat = (s.category || '').toLowerCase();
                const isRetailStore = cat.includes('stationery') || cat.includes('print') || cat.includes('xerox') || cat.includes('grocery') || cat.includes('book') || cat.includes('electronics');
                return !isRetailStore;
            });

            setRestaurants(foodShops);

            setProducts(productsRes.data || []);
            setOrders(ordersRes.data || []);
            setUniversities(unisRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch restaurant data:', err);
            setError('Failed to load restaurant data.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditMode(false);
        setCurrentId(null);
        setFormData({
            name: '',
            category: 'Food & Canteen',
            imageUrl: '',
            openingTime: '08:00 AM',
            closingTime: '10:00 PM',
            estimatedDeliveryTime: '20-30 min',
            minOrderValue: 0,
            deliveryFee: 15,
            costForTwo: '₹200 for two',
            isOpen: true,
            universityId: universities[0]?.id || ''
        });
        setOpenModal(true);
    };

    const handleOpenEdit = (restaurant) => {
        setEditMode(true);
        setCurrentId(restaurant.id || restaurant._id);
        setFormData({
            name: restaurant.name || '',
            category: restaurant.category || 'Food & Canteen',
            imageUrl: restaurant.imageUrl || '',
            openingTime: restaurant.openingTime || '08:00 AM',
            closingTime: restaurant.closingTime || '10:00 PM',
            estimatedDeliveryTime: restaurant.estimatedDeliveryTime || '20-30 min',
            minOrderValue: restaurant.minOrderValue || 0,
            deliveryFee: restaurant.deliveryFee || 15,
            costForTwo: restaurant.costForTwo || '₹200 for two',
            isOpen: restaurant.isOpen !== false,
            universityId: restaurant.universityId || ''
        });
        setOpenModal(true);
    };

    const handleToggleOpenStatus = async (restaurant) => {
        const id = restaurant.id || restaurant._id;
        const newStatus = !restaurant.isOpen;
        try {
            await api.put(`/shops/${id}`, {
                ...restaurant,
                isOpen: newStatus
            });
            setRestaurants(restaurants.map(r => (r.id === id || r._id === id) ? { ...r, isOpen: newStatus } : r));
        } catch (err) {
            console.error('Failed to toggle open status:', err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);
            const res = await uploadImage(uploadFormData);
            if (res.data && res.data.url) {
                setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
            }
        } catch (err) {
            console.error('Image upload error:', err);
            setError(err.response?.data?.message || 'Failed to upload banner image. Please check your connection.');
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleSaveRestaurant = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                shopType: 'RESTAURANT',
                isWarehouse: false
            };
            if (editMode && currentId) {
                await api.put(`/shops/${currentId}`, payload);
            } else {
                await api.post('/shops', payload);
            }
            setOpenModal(false);
            fetchInitialData();
        } catch (err) {
            console.error('Failed to save restaurant:', err);
            setError('Failed to save restaurant details.');
        }
    };

    const handleDeleteRestaurant = async (id) => {
        if (window.confirm('Are you sure you want to delete this canteen/restaurant?')) {
            try {
                await api.delete(`/shops/${id}`);
                fetchInitialData();
            } catch (err) {
                setError('Failed to delete restaurant.');
            }
        }
    };

    const filteredRestaurants = restaurants.filter(r => {
        const matchesQuery = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || r.category.toLowerCase().includes(selectedCategory.toLowerCase());
        return matchesQuery && matchesCategory;
    });

    const openCount = restaurants.filter(r => r.isOpen).length;
    const foodProductsCount = products.length;

    return (
        <Fade in={true} timeout={500}>
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
                            Restaurant & Canteen Hub
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '14px' }}>
                            Manage campus dining outlets, live kitchen status toggles, food menus, and kitchen orders.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAdd}
                        sx={{
                            bgcolor: '#006d33',
                            '&:hover': { bgcolor: '#005225' },
                            py: 1.5,
                            px: 3.5,
                            fontWeight: 700,
                            borderRadius: '12px'
                        }}
                    >
                        Add New Canteen / Restaurant
                    </Button>
                </Paper>

                {/* KPI Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb', p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Avatar sx={{ bgcolor: '#e6f7ed', color: '#006d33', width: 40, height: 40 }}>
                                    <RestaurantIcon />
                                </Avatar>
                                <Chip label="FOOD OUTLETS" size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontWeight: 800, fontSize: '10px' }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700 }}>
                                TOTAL CANTEENS & CAFES
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mt: 0.5 }}>
                                {restaurants.length}
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb', p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Avatar sx={{ bgcolor: '#e6f7ed', color: '#006d33', width: 40, height: 40 }}>
                                    <KitchenIcon />
                                </Avatar>
                                <Chip label="KITCHENS ACTIVE" size="small" sx={{ bgcolor: '#e6f7ed', color: '#006d33', fontWeight: 800, fontSize: '10px' }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700 }}>
                                CURRENTLY OPEN
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#006d33', mt: 0.5 }}>
                                {openCount} / {restaurants.length}
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb', p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Avatar sx={{ bgcolor: '#fef3c7', color: '#b45309', width: 40, height: 40 }}>
                                    <FastfoodIcon />
                                </Avatar>
                                <Chip label="FOOD DISHES" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: '10px' }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700 }}>
                                ACTIVE MENU ITEMS
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mt: 0.5 }}>
                                {foodProductsCount}
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb', p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0284c7', width: 40, height: 40 }}>
                                    <AccessTimeIcon />
                                </Avatar>
                                <Chip label="AVG PREP TIME" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800, fontSize: '10px' }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700 }}>
                                ESTIMATED DELIVERIES
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mt: 0.5 }}>
                                20 min
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs & Search Bar */}
                <Paper elevation={0} sx={{ p: 2, mb: 4, bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #e5e7eb' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search restaurants by name or cuisine..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#9ca3af' }} />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                <Chip
                                    label="All Outlets"
                                    clickable
                                    onClick={() => setSelectedCategory('all')}
                                    sx={{
                                        bgcolor: selectedCategory === 'all' ? '#006d33' : '#f3f4f6',
                                        color: selectedCategory === 'all' ? '#ffffff' : '#374151',
                                        fontWeight: 700
                                    }}
                                />
                                <Chip
                                    label="Food & Canteens"
                                    clickable
                                    onClick={() => setSelectedCategory('canteen')}
                                    sx={{
                                        bgcolor: selectedCategory === 'canteen' ? '#006d33' : '#f3f4f6',
                                        color: selectedCategory === 'canteen' ? '#ffffff' : '#374151',
                                        fontWeight: 700
                                    }}
                                />
                                <Chip
                                    label="Bakery & Cafe"
                                    clickable
                                    onClick={() => setSelectedCategory('cafe')}
                                    sx={{
                                        bgcolor: selectedCategory === 'cafe' ? '#006d33' : '#f3f4f6',
                                        color: selectedCategory === 'cafe' ? '#ffffff' : '#374151',
                                        fontWeight: 700
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                        <CircularProgress sx={{ color: '#006d33' }} />
                    </Box>
                ) : (
                    /* Restaurant Cards Grid */
                    <Grid container spacing={3}>
                        {filteredRestaurants.map((restaurant) => {
                            const rId = restaurant.id || restaurant._id;
                            const resProducts = products.filter(p => p.shopId === rId);

                            return (
                                <Grid item xs={12} sm={6} md={4} key={rId}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            bgcolor: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: '#43d174',
                                                boxShadow: '0 8px 24px rgba(0, 109, 51, 0.08)'
                                            }
                                        }}
                                    >
                                        {/* Image Banner */}
                                        <Box sx={{ position: 'relative', height: 180, bgcolor: '#f3f4f6' }}>
                                            <CardMedia
                                                component="img"
                                                height="180"
                                                image={resolveImageUrl(restaurant.imageUrl)}
                                                alt={restaurant.name}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop';
                                                }}
                                            />
                                            <Chip
                                                label={restaurant.isOpen ? 'KITCHEN OPEN' : 'CLOSED'}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    bgcolor: restaurant.isOpen ? '#006d33' : '#ef4444',
                                                    color: '#ffffff',
                                                    fontWeight: 800,
                                                    fontSize: '10px',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </Box>

                                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                                                    {restaurant.name}
                                                </Typography>
                                                <Switch
                                                    checked={restaurant.isOpen}
                                                    onChange={() => handleToggleOpenStatus(restaurant)}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>

                                            <Typography variant="caption" sx={{ color: '#006d33', fontWeight: 700, display: 'block', mb: 2 }}>
                                                {restaurant.category || 'Food Canteen'}
                                            </Typography>

                                            <Stack spacing={1} sx={{ color: '#4b5563', fontSize: '13px', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AccessTimeIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                                                    <span>Hours: {restaurant.openingTime || '08:00 AM'} - {restaurant.closingTime || '10:00 PM'}</span>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <FastfoodIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                                                    <span>Menu: {resProducts.length} dishes listed</span>
                                                </Box>
                                            </Stack>

                                            {restaurant.university && (
                                                <Chip
                                                    label={`🏛️ ${restaurant.university.name}`}
                                                    size="small"
                                                    sx={{ bgcolor: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: '11px' }}
                                                />
                                            )}
                                        </CardContent>

                                        <CardActions sx={{ px: 3, pb: 2.5, pt: 0, justifyContent: 'space-between', borderTop: '1px solid #f3f4f6' }}>
                                            <Button
                                                size="small"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleOpenEdit(restaurant)}
                                                sx={{ color: '#006d33', fontWeight: 700 }}
                                            >
                                                Edit Canteen
                                            </Button>

                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteRestaurant(rId)}
                                                    sx={{ color: '#ef4444', bgcolor: '#fee2e2' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* Add / Edit Restaurant Modal */}
                <Modal open={openModal} onClose={() => setOpenModal(false)}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', sm: 600 },
                            bgcolor: '#ffffff',
                            borderRadius: 4,
                            border: '1px solid #e5e7eb',
                            boxShadow: 24,
                            p: 4,
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 3 }}>
                            {editMode ? 'Edit Restaurant / Canteen' : 'Add New Campus Canteen'}
                        </Typography>

                        <form onSubmit={handleSaveRestaurant}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Restaurant / Outlet Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Cuisine / Category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Assigned Campus</InputLabel>
                                        <Select
                                            value={formData.universityId}
                                            onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                                            label="Assigned Campus"
                                        >
                                            {universities.map(u => (
                                                <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Banner Image URL"
                                        placeholder="https://images.unsplash.com/... or upload file below"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        sx={{ mb: 1 }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            disabled={uploading}
                                            startIcon={uploading ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                                            sx={{ borderColor: '#006d33', color: '#006d33', fontWeight: 700 }}
                                        >
                                            {uploading ? 'Uploading to Cloud...' : 'Upload Image File'}
                                            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                        </Button>
                                        {formData.imageUrl && (
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                            >
                                                Remove Image
                                            </Button>
                                        )}
                                    </Box>

                                    {formData.imageUrl && (
                                        <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #e5e7eb', height: 160, position: 'relative', bgcolor: '#f9fafb' }}>
                                            <Box
                                                component="img"
                                                src={resolveImageUrl(formData.imageUrl)}
                                                alt="Restaurant Banner Preview"
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80';
                                                }}
                                            />
                                            <Chip
                                                label="Preview"
                                                size="small"
                                                sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontWeight: 700 }}
                                            />
                                        </Box>
                                    )}
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Opening Time"
                                        value={formData.openingTime}
                                        onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Closing Time"
                                        value={formData.closingTime}
                                        onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Delivery Fee (INR)"
                                        value={formData.deliveryFee}
                                        onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Min Order Value (INR)"
                                        value={formData.minOrderValue}
                                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isOpen}
                                                onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                                                color="primary"
                                            />
                                        }
                                        label={<Typography sx={{ fontWeight: 600, color: '#111827' }}>Kitchen Currently Open</Typography>}
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                                <Button onClick={() => setOpenModal(false)} sx={{ color: '#6b7280' }}>Cancel</Button>
                                <Button type="submit" variant="contained" sx={{ bgcolor: '#006d33', '&:hover': { bgcolor: '#005225' } }}>
                                    {editMode ? 'Save Changes' : 'Create Outlet'}
                                </Button>
                            </Box>
                        </form>
                    </Box>
                </Modal>
            </Box>
        </Fade>
    );
}
