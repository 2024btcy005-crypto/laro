import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, useTheme,
    CircularProgress, Alert, Snackbar, Tooltip, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    EmojiEvents as QuestIcon
} from '@mui/icons-material';
import { getAllQuests, createQuest, deleteQuest, getAllUniversities, getAllProducts } from '../api';

const QuestManagement = () => {
    const theme = useTheme();
    const [quests, setQuests] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        universityId: '',
        productId: '',
        targetCount: 300,
        rewardAmount: 50
    });
    
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [questsRes, uniRes, prodRes] = await Promise.all([
                getAllQuests(),
                getAllUniversities(),
                getAllProducts()
            ]);
            setQuests(questsRes.data);
            setUniversities(uniRes.data);
            setProducts(prodRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to load quest administration data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = () => {
        setFormData({
            title: '',
            description: '',
            universityId: '',
            productId: '',
            targetCount: 300,
            rewardAmount: 50
        });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        const { title, universityId, productId, targetCount, rewardAmount } = formData;
        if (!title.trim() || !universityId || !productId || !targetCount || !rewardAmount) {
            setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'warning' });
            return;
        }
        try {
            await createQuest(formData);
            handleClose();
            fetchData();
            setSnackbar({ open: true, message: 'Quest published successfully', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to publish quest', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quest? Progress will be lost.')) return;
        try {
            await deleteQuest(id);
            fetchData();
            setSnackbar({ open: true, message: 'Quest deleted successfully', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete quest', severity: 'error' });
        }
    };

    // Filter products based on selected university
    const filteredProducts = products.filter(p => p.universityId === formData.universityId);

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <QuestIcon sx={{ fontSize: 40 }} /> QUEST MANAGEMENT
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Create and manage campus-wide purchase milestones that reward students with Laro Coins.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ borderRadius: 2, fontWeight: 700 }}>Refresh</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>New Quest</Button>
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
                                <TableCell sx={{ fontWeight: 800 }}>TITLE</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>UNIVERSITY</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>TARGET PRODUCT</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="center">PROGRESS</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="center">REWARD</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="center">STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {quests.map((quest) => (
                                <TableRow key={quest.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{quest.title}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{quest.university?.name || '-'}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{quest.product?.name || '-'}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                                        {quest.currentCount} / {quest.targetCount}
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: 'secondary.main', fontWeight: 800 }}>
                                        +{Math.round(quest.rewardAmount)} Ł
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{
                                            display: 'inline-block',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 2,
                                            fontSize: '0.75rem',
                                            fontWeight: 900,
                                            bgcolor: quest.status === 'active' ? 'rgba(0, 193, 93, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: quest.status === 'active' ? '#00c15d' : '#ef4444'
                                        }}>
                                            {quest.status.toUpperCase()}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Delete">
                                            <IconButton onClick={() => handleDelete(quest.id)} color="error" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)' }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {quests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <Typography color="text.secondary">No quests found. Click 'New Quest' to publish one.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 4, bgcolor: '#1a1a2e', width: '100%', maxWidth: 550 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: 'primary.main', pb: 0 }}>PUBLISH NEW CAMPUS QUEST</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Quest Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Morning Coffee Run, Printing Marathon"
                            required
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Quest Description / Guidelines"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Explain the mission guidelines to campus students..."
                        />
                        
                        <FormControl fullWidth required>
                            <InputLabel id="select-university-label">Select University</InputLabel>
                            <Select
                                labelId="select-university-label"
                                label="Select University"
                                value={formData.universityId}
                                onChange={(e) => setFormData({ ...formData, universityId: e.target.value, productId: '' })}
                            >
                                {universities.map((uni) => (
                                    <MenuItem key={uni.id} value={uni.id}>{uni.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required disabled={!formData.universityId}>
                            <InputLabel id="select-product-label">Select Target Product</InputLabel>
                            <Select
                                labelId="select-product-label"
                                label="Select Target Product"
                                value={formData.productId}
                                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                            >
                                {filteredProducts.map((prod) => (
                                    <MenuItem key={prod.id} value={prod.id}>{prod.name} ({prod.price} Ł)</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Target Order Milestone"
                                value={formData.targetCount}
                                onChange={(e) => setFormData({ ...formData, targetCount: Number(e.target.value) })}
                                required
                            />
                            <TextField
                                fullWidth
                                type="number"
                                label="Laro Coins Reward"
                                value={formData.rewardAmount}
                                onChange={(e) => setFormData({ ...formData, rewardAmount: Number(e.target.value) })}
                                required
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ fontWeight: 800, borderRadius: 2, px: 4 }}>Publish</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2, fontWeight: 700 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default QuestManagement;
