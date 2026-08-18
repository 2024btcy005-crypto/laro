import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    CircularProgress,
    Avatar,
    useTheme,
    Fade,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import { getAllUsers, toggleUserStatus, updateUserRole, getAllUniversities, getAllShops, assignShopToDeliveryPartner } from '../api';

const roleColors = {
    'super_admin': { label: 'SUPER ADMIN', color: '#dc2626', bg: '#fee2e2' },
    'campus_admin': { label: 'CAMPUS ADMIN', color: '#0284c7', bg: '#e0f2fe' },
    'customer': { label: 'CUSTOMER', color: '#006d33', bg: '#e6f7ed' },
    'delivery': { label: 'DELIVERY', color: '#d97706', bg: '#fef3c7' },
    'shop_admin': { label: 'SHOP VENDOR', color: '#7c3aed', bg: '#f3e8ff' }
};

export default function UserManagement() {
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Dialog State
    const [editOpen, setEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [newUni, setNewUni] = useState('');
    const [newShop, setNewShop] = useState('');
    const [updating, setUpdating] = useState(false);

    // Filter state
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, unisRes, shopsRes] = await Promise.all([
                getAllUsers(),
                getAllUniversities(),
                getAllShops()
            ]);
            setUsers(usersRes.data || []);
            setUniversities(unisRes.data || []);
            setShops(shopsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const action = currentStatus === false ? 'activate' : 'deactivate';
        if (window.confirm(`Are you sure you want to ${action} this user?`)) {
            try {
                const response = await toggleUserStatus(userId);
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, isActive: response.data.user.isActive } : user
                ));
            } catch (error) {
                console.error('Error toggling user status:', error);
            }
        }
    };

    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setNewUni(user.universityId || '');
        setNewShop(user.assignedShopId || '');
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        setUpdating(true);
        try {
            await updateUserRole(selectedUser.id, {
                role: newRole,
                universityId: newRole === 'campus_admin' ? newUni : null
            });

            if (newRole === 'delivery') {
                await assignShopToDeliveryPartner(selectedUser.id, {
                    assignedShopId: newShop || null
                });
            }

            await fetchData();
            setEditOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating role or shop assignment');
        } finally {
            setUpdating(false);
        }
    };

    const filteredUsers = users.filter(user => {
        if (tabValue === 0) return true;
        if (tabValue === 1) return ['super_admin', 'campus_admin', 'shop_admin'].includes(user.role);
        if (tabValue === 2) return user.role === 'customer';
        if (tabValue === 3) return user.role === 'delivery';
        return true;
    });

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
                            User Management
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '14px' }}>
                            Manage campus student accounts, delivery fleet roles, and administrator access control.
                        </Typography>
                    </Box>

                    <Chip
                        label={`${users.length} REGISTERED USERS`}
                        size="small"
                        sx={{ bgcolor: '#e6f7ed', color: '#006d33', fontWeight: 800, fontSize: '11px', px: 1 }}
                    />
                </Paper>

                {/* Filter Tabs Bar */}
                <Paper
                    elevation={0}
                    sx={{
                        px: 3,
                        py: 1,
                        mb: 3,
                        bgcolor: '#ffffff',
                        borderRadius: 3,
                        border: '1px solid #e5e7eb'
                    }}
                >
                    <Tabs
                        value={tabValue}
                        onChange={(e, v) => setTabValue(v)}
                        indicatorColor="primary"
                        textColor="primary"
                        sx={{
                            '& .MuiTab-root': {
                                color: '#6b7280',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                '&.Mui-selected': { color: '#006d33' }
                            }
                        }}
                    >
                        <Tab label={`ALL (${users.length})`} />
                        <Tab label={`ADMINS (${users.filter(u => ['super_admin', 'campus_admin', 'shop_admin'].includes(u.role)).length})`} />
                        <Tab label={`CUSTOMERS (${users.filter(u => u.role === 'customer').length})`} />
                        <Tab label={`DELIVERY (${users.filter(u => u.role === 'delivery').length})`} />
                    </Tabs>
                </Paper>

                {/* Users Table */}
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        bgcolor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden',
                    }}
                >
                    {loading ? (
                        <Box sx={{ p: 8, textAlign: 'center' }}>
                            <CircularProgress sx={{ color: '#006d33' }} />
                        </Box>
                    ) : (
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', py: 2 }}>USER</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', py: 2 }}>EMAIL / PHONE</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', py: 2 }}>ROLE</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', py: 2 }}>CAMPUS</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', py: 2 }}>ASSIGNED SHOP</TableCell>
                                    <TableCell sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', py: 2 }}>STATUS</TableCell>
                                    <TableCell align="right" sx={{ color: '#6b7280', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', py: 2 }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((user) => {
                                    const rCfg = roleColors[user.role] || { label: user.role?.toUpperCase(), color: '#4b5563', bg: '#f3f4f6' };
                                    return (
                                        <TableRow
                                            key={user.id}
                                            hover
                                            sx={{
                                                transition: 'all 0.2s',
                                                '& td': { borderBottom: '1px solid #f3f4f6' }
                                            }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar
                                                        sx={{
                                                            mr: 2,
                                                            bgcolor: '#006d33',
                                                            color: '#ffffff',
                                                            width: 40,
                                                            height: 40,
                                                            fontSize: '1rem',
                                                            fontWeight: 800
                                                        }}
                                                    >
                                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                                                            {user.name || 'Unknown User'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                                            ID: {user.id?.substring(0, 8)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>
                                                {user.email || user.phoneNumber || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={rCfg.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: rCfg.bg,
                                                        color: rCfg.color,
                                                        fontWeight: 800,
                                                        fontSize: '10px',
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#4b5563', fontSize: '13px' }}>
                                                {user.university?.name || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#4b5563', fontSize: '13px' }}>
                                                {user.role === 'delivery' ? (
                                                    user.assignedShop?.name ? (
                                                        <Chip
                                                            label={user.assignedShop.name}
                                                            size="small"
                                                            sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 800, fontSize: '10px' }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="ALL SHOPS (GLOBAL)"
                                                            size="small"
                                                            sx={{ bgcolor: '#f3f4f6', color: '#6b7280', fontWeight: 700, fontSize: '10px' }}
                                                        />
                                                    )
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: user.isActive !== false ? '#006d33' : '#ef4444',
                                                    }} />
                                                    <Typography sx={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        color: user.isActive !== false ? '#006d33' : '#ef4444'
                                                    }}>
                                                        {user.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenEdit(user)}
                                                        sx={{ color: '#006d33', bgcolor: '#e6f7ed', '&:hover': { bgcolor: '#38c567', color: '#fff' } }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            bgcolor: user.isActive !== false ? '#fee2e2' : '#e6f7ed',
                                                            color: user.isActive !== false ? '#ef4444' : '#006d33',
                                                            '&:hover': { bgcolor: user.isActive !== false ? '#ef4444' : '#006d33', color: '#fff' }
                                                        }}
                                                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                    >
                                                        {user.isActive !== false ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>

                {/* Edit Role Dialog */}
                <Dialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    PaperProps={{ sx: { borderRadius: 4, p: 2, bgcolor: '#ffffff', border: '1px solid #e5e7eb' } }}
                >
                    <DialogTitle sx={{ fontWeight: 800, color: '#111827' }}>
                        Edit User Permissions & Shop Assignment: {selectedUser?.name}
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
                            <InputLabel>User System Role</InputLabel>
                            <Select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                label="User System Role"
                            >
                                <MenuItem value="customer">Student Customer</MenuItem>
                                <MenuItem value="delivery">Delivery Partner (Rider)</MenuItem>
                                <MenuItem value="shop_admin">Shop / Canteen Manager</MenuItem>
                                <MenuItem value="campus_admin">Campus Administrator</MenuItem>
                                <MenuItem value="super_admin">Super Admin (Global)</MenuItem>
                            </Select>
                        </FormControl>

                        {newRole === 'delivery' && (
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Assigned Restaurant / Shop</InputLabel>
                                <Select
                                    value={newShop}
                                    onChange={(e) => setNewShop(e.target.value)}
                                    label="Assigned Restaurant / Shop"
                                >
                                    <MenuItem value="">All Shops & Restaurants (Global Rider)</MenuItem>
                                    {shops.map(s => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.name} ({s.shopType || s.category || 'Shop'})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {newRole === 'campus_admin' && (
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Assigned Campus / University</InputLabel>
                                <Select
                                    value={newUni}
                                    onChange={(e) => setNewUni(e.target.value)}
                                    label="Assigned Campus / University"
                                >
                                    {universities.map(u => (
                                        <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setEditOpen(false)} sx={{ color: '#6b7280' }}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleEditSave}
                            disabled={updating}
                            sx={{ bgcolor: '#006d33', '&:hover': { bgcolor: '#005225' } }}
                        >
                            {updating ? 'Saving...' : 'Save Role'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Fade>
    );
}
