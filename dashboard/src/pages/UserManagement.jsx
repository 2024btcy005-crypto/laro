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
import { getAllUsers, toggleUserStatus, updateUserRole, getAllUniversities } from '../api';

const roleColors = {
    'super_admin': 'error',
    'campus_admin': 'secondary',
    'customer': 'primary',
    'delivery': 'success',
    'shop_admin': 'warning'
};

export default function UserManagement() {
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Dialog State
    const [editOpen, setEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [newUni, setNewUni] = useState('');
    const [updating, setUpdating] = useState(false);

    // Filter state
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, unisRes] = await Promise.all([
                getAllUsers(),
                getAllUniversities()
            ]);
            setUsers(usersRes.data);
            setUniversities(unisRes.data);
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
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        setUpdating(true);
        try {
            await updateUserRole(selectedUser.id, {
                role: newRole,
                universityId: newRole === 'campus_admin' ? newUni : null
            });
            await fetchData(); // Refresh list
            setEditOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating role');
        } finally {
            setUpdating(false);
        }
    };

    const filteredUsers = users.filter(user => {
        if (tabValue === 0) return true; // All
        if (tabValue === 1) return ['super_admin', 'campus_admin', 'shop_admin'].includes(user.role); // Admins
        if (tabValue === 2) return user.role === 'customer'; // Customers
        if (tabValue === 3) return user.role === 'delivery'; // Delivery
        return true;
    });

    return (
        <Fade in={true} timeout={1000}>
            <Box sx={{ position: 'relative', pb: 8 }}>
                {/* Background Glow */}
                <Box sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 400,
                    height: 400,
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0) 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />

                <Typography variant="h4" sx={{
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    background: 'linear-gradient(90deg, #f8fafc 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 900
                }}>
                    User Management
                    <PeopleIcon sx={{ color: theme.palette.primary.main, fontSize: 32, opacity: 0.8 }} />
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, v) => setTabValue(v)}
                        sx={{
                            '& .MuiTab-root': {
                                color: '#94a3b8',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                '&.Mui-selected': { color: theme.palette.primary.main }
                            }
                        }}
                    >
                        <Tab label={`ALL (${users.length})`} />
                        <Tab label={`ADMINS (${users.filter(u => ['super_admin', 'campus_admin', 'shop_admin'].includes(u.role)).length})`} />
                        <Tab label={`CUSTOMERS (${users.filter(u => u.role === 'customer').length})`} />
                        <Tab label={`DELIVERY (${users.filter(u => u.role === 'delivery').length})`} />
                    </Tabs>
                </Box>

                <TableContainer component={Paper} sx={{
                    borderRadius: 6,
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                }}>
                    {loading ? (
                        <Box sx={{ p: 10, textAlign: 'center' }}>
                            <CircularProgress sx={{ color: theme.palette.primary.main }} />
                        </Box>
                    ) : (
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                                    <TableCell sx={{ color: '#94a3b8', py: 2.5 }}>USER</TableCell>
                                    <TableCell sx={{ color: '#94a3b8', py: 2.5 }}>EMAIL / PHONE</TableCell>
                                    <TableCell sx={{ color: '#94a3b8', py: 2.5 }}>ROLE</TableCell>
                                    <TableCell sx={{ color: '#94a3b8', py: 2.5 }}>CAMPUS</TableCell>
                                    <TableCell sx={{ color: '#94a3b8', py: 2.5 }}>STATUS</TableCell>
                                    <TableCell align="right" sx={{ color: '#94a3b8', py: 2.5 }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        sx={{
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                '& .MuiAvatar-root': { transform: 'scale(1.1)' }
                                            },
                                            '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar
                                                    sx={{
                                                        mr: 2,
                                                        background: roleColors[user.role] === 'error'
                                                            ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                                                            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                        width: 42,
                                                        height: 42,
                                                        fontSize: '1rem',
                                                        fontWeight: 900
                                                    }}
                                                >
                                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                                                        {user.name || 'Unknown User'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                                        ID: {user.id.substring(0, 8)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: '#cbd5e1', fontWeight: 500 }}>
                                            {user.email || user.phoneNumber}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role.replace('_', ' ').toUpperCase()}
                                                size="small"
                                                color={roleColors[user.role] || 'default'}
                                                variant="outlined"
                                                sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                            {user.university?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: user.isActive !== false ? '#10b981' : '#f43f5e',
                                                }} />
                                                <Typography sx={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    color: user.isActive !== false ? '#10b981' : '#f43f5e'
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
                                                    sx={{ color: '#f472b6', backgroundColor: 'rgba(244, 114, 182, 0.1)' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                        transition: 'all 0.2s',
                                                        color: user.isActive !== false ? '#f43f5e' : '#10b981',
                                                    }}
                                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                >
                                                    {user.isActive !== false ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>

                {/* Edit Role Dialog */}
                <Dialog
                    open={editOpen}
                    onClose={() => !updating && setEditOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 6,
                            bgcolor: '#1e293b',
                            color: '#f8fafc',
                            backgroundImage: 'none',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 800 }}>Manage User Role</DialogTitle>
                    <DialogContent sx={{ minWidth: 350, mt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel sx={{ color: '#94a3b8' }}>User Role</InputLabel>
                            <Select
                                value={newRole}
                                label="User Role"
                                onChange={(e) => setNewRole(e.target.value)}
                                sx={{ color: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                            >
                                <MenuItem value="customer">Customer</MenuItem>
                                <MenuItem value="delivery">Delivery Partner</MenuItem>
                                <MenuItem value="campus_admin">Campus Admin</MenuItem>
                                <MenuItem value="super_admin">Super Admin</MenuItem>
                                <MenuItem value="shop_admin">Shop Admin</MenuItem>
                            </Select>
                        </FormControl>

                        {newRole === 'campus_admin' && (
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: '#94a3b8' }}>Select Campus</InputLabel>
                                <Select
                                    value={newUni}
                                    label="Select Campus"
                                    onChange={(e) => setNewUni(e.target.value)}
                                    sx={{ color: '#f8fafc', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                                >
                                    {universities.map(uni => (
                                        <MenuItem key={uni.id} value={uni.id}>{uni.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setEditOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
                        <Button
                            onClick={handleEditSave}
                            variant="contained"
                            disabled={updating || (newRole === 'campus_admin' && !newUni)}
                            sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                            {updating ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Fade>
    );
}
