import React, { useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/router';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleRegister = async () => {
        const response = await fetch('http://localhost:8000/api/users/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        if (response.ok) {
            router.push('/login');
        } else {
            // Handle error
            console.error('Registration failed');
        }
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Card sx={{ minWidth: 275 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Register
                    </Typography>
                    <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        label="Email"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        label="Password"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: '1rem', alignItems: 'center' }}>
                        <Button variant="contained" color="primary" onClick={handleRegister}>
                            Register
                        </Button>
                        <Button variant="text" onClick={() => router.push('/login')}>
                            Back to login
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RegisterPage;
