import React, { useState } from 'react';
import {
    Typography, Paper, Box, Button, Grid, LinearProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel, Tabs, Tab
} from '@mui/material';
import { Add } from '@mui/icons-material';
import constants from '../data/constants.json';

interface Budget {
    category: string;
    budgeted: number;
    currency?: string;
    spent: number;
    period?: string;
}

const budgetsData: Budget[] = [
    { category: 'Groceries', currency: "USD", budgeted: 500, spent: 250, period: 'Month' },
    { category: 'Entertainment', currency: "CNY", budgeted: 200, spent: 80, period: 'Month' },
    { category: 'Shopping', currency: "HKD", budgeted: 300, spent: 250, period: 'Month' },
    { category: 'Transportation', currency: "CAD", budgeted: 150, spent: 140, period: 'Month' },
    { category: 'Utilities', currency: "USD", budgeted: 100, spent: 110, period: 'Year' },
];

const getProgressColor = (value: number) => {
    if (value > 90) {
        return 'error';
    }
    if (value > 75) {
        return 'warning';
    }
    return 'success';
};

const BudgetRow: React.FC<Budget> = ({ category, budgeted, currency, spent, period }) => {
    const spentPercentage = (spent / budgeted) * 100;
    const remaining = budgeted - spent;

    return (
        <Box component={Paper} sx={{ p: 2, mb: 2, borderRadius: '12px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.8)' }}>
            <Box sx={{ display: 'flex', justifyContent: "space-between" }}>
                <Typography variant="body1">{category} ({period})</Typography>
                <Box>
                    <Typography variant="caption">{currency} {spent.toFixed(2)} / {currency} {budgeted.toFixed(2)}</Typography>
                </Box>
            </Box>
            <LinearProgress
                variant="determinate"
                value={spentPercentage}
                color={getProgressColor(spentPercentage)}
                sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">{spentPercentage.toFixed(0)}% used</Typography>
                <Typography variant="body2" sx={{ color: remaining > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    {currency} {remaining.toFixed(2)} remaining
                </Typography>
            </Box>
        </Box>
    );
};

const Budgets = () => {
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState('Month');
    const [budgets, setBudgets] = useState<Budget[]>(budgetsData);
    const [filter, setFilter] = useState('All');

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAddBudget = () => {
        if (category && amount) {
            const newBudget: Budget = {
                category,
                budgeted: parseFloat(amount),
                spent: 0,
                currency: 'USD', // Default currency
                period,
            };
            setBudgets([...budgets, newBudget]);
            handleClose();
            setCategory('');
            setAmount('');
            setPeriod('Month');
        }
    };

    const handleFilterChange = (event: React.SyntheticEvent, newValue: string) => {
        setFilter(newValue);
    };

    const filteredBudgets = budgets.filter(budget => {
        if (filter === 'All') return true;
        return budget.period === filter;
    });

    const totals = filteredBudgets.reduce((acc, budget) => {
        acc.budgeted += budget.budgeted;
        acc.spent += budget.spent;
        return acc;
    }, { budgeted: 0, spent: 0 });

    const remainingTotal = totals.budgeted - totals.spent;

    return (
        <Paper sx={{ p: 2, borderRadius: '16px', background: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    Budgets
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleClickOpen}
                    sx={{ textTransform: 'none', borderRadius: '8px' }}
                >
                    Add Budget
                </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={filter} onChange={handleFilterChange} aria-label="budget period filter">
                    <Tab label="All" value="All" />
                    <Tab label="Monthly" value="Month" />
                    <Tab label="Yearly" value="Year" />
                </Tabs>
            </Box>

            {filteredBudgets.map((budget) => (
                <BudgetRow key={budget.category} {...budget} />
            ))}
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2, borderTop: '2px solid #ddd', pt: 2 }}>
                <Grid size={4}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total: ${totals.budgeted.toFixed(2)}</Typography>
                </Grid>
                <Grid size={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Used: ${totals.spent.toFixed(2)}</Typography>
                </Grid>
                <Grid size={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: remainingTotal > 0 ? 'green' : 'red' }}>
                        Remain: ${remainingTotal.toFixed(2)}
                    </Typography>
                </Grid>
            </Grid>
            <Dialog
                open={open}
                onClose={handleClose}
                sx={{
                    '& .MuiDialog-paper': {  // Target the Paper component inside Dialog for fine-tuned centering and width
                        margin: 'auto',  // Ensures horizontal centering
                        maxWidth: '50vw',  // Prevents overflow on small screens (optional safety)
                        width: { xs: '95%', sm: '80%', md: '30%' }  // Responsive widths: narrower on larger screens to avoid "too wide"
                    }
                }}
            >
                <DialogTitle>Add a New Budget</DialogTitle>
                <DialogContent sx={{ minHeight: '250px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            label="Category"
                        >
                            {constants.transactionCategories.expense.map((cat) => (
                                <MenuItem key={cat.value} value={cat.label}>{cat.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Budget Amount"
                        fullWidth
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Period</InputLabel>
                        <Select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            label="Period"
                        >
                            <MenuItem value="Month">Month</MenuItem>
                            <MenuItem value="Year">Year</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleAddBudget}>Add</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default Budgets;
