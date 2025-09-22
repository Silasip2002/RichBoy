import React, { useState, useEffect } from 'react';
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
import constants from '../data/constants.json';

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
}) => {
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [netBalance, setNetBalance] = useState(0);
    const { token } = useAuth();

    useEffect(() => {
        const fetchAllTransactions = async () => {
            if (token) {
                let allTransactions: Transaction[] = [];
                let page = 1;
                while (true) {
                    const response = await fetch(`http://localhost:8000/api/transactions/?page=${page}&page_size=100`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        allTransactions = [...allTransactions, ...data.results];
                        if (!data.next) {
                            break;
                        }
                        page++;
                    } else {
                        break;
                    }
                }

                const { totalIncome, totalExpense, netBalance } = allTransactions.reduce(
                    (acc, transaction) => {
                        const amount = parseFloat(transaction.amount);
                        if (transaction.transaction_type === 'income') {
                            acc.totalIncome += amount;
                        } else if (transaction.transaction_type === 'expense') {
                            acc.totalExpense += amount;
                        }
                        acc.netBalance = acc.totalIncome - acc.totalExpense;
                        return acc;
                    },
                    { totalIncome: 0, totalExpense: 0, netBalance: 0 }
                );

                setTotalIncome(totalIncome);
                setTotalExpense(totalExpense);
                setNetBalance(netBalance);
            }
        };

        fetchAllTransactions();
    }, [token]);

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
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{totalIncome.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8d7da', color: '#721c24', textAlign: 'center' }}>
                        <Typography variant="h6">Total Expense</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{totalExpense.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: netBalance >= 0 ? '#d4edda' : '#f8d7da', color: netBalance >= 0 ? '#155724' : '#721c24', textAlign: 'center' }}>
                        <Typography variant="h6">Net Balance</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{netBalance.toFixed(2)}</Typography>
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
                            {transactions.map((transaction) => (
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