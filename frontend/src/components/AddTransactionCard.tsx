import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  MenuItem,
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
  DescriptionOutlined,
  CalendarTodayOutlined,
} from '@mui/icons-material';
import constants from '../data/constants.json';
import { createTransaction, getAccounts, createAccount } from '../services/api';

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
  const [currency, setCurrency] = useState(constants.currencies[0].value);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [account, setAccount] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { token } = useAuth();

  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState(constants.accountTypes[0].value);
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState(constants.currencies[0].value);

    const fetchAccounts = useCallback(async () => {
      if (!token) return;
      try {
        const data = await getAccounts(token);
        if (data && Array.isArray(data.results)) {
          setAccounts(data.results);
        } else if (Array.isArray(data)) {
          setAccounts(data);
        } else {
          console.error('Received data is not an array or paginated response');
          setAccounts([]); // Ensure accounts is always an array
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    }, [token]);
  
    useEffect(() => {
      fetchAccounts();
    }, [fetchAccounts]);
  const currentCategories = transactionType === 'income' ? constants.transactionCategories.income : constants.transactionCategories.expense;

  const handleTransactionTypeChange = (event: React.MouseEvent<HTMLElement>, newType: string) => {
    if (newType !== null) {
      setTransactionType(newType);
      setCategory(''); // Reset category when transaction type changes
    }
  };

  const handleSaveTransaction = async () => {
    if (!token) return;
    try {
      await createTransaction(token, {
        transaction_type: transactionType,
        amount,
        currency,
        description,
        category,
        date,
        is_recurring: isRecurring,
        account: Number(account),
      });
      console.log('Transaction saved');
      onTransactionAdded();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleOpenAccountDialog = () => {
    setOpenAccountDialog(true);
  };

  const handleCloseAccountDialog = () => {
    setOpenAccountDialog(false);
    setNewAccountName('');
    setNewAccountType(constants.accountTypes[0].value);
    setNewAccountBalance('');
    setNewAccountCurrency(constants.currencies[0].value);
  };

  const handleCreateAccount = async () => {
    if (!token) return;
    try {
      await createAccount(token, {
        name: newAccountName,
        account_type: newAccountType,
        balance: newAccountBalance,
        currency: newAccountCurrency,
      });
      handleCloseAccountDialog();
      fetchAccounts();
    } catch (error) {
      console.error('Failed to create account:', error);
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            <Grid >
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                fullWidth
              >
                {constants.currencies.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
              >
                <MenuItem value="" disabled>Select a category</MenuItem>
                {currentCategories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControlLabel
                control={<Switch checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} color="primary" />}
                label="Recurring transaction"
                sx={{ width: '100%' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
          />
          <TextField
            select
            margin="dense"
            label="Account Type"
            fullWidth
            value={newAccountType}
            onChange={(e) => setNewAccountType(e.target.value)}
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
          />
          <TextField
            select
            margin="dense"
            label="Currency"
            fullWidth
            value={newAccountCurrency}
            onChange={(e) => setNewAccountCurrency(e.target.value)}
          >
            {constants.currencies.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAccountDialog}>Cancel</Button>
          <Button onClick={handleCreateAccount}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddTransactionCard;