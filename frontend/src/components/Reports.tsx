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

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Transaction Categories Analysis
            </Typography>

            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                Breakdown of expenses by category (showing top 10 categories)
            </Typography>

            <Card>
                <CardContent>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                        <PieChart
                            series={[
                                {
                                    data: chartData,
                                    innerRadius: isMobile ? 40 : 60,
                                    outerRadius: isMobile ? 100 : 140,
                                    paddingAngle: 2,
                                    cornerRadius: 4,
                                    startAngle: -90,
                                    endAngle: 270,
                                    cx: '50%',
                                    cy: '50%',
                                    highlightScope: { fade: 'global', highlighted: 'item' },
                                    valueFormatter: (value) => formatCurrency(value.value),
                                },
                            ]}
                            slotProps={{
                                legend: {
                                    direction: isMobile ? 'row' : 'column',
                                    position: isMobile ? { vertical: 'bottom', horizontal: 'middle' } : { vertical: 'middle', horizontal: 'right' },
                                    itemMarkWidth: 15,
                                    itemMarkHeight: 8,
                                    markGap: 4,
                                    itemGap: 8,
                                    labelStyle: {
                                        fontSize: isMobile ? 10 : 12,
                                    },
                                },
                            }}
                            sx={{
                                [`& .${pieArcClasses.faded}`]: {
                                    fill: 'gray',
                                },
                            }}
                            width={isMobile ? 350 : 500}
                            height={isMobile ? 300 : 400}
                        />
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Category Breakdown
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: 2
                        }}>
                            {categoryData.map((item, index) => (
                                <Box
                                    key={item.category}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 1,
                                        bgcolor: 'background.paper',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Typography variant={isMobile ? "body2" : "body1"}>
                                        {index + 1}. {item.category}
                                    </Typography>
                                    <Typography
                                        variant={isMobile ? "caption" : "body2"}
                                        fontWeight="bold"
                                        sx={{ ml: 1 }}
                                    >
                                        {formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Income vs Expense Bar Chart */}
            {monthlyData.length > 0 && (
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Income vs Expense Comparison
                        </Typography>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Monthly comparison of income and expenses (last 12 months)
                        </Typography>

                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <BarChart
                                xAxis={[
                                    {
                                        data: monthlyData.map(item => item.month),
                                        scaleType: 'band',
                                        tickLabelStyle: {
                                            angle: -45,
                                            textAnchor: 'end',
                                            fontSize: 10,
                                        },
                                    }
                                ]}
                                series={[
                                    {
                                        data: monthlyData.map(item => item.income),
                                        label: 'Income',
                                        color: theme.palette.success.main,
                                    },
                                    {
                                        data: monthlyData.map(item => item.expense),
                                        label: 'Expense',
                                        color: theme.palette.error.main,
                                    }
                                ]}
                                width={isMobile ? Math.min(window.innerWidth - 100, 600) : 800}
                                height={isMobile ? 300 : 400}
                                margin={{ top: 20, right: 30, left: 80, bottom: 100 }}
                                slotProps={{
                                    legend: {
                                        direction: 'row' as const,
                                        position: { vertical: 'top', horizontal: 'center' as const },
                                        itemGap: 20,
                                    },
                                }}
                            />
                        </Box>

                        {/* Summary Statistics */}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Summary Statistics
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                                gap: 2,
                                mt: 2
                            }}>
                                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center' }}>
                                    <Typography variant="h6" color="success.dark">
                                        Total Income
                                    </Typography>
                                    <Typography variant="h5" color="success.dark" fontWeight="bold">
                                        {formatCurrency(monthlyData.reduce((sum, item) => sum + item.income, 0))}
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, textAlign: 'center' }}>
                                    <Typography variant="h6" color="error.dark">
                                        Total Expenses
                                    </Typography>
                                    <Typography variant="h5" color="error.dark" fontWeight="bold">
                                        {formatCurrency(monthlyData.reduce((sum, item) => sum + item.expense, 0))}
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: monthlyData.reduce((sum, item) => sum + item.income, 0) >= monthlyData.reduce((sum, item) => sum + item.expense, 0) ? 'info.light' : 'warning.light', borderRadius: 1, textAlign: 'center' }}>
                                    <Typography variant="h6" color={monthlyData.reduce((sum, item) => sum + item.income, 0) >= monthlyData.reduce((sum, item) => sum + item.expense, 0) ? 'info.dark' : 'warning.dark'}>
                                        Net Balance
                                    </Typography>
                                    <Typography variant="h5" color={monthlyData.reduce((sum, item) => sum + item.income, 0) >= monthlyData.reduce((sum, item) => sum + item.expense, 0) ? 'info.dark' : 'warning.dark'} fontWeight="bold">
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