import React, { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import { PieChart, pieArcClasses } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { getAllTransactions, Transaction } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface CategoryData {
    category: string;
    value: number;
    percentage: number;
    label: string;
}

interface MonthlyData {
    month: string;
    income: number;
    expense: number;
}

const Reports = () => {
    const { token } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add touch-friendly scrolling for mobile
    React.useEffect(() => {
        if (isMobile) {
            document.body.style.touchAction = 'pan-y';
            return () => {
                document.body.style.touchAction = '';
            };
        }
    }, [isMobile]);

    useEffect(() => {
        const fetchCategoryData = async () => {
            if (!token) return;

            try {
                setLoading(true);
                const transactions = await getAllTransactions(token);

                // Group transactions by category and calculate totals
                const categoryTotals: { [key: string]: number } = {};
                let totalAmount = 0;

                // Group transactions by month for income vs expense
                const monthlyTotals: { [key: string]: { income: number; expense: number } } = {};

                transactions.forEach((transaction: Transaction) => {
                    const amount = transaction.amount;
                    const category = transaction.category || 'Uncategorized';
                    const transactionDate = new Date(transaction.date);
                    const monthKey = transactionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                    // Initialize month if not exists
                    if (!monthlyTotals[monthKey]) {
                        monthlyTotals[monthKey] = { income: 0, expense: 0 };
                    }

                    // Process category data for expenses
                    if (transaction.transaction_type === 'expense') {
                        categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(amount);
                        totalAmount += Math.abs(amount);
                        monthlyTotals[monthKey].expense += Math.abs(amount);
                    } else if (transaction.transaction_type === 'income') {
                        monthlyTotals[monthKey].income += amount;
                    }
                });

                // Convert category data to array format and calculate percentages
                const categoryDataResult: CategoryData[] = Object.entries(categoryTotals)
                    .map(([category, amount]) => ({
                        category,
                        value: amount,
                        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
                        label: `${category}: ${((amount / totalAmount) * 100).toFixed(1)}%`
                    }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10); // Top 10 categories

                // Convert monthly data to array and sort by date
                const monthlyDataResult: MonthlyData[] = Object.entries(monthlyTotals)
                    .map(([month, data]) => ({
                        month,
                        income: data.income,
                        expense: data.expense
                    }))
                    .sort((a, b) => {
                        // Sort by date (most recent first)
                        const dateA = new Date(a.month);
                        const dateB = new Date(b.month);
                        return dateB.getTime() - dateA.getTime();
                    })
                    .slice(0, 12); // Last 12 months

                setCategoryData(categoryDataResult);
                setMonthlyData(monthlyDataResult);
            } catch (err) {
                setError('Failed to load transaction data');
                console.error('Error fetching category data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryData();
    }, [token]);

    const chartData = categoryData.map((item, index) => ({
        id: index,
        value: item.value,
        label: item.category,
        percentage: item.percentage
    }));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    if (categoryData.length === 0 && monthlyData.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6" color="textSecondary">
                    No transactions found to display reports
                </Typography>
            </Box>
        );
    }

    const settings = {
        margin: { right: 5 },
        hideLegend: isMobile ? true : false,
    };

    return (
        <Box sx={{
            px: 0,
            py: 1,
            width: '100%',
            maxWidth: isMobile ? '75vw' : '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom sx={{ textAlign: 'center', mb: 0.5, width: '100%' }}>
                Transaction Analysis
            </Typography>

            <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2, width: '100%' }}>
                Your financial insights at a glance
            </Typography>

            <Card sx={{ mb: 1.5, width: '100%', maxWidth: isMobile ? '95vw' : '100%' }}>
                <CardContent sx={{ pb: 1 }}>
                    <Typography variant="h6" gutterBottom align="center">
                        📊 Expense Categories
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block" align="center" gutterBottom>
                        Where your money goes (top 10)
                    </Typography>

                    <Box sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        my: 1
                    }}>
                        <PieChart
                            {...settings}
                            series={[
                                {
                                    data: chartData,
                                    innerRadius: isMobile ? 30 : 50,
                                    outerRadius: isMobile ? 70 : 120,
                                    paddingAngle: 1,
                                    cornerRadius: 2,
                                    startAngle: -90,
                                    endAngle: 270,
                                    cx: '50%',
                                    cy: '50%',
                                    arcLabel: 'value',
                                    highlightScope: { fade: 'global', highlight: 'item' },
                                    valueFormatter: (value) => formatCurrency(value.value),
                                },
                            ]}
                            sx={{
                                [`& .${pieArcClasses.faded}`]: {
                                    fill: 'gray',
                                    opacity: 0.3,
                                },
                            }}
                            width={isMobile ? Math.min(window.innerWidth - 40, 320) : 400}
                            height={isMobile ? 280 : 350}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Income vs Expense Bar Chart */}
            {monthlyData.length > 0 && (
                <Card sx={{ mb: 1.5, width: '100%', maxWidth: isMobile ? '95vw' : '100%' }}>
                    <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" gutterBottom align="center">
                            💰 Income vs Expenses
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block" align="center" gutterBottom>
                            Monthly comparison (last 12 months)
                        </Typography>

                        <Box sx={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            mt: 1,
                            overflow: 'auto',
                            pb: 0.5
                        }}>
                            <BarChart
                                xAxis={[
                                    {
                                        data: monthlyData.slice(0, isMobile ? 6 : 12).map(item => item.month),
                                        scaleType: 'band',
                                        tickLabelStyle: {
                                            angle: isMobile ? -45 : 0,
                                            textAnchor: 'end',
                                            fontSize: isMobile ? 9 : 11,
                                        },
                                    }
                                ]}
                                series={[
                                    {
                                        data: monthlyData.slice(0, isMobile ? 6 : 12).map(item => item.income),
                                        label: 'Income',
                                        color: theme.palette.success.main,
                                        valueFormatter: (value) => formatCurrency(Number(value)),
                                    },
                                    {
                                        data: monthlyData.slice(0, isMobile ? 6 : 12).map(item => item.expense),
                                        label: 'Expense',
                                        color: theme.palette.error.main,
                                        valueFormatter: (value) => formatCurrency(Number(value)),
                                    }
                                ]}
                                width={isMobile ? Math.min(window.innerWidth - 40, 350) : Math.min(window.innerWidth - 100, 700)}
                                height={isMobile ? 250 : 350}
                                margin={{
                                    top: 20,
                                    right: isMobile ? 10 : 30,
                                    left: isMobile ? 60 : 80,
                                    bottom: isMobile ? 80 : 60
                                }}
                                slotProps={{
                                    legend: {
                                        direction: 'horizontal' as const,
                                        position: { vertical: 'top', horizontal: 'center' },
                                    },
                                }}
                            />
                        </Box>

                        {/* Summary Statistics */}
                        <Box sx={{ mt: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom align="center">
                                📈 Financial Summary
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? 1 : 1.5,
                                mt: 1
                            }}>
                                <Box sx={{
                                    p: isMobile ? 1 : 1.5,
                                    bgcolor: 'success.light',
                                    borderRadius: 2,
                                    textAlign: 'center',
                                    flex: 1,
                                    border: '2px solid',
                                    borderColor: 'success.main'
                                }}>
                                    <Typography variant={isMobile ? "body2" : "h6"} color="success.dark" gutterBottom>
                                        💵 Total Income
                                    </Typography>
                                    <Typography variant={isMobile ? "h6" : "h5"} color="success.dark" fontWeight="bold">
                                        {formatCurrency(monthlyData.reduce((sum, item) => sum + item.income, 0))}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: isMobile ? 1 : 1.5,
                                    bgcolor: 'error.light',
                                    borderRadius: 2,
                                    textAlign: 'center',
                                    flex: 1,
                                    border: '2px solid',
                                    borderColor: 'error.main'
                                }}>
                                    <Typography variant={isMobile ? "body2" : "h6"} color="error.dark" gutterBottom>
                                        💸 Total Expenses
                                    </Typography>
                                    <Typography variant={isMobile ? "h6" : "h5"} color="error.dark" fontWeight="bold">
                                        {formatCurrency(monthlyData.reduce((sum, item) => sum + item.expense, 0))}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: isMobile ? 1 : 1.5,
                                    bgcolor: monthlyData.reduce((sum, item) => sum + item.income, 0) >= monthlyData.reduce((sum, item) => sum + item.expense, 0) ? 'info.light' : 'warning.light',
                                    borderRadius: 2,
                                    textAlign: 'center',
                                    flex: 1,
                                    border: '2px solid',
                                    borderColor: monthlyData.reduce((sum, item) => sum + item.income, 0) >= monthlyData.reduce((sum, item) => sum + item.expense, 0) ? 'info.main' : 'warning.main'
                                }}>
                                    <Typography variant={isMobile ? "body2" : "h6"} color={monthlyData.reduce((sum, item) => sum + item.income, 0) >= monthlyData.reduce((sum, item) => sum + item.expense, 0) ? 'info.dark' : 'warning.dark'} gutterBottom>
                                        {monthlyData.reduce((sum, item) => sum + item.income, 0) >= monthlyData.reduce((sum, item) => sum + item.expense, 0) ? '✅ Net Balance' : '⚠️ Net Balance'}
                                    </Typography>
                                    <Typography variant={isMobile ? "h6" : "h5"} color={monthlyData.reduce((sum, item) => sum + item.income, 0) >= monthlyData.reduce((sum, item) => sum + item.expense, 0) ? 'info.dark' : 'warning.dark'} fontWeight="bold">
                                        {formatCurrency(monthlyData.reduce((sum, item) => sum + item.income, 0) - monthlyData.reduce((sum, item) => sum + item.expense, 0))}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default Reports;