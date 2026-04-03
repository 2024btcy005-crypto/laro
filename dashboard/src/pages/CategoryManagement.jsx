import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, useTheme,
    CircularProgress, Alert, Snackbar, Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Category as CategoryIcon
} from '@mui/icons-material';
import { getAllCategories, createCategory, deleteCategory } from '../api';

const CategoryManagement = () => {
    const theme = useTheme();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await getAllCategories();
            setCategories(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch categories');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpen = () => {
        setFormData({ name: '', description: '' });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        try {
            await createCategory(formData);
            handleClose();
            fetchCategories();
            setSnackbar({ open: true, message: 'Category added successfully', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to add category', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category? Products using this category might be affected.')) return;
        try {
            await deleteCategory(id);
            fetchCategories();
            setSnackbar({ open: true, message: 'Category deleted', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete category', severity: 'error' });
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CategoryIcon sx={{ fontSize: 40 }} /> CATEGORY MANAGEMENT
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Define product categories to organize your store inventory.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchCategories} sx={{ borderRadius: 2, fontWeight: 700 }}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>New Category</Button>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={10}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>NAME</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>DESCRIPTION</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.map((cat) => (
                                <TableRow key={cat.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ opacity: 0.5, fontSize: '0.75rem' }}>{cat.id.substring(0, 8)}...</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>{cat.name}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{cat.description || '-'}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Delete">
                                            <IconButton onClick={() => handleDelete(cat.id)} color="error" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)' }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {categories.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                        <Typography color="text.secondary">No categories found. Click 'New Category' to start.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: '#1a1a2e', width: '100%', maxWidth: 500 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', pb: 0 }}>ADD NEW CATEGORY</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Category Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Burgers, Pizza, Drinks"
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} sx={{ fontWeight: 800, px: 4 }}>Create</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default CategoryManagement;
