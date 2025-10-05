import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, useTheme, useMediaQuery, Typography } from '@mui/material';
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{
                    p: isMobile ? 1 : 2,
                    pb: isMobile ? 8 : 2 // Extra bottom padding for mobile FAB
                }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const TransactionsPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

    // For mobile, we want fewer rows per page by default
    React.useEffect(() => {
        if (isMobile && rowsPerPage > 10) {
            setRowsPerPage(10);
        }
    }, [isMobile, rowsPerPage]);

    return (
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            pb: isMobile ? 7 : 0 // Bottom navigation space
        }}>
            {/* Mobile-optimized Header */}
            <Box sx={{
                px: isMobile ? 2 : 3,
                py: isMobile ? 2 : 3,
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: 'sticky',
                top: 0,
                zIndex: 1100
            }}>
                <Typography
                    variant={isMobile ? "h5" : "h4"}
                    component="h1"
                    sx={{
                        fontWeight: 'bold',
                        textAlign: isMobile ? 'center' : 'left',
                        mb: isMobile ? 2 : 3
                    }}
                >
                    💰 Finance Manager
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        aria-label="finance tabs"
                        variant={isMobile ? "fullWidth" : "standard"}
                        scrollButtons={isMobile ? "auto" : false}
                        allowScrollButtonsMobile
                        sx={{
                            '& .MuiTab-root': {
                                minWidth: isMobile ? 'auto' : 160,
                                fontSize: isMobile ? '0.875rem' : '0.875rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                py: isMobile ? 1 : 2
                            }
                        }}
                    >
                        <Tab label={isMobile ? "📝" : "Transactions"} />
                        <Tab label={isMobile ? "📊" : "Reports"} />
                        <Tab label={isMobile ? "🏦" : "Accounts"} />
                        <Tab label={isMobile ? "📋" : "Budgets"} />
                    </Tabs>
                </Box>
            </Box>
            <TabPanel value={value} index={0}>
                {isMobile ? (
                    // Mobile Layout: Transaction History first, then Add Transaction below
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Transaction History */}
                        <Box>
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
                                onRefresh={handleTransactionAdded}
                                isMobile={isMobile}
                            />
                        </Box>

                        {/* Add Transaction Card - below transaction history on mobile */}
                        <Box>
                            <AddTransactionCard
                                onTransactionAdded={handleTransactionAdded}
                                isMobile={isMobile}
                            />
                        </Box>
                    </Box>
                ) : (
                    // Desktop Layout: Side-by-side layout
                    <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)' }}>
                        {/* Transaction History - takes up most of the space */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                                onRefresh={handleTransactionAdded}
                                isMobile={isMobile}
                            />
                        </Box>

                        {/* Add Transaction Card - fixed width on right side */}
                        <Box sx={{ width: 380, flexShrink: 0 }}>
                            <AddTransactionCard
                                onTransactionAdded={handleTransactionAdded}
                                isMobile={isMobile}
                            />
                        </Box>
                    </Box>
                )}
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