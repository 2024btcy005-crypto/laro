import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, Grid, IconButton, Chip, Modal, TextField,
    CircularProgress, useTheme, Fade, Backdrop, Card, CardMedia, CardContent,
    CardActions, Tooltip, Stack, InputAdornment, FormControl, InputLabel,
    Select, MenuItem, Switch, FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Store';
import SchoolIcon from '@mui/icons-material/School';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { getAllProducts, addProduct, updateProduct, deleteProduct, getAllShops, uploadImage, getAllCategories, getAllUniversities } from '../api';

const INITIAL_FORM_STATE = {
    id: null,
    universityId: '',
    shopId: '',
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'General',
    imageUrl: '',
    isVeg: true,
    isAvailable: true,
    variantOf: null,
    variantName: '',
    sku: '',
    unit: 'pc'
};

export default function ProductManagement() {
    const theme = useTheme();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super_admin';

    const [open, setOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [prodRes, shopRes, catRes, uniRes] = await Promise.all([
                getAllProducts(),
                getAllShops(),
                getAllCategories(),
                getAllUniversities()
            ]);
            setProducts(prodRes.data);
            setShops(shopRes.data);
            setCategoriesList(catRes.data);
            setUniversities(uniRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = categoriesList.map(c => c.name);
        // Fallback for existing products with string categories not in the list
        const existingCats = new Set(products.map(p => p.category).filter(Boolean));
        const combined = new Set(['All', ...cats, ...Array.from(existingCats)]);
        return Array.from(combined);
    }, [categoriesList, products]);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.shop?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Group products by category
    const groupedProducts = useMemo(() => {
        const groups = {};
        filteredProducts.forEach(product => {
            const cat = product.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(product);
        });
        return groups;
    }, [filteredProducts]);

    const handleOpenModal = (product = null, category = null) => {
        if (product) {
            setFormData({
                id: product.id,
                universityId: product.universityId || '',
                shopId: product.shopId,
                name: product.name,
                description: product.description || '',
                price: product.price,
                originalPrice: product.originalPrice || '',
                category: product.category || 'General',
                imageUrl: product.imageUrl || '',
                isVeg: product.isVeg !== undefined ? product.isVeg : true,
                isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
                variantOf: product.variantOf || null,
                variantName: product.variantName || '',
                sku: product.sku || '',
                unit: product.unit || 'pc'
            });
            setImagePreview(product.imageUrl ? `http://localhost:5000${product.imageUrl}` : null);
        } else {
            setFormData({
                ...INITIAL_FORM_STATE,
                category: category || 'General',
                // Pre-fill shopId if there's only one shop or if we can derive it
                shopId: shops.length === 1 ? shops[0].id : ''
            });
            setImagePreview(null);
        }
        setSelectedFile(null);
        setOpen(true);
    };

    const handleAddVariant = (parent) => {
        setFormData({
            ...INITIAL_FORM_STATE,
            universityId: parent.universityId || '',
            shopId: parent.shopId,
            name: parent.name,
            category: parent.category || 'General',
            imageUrl: parent.imageUrl || '',
            isVeg: parent.isVeg !== undefined ? parent.isVeg : true,
            variantOf: parent.id,
            variantName: ''
        });
        setImagePreview(parent.imageUrl ? `http://localhost:5000${parent.imageUrl}` : null);
        setSelectedFile(null);
        setOpen(true);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.shopId) {
            alert('Please fill in Required fields: Name, Price, and Shop');
            return;
        }

        setActionLoading(true);
        try {
            let finalImageUrl = formData.imageUrl;

            // 1. Upload image first if a new file is selected
            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', selectedFile);
                const uploadRes = await uploadImage(uploadFormData);
                finalImageUrl = uploadRes.data.url;
            }

            // 2. Save product with the image URL and sanitized numeric fields
            const submissionData = {
                ...formData,
                imageUrl: finalImageUrl,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice === '' ? null : parseFloat(formData.originalPrice),
                variantOf: formData.variantOf === '' ? null : formData.variantOf,
                stockQuantity: 999, // Fixed high number now that stock concept is removed
                lowStockThreshold: 0
            };

            if (formData.id) {
                await updateProduct(formData.id, submissionData);
            } else {
                await addProduct(submissionData);
            }
            setOpen(false);
            fetchInitialData();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await deleteProduct(id);
            fetchInitialData();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        }
    };

    return (
        <Fade in={true} timeout={800}>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
                    <Box>
                        <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                            Inventory
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your digital catalog cross <span style={{ color: theme.palette.primary.main, fontWeight: 800 }}>{products.length}</span> items.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            fontSize: '0.9rem',
                            boxShadow: '0 10px 20px rgba(236, 72, 153, 0.2)',
                        }}
                    >
                        Add New Product
                    </Button>
                </Box>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
                    <TextField
                        placeholder="Search products or shops..."
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
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ color: 'text.secondary' }}>Category</InputLabel>
                        <Select
                            value={selectedCategory}
                            label="Category"
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)' }}
                        >
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
                        <CircularProgress thickness={5} size={60} sx={{ color: theme.palette.primary.main }} />
                    </Box>
                ) : (
                    <Box>
                        {filteredProducts.length === 0 ? (
                            <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <FastfoodIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">No items match your filters.</Typography>
                            </Paper>
                        ) : (
                            Object.keys(groupedProducts).sort().map((category) => (
                                <Box key={category} sx={{ mb: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="h5" fontWeight="900" color="secondary.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                {category}
                                            </Typography>
                                            <Chip
                                                label={`${groupedProducts[category].length} items`}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontWeight: 700, fontSize: '0.7rem' }}
                                            />
                                        </Box>
                                        <Button
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => handleOpenModal(null, category)}
                                            sx={{
                                                color: 'primary.main',
                                                fontWeight: 800,
                                                '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.05)' }
                                            }}
                                        >
                                            Add to {category}
                                        </Button>
                                    </Box>
                                    <Grid container spacing={3}>
                                        {groupedProducts[category].map((product) => (
                                            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                                                <Card sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    borderRadius: 4,
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-5px)',
                                                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                                                        borderColor: 'rgba(236, 72, 153, 0.2)'
                                                    },
                                                    '&:hover .MuiCardMedia-root': { transform: 'scale(1.08)' }
                                                }}>
                                                    <Box sx={{ position: 'relative', overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.02)', pt: 2 }}>
                                                        <CardMedia
                                                            component="img"
                                                            height="160"
                                                            image={product.imageUrl ? `http://localhost:5000${product.imageUrl}` : 'https://via.placeholder.com/200?text=Product'}
                                                            alt={product.name}
                                                            sx={{
                                                                transition: 'transform 0.4s ease-in-out',
                                                                objectFit: 'contain'
                                                            }}
                                                        />
                                                        <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
                                                            <Chip
                                                                label={product.isAvailable ? "AVAILABLE" : "DISABLED"}
                                                                sx={{
                                                                    fontWeight: 900,
                                                                    fontSize: '0.66rem',
                                                                    borderRadius: 1,
                                                                    bgcolor: product.isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                    color: product.isAvailable ? '#10b981' : '#ef4444',
                                                                    border: `1px solid ${product.isAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                            <Typography variant="subtitle1" fontWeight="800" sx={{ lineHeight: 1.2 }}>
                                                                {product.name}
                                                                {product.variantName && (
                                                                    <Typography component="span" variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 600 }}>
                                                                        ({product.variantName})
                                                                    </Typography>
                                                                )}
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight="900" color="primary.main">
                                                                ₹{product.price}
                                                            </Typography>
                                                        </Stack>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <StoreIcon sx={{ fontSize: 14, opacity: 0.5 }} />
                                                            <Typography variant="caption" fontWeight="700" color="text.secondary">
                                                                {product.shop?.name || 'Main Store'}
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <SchoolIcon sx={{ fontSize: 14, opacity: 0.5 }} />
                                                            <Typography variant="caption" fontWeight="700" color="secondary.main">
                                                                {product.university?.name || 'Global / Common'}
                                                            </Typography>
                                                        </Box>

                                                        {product.description && (
                                                            <Typography variant="body2" color="text.secondary" sx={{
                                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden', mb: 1, fontSize: '0.75rem'
                                                            }}>
                                                                {product.description}
                                                            </Typography>
                                                        )}

                                                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            {product.sku && (
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.6rem', fontWeight: 800 }}>
                                                                        SKU
                                                                    </Typography>
                                                                    <Typography variant="caption" fontWeight="700">
                                                                        {product.sku}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </CardContent>
                                                    <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
                                                        {!product.variantOf && (
                                                            <Tooltip title="Add Variant">
                                                                <IconButton size="small" sx={{ color: 'secondary.main', bgcolor: 'rgba(244, 114, 182, 0.05)' }} onClick={() => handleAddVariant(product)}>
                                                                    <AddIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" sx={{ color: 'primary.main', bgcolor: 'rgba(236, 72, 153, 0.05)' }} onClick={() => handleOpenModal(product)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton size="small" sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.05)' }} onClick={() => handleDelete(product.id)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </CardActions>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            ))
                        )}
                    </Box>
                )}

                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(8px)', background: 'rgba(8, 12, 20, 0.8)' } }}
                >
                    <Fade in={open}>
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: 600, bgcolor: 'background.paper',
                            borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            p: 5, border: '1px solid rgba(255, 255, 255, 0.05)',
                            maxHeight: '90vh', overflowY: 'auto'
                        }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, mb: 4 }}>
                                {formData.id ? 'Edit Product' : 'Add New Product'}
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth variant="filled" required>
                                        <InputLabel>Target Shop</InputLabel>
                                        <Select
                                            value={formData.shopId}
                                            onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                                            sx={{ borderRadius: '8px 8px 0 0' }}
                                        >
                                            {shops.map(shop => (
                                                <MenuItem key={shop.id} value={shop.id}>{shop.name} {shop.university && `(${shop.university.name})`}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {isSuperAdmin && (
                                    <Grid item xs={12}>
                                        <FormControl fullWidth variant="filled" required>
                                            <InputLabel>Target University/Campus</InputLabel>
                                            <Select
                                                value={formData.universityId}
                                                onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                                                sx={{ borderRadius: '8px 8px 0 0' }}
                                            >
                                                <MenuItem value="">Global / Select Later</MenuItem>
                                                {universities.map(uni => (
                                                    <MenuItem key={uni.id} value={uni.id}>{uni.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth label="Product Name" variant="filled" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }}
                                        disabled={!!formData.variantOf}
                                    />
                                </Grid>
                                {formData.variantOf && (
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth label="Variant Name (e.g. 100g, Large, Family Pack)"
                                            variant="filled" required
                                            value={formData.variantName}
                                            onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0', bgcolor: 'rgba(236, 72, 153, 0.05)' } }}
                                            autoFocus
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth label="Description" variant="filled" multiline rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth label="Sale Price (₹)" type="number" variant="filled" required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth label="Original MRP (₹)" type="number" variant="filled"
                                        value={formData.originalPrice}
                                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                        sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth label="Category" variant="filled"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }}
                                        placeholder="e.g. Burgers, Beverages"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth variant="filled">
                                        <InputLabel>Unit</InputLabel>
                                        <Select
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        >
                                            <MenuItem value="pc">Piece (pc)</MenuItem>
                                            <MenuItem value="kg">Kilogram (kg)</MenuItem>
                                            <MenuItem value="gm">Gram (gm)</MenuItem>
                                            <MenuItem value="ml">Milliliter (ml)</MenuItem>
                                            <MenuItem value="ltr">Liter (ltr)</MenuItem>
                                            <MenuItem value="pack">Pack</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth label="Stock Keeping Unit (SKU)" variant="filled"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }}
                                        placeholder="e.g. MILK-500-AMUL"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                                        {imagePreview && (
                                            <Box sx={{ position: 'relative', width: '100%', height: 180, borderRadius: 3, overflow: 'hidden', mb: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <CardMedia
                                                    component="img"
                                                    image={imagePreview}
                                                    sx={{ height: '100%', objectFit: 'contain' }}
                                                />
                                            </Box>
                                        )}
                                        <input
                                            type="file"
                                            hidden
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept="image/*"
                                        />
                                        <Button
                                            variant="outlined"
                                            startIcon={<CloudUploadIcon />}
                                            onClick={() => fileInputRef.current.click()}
                                            fullWidth
                                            sx={{ borderRadius: 2, py: 1.5, borderStyle: 'dashed' }}
                                        >
                                            {selectedFile ? 'Change Selected Image' : 'Upload Product Image'}
                                        </Button>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth label="Or Image URL" variant="filled"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        sx={{ '& .MuiFilledInput-root': { borderRadius: '8px 8px 0 0' } }}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={<Switch checked={formData.isVeg} onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })} />}
                                        label="Pure Veg?"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel
                                        control={<Switch checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} />}
                                        label="Is Available?"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={handleSubmit}
                                        disabled={actionLoading}
                                        sx={{
                                            borderRadius: 2,
                                            py: 2,
                                            fontWeight: 900,
                                            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                            mt: 2
                                        }}
                                    >
                                        {actionLoading ? <CircularProgress size={24} color="inherit" /> : (formData.id ? 'Update Product' : 'Create Product')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Fade>
                </Modal>
            </Box>
        </Fade >
    );
}


