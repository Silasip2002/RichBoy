import React, { useState } from 'react';
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

const AddTransactionCard: React.FC<AddTransactionCardProps> = ({ onTransactionAdded }) => {
  const [transactionType, setTransactionType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [account, setAccount] = useState('');
  const { token } = useAuth();

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

  return (
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
          <Grid item xs={12}>
            <ToggleButtonGroup
              value={transactionType}
              exclusive
              onChange={handleTransactionTypeChange}
              fullWidth
              sx={{
                display: 'flex',
                gap: 4,
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
              <ToggleButton value="expense" >
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
            <TextField
              select
              label="Account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              fullWidth
            >
              <MenuItem value="" disabled>Select an account</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="bank">Bank Account</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} width={"100%"}>
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
              control={<Switch checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} color="primary"/>}
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
  );
};

export default AddTransactionCard;
