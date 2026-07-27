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
    Avatar,
    InputBase,
    Badge,
    Paper
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/GridView';
import StoreIcon from '@mui/icons-material/Storefront';
import FastfoodIcon from '@mui/icons-material/Inventory2';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalOfferIcon from '@mui/icons-material/Sell';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CampaignIcon from '@mui/icons-material/Campaign';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import TuneIcon from '@mui/icons-material/Tune';

const drawerWidth = 260;

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
        { text: 'Dashboard', icon: <DashboardIcon size={20} />, path: '/' },
        { text: 'Financial Analytics', icon: <AssessmentIcon size={20} />, path: '/analytics' },
        { text: 'Restaurants & Canteens', icon: <RestaurantIcon size={20} />, path: '/restaurants' },
        { text: 'Orders', icon: <ShoppingBagIcon size={20} />, path: '/orders' },
        { text: 'Shops', icon: <StoreIcon size={20} />, path: '/shops' },
        { text: 'Products', icon: <FastfoodIcon size={20} />, path: '/products' },
        { text: 'Marketing & Ads', icon: <CampaignIcon size={20} />, path: '/marketing' },
        { text: 'Users', icon: <PeopleIcon size={20} />, path: '/users', superOnly: true },
        { text: 'Quests', icon: <EmojiEventsIcon size={20} />, path: '/quests' },
        { text: 'Coupons', icon: <LocalOfferIcon size={20} />, path: '/coupons' },
        { text: 'Categories', icon: <CategoryIcon size={20} />, path: '/categories' },
    ].filter(item => !item.superOnly || isSuperAdmin);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff', borderRight: '1px solid #e5e7eb' }}>
            {/* Logo Section */}
            <Toolbar sx={{ px: 3, pt: 3, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 900,
                        color: '#006d33',
                        letterSpacing: '-0.03em',
                        lineHeight: 1
                    }}
                >
                    Laro
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, mt: 0.5 }}>
                    Campus Operations
                </Typography>
            </Toolbar>

            {/* Menu Links */}
            <Box sx={{ flexGrow: 1, px: 2, py: 2 }}>
                <List disablePadding>
                    {menuItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 0.8 }}>
                                <ListItemButton
                                    selected={active}
                                    onClick={() => {
                                        navigate(item.path);
                                        if (isMobile) setMobileOpen(false);
                                    }}
                                    sx={{
                                        borderRadius: '12px',
                                        py: 1.2,
                                        px: 2,
                                        transition: 'all 0.2s ease',
                                        bgcolor: active ? '#43d174' : 'transparent',
                                        color: active ? '#003918' : '#374151',
                                        '&.Mui-selected': {
                                            bgcolor: '#43d174',
                                            color: '#003918',
                                            '&:hover': { bgcolor: '#38c567' }
                                        },
                                        '&:hover': {
                                            bgcolor: active ? '#43d174' : '#f3f4f6',
                                        }
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 36,
                                            color: active ? '#003918' : '#4b5563'
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            fontSize: '14px',
                                            fontWeight: active ? 700 : 600
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Sidebar Footer */}
            <Box sx={{ p: 2.5, borderTop: '1px solid #f3f4f6' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.2,
                        mb: 2,
                        bgcolor: '#f3f4f6',
                        borderRadius: 2,
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="caption" sx={{ color: '#4b5563', fontWeight: 700, letterSpacing: '0.05em' }}>
                        SYSTEM STATUS: ACTIVE
                    </Typography>
                </Paper>

                <List disablePadding>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            onClick={() => navigate('/settings')}
                            sx={{ borderRadius: '10px', py: 1, color: '#374151' }}
                        >
                            <ListItemIcon sx={{ minWidth: 36, color: '#4b5563' }}>
                                <SettingsIcon size={18} />
                            </ListItemIcon>
                            <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }} />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{ borderRadius: '10px', py: 1, color: '#ef4444' }}
                        >
                            <ListItemIcon sx={{ minWidth: 36, color: '#ef4444' }}>
                                <LogoutIcon size={18} />
                            </ListItemIcon>
                            <ListItemText primary="Log Out" primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }} />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8f9fb', minHeight: '100vh' }}>
            <CssBaseline />

            {/* Sidebar Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant={isMobile ? 'temporary' : 'permanent'}
                    open={isMobile ? mobileOpen : true}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: '1px solid #e5e7eb',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Workspace */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Top Navigation Header Bar */}
                <Box
                    sx={{
                        bgcolor: '#ffffff',
                        borderBottom: '1px solid #e5e7eb',
                        px: { xs: 2, md: 4 },
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        gap: 2
                    }}
                >
                    {isMobile && (
                        <IconButton onClick={handleDrawerToggle} sx={{ color: '#111827' }}>
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Left Page Title / Search Bar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexGrow: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#006d33', display: { xs: 'none', sm: 'block' } }}>
                            {location.pathname === '/analytics' ? 'Financial Analytics' : location.pathname === '/restaurants' ? 'Restaurants & Canteens' : 'Laro Dashboard'}
                        </Typography>


                        {/* Search Pills */}
                        <Paper
                            elevation={0}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 2,
                                py: 0.8,
                                bgcolor: '#f3f4f6',
                                borderRadius: '24px',
                                border: '1px solid #e5e7eb',
                                width: { xs: '100%', sm: 320 }
                            }}
                        >
                            <SearchIcon sx={{ color: '#9ca3af', mr: 1, fontSize: 20 }} />
                            <InputBase
                                placeholder="Search transactions..."
                                sx={{ fontSize: '14px', width: '100%', color: '#1f2937' }}
                            />
                        </Paper>
                    </Box>

                    {/* Right User Status Profile */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <IconButton sx={{ color: '#4b5563', bgcolor: '#f3f4f6' }}>
                            <Badge variant="dot" color="error">
                                <NotificationsNoneIcon sx={{ fontSize: 20 }} />
                            </Badge>
                        </IconButton>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                                    {user.name || 'Super Admin'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, fontSize: '10px', letterSpacing: '0.05em' }}>
                                    GLOBAL ADMINISTRATOR
                                </Typography>
                            </Box>

                            <Avatar
                                sx={{
                                    bgcolor: '#fabd00',
                                    color: '#000000',
                                    fontWeight: 900,
                                    width: 40,
                                    height: 40,
                                    fontSize: '16px'
                                }}
                            >
                                {user.name?.charAt(0) || 'A'}
                            </Avatar>
                        </Box>
                    </Box>
                </Box>

                {/* Page Content Outlet */}
                <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
