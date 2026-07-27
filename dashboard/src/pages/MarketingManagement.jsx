import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Chip
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getAdvertisement, updateAdvertisement, sendBroadcastNotification, getAllUniversities, uploadImage, resolveImageUrl } from '../api';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`marketing-tabpanel-${index}`} {...other}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

export default function MarketingManagement() {
    const [tabIndex, setTabIndex] = useState(0);

    // Banner Ad State
    const [adTitle, setAdTitle] = useState('');
    const [adImageUrl, setAdImageUrl] = useState('');
    const [adLinkUrl, setAdLinkUrl] = useState('');
    const [adIsActive, setAdIsActive] = useState(false);
    const [adLoading, setAdLoading] = useState(true);
    const [adSaving, setAdSaving] = useState(false);
    const [adMessage, setAdMessage] = useState({ type: '', text: '' });
    const [uploadingImage, setUploadingImage] = useState(false);

    // Push Notification State
    const [notifTitle, setNotifTitle] = useState('');
    const [notifBody, setNotifBody] = useState('');
    const [targetUni, setTargetUni] = useState('all');
    const [universities, setUniversities] = useState([]);
    const [notifSending, setNotifSending] = useState(false);
    const [notifMessage, setNotifMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchAdData();
        fetchUniversities();
    }, []);

    const fetchAdData = async () => {
        try {
            setAdLoading(true);
            const res = await getAdvertisement();
            if (res.data) {
                setAdTitle(res.data.title || '');
                setAdImageUrl(res.data.imageUrl || '');
                setAdLinkUrl(res.data.linkUrl || '');
                setAdIsActive(res.data.isActive || false);
            }
        } catch (err) {
            console.error('Failed to load ad data:', err);
        } finally {
            setAdLoading(false);
        }
    };

    const fetchUniversities = async () => {
        try {
            const res = await getAllUniversities();
            setUniversities(res.data || []);
        } catch (err) {
            console.error('Failed to fetch universities:', err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('file', file);
            const res = await uploadImage(formData);
            setAdImageUrl(res.data.url);
            setAdMessage({ type: 'success', text: 'Banner image uploaded successfully!' });
        } catch (err) {
            setAdMessage({ type: 'error', text: 'Failed to upload image' });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSaveAd = async (e) => {
        e.preventDefault();
        try {
            setAdSaving(true);
            setAdMessage({ type: '', text: '' });
            const payload = { title: adTitle, imageUrl: adImageUrl, linkUrl: adLinkUrl, isActive: adIsActive };
            await updateAdvertisement(payload);
            setAdMessage({ type: 'success', text: 'Hero Banner Advertisement updated successfully!' });
        } catch (err) {
            setAdMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update advertisement' });
        } finally {
            setAdSaving(false);
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!notifTitle || !notifBody) {
            setNotifMessage({ type: 'error', text: 'Please fill in both Title and Message body.' });
            return;
        }

        try {
            setNotifSending(true);
            setNotifMessage({ type: '', text: '' });
            const res = await sendBroadcastNotification({
                title: notifTitle,
                body: notifBody,
                universityId: targetUni
            });
            setNotifMessage({ type: 'success', text: res.data.message || 'Notification broadcast completed successfully!' });
            setNotifTitle('');
            setNotifBody('');
        } catch (err) {
            setNotifMessage({ type: 'error', text: err.response?.data?.message || 'Failed to broadcast push notification' });
        } finally {
            setNotifSending(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1 }}>
                    Marketing & Communications
                </Typography>
                <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                    Manage homepage hero banner advertisements and broadcast real-time push notifications to students.
                </Typography>
            </Box>

            <Paper sx={{ bgcolor: '#1e293b', borderRadius: 3, border: '1px solid #334155' }}>
                <Tabs
                    value={tabIndex}
                    onChange={(e, val) => setTabIndex(val)}
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        px: 2,
                        '& .MuiTab-root': { color: '#94a3b8', fontWeight: 600 },
                        '& .Mui-selected': { color: '#ec4899' }
                    }}
                >
                    <Tab icon={<CampaignIcon />} iconPosition="start" label="Hero Banner Ads" />
                    <Tab icon={<NotificationsActiveIcon />} iconPosition="start" label="Push Notification Hub" />
                </Tabs>

                {/* TAB 1: HERO BANNER AD MANAGEMENT */}
                <TabPanel value={tabIndex} index={0}>
                    <Grid container spacing={4} sx={{ px: 3 }}>
                        <Grid item xs={12} md={7}>
                            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700, mb: 2 }}>
                                Active Hero Banner Settings
                            </Typography>

                            {adMessage.text && (
                                <Alert severity={adMessage.type} sx={{ mb: 3 }} onClose={() => setAdMessage({ type: '', text: '' })}>
                                    {adMessage.text}
                                </Alert>
                            )}

                            {adLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <form onSubmit={handleSaveAd}>
                                    <TextField
                                        fullWidth
                                        label="Campaign / Banner Title"
                                        value={adTitle}
                                        onChange={(e) => setAdTitle(e.target.value)}
                                        required
                                        sx={{ mb: 3, input: { color: '#fff' }, label: { color: '#94a3b8' } }}
                                    />

                                    <Box sx={{ mb: 3 }}>
                                        <TextField
                                            fullWidth
                                            label="Banner Image URL"
                                            value={adImageUrl}
                                            onChange={(e) => setAdImageUrl(e.target.value)}
                                            required
                                            sx={{ mb: 1, input: { color: '#fff' }, label: { color: '#94a3b8' } }}
                                        />
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={uploadingImage ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                                            disabled={uploadingImage}
                                            sx={{ borderColor: '#ec4899', color: '#ec4899' }}
                                        >
                                            {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                                            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                        </Button>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        label="Destination Link / Deep Link (Optional)"
                                        placeholder="/shop/123 or https://..."
                                        value={adLinkUrl}
                                        onChange={(e) => setAdLinkUrl(e.target.value)}
                                        sx={{ mb: 3, input: { color: '#fff' }, label: { color: '#94a3b8' } }}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={adIsActive}
                                                onChange={(e) => setAdIsActive(e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Typography sx={{ color: adIsActive ? '#4ade80' : '#94a3b8', fontWeight: 600 }}>
                                                {adIsActive ? 'Banner Active (Displayed on App Home)' : 'Banner Inactive (Hidden)'}
                                            </Typography>
                                        }
                                        sx={{ mb: 3, display: 'block' }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={adSaving}
                                        startIcon={adSaving ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                        sx={{
                                            bgcolor: '#ec4899',
                                            '&:hover': { bgcolor: '#db2777' },
                                            py: 1.5,
                                            px: 4,
                                            fontWeight: 700,
                                            borderRadius: 2
                                        }}
                                    >
                                        {adSaving ? 'Saving Changes...' : 'Save Banner Settings'}
                                    </Button>
                                </form>
                            )}
                        </Grid>

                        {/* LIVE BANNER PREVIEW CARD */}
                        <Grid item xs={12} md={5}>
                            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700, mb: 2 }}>
                                Customer App Live Preview
                            </Typography>

                            <Card sx={{ bgcolor: '#0f172a', borderRadius: 3, border: '1px solid #334155', overflow: 'hidden' }}>
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <VisibilityIcon sx={{ color: '#ec4899', fontSize: 20 }} />
                                        <Typography variant="subtitle2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                                            Hero Banner Mockup
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={adIsActive ? 'LIVE' : 'HIDDEN'}
                                        color={adIsActive ? 'success' : 'default'}
                                        size="small"
                                        sx={{ fontWeight: 700 }}
                                    />
                                </Box>

                                <Box sx={{ position: 'relative', minHeight: 180, bgcolor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {adImageUrl ? (
                                        <img
                                            src={resolveImageUrl(adImageUrl)}
                                            alt="Hero Banner Preview"
                                            style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop';
                                            }}
                                        />
                                    ) : (
                                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                                            No Banner Image Set
                                        </Typography>
                                    )}
                                </Box>

                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                                        {adTitle || 'Promotional Campaign Title'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                                        {adLinkUrl ? `Destination: ${adLinkUrl}` : 'No click action link'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* TAB 2: PUSH NOTIFICATION BROADCAST HUB */}
                <TabPanel value={tabIndex} index={1}>
                    <Grid container spacing={4} sx={{ px: 3 }}>
                        <Grid item xs={12} md={7}>
                            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700, mb: 2 }}>
                                Broadcast Push Notification
                            </Typography>

                            {notifMessage.text && (
                                <Alert severity={notifMessage.type} sx={{ mb: 3 }} onClose={() => setNotifMessage({ type: '', text: '' })}>
                                    {notifMessage.text}
                                </Alert>
                            )}

                            <form onSubmit={handleSendNotification}>
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel sx={{ color: '#94a3b8' }}>Target Audience / Campus</InputLabel>
                                    <Select
                                        value={targetUni}
                                        onChange={(e) => setTargetUni(e.target.value)}
                                        label="Target Audience / Campus"
                                        sx={{ color: '#fff', '.MuiSvgIcon-root': { color: '#94a3b8' } }}
                                    >
                                        <MenuItem value="all">🌐 All Campuses (Global Broadcast)</MenuItem>
                                        {universities.map((uni) => (
                                            <MenuItem key={uni.id} value={uni.id}>
                                                🏛️ {uni.name} ({uni.city || 'Campus'})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Notification Title"
                                    placeholder="e.g., Midnight Craving Flash Sale! 🍕"
                                    value={notifTitle}
                                    onChange={(e) => setNotifTitle(e.target.value)}
                                    required
                                    sx={{ mb: 3, input: { color: '#fff' }, label: { color: '#94a3b8' } }}
                                />

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Message Body"
                                    placeholder="Get 20% OFF on all late-night canteen orders till 2 AM. Use code MIDNIGHT20."
                                    value={notifBody}
                                    onChange={(e) => setNotifBody(e.target.value)}
                                    required
                                    sx={{ mb: 3, textarea: { color: '#fff' }, label: { color: '#94a3b8' } }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={notifSending}
                                    startIcon={notifSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    sx={{
                                        bgcolor: '#ec4899',
                                        '&:hover': { bgcolor: '#db2777' },
                                        py: 1.5,
                                        px: 4,
                                        fontWeight: 700,
                                        borderRadius: 2
                                    }}
                                >
                                    {notifSending ? 'Broadcasting...' : 'Broadcast Push Notification'}
                                </Button>
                            </form>
                        </Grid>

                        {/* PHONE NOTIFICATION PREVIEW */}
                        <Grid item xs={12} md={5}>
                            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700, mb: 2 }}>
                                Student Lock-Screen Preview
                            </Typography>

                            <Paper
                                elevation={4}
                                sx={{
                                    bgcolor: '#0f172a',
                                    borderRadius: 4,
                                    border: '2px solid #334155',
                                    p: 2.5,
                                    maxWidth: 360,
                                    mx: 'auto'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>
                                            Z
                                        </Box>
                                        <Typography variant="subtitle2" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                                            Zippit Campus
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        Now
                                    </Typography>
                                </Box>

                                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', p: 2, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 700, mb: 0.5 }}>
                                        {notifTitle || 'Notification Title'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.4 }}>
                                        {notifBody || 'Push notification preview text will appear here as you type...'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>
        </Box>
    );
}
