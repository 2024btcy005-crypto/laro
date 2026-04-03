import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, useTheme,
    CircularProgress, Alert, Snackbar, Tooltip, Grid, Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    School as SchoolIcon,
    LocationOn as LocationIcon
} from '@mui/icons-material';
import { getAllUniversities, createUniversity, updateUniversity, deleteUniversity } from '../api';

const UniversityManagement = () => {
    const theme = useTheme();
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', address: '', radius: 3.0,
        adminName: '', adminEmail: '', adminPassword: ''
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchUniversities = async () => {
        try {
            setLoading(true);
            const res = await getAllUniversities();
            setUniversities(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch universities');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        await fetchUniversities();
    };

    const handleOpen = (uni = null) => {
        if (uni) {
            setEditId(uni.id);
            setFormData({
                name: uni.name,
                address: uni.address || '',
                radius: uni.radius || 3.0,
                adminName: '', adminEmail: '', adminPassword: ''
            });
        } else {
            setEditId(null);
            setFormData({
                name: '', address: '', radius: 3.0,
                adminName: '', adminEmail: '', adminPassword: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        try {
            if (editId) {
                await updateUniversity(editId, formData);
                setSnackbar({ open: true, message: 'University updated successfully', severity: 'success' });
            } else {
                await createUniversity(formData);
                setSnackbar({ open: true, message: 'University added successfully', severity: 'success' });
            }
            handleClose();
            fetchUniversities();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Action failed', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this university? This might affect existing shops and delivery partners.')) return;
        try {
            await deleteUniversity(id);
            fetchUniversities();
            setSnackbar({ open: true, message: 'University deleted', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete university', severity: 'error' });
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SchoolIcon sx={{ fontSize: 40 }} /> CAMPUS MANAGEMENT
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage Universities and Colleges for targeted campus fulfillment.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchUniversities} sx={{ borderRadius: 2, fontWeight: 700 }}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>New Campus</Button>
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
                                <TableCell sx={{ fontWeight: 800 }}>UNIVERSITY NAME</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>LOCATION</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>RADIUS</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>ADMIN EMAIL</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {universities.map((uni) => (
                                <TableRow key={uni.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ opacity: 0.5, fontSize: '0.75rem' }}>{uni.id.substring(0, 8)}...</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>{uni.name}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{uni.address || 'No address set'}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{uni.radius} km</TableCell>
                                    <TableCell sx={{ color: 'secondary.main', fontWeight: 600 }}>
                                        {uni.users && uni.users.length > 0 ? uni.users[0].email : 'Not set'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleOpen(uni)} color="primary" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.05)' }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => handleDelete(uni.id)} color="error" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {universities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <Typography color="text.secondary">No campuses found. Add your first university!</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: '#1a1a2e', width: '100%', maxWidth: 600 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', pb: 0 }}>{editId ? 'UPDATE CAMPUS' : 'ADD NEW CAMPUS'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="University Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Cochin University, NIT Calicut"
                        />
                        <TextField
                            fullWidth
                            label="Address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Radius (km)"
                            type="number"
                            value={formData.radius}
                            onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                            helperText="Coverage area for delivery on campus"
                        />

                        {!editId && (
                            <>
                                <Divider sx={{ my: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.1em' }}>
                                        ADMINISTRATOR ACCOUNT
                                    </Typography>
                                </Divider>

                                <TextField
                                    fullWidth
                                    label="Admin Name"
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    placeholder="e.g. Campus Manager"
                                />
                                <TextField
                                    fullWidth
                                    label="Admin Email"
                                    type="email"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                />
                                <TextField
                                    fullWidth
                                    label="Admin Password"
                                    type="password"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
                                    This account will be created and granted Campus Administrator access for this university.
                                </Typography>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} sx={{ fontWeight: 800, px: 4 }}>{editId ? 'Update' : 'Create'}</Button>
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

export default UniversityManagement;
