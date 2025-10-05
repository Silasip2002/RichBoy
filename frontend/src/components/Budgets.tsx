import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography, Paper, Box, Button, Grid, LinearProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel, Tabs, Tab
} from '@mui/material';
import { Add } from '@mui/icons-material';
import constants from '../data/constants.json';
import { getBudgets, createBudget, Budget, BudgetData, getUserProfile, getBudgetSummary } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const getProgressColor = (value: number) => {
    if (value > 90) {
        return 'error';
    }
    if (value > 75) {
        return 'warning';
    }
    return 'success';
};

// Helper function for currency formatting
const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const BudgetRow: React.FC<Budget> = ({ category, budgeted_amount, currency, spent_amount, period }) => {
    const spentPercentage = budgeted_amount > 0 ? (spent_amount / budgeted_amount) * 100 : 0;
    const remaining = budgeted_amount - spent_amount;

    return (
        <Box component={Paper} sx={{ p: 2, mb: 2, borderRadius: '12px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.8)' }}>
            <Box sx={{ display: 'flex', justifyContent: "space-between" }}>
                <Typography variant="body1">{category} ({period})</Typography>
                <Box>
                    <Typography variant="caption">{currency} {spent_amount.toFixed(2)} / {currency} {budgeted_amount.toFixed(2)}</Typography>
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

interface BudgetsProps {
    refreshSummary?: number;
}

const Budgets = ({ refreshSummary = 0 }: BudgetsProps = {}) => {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState('Month');
    const [currency, setCurrency] = useState('USD');
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [filter, setFilter] = useState('All');
    const [userProfile, setUserProfile] = useState<{ preferred_currency: string } | null>(null);
    const [totalBudgeted, setTotalBudgeted] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [remainingBalance, setRemainingBalance] = useState(0);
    const [summaryCurrency, setSummaryCurrency] = useState('USD');

    // Fetch user profile and budget summary
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (token) {
                try {
                    const profile = await getUserProfile(token);
                    setUserProfile(profile);
                } catch (error) {
                    console.error('Failed to fetch user profile', error);
                }
            }
        };

        fetchUserProfile();
    }, [token]);

    const fetchBudgets = useCallback(async () => {
        if (token) {
            try {
                const data = await getBudgets(token);
                setBudgets(data.results);
            } catch (error) {
                console.error('Failed to fetch budgets', error);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAddBudget = async () => {
        if (category && amount && token) {
            const budgetData: BudgetData = {
                category,
                budgeted_amount: amount,
                currency,
                period,
            };
            try {
                await createBudget(token, budgetData);
                fetchBudgets();
                handleClose();
                setCategory('');
                setAmount('');
                setPeriod('Month');
                setCurrency('USD');
            } catch (error) {
                console.error('Failed to create budget', error);
            }
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
        acc.budgeted += budget.budgeted_amount;
        acc.spent += budget.spent_amount;
        return acc;
    }, { budgeted: 0, spent: 0 });

    const remainingTotal = totals.budgeted - totals.spent;

    // Fetch budget summary from backend (server-side conversion)
    useEffect(() => {
        const fetchBudgetSummary = async () => {
            if (token) {
                try {
                    const summary = await getBudgetSummary(token);
                    setTotalBudgeted(summary.total_budgeted);
                    setTotalSpent(summary.total_spent);
                    setRemainingBalance(summary.remaining_balance);
                    setSummaryCurrency(summary.preferred_currency);

                    // Update user profile if currency changed
                    if (userProfile && userProfile.preferred_currency !== summary.preferred_currency) {
                        setUserProfile({ ...userProfile, preferred_currency: summary.preferred_currency });
                    }
                } catch (error) {
                    console.error('Failed to fetch budget summary', error);
                    // Fallback to local totals if API fails
                    setTotalBudgeted(totals.budgeted);
                    setTotalSpent(totals.spent);
                    setRemainingBalance(remainingTotal);
                    setSummaryCurrency(userProfile?.preferred_currency || 'USD');
                }
            }
        };

        fetchBudgetSummary();
    }, [token, refreshSummary, budgets.length, totals.budgeted, totals.spent, remainingTotal, userProfile, setUserProfile]);

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
                <BudgetRow key={budget.id} {...budget} />
            ))}
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2, borderTop: '2px solid #ddd', pt: 2 }}>
                <Grid size={4}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Total: {formatCurrency(totalBudgeted, summaryCurrency)}
                    </Typography>
                </Grid>
                <Grid size={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Used: {formatCurrency(totalSpent, summaryCurrency)}
                    </Typography>
                </Grid>
                <Grid size={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: remainingBalance > 0 ? 'green' : 'red' }}>
                        Remain: {formatCurrency(remainingBalance, summaryCurrency)}
                    </Typography>
                </Grid>
            </Grid>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Add a New Budget</DialogTitle>
                <DialogContent sx={{ minHeight: '250px' }}>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            label="Category"
                        >
                            {constants.transactionCategories.expense.map((cat) => (
                                <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Budget Amount"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Currency</InputLabel>
                        <Select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            label="Currency"
                        >
                            {constants.currencies.map((cur) => (
                                <MenuItem key={cur.value} value={cur.value}>{cur.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
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
