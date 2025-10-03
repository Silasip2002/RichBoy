import React, { useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography, CircularProgress } from '@mui/material';
import { loginUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginUser({ username, password });
            await login(data.access);
            router.push('/');
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message || 'Login failed. Please try again.');
            } else {
                setError('An unknown error occurred.');
            }
            console.error('Login failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        router.push('/register');
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Card sx={{ minWidth: 275 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Login
                    </Typography>
                    <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        label="Password"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    {error && (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button variant="contained" color="primary" onClick={handleLogin} disabled={loading}>
                            Login
                        </Button>
                        <Button variant="text" color="primary" onClick={handleRegister} sx={{ ml: 2 }} disabled={loading}>
                            Register
                        </Button>
                        {loading && <CircularProgress size={24} />}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginPage;
