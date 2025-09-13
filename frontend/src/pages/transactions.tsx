import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Tabs, Tab } from '@mui/material';
import AddTransactionCard from '../components/AddTransactionCard';
import TransactionHistory from '../components/TransactionHistory';
import Reports from '../components/Reports';
import Accounts from '../components/Accounts';
import Budgets from '../components/Budgets';
import { useAuth } from '../contexts/AuthContext';

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
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const { token } = useAuth();
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const fetchTransactions = useCallback(async () => {
        if (token) {
            const response = await fetch('http://localhost:8000/api/transactions/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

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
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <AddTransactionCard onTransactionAdded={fetchTransactions} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <TransactionHistory transactions={transactions} />
                    </Grid>
                </Grid>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Reports />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <Accounts />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <Budgets />
            </TabPanel>
        </Box>
    );
};

export default TransactionsPage;
