import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

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

  const handleTransactionTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionType(event.target.value);
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
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Add Transaction
        </Typography>
        <FormControl component="fieldset" sx={{ mb: 1 }}>
          <FormLabel component="legend" sx={{ fontSize: '0.8rem' }}>Transaction Type</FormLabel>
          <RadioGroup
            row
            aria-label="transaction-type"
            name="transaction-type"
            value={transactionType}
            onChange={handleTransactionTypeChange}
          >
            <FormControlLabel value="income" control={<Radio size="small" />} label={<Typography variant="body2">Income</Typography>} />
            <FormControlLabel value="expense" control={<Radio size="small" />} label={<Typography variant="body2">Expense</Typography>} />
          </RadioGroup>
        </FormControl>
        <TextField
          label="Amount"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ mb: 1.5 }}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <FormControl fullWidth sx={{ mb: 1.5 }} size="small">
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            displayEmpty
            MenuProps={{
                disableScrollLock: true,
                anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left"
                },
                transformOrigin: {
                    vertical: "top",
                    horizontal: "left"
                },
                getContentAnchorEl: null
            }}
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="HKD">HKD</MenuItem>
            <MenuItem value="RMB">RMB</MenuItem>
            <MenuItem value="CAD">CAD</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Description"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ mb: 1.5 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FormControl fullWidth sx={{ mb: 1.5 }} size="small">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            displayEmpty
            MenuProps={{
                disableScrollLock: true,
                anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left"
                },
                transformOrigin: {
                    vertical: "top",
                    horizontal: "left"
                },
                getContentAnchorEl: null
            }}
          >
            <MenuItem value="" disabled>
              Category
            </MenuItem>
            <MenuItem value="food">Food</MenuItem>
            <MenuItem value="transportation">Transportation</MenuItem>
            <MenuItem value="salary">Salary</MenuItem>
            <MenuItem value="utilities">Utilities</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 1.5 }} size="small">
          <Select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            displayEmpty
            MenuProps={{
                disableScrollLock: true,
                anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left"
                },
                transformOrigin: {
                    vertical: "top",
                    horizontal: "left"
                },
                getContentAnchorEl: null
            }}
          >
            <MenuItem value="" disabled>
              Account
            </MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="bank">Bank</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Date"
          variant="outlined"
          fullWidth
          size="small"
          sx={{ mb: 1.5 }}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <FormControlLabel
          control={<Switch checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />}
          label="Recurring Transaction"
          sx={{ mb: 1, display: 'block' }}
        />
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSaveTransaction} fullWidth>
            Save Transaction
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AddTransactionCard;
