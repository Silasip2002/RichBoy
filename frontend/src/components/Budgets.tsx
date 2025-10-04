import React from 'react';
import { Typography, Paper, Box, Button, Grid, LinearProgress } from '@mui/material';
import { Add } from '@mui/icons-material';

interface Budget {
    category: string;
    budgeted: number;
    currency?: string;
    spent: number;
}

const budgetsData: Budget[] = [
    { category: 'Groceries', currency:"USD", budgeted: 500, spent: 250 },
    { category: 'Entertainment', currency:"CNY",budgeted: 200, spent: 80 },
    { category: 'Shopping', currency:"HKD", budgeted: 300, spent: 250 },
    { category: 'Transportation',currency:"CAD",  budgeted: 150, spent: 140 },
    { category: 'Utilities', currency:"USD", budgeted: 100, spent: 110 },
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

const BudgetRow: React.FC<Budget> = ({ category, budgeted, currency, spent }) => {
    const spentPercentage = (spent / budgeted) * 100;
    const remaining = budgeted - spent;

    return (
        <Box component={Paper} sx={{ p: 2, mb: 2, borderRadius: '12px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.8)' }}>
            <Box sx={{ display: 'flex', justifyContent: "space-between" }}>
                <Typography variant="body1">{category}</Typography>
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
            <Box sx={{display:"flex", justifyContent:"space-between"}}>
                <Typography variant="body2" color="text.secondary">{spentPercentage.toFixed(0)}% used</Typography>
                <Typography variant="body2" sx={{ color: remaining > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    {currency} {remaining.toFixed(2)} remaining
                </Typography>
            </Box>
        </Box>
    );
};

const Budgets = () => {
    const totals = budgetsData.reduce((acc, budget) => {
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
                    sx={{ textTransform: 'none', borderRadius: '8px' }}
                >
                    Add Budget
                </Button>
            </Box>

            {budgetsData.map((budget) => (
                <BudgetRow key={budget.category} {...budget} />
            ))}
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2, borderTop: '2px solid #ddd', pt: 2 }}>
                <Grid size={3}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total: ${totals.budgeted.toFixed(2)}</Typography>
                </Grid>
                <Grid size={3} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Used: ${totals.spent.toFixed(2)}</Typography>
                </Grid>
                <Grid size={3} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: remainingTotal > 0 ? 'green' : 'red' }}>
                        Remain: ${remainingTotal.toFixed(2)}
                    </Typography>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default Budgets;
