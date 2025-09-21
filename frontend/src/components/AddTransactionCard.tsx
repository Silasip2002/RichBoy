import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Typography,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import {
  AddCircleOutline,
  RemoveCircleOutline,
  AttachMoney,
  AccountBalanceWalletOutlined,
  DescriptionOutlined,
  LocalOfferOutlined,
  CalendarTodayOutlined,
} from '@mui/icons-material';

interface AddTransactionCardProps {
  onTransactionAdded: () => void;
}

interface Account {
  id: number;
  name: string;
}

const AddTransactionCard: React.FC<AddTransactionCardProps> = ({ onTransactionAdded }) => {
  const [transactionType, setTransactionType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [account, setAccount] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { token } = useAuth();

  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('USD');

  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchAccounts = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/accounts/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.results)) {
          setAccounts(data.results);
        } else if (Array.isArray(data)) {
          setAccounts(data);
        } else {
          console.error('Received data is not an array or paginated response');
          setAccounts([]); // Ensure accounts is always an array
        }
      } else {
        console.error('Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  const handleTransactionTypeChange = (event: React.MouseEvent<HTMLElement>, newType: string) => {
    if (newType !== null) {
      setTransactionType(newType);
    }
  };

  const handleSaveTransaction = async () => {
    const response = await fetch('http://localhost:8000/api/transactions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        transaction_type: transactionType,
        amount,
        currency,
        description,
        category,
        date,
        is_recurring: isRecurring,
        account,
      }),
    });

    if (response.ok) {
      // Handle success
      console.log('Transaction saved');
      onTransactionAdded();
    } else {
      // Handle error
      console.error('Failed to save transaction');
    }
  };

  const handleOpenAccountDialog = () => {
    setOpenAccountDialog(true);
  };

  const handleCloseAccountDialog = () => {
    setOpenAccountDialog(false);
    setNewAccountName('');
    setNewAccountType('');
    setNewAccountBalance('');
    setNewAccountCurrency('USD');
  };

  const handleCreateAccount = async () => {
    const response = await fetch('http://localhost:8000/api/accounts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newAccountName,
        account_type: newAccountType,
        balance: newAccountBalance,
        currency: newAccountCurrency,
      }),
    });

    if (response.ok) {
      handleCloseAccountDialog();
      fetchAccounts();
    } else {
      console.error('Failed to create account');
    }
  };

  const handleOpenCategoryDialog = () => {
    setOpenCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setNewCategoryName('');
  };

  const handleCreateCategory = async () => {
    const response = await fetch('http://localhost:8000/api/categories/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newCategoryName }),
    });

    if (response.ok) {
      handleCloseCategoryDialog();
      // You might want to refresh the categories list here
    } else {
      console.error('Failed to create category');
    }
  };

  return (
    <>
      <Card sx={{
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        background: 'rgba(255, 255, 255, 0.9)',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 3, textAlign: 'center' }}>
            Add New Transaction
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} width={"100%"}>
              <ToggleButtonGroup
                value={transactionType}
                exclusive
                onChange={handleTransactionTypeChange}
                fullWidth
                sx={{
                  display: 'flex',
                  gap: 2,
                  '& .MuiToggleButton-root': {
                    color: '#888',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    '&.Mui-selected': {
                      color: 'white',
                      backgroundColor: transactionType === 'income' ? '#4caf50' : '#f44336',
                      '&:hover': {
                        backgroundColor: transactionType === 'income' ? '#43a047' : '#e53935',
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="expense">
                  <RemoveCircleOutline sx={{ mr: 1 }} />
                  Expense
                </ToggleButton>
                <ToggleButton value="income">
                  <AddCircleOutline sx={{ mr: 1 }} />
                  Income
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} width={"100%"}>
              <TextField
                label="Amount"
                variant="outlined"
                fullWidth
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} width={"100%"}>
              <TextField
                select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                fullWidth
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
                <MenuItem value="JPY">JPY</MenuItem>
                <MenuItem value="CNY">CNY</MenuItem>
                <MenuItem value="HKD">HKD</MenuItem>
                <MenuItem value="TWD">TWD</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} width={"100%"}>
              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionOutlined />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} width={"100%"}>
              <Button onClick={handleOpenAccountDialog}
                sx={{ minWidth: 0, px: 1, float: 'right' }}
                size='small'
              >+Add Account</Button>
              <TextField
                select
                label="Account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                fullWidth
              >
                <MenuItem value="" disabled>Select an account</MenuItem>
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} width={"100%"}>
              <Button
                onClick={handleOpenCategoryDialog}
                size="small"
                sx={{ minWidth: 0, px: 1, float: 'right' }}
              >
                +Add Category
              </Button>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
              >
                <MenuItem value="" disabled>Select a category</MenuItem>
                <MenuItem value="Salary">Salary</MenuItem>
                <MenuItem value="Investments">Investments</MenuItem>
                <MenuItem value="Freelance">Freelance</MenuItem>
                <MenuItem value="Gifts">Gifts</MenuItem>
                <MenuItem value="Other Income">Other Income</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} width={"100%"}>
              <TextField
                label="Date"
                variant="outlined"
                fullWidth
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayOutlined />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} width={"100%"}>
              <FormControlLabel
                control={<Switch checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} color="primary" />}
                label="Recurring transaction"
                sx={{ width: '100%' }}
              />
            </Grid>
            <Grid item xs={12} width={"100%"}>
              <Button variant="contained" color="primary" onClick={handleSaveTransaction} fullWidth sx={{ py: 1.5, textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}>
                Add Transaction
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Dialog open={openAccountDialog} onClose={handleCloseAccountDialog}>
        <DialogTitle>Add New Account</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Account Name"
            type="text"
            fullWidth
            variant="standard"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
          />
          <TextField
            select
            margin="dense"
            label="Account Type"
            fullWidth
            variant="standard"
            value={newAccountType}
            onChange={(e) => setNewAccountType(e.target.value)}
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
            variant="standard"
            value={newAccountBalance}
            onChange={(e) => setNewAccountBalance(e.target.value)}
          />
          <TextField
            select
            margin="dense"
            label="Currency"
            fullWidth
            variant="standard"
            value={newAccountCurrency}
            onChange={(e) => setNewAccountCurrency(e.target.value)}
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
          <Button onClick={handleCloseAccountDialog}>Cancel</Button>
          <Button onClick={handleCreateAccount}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCategoryDialog} onClose={handleCloseCategoryDialog}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="standard"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
          <Button onClick={handleCreateCategory}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddTransactionCard;  