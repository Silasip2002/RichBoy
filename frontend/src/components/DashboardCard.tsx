import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const DashboardCard: React.FC = () => {
  // Static data for now, will be dynamic later
  const totalPortfolioValue = "$1,234,567.89";
  const todaysChange = "+$1,234.56 (+1.23%)";
  const annualReturn = "+15.00%";
  const cashBalance = "$50,000.00";

  // Determine color for Today's Change
  const isPositiveChange = todaysChange.startsWith('+');
  const changeColor = isPositiveChange ? 'success.main' : 'error.main';

  return (
    <Card sx={{ minWidth: 275, mb: 3 }}>
      <CardContent >
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Portfolio Overview
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%', flexGrow: 1 }}> 
          <Box sx={{ width: '25%', flexGrow: 1 }}> 
            <Typography variant="subtitle2" color="text.secondary">
              Total Portfolio Value
            </Typography>
            <Typography variant="h5" component="div">
              {totalPortfolioValue}
            </Typography>
          </Box>
          <Box sx={{ width: '25%', flexGrow: 1 }}> 
            <Typography variant="subtitle2" color="text.secondary">
              Today&apos;s Change
            </Typography>
            <Typography variant="h5" component="div" sx={{ color: changeColor }}>
              {todaysChange}
            </Typography>
          </Box>
          <Box sx={{ width: '25%', flexGrow: 1 }}> 
            <Typography variant="subtitle2" color="text.secondary">
              Annual Return
            </Typography>
            <Typography variant="h5" component="div">
              {annualReturn}
            </Typography>
          </Box>
          <Box sx={{ width: '25%', flexGrow: 1 }}> {/* Replaced Grid item with Box */}
            <Typography variant="subtitle2" color="text.secondary">
              Cash Balance
            </Typography>
            <Typography variant="h5" component="div">
              {cashBalance}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
