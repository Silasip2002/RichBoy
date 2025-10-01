import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, ButtonGroup, Button } from '@mui/material'; // Added ButtonGroup, Button
import { LineChart } from '@mui/x-charts/LineChart'; // Added LineChart
import { useAuth } from '../contexts/AuthContext';
import { getPortfolioSummary, getPortfolioGrowth } from '../services/api'; // Added getPortfolioGrowth

const DashboardCard: React.FC = () => {
  const { token } = useAuth();
  const [totalPortfolioValue, setTotalPortfolioValue] = useState("$0.00");
  const [todaysChange, setTodaysChange] = useState("+$0.00 (+0.00%)");
  const [annualReturn, setAnnualReturn] = useState("+0.00%");
  const [cashBalance, setCashBalance] = useState("$0.00");

  // New state for portfolio growth chart
  const [portfolioGrowthData, setPortfolioGrowthData] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m'); // Default to 1 month

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

        const todaysChangeValue = parseFloat(data.todays_change_value);
        const todaysChangePercentage = parseFloat(data.todays_change_percentage);
        const formattedChangeValue = todaysChangeValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setTodaysChange(`${todaysChangeValue >= 0 ? '+' : ''}${formattedChangeValue} (${todaysChangePercentage.toFixed(2)}%)`);

        const annualReturnPercentage = parseFloat(data.annual_return_percentage);
        setAnnualReturn(`${annualReturnPercentage >= 0 ? '+' : ''}${annualReturnPercentage.toFixed(2)}%`);

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

  // New useEffect for fetching portfolio growth data
  useEffect(() => {
    const fetchPortfolioGrowth = async () => {
      if (!token) return;
      try {
        const data = await getPortfolioGrowth(token, selectedTimeframe);
        // Format data for LineChart: convert date strings to Date objects
        const formattedData = data.map((item: any) => ({
          ...item,
          date: new Date(item.date),
        }));
        setPortfolioGrowthData(formattedData);
      } catch (error) {
        console.error('Failed to fetch portfolio growth data', error);
      }
    };

    fetchPortfolioGrowth();
  }, [token, selectedTimeframe]);


  // Determine color for Today's Change
  const isPositiveChange = todaysChange.startsWith('+');
  const changeColor = isPositiveChange ? 'success.main' : 'error.main';
  const annualReturnColor = annualReturn.startsWith('+') ? 'success.main' : 'error.main';

  return (
    <Box> {/* Wrapped in a Box to allow multiple Cards */}
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
              <Typography variant="h6" component="div" sx={{ fontSize: '1rem', color: annualReturnColor }}>
                {annualReturn}
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

      {/* New Card for Portfolio Growth Chart */}
      <Card sx={{ minWidth: 275, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Portfolio Growth</Typography>
            <ButtonGroup variant="outlined" aria-label="timeframe selection" sx={{ gap: '8px' }}>
              {['1w', '1m', '5y', 'all'].map((timeframe) => (
                <Button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  variant={selectedTimeframe === timeframe ? 'contained' : 'outlined'}
                  sx={{ textTransform: 'none', borderRadius: '20px', minWidth: '60px' }}
                >
                  {timeframe.toUpperCase()}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
          <Box sx={{ height: 300 }}>
            {portfolioGrowthData.length > 1 ? (
              <LineChart
                dataset={portfolioGrowthData}
                series={[
                  {
                    dataKey: 'total_balance',
                    label: 'Portfolio Value',
                    valueFormatter: (value) => `${totalPortfolioValue.split(' ')[0]} ${value?.toFixed ? value.toFixed(2) : ''}`,
                  },
                ]}
                xAxis={[{
                  scaleType: 'time',
                  dataKey: 'date',
                  valueFormatter: (date) => new Date(date).toLocaleDateString(),
                }]}
                yAxis={[{
                  valueFormatter: (value: number) => {
                    if (value == null) return '';

                    const absValue = Math.abs(value);
                    let formatted = '';
                    if (absValue >= 1e9) {
                      formatted = `${(value / 1e9).toFixed(1)}B`;
                    } else if (absValue >= 1e6) {
                      formatted = `${(value / 1e6).toFixed(1)}M`;
                    } else if (absValue >= 1e3) {
                      formatted = `${(value / 1e3).toFixed(1)}K`;
                    } else {
                      formatted = `${value.toFixed(2)}`;
                    }
                    return formatted;
                  },
                  width: 120,
                }]}
                margin={{ left: 30, right: 20, top: 20, bottom: 30 }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">Not enough data to display portfolio growth.</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardCard;