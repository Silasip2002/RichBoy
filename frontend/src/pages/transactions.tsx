import React from 'react';
import { Box } from '@mui/material';
import AddTransactionCard from '../components/AddTransactionCard';

const TransactionsPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <AddTransactionCard />
    </Box>
  );
};

export default TransactionsPage;
