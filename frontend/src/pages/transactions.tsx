import React, { useState, useEffect, useCallback } from 'react';
import { Box,Tabs, Tab } from '@mui/material';
import AddTransactionCard from '../components/AddTransactionCard';
import TransactionHistory from '../components/TransactionHistory';
import Reports from '../components/Reports';
import Accounts from '../components/Accounts';
import Budgets from '../components/Budgets';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions, getAccounts } from '../services/api';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const TransactionsPage = () => {
    const [value, setValue] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { token } = useAuth();

    const [search, setSearch] = useState('');
    const [time, setTime] = useState('all');
    const [type, setType] = useState('all');
    const [category, setCategory] = useState('all');
    const [account, setAccount] = useState('all');

    const [accounts, setAccounts] = useState([]);
    const [, setRefreshAccounts] = useState(0);
    const [refreshSummary, setRefreshSummary] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const fetchTransactions = useCallback(async () => {
        if (token) {
            const params = new URLSearchParams({
                page: (page + 1).toString(),
                page_size: rowsPerPage.toString(),
                search,
                time,
                type,
                category,
                account,
            });
            try {
                const data = await getTransactions(token, params);
                setTransactions(data.results);
                setCount(data.count);
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
            }
        }
    }, [token, page, rowsPerPage, search, time, type, category, account]);

    const handleTransactionAdded = () => {
        fetchTransactions();
        setRefreshAccounts(prev => prev + 1);
        setRefreshSummary(prev => prev + 1);
    };

    useEffect(() => {
        const fetchFilters = async () => {
            if (token) {
                try {
                    const data = await getAccounts(token);
                    setAccounts(data.results || []);
                } catch (error) {
                    console.error('Failed to fetch accounts:', error);
                }
            }
        };

        fetchFilters();
    }, [token]);

    useEffect(() => {
        if (value === 0) {
            fetchTransactions();
        }
    }, [value, fetchTransactions]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Transactions" />
                    <Tab label="Reports" />
                    <Tab label="Accounts" />
                    <Tab label="Budgets" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <TransactionHistory
                            transactions={transactions}
                            count={count}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            search={search}
                            setSearch={setSearch}
                            time={time}
                            setTime={setTime}
                            type={type}
                            setType={setType}
                            category={category}
                            setCategory={setCategory}
                            account={account}
                            setAccount={setAccount}
                            accounts={accounts}
                            refreshSummary={refreshSummary}
                        />
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '320px' }, flexShrink: 0 }}>
                        <AddTransactionCard onTransactionAdded={handleTransactionAdded} />
                    </Box>
                </Box>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Reports />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <Accounts onDataChange={handleTransactionAdded} />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <Budgets />
            </TabPanel>
        </Box>
    );
};

export default TransactionsPage;