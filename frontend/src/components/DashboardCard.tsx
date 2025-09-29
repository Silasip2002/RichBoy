import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getPortfolioSummary } from '../services/api';

const DashboardCard: React.FC = () => {
  const { token } = useAuth();
  const [totalPortfolioValue, setTotalPortfolioValue] = useState("$0.00");
  const [todaysChange, setTodaysChange] = useState("+$0.00 (+0.00%)");
  const [cashBalance, setCashBalance] = useState("$0.00");

  useEffect(() => {
    const fetchPortfolioSummary = async () => {
      if (!token) return;
      try {
        const data = await getPortfolioSummary(token);
        console.log('Portfolio Summary Data:', data);
        const currency = data.preferred_currency;

        const formattedTotalValue = data.total_portfolio_value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setTotalPortfolioValue(`${currency} ${formattedTotalValue}`);

        setTodaysChange(`${data.todays_change >= 0 ? '+' : ''}${data.todays_change.toFixed(2)}%`);

        const formattedCashBalance = data.cash_balance.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setCashBalance(`${currency} ${formattedCashBalance}`);
      } catch (error) {
        console.error('Failed to fetch portfolio summary', error);
      }
    };

    fetchPortfolioSummary();
  }, [token]);

  // Determine color for Today's Change
  const isPositiveChange = todaysChange.startsWith('+');
  const changeColor = isPositiveChange ? 'success.main' : 'error.main';

  return (
    <Card sx={{ minWidth: 275, mb: 3 }}>
      <CardContent >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%', flexGrow: 1 }}> 
          <Box sx={{ width: '25%', flexGrow: 1 }}> 
            <Typography variant="subtitle2" color="text.secondary">
              Total Portfolio Value
            </Typography>
            <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
              {totalPortfolioValue}
            </Typography>
          </Box>
          <Box sx={{ width: '25%', flexGrow: 1 }}> 
            <Typography variant="subtitle2" color="text.secondary">
              Today&apos;s Change
            </Typography>
            <Typography variant="h6" component="div" sx={{ fontSize: '1rem', color: changeColor }}>
              {todaysChange}
            </Typography>
          </Box>
          <Box sx={{ width: '25%', flexGrow: 1 }}> 
            <Typography variant="subtitle2" color="text.secondary">
              Annual Return
            </Typography>
            <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
              +15.00%
            </Typography>
          </Box>
          <Box sx={{ width: '25%', flexGrow: 1 }}> {/* Replaced Grid item with Box */}
            <Typography variant="subtitle2" color="text.secondary">
              Cash Balance
            </Typography>
            <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
              {cashBalance}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;