import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Box, Button, Card, CardContent, Typography, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, CircularProgress, Alert
} from '@mui/material';
import {
    Add as AddIcon,
    AttachMoney as AttachMoneyIcon,
    AccountBalanceWalletOutlined as AccountBalanceWalletOutlinedIcon,
    CreditCard as CreditCardIcon,
} from '@mui/icons-material';

interface Account {
    id: number;
    name: string;
    account_type: string;
    balance: number;
    currency: string;
}

const Accounts: React.FC = () => {
    const { token } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openAddAccountDialog, setOpenAddAccountDialog] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState('bank');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [newAccountCurrency, setNewAccountCurrency] = useState('USD');
    const [addAccountError, setAddAccountError] = useState<string | null>(null);

    const fetchAccounts = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/accounts/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Assuming data is an array of accounts or has a .results property
                if (Array.isArray(data.results)) {
                    setAccounts(data.results.map((acc: any) => ({ ...acc, balance: parseFloat(acc.balance) })));
                } else if (Array.isArray(data)) {
                    setAccounts(data.map((acc: any) => ({ ...acc, balance: parseFloat(acc.balance) })));
                } else {
                    console.error('Received data is not an array or paginated response', data);
                    setAccounts([]);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to fetch accounts');
            }
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError('Network error or server is unreachable');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [token]);

    const handleOpenAddAccountDialog = () => {
        setOpenAddAccountDialog(true);
        setAddAccountError(null);
    };

    const handleCloseAddAccountDialog = () => {
        setOpenAddAccountDialog(false);
        setNewAccountName('');
        setNewAccountType('bank');
        setNewAccountBalance('');
        setNewAccountCurrency('USD');
        setAddAccountError(null);
    };

    const handleCreateAccount = async () => {
        if (!token) return;
        setAddAccountError(null);
        try {
            const response = await fetch('http://localhost:8000/api/accounts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: newAccountName,
                    account_type: newAccountType,
                    balance: parseFloat(newAccountBalance),
                    currency: newAccountCurrency,
                }),
            });

            if (response.ok) {
                handleCloseAddAccountDialog();
                fetchAccounts(); // Refresh accounts list
            } else {
                const errorData = await response.json();
                const errorMessage = Object.values(errorData).flat().join(' ');
                setAddAccountError(errorMessage || 'Failed to create account');
            }
        } catch (err) {
            console.error('Error creating account:', err);
            setAddAccountError('Network error or server is unreachable');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ my: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ my: 3 }}>
            <Card sx={{
                borderRadius: '16px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                background: 'rgba(255, 255, 255, 0.9)',
            }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>Accounts</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddAccountDialog}
                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                        >
                            Add Account
                        </Button>
                    </Box>
                    <Grid container spacing={2}>
                        {accounts.length === 0 ? (
                            <Grid item xs={12}>
                                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                                    No accounts found. Click "Add Account" to create one.
                                </Typography>
                            </Grid>
                        ) : (
                            accounts.map((account) => (
                                <Grid item xs={12} sm={6} md={4} key={account.id}>
                                    <Card sx={{
                                        p: 2,
                                        borderRadius: '8px',
                                        border: account.account_type === 'cash' ? '1px solid #a7d9b5' : account.account_type === 'bank' ? '1px solid #a2d2ff' : '1px solid #d8b2ff',
                                        bgcolor: account.account_type === 'cash' ? '#e6ffe6' : account.account_type === 'bank' ? '#e0f2ff' : '#f5e6ff',
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            {account.account_type === 'cash' && (
                                                <AttachMoneyIcon sx={{ color: '#28a745', mr: 1 }} />
                                            )}
                                            {account.account_type === 'bank' && (
                                                <AccountBalanceWalletOutlinedIcon sx={{ color: '#007bff', mr: 1 }} />
                                            )}
                                            {account.account_type === 'credit_card' && (
                                                <CreditCardIcon sx={{ color: '#6f42c1', mr: 1 }} />
                                            )}
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>{account.name}</Typography>
                                        </Box>
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 'semibold',
                                                color: account.balance >= 0 ? '#28a745' : '#dc3545',
                                            }}
                                        >
                                            {account.currency} {account.balance.toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {account.account_type === 'cash'
                                                ? 'Cash Account'
                                                : account.account_type === 'bank'
                                                    ? 'Bank Account'
                                                    : 'Credit Card'}
                                        </Typography>
                                    </Card>
                                </Grid>
                            ))
                        )}
                    </Grid>
                </CardContent>
            </Card>

            {/* Add Account Dialog */}
            <Dialog open={openAddAccountDialog} onClose={handleCloseAddAccountDialog}>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogContent>
                    {addAccountError && <Alert severity="error" sx={{ mb: 2 }}>{addAccountError}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Account Name"
                        type="text"
                        fullWidth
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Account Type"
                        fullWidth
                        value={newAccountType}
                        onChange={(e) => setNewAccountType(e.target.value)}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="bank">Bank Account</MenuItem>
                        <MenuItem value="credit_card">Credit Card</MenuItem>
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Initial Balance"
                        type="number"
                        fullWidth
                        value={newAccountBalance}
                        onChange={(e) => setNewAccountBalance(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Currency"
                        fullWidth
                        value={newAccountCurrency}
                        onChange={(e) => setNewAccountCurrency(e.target.value)}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                        <MenuItem value="JPY">JPY</MenuItem>
                        <MenuItem value="CNY">CNY</MenuItem>
                        <MenuItem value="HKD">HKD</MenuItem>
                        <MenuItem value="TWD">TWD</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddAccountDialog}>Cancel</Button>
                    <Button onClick={handleCreateAccount}>Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Accounts;
