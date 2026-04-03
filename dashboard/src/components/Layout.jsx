import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    CssBaseline,
    Toolbar,
    List,
    Typography,
    Divider,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    useMediaQuery,
    useTheme,
    Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';

const drawerWidth = 280;

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super_admin';
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Orders', icon: <ShoppingBagIcon />, path: '/orders' },
        { text: 'Shops', icon: <StoreIcon />, path: '/shops' },
        { text: 'Products', icon: <FastfoodIcon />, path: '/products' },
        { text: 'Users', icon: <PeopleIcon />, path: '/users', superOnly: true },
        { text: 'Coupons', icon: <LocalOfferIcon />, path: '/coupons' },
        { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
        { text: 'Universities', icon: <SchoolIcon />, path: '/universities', superOnly: true },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ].filter(item => !item.superOnly || isSuperAdmin);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
            <Toolbar sx={{ px: 3, py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                    }}
                >
                    <Avatar
                        sx={{
                            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                            width: 40,
                            height: 40,
                            fontWeight: 900,
                            fontSize: '1.2rem',
                            boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)'
                        }}
                    >
                        L
                    </Avatar>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: '0.1em',
                            background: 'linear-gradient(to right, #f8fafc, #f472b6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        LARO
                    </Typography>
                </Box>
            </Toolbar>

            <Box sx={{ flexGrow: 1, px: 2, mt: 2 }}>
                <List sx={{ px: 1 }}>
                    {menuItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    selected={active}
                                    onClick={() => {
                                        navigate(item.path);
                                        if (isMobile) setMobileOpen(false);
                                    }}
                                    sx={{
                                        borderRadius: 4,
                                        py: 1.5,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&.Mui-selected': {
                                            background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.05) 100%)',
                                            border: '1px solid rgba(236, 72, 153, 0.2)',
                                            '& .MuiListItemIcon-root': {
                                                color: '#f472b6',
                                            },
                                            '& .MuiListItemText-primary': {
                                                color: '#f8fafc',
                                                fontWeight: 700,
                                            },
                                        },
                                        '&:hover': {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            transform: 'translateX(4px)',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        minWidth: 45,
                                        color: active ? '#f472b6' : 'rgba(255, 255, 255, 0.4)',
                                        transition: 'all 0.3s'
                                    }}>
                                        {React.cloneElement(item.icon, {
                                            sx: { fontSize: 24, filter: active ? 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.4))' : 'none' }
                                        })}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            fontSize: '0.95rem',
                                            fontWeight: active ? 700 : 500,
                                            letterSpacing: '0.01em',
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ p: 3 }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 4,
                        py: 1.5,
                        color: '#ef4444',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        '&:hover': {
                            background: 'rgba(239, 68, 68, 0.15)',
                            transform: 'translateY(-2px)',
                        }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40, color: '#ef4444' }}>
                        <ExitToAppIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700 }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', background: '#080c14' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
            >
                <Toolbar sx={{ height: 80 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1, letterSpacing: '0.05em' }}>
                        {menuItems.find(i => i.path === location.pathname)?.text || 'Dashboard'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                                {user.name || 'Admin User'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(236, 72, 153, 0.8)', display: 'block', fontWeight: 800 }}>
                                {isSuperAdmin ? 'Global Super Administrator' : (user.university?.name ? `${user.university.name} Admin` : 'Campus Administrator')}
                            </Typography>
                        </Box>
                        <Avatar
                            sx={{
                                width: 45,
                                height: 45,
                                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)'
                            }}
                        >
                            A
                        </Avatar>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            border: 'none',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>

                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            border: 'none',
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 3, md: 5 },
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    background: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.08), transparent 50%), radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.05), transparent 50%)',
                    minHeight: '100vh',
                    position: 'relative'
                }}
            >
                <Toolbar sx={{ height: 80 }} />
                <Outlet />
            </Box>
        </Box>
    );
}
