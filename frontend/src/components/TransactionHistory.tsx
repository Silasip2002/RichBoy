import React, { useState, useEffect } from 'react';
import constants from '../data/constants.json';
import { useAuth } from '../contexts/AuthContext';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { getTransactionSummary } from '../services/api';

interface Transaction {
    id: number;
    transaction_type: string;
    amount: string;
    currency: string;
    description: string;
    category: string;
    date: string;
    account: string;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    search: string;
    setSearch: (search: string) => void;
    time: string;
    setTime: (time: string) => void;
    type: string;
    setType: (type: string) => void;
    category: string;
    setCategory: (category: string) => void;
    account: string;
    setAccount: (account: string) => void;
    accounts: { id: number; name: string }[];
    refreshSummary: number;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
    transactions,
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    search,
    setSearch,
    time,
    setTime,
    type,
    setType,
    category,
    setCategory,
    account,
    setAccount,
    accounts,
    refreshSummary,
}) => {
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [netBalance, setNetBalance] = useState(0);
    const [summaryCurrency, setSummaryCurrency] = useState('USD');
    const { token } = useAuth();

    // Helper function for currency formatting
    const formatCurrency = (value: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { // 'en-US' for standard US formatting, can be dynamic
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    useEffect(() => {
        const fetchSummary = async () => {
            if (token) {
                try {
                    const summary = await getTransactionSummary(token);
                    setTotalIncome(summary.total_income);
                    setTotalExpense(summary.total_expense);
                    setNetBalance(summary.net_balance);
                    setSummaryCurrency(summary.preferred_currency);
                } catch (error) {
                    console.error('Failed to fetch transaction summary', error);
                }
            }
        };

        fetchSummary();
    }, [token, refreshSummary]);

    const allCategories = [...constants.transactionCategories.income, ...constants.transactionCategories.expense];

    return (
        <Card sx={{ width: '100%' }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Transaction History
                </Typography>
                {/* TODO1: search function and filter functions here  
                    1.serach function by the keywods
                    2.filter by time : all time/ this month/ last month/ custom ragne
                    3. filter by the type : all type / income/ expense
                    4. filter by the categoreis
                    5.filter by the accounts 
                */}
                <Box sx={{ display: 'flex', gap: 2, my: 2, flexWrap: 'wrap' }}>
                    <TextField label="Search" variant="outlined" size="small" sx={{ flexGrow: 1, minWidth: '200px' }} value={search} onChange={(e) => setSearch(e.target.value)} />
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Time</InputLabel>
                        <Select value={time} onChange={(e) => setTime(e.target.value)}>
                            <MenuItem value="all">All Time</MenuItem>
                            <MenuItem value="month">This Month</MenuItem>
                            <MenuItem value="last_month">Last Month</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Type</InputLabel>
                        <Select value={type} onChange={(e) => setType(e.target.value)}>
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="income">Income</MenuItem>
                            <MenuItem value="expense">Expense</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Category</InputLabel>
                        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <MenuItem value="all">All</MenuItem>
                            {allCategories.map((cat) => (
                                <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Account</InputLabel>
                        <Select value={account} onChange={(e) => setAccount(e.target.value)}>
                            <MenuItem value="all">All</MenuItem>
                            {accounts.map((acc) => (
                                <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>                {/* TODO2 : show the total icome , total expense and net balance */}
                <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 2 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#d4edda', color: '#155724', textAlign: 'center' }}>
                        <Typography variant="h6">Total Income</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatCurrency(totalIncome, summaryCurrency)}</Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8d7da', color: '#721c24', textAlign: 'center' }}>
                        <Typography variant="h6">Total Expense</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatCurrency(totalExpense, summaryCurrency)}</Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: netBalance >= 0 ? '#d4edda' : '#f8d7da', color: netBalance >= 0 ? '#155724' : '#721c24', textAlign: 'center' }}>
                        <Typography variant="h6">Net Balance</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatCurrency(netBalance, summaryCurrency)}</Typography>
                    </Box>
                </Box>
                <TableContainer sx={{ maxHeight: 440, overflowY: 'auto' }}>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Account</TableCell>
                                <TableCell align="right">Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions
                                .slice()
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((transaction) => (
                                    <TableRow
                                        key={transaction.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {transaction.date}
                                        </TableCell>
                                        <TableCell>{transaction.description}</TableCell>
                                        <TableCell>{transaction.category}</TableCell>
                                        <TableCell>{accounts.find(acc => acc.id === parseInt(transaction.account))?.name || transaction.account}</TableCell>
                                        <TableCell align="right">{`${transaction.amount} ${transaction.currency}`}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={count}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={onPageChange}
                    onRowsPerPageChange={onRowsPerPageChange}
                />
            </CardContent>
        </Card>
    );
};

export default TransactionHistory;