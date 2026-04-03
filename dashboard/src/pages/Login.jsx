import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@laro.com');
    const [password, setPassword] = useState('password123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login/admin', {
                phoneNumber: email, // Backend uses phoneNumber as the username field
                password
            });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1a2e' // Dark premium background
            }}
        >
            <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 4, boxShadow: 10 }}>
                <CardContent sx={{ p: 5 }}>
                    <Typography variant="h4" fontWeight="bold" textAlign="center" mb={1}>
                        Admin Portal
                    </Typography>
                    <Typography variant="body2" color="textSecondary" textAlign="center" mb={4}>
                        Sign in to manage Laro
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            variant="outlined"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Button
                            fullWidth
                            size="large"
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            sx={{ mt: 3, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}
