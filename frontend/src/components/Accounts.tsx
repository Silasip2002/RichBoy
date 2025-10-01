import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Box, Button, Card, CardContent, Typography, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, CircularProgress, Alert, List, ListItem, ListItemText, Divider, IconButton, FormControl, Select, SelectChangeEvent, Menu
} from '@mui/material';
import {
    Add as AddIcon,
    Close as CloseIcon,
    AttachMoney as AttachMoneyIcon,
    AccountBalanceWalletOutlined as AccountBalanceWalletOutlinedIcon,
    CreditCard as CreditCardIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    TrendingUp as TrendingUpIcon,
    MonetizationOn as MonetizationOnIcon,
    AccountBalance as AccountBalanceIcon,
    CreditScore as CreditScoreIcon,
} from '@mui/icons-material';
import { LineChart } from '@mui/x-charts/LineChart';
import constants from '../data/constants.json';
import { getAccounts, createAccount, updateAccount, deleteAccount, getUserProfile, updateUserProfile, getAccountDetails, getAccountTransactions, createBalanceSnapshot, getBalanceSnapshots, updateBalanceSnapshot } from '../services/api';

interface Account {
    id: number;
    name: string;
    account_type: string;
    balance: number;
    currency: string;
}

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    category: string;
}

interface BalanceSnapshot {
    id: number;
    date: string;
    balance: number;
}

interface Activity {
    date: string;
    type: 'transaction' | 'snapshot';
    data: Transaction | BalanceSnapshot;
}

interface AccountsProps {
    refresh?: number;
    onDataChange?: () => void;
}

const Accounts: React.FC<AccountsProps> = ({ refresh, onDataChange }) => {
    const { token } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openAddAccountDialog, setOpenAddAccountDialog] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState(constants.accountTypes[0].value);
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [newAccountCurrency, setNewAccountCurrency] = useState(constants.currencies[0].value);
    const [addAccountError, setAddAccountError] = useState<string | null>(null);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const [openEditAccountDialog, setOpenEditAccountDialog] = useState(false);
    const [editAccountData, setEditAccountData] = useState<Partial<Account> | null>(null);
    const [editAccountError, setEditAccountError] = useState<string | null>(null);

    const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);

    // State for preferred currency
    const [preferredCurrency, setPreferredCurrency] = useState('USD');
    const [initialPreferredCurrency, setInitialPreferredCurrency] = useState('USD'); // To check if changed
    const [preferredCurrencyError, setPreferredCurrencyError] = useState<string | null>(null);

    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [balanceSnapshots, setBalanceSnapshots] = useState<BalanceSnapshot[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

    const [openRecordBalanceDialog, setOpenRecordBalanceDialog] = useState(false);
    const [recordBalanceAmount, setRecordBalanceAmount] = useState('');
    const [recordBalanceDate, setRecordBalanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [recordBalanceError, setRecordBalanceError] = useState<string | null>(null);

    const [timeFrame, setTimeFrame] = useState('all');

    const fetchAccounts = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getAccounts(token);
            if (Array.isArray(data.results)) {
                setAccounts(data.results.map((acc: any) => ({ ...acc, balance: parseFloat(acc.balance) })));
            } else if (Array.isArray(data)) {
                setAccounts(data.map((acc: any) => ({ ...acc, balance: parseFloat(acc.balance) })));
            } else {
                console.error('Received data is not an array or paginated response', data);
                setAccounts([]);
            }
        } catch (err: any) {
            console.error('Error fetching accounts:', err);
            setError(err.message || 'Network error or server is unreachable');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        if (!token) return;
        try {
            const profile = await getUserProfile(token);
            if (profile && profile.preferred_currency) {
                setPreferredCurrency(profile.preferred_currency);
                setInitialPreferredCurrency(profile.preferred_currency);
            }
        } catch (err: any) {
            console.error('Error fetching user profile:', err);
            // Handle error, maybe set a default or show a message
        }
    }
    const fetchAccountDetailsAndActivities = async () => {
        if (!token || !selectedAccount) return;

        setDetailsLoading(true);
        setDetailsError(null);

        try {
            const accountDetails = await getAccountDetails(token, selectedAccount.id.toString());
            setSelectedAccount({ ...accountDetails, balance: parseFloat(accountDetails.balance) });

            const transactionData = await getAccountTransactions(token, selectedAccount.id.toString());
            const transactions = Array.isArray(transactionData.results) ? transactionData.results : (Array.isArray(transactionData) ? transactionData : []);

            const snapshotData = await getBalanceSnapshots(token, selectedAccount.id.toString());
            const snapshots = Array.isArray(snapshotData.results) ? snapshotData.results : (Array.isArray(snapshotData) ? snapshotData : []);
            setBalanceSnapshots(snapshots.map((s: any) => ({...s, balance: parseFloat(s.balance)})));

            const combinedActivities: Activity[] = [
                ...transactions.map((t: any) => ({ date: t.date, type: 'transaction' as const, data: { ...t, amount: parseFloat(t.amount) }})),
                ...snapshots.map((s: any) => ({ date: s.date, type: 'snapshot' as const, data: { ...s, balance: parseFloat(s.balance) }}))
            ];

            combinedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setActivities(combinedActivities);

        } catch (err: any) {
            setDetailsError(err.message || 'Failed to fetch account data');
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
        fetchUserProfile(); // Fetch user profile on mount
    }, [token, refresh]);

    useEffect(() => {
        if (openDetailsDialog) {
            fetchAccountDetailsAndActivities();
        }
    }, [selectedAccount?.id, openDetailsDialog, token]);

    const handleOpenAddAccountDialog = () => {
        setOpenAddAccountDialog(true);
        setAddAccountError(null);
    };

    const handleCloseAddAccountDialog = () => {
        setOpenAddAccountDialog(false);
        setNewAccountName('');
        setNewAccountType(constants.accountTypes[0].value);
        setNewAccountBalance('');
        setNewAccountCurrency(constants.currencies[0].value);
        setAddAccountError(null);
    };

    const handleCreateAccount = async () => {
        if (!token) return;
        setAddAccountError(null);
        try {
            const newAccount = await createAccount(token, {
                name: newAccountName,
                account_type: newAccountType,
                balance: parseFloat(newAccountBalance),
                currency: newAccountCurrency,
            });

            if (newAccount && newAccount.id) {
                await createBalanceSnapshot(token, {
                    account: newAccount.id,
                    balance: parseFloat(newAccountBalance),
                    date: new Date().toISOString().split('T')[0],
                });
            }

            handleCloseAddAccountDialog();
            if (onDataChange) {
                onDataChange();
            }
        } catch (err: any) {
            setAddAccountError(err.message || 'Failed to create account');
            console.error('Error creating account:', err);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, account: Account) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedAccount(account);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedAccount(null);
    };

    const handleOpenEditDialog = () => {
        event
        if (selectedAccount) {
            setEditAccountData({ ...selectedAccount });
            setOpenEditAccountDialog(true);
        }
        handleMenuClose();
    };

    const handleCloseEditDialog = () => {
        setOpenEditAccountDialog(false);
        setEditAccountData(null);
        setEditAccountError(null);
    };

    const handleUpdateAccount = async () => {
        if (!token || !editAccountData || !editAccountData.id) return;
        setEditAccountError(null);
        try {
            await updateAccount(token, editAccountData.id, {
                name: editAccountData.name,
                account_type: editAccountData.account_type,
                balance: editAccountData.balance,
                currency: editAccountData.currency,
            });
            handleCloseEditDialog();
            if (onDataChange) {
                onDataChange();
            }
        } catch (err: any) {
            setEditAccountError(err.message || 'Failed to update account');
            console.error('Error updating account:', err);
        }
    };

    const handleOpenDeleteDialog = () => {
        setOpenDeleteConfirmDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteConfirmDialog(false);
        handleMenuClose();
    };

    const handleDeleteAccount = async () => {
        if (!token || !selectedAccount) return;
      
        try {
            await deleteAccount(token, selectedAccount.id);
            handleCloseDeleteDialog();
            if (onDataChange) {
                onDataChange();
            }
            fetchAccounts();
        } catch (err: any) {
            console.error('Error deleting account:', err);
        }
    };

    const handleSavePreferredCurrency = async () => {
        if (!token) return;
        setPreferredCurrencyError(null);
        try {
            await updateUserProfile(token, { preferred_currency: preferredCurrency });
            setInitialPreferredCurrency(preferredCurrency); // Update initial to reflect saved state
            alert('Preferred currency updated successfully!');
        } catch (err: any) {
            setPreferredCurrencyError(err.message || 'Failed to update preferred currency');
            console.error('Error updating preferred currency:', err);
        }
    };
    const handleCardClick = (account: Account) => {
        setSelectedAccount(account);
        setOpenDetailsDialog(true);
    };

    const handleCloseDetailsDialog = () => {
        setOpenDetailsDialog(false);
        setSelectedAccount(null);
        setActivities([]);
        setDetailsError(null);
    };

    const handleRecordBalance = async () => {
        if (!token || !selectedAccount || !recordBalanceAmount) return;

        setRecordBalanceError(null);
        try {
            const existingSnapshot = balanceSnapshots.find(s => s.date === recordBalanceDate);

            if (existingSnapshot) {
                await updateBalanceSnapshot(token, existingSnapshot.id.toString(), {
                    account: selectedAccount.id,
                    balance: parseFloat(recordBalanceAmount),
                    date: recordBalanceDate,
                });
            } else {
                await createBalanceSnapshot(token, {
                    account: selectedAccount.id,
                    balance: parseFloat(recordBalanceAmount),
                    date: recordBalanceDate,
                });
            }

            setOpenRecordBalanceDialog(false);
            setRecordBalanceAmount('');
            // Refresh data
            if (onDataChange) {
                onDataChange();
            }
            fetchAccountDetailsAndActivities();
        } catch (err: any) {
            setRecordBalanceError(err.message || 'Failed to record balance');
        }
    };

    const handleTimeFrameChange = (event: SelectChangeEvent) => {
        setTimeFrame(event.target.value);
    };

    const filteredSnapshots = balanceSnapshots.filter(snapshot => {
        if (timeFrame === 'all') {
            return true;
        }
        const snapshotDate = new Date(snapshot.date);
        const now = new Date();
        let daysToSubtract = 0;
        switch (timeFrame) {
            case '1w':
                daysToSubtract = 7;
                break;
            case '1m':
                daysToSubtract = 30;
                break;
            case '5y':
                daysToSubtract = 5 * 365;
                break;
            default:
                return true;
        }
        const fromDate = new Date(now.setDate(now.getDate() - daysToSubtract));
        return snapshotDate >= fromDate;
    });

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

                    {/* Preferred Currency Setting */}
                    <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: '8px', bgcolor: '#f9f9f9' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>Display Currency</Typography>
                        {preferredCurrencyError && <Alert severity="error" sx={{ mb: 2 }}>{preferredCurrencyError}</Alert>}
                        <TextField
                            select
                            label="Preferred Display Currency"
                            fullWidth
                            value={preferredCurrency}
                            onChange={(e) => setPreferredCurrency(e.target.value)}
                            sx={{ mb: 1 }}
                        >
                            {constants.currencies.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Button
                            variant="contained"
                            onClick={handleSavePreferredCurrency}
                            disabled={preferredCurrency === initialPreferredCurrency} // Disable if no change
                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                        >
                            Save Display Currency
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
                                    <Card
                                        onClick={() => handleCardClick(account)}
                                        sx={{
                                            p: 2,
                                            borderRadius: '8px',
                                            border: account.account_type === 'cash' ? '1px solid #a7d9b5' : account.account_type === 'bank' ? '1px solid #a2d2ff' : account.account_type === 'credit_card' ? '1px solid #d8b2ff' : account.account_type === 'investment' ? '1px solid #ffc107' : account.account_type === 'crypto' ? '1px solid #fd7e14' : account.account_type === 'bond' ? '1px solid #6610f2' : '1px solid #20c997',
                                            bgcolor: account.account_type === 'cash' ? '#e6ffe6' : account.account_type === 'bank' ? '#e0f2ff' : account.account_type === 'credit_card' ? '#f5e6ff' : account.account_type === 'investment' ? '#fff8e1' : account.account_type === 'crypto' ? '#fff3e0' : account.account_type === 'bond' ? '#f1e6ff' : '#e6fff9',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
                                                transform: 'scale(1.02)'
                                            },
                                            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                                            position: 'relative',
                                        }}>
                                        <CardContent>
                                            <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                                                <IconButton
                                                    aria-label="more"
                                                    onClick={(e) => handleMenuClick(e, account)}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </Box>
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
                                                {account.account_type === 'investment' && (
                                                    <TrendingUpIcon sx={{ color: '#ffc107', mr: 1 }} />
                                                )}
                                                {account.account_type === 'crypto' && (
                                                    <MonetizationOnIcon sx={{ color: '#fd7e14', mr: 1 }} />
                                                )}
                                                {account.account_type === 'bond' && (
                                                    <AccountBalanceIcon sx={{ color: '#6610f2', mr: 1 }} />
                                                )}
                                                {account.account_type === 'loan' && (
                                                    <CreditScoreIcon sx={{ color: '#20c997', mr: 1 }} />
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
                                                {constants.accountTypes.find(at => at.value === account.account_type)?.label || account.account_type}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        )
                    }
                    </Grid>
                </CardContent>
            </Card>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleOpenEditDialog}>
                    <EditIcon sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={handleOpenDeleteDialog}>
                    <DeleteIcon sx={{ mr: 1, color: 'error.main' }} />
                    <Typography color="error">Delete</Typography>
                </MenuItem>
            </Menu>

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
                        {constants.accountTypes.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
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
                        {constants.currencies.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddAccountDialog}>Cancel</Button>
                    <Button onClick={handleCreateAccount}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Account Dialog */}
            <Dialog open={openEditAccountDialog} onClose={handleCloseEditDialog}>
                <DialogTitle>Edit Account</DialogTitle>
                <DialogContent>
                    {editAccountError && <Alert severity="error" sx={{ mb: 2 }}>{editAccountError}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Account Name"
                        type="text"
                        fullWidth
                        value={editAccountData?.name || ''}
                        onChange={(e) => setEditAccountData(prev => prev ? { ...prev, name: e.target.value } : null)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Account Type"
                        fullWidth
                        value={editAccountData?.account_type || ''}
                        onChange={(e) => setEditAccountData(prev => prev ? { ...prev, account_type: e.target.value } : null)}
                        sx={{ mb: 2 }}
                    >
                        {constants.accountTypes.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        margin="dense"
                        label="Currency"
                        fullWidth
                        value={editAccountData?.currency || ''}
                        onChange={(e) => setEditAccountData(prev => prev ? { ...prev, currency: e.target.value } : null)}
                        sx={{ mb: 2 }}
                    >
                        {constants.currencies.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="dense"
                        label="Balance"
                        type="number"
                        fullWidth
                        value={editAccountData?.balance ?? ''}
                        onChange={(e) => setEditAccountData(prev => prev ? { ...prev, balance: parseFloat(e.target.value) } : null)}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>Cancel</Button>
                    <Button onClick={handleUpdateAccount}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteConfirmDialog}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete the account "{selectedAccount?.name}"? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleDeleteAccount} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
            {/* Account Details Dialog */}
            <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} fullWidth maxWidth="md">
                {selectedAccount && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selectedAccount.name}
                            <IconButton onClick={handleCloseDetailsDialog}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            {detailsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                            ) : detailsError ? (
                                <Alert severity="error">{detailsError}</Alert>
                            ) : (
                                <Box>
                                    <Card sx={{ mb: 3, borderRadius: '16px', boxShadow: 1 }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="h6">Balance: {selectedAccount.currency} {selectedAccount.balance.toFixed(2)}</Typography>
                                                    <Typography variant="body1" color="text.secondary">Account Type: {constants.accountTypes.find(at => at.value === selectedAccount.account_type)?.label || selectedAccount.account_type}</Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>

                                    {balanceSnapshots.length > 1 && (
                                        <Card sx={{ mb: 3, borderRadius: '16px', boxShadow: 1 }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>Account Growth</Typography>
                                                    <FormControl size="small">
                                                        <Select
                                                            value={timeFrame}
                                                            onChange={handleTimeFrameChange}
                                                        >
                                                            <MenuItem value={'1w'}>1W</MenuItem>
                                                            <MenuItem value={'1m'}>1M</MenuItem>
                                                            <MenuItem value={'5y'}>5Y</MenuItem>
                                                            <MenuItem value={'all'}>All</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                                <Box sx={{ height: 300 }}>
                                                    <LineChart
                                                        dataset={filteredSnapshots.slice().reverse().map(s => ({...s, date: new Date(s.date)}))}
                                                        series={[
                                                            {
                                                                dataKey: 'balance',
                                                                label: 'Balance',
                                                                valueFormatter: (value) => `${selectedAccount?.currency ?? ''} ${value?.toFixed ? value.toFixed(2) : ''}`,
                                                            },
                                                        ]}
                                                        xAxis={[{
                                                            scaleType: 'time',
                                                            dataKey: 'date',
                                                            valueFormatter: (date) => new Date(date).toLocaleDateString(),
                                                        }]}
                                                        yAxis={[{
                                                            valueFormatter: (value: number) => {
                                                                if (value == null) return '';
                                                                const currency = selectedAccount?.currency ?? '';
                                                                const absValue = Math.abs(value);
                                                                let formatted = '';
                                                                if (absValue >= 1e9) {
                                                                    formatted = `${currency}${(value / 1e9).toFixed(1)}B`;
                                                                } else if (absValue >= 1e6) {
                                                                    formatted = `${currency}${(value / 1e6).toFixed(1)}M`;
                                                                } else if (absValue >= 1e3) {
                                                                    formatted = `${currency}${(value / 1e3).toFixed(1)}K`;
                                                                } else {
                                                                    formatted = `${currency}${value.toFixed(2)}`;
                                                                }
                                                                return formatted;
                                                            },
                                                            width: 120,
                                                        }]}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card sx={{ borderRadius: '16px', boxShadow: 1 }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>Activities</Typography>
                                                <Button variant="contained" onClick={() => setOpenRecordBalanceDialog(true)}>Record Balance</Button>
                                            </Box>
                                            <List>
                                                {activities.length > 0 ? (
                                                    activities.map((activity, index) => (
                                                        <React.Fragment key={`${activity.type}-${(activity.data as any).id}`}>
                                                            <ListItem sx={{ py: 1.5 }}>
                                                                {activity.type === 'transaction' ? (
                                                                    <>
                                                                        <ListItemText
                                                                            primary={<Typography variant="body1" sx={{ fontWeight: 'medium' }}>{(activity.data as Transaction).description}</Typography>}
                                                                            secondary={`Date: ${new Date(activity.data.date).toLocaleDateString()} | Category: ${(activity.data as Transaction).category}`}
                                                                        />
                                                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: (activity.data as Transaction).amount >= 0 ? 'success.main' : 'error.main' }}>
                                                                            {(activity.data as Transaction).amount >= 0 ? '+' : ''}{selectedAccount.currency} {(activity.data as Transaction).amount.toFixed(2)}
                                                                        </Typography>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ListItemText
                                                                            primary={<Typography variant="body1" sx={{ fontWeight: 'medium' }}>Balance Recorded</Typography>}
                                                                            secondary={`Date: ${new Date(activity.data.date).toLocaleDateString()}`}
                                                                        />
                                                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                                            {selectedAccount.currency} {(activity.data as BalanceSnapshot).balance.toFixed(2)}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                            </ListItem>
                                                            {index < activities.length - 1 && <Divider component="li" />}
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <ListItem>
                                                        <ListItemText primary="No activities found for this account." />
                                                    </ListItem>
                                                )}
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Box>
                            )}
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* Record Balance Dialog */}
            <Dialog open={openRecordBalanceDialog} onClose={() => setOpenRecordBalanceDialog(false)}>
                <DialogTitle>Record Balance for {selectedAccount?.name}</DialogTitle>
                <DialogContent>
                    {recordBalanceError && <Alert severity="error" sx={{ mb: 2 }}>{recordBalanceError}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Balance"
                        type="number"
                        fullWidth
                        value={recordBalanceAmount}
                        onChange={(e) => setRecordBalanceAmount(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Date"
                        type="date"
                        fullWidth
                        value={recordBalanceDate}
                        onChange={(e) => setRecordBalanceDate(e.target.value)}
                        sx={{ mb: 2 }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRecordBalanceDialog(false)}>Cancel</Button>
                    <Button onClick={handleRecordBalance}>Record</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Accounts;
