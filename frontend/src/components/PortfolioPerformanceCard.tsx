import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Divider, Button, ButtonGroup } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';

const PortfolioPerformanceCard: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y'); // Default to 1 Year

  const timeframes = ['1M', '3M', '6M', 'YTD', '1Y', 'All'];

  // Mock data for Line Chart
  const lineChartData = {
    '1M': { series: [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }], xAxis: [{ scaleType: 'point', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] }] },
    '3M': { series: [{ data: [10, 20, 15, 25, 22, 30, 28, 35, 32, 40] }], xAxis: [{ scaleType: 'point', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'] }] },
    '6M': { series: [{ data: [50, 45, 60, 55, 70, 65, 80, 75, 90, 85] }], xAxis: [{ scaleType: 'point', data: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10'] }] },
    'YTD': { series: [{ data: [100, 110, 105, 120, 115, 130, 125, 140, 135, 150] }], xAxis: [{ scaleType: 'point', data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2'] }] },
    '1Y': { series: [{ data: [200, 210, 205, 220, 215, 230, 225, 240, 235, 250] }], xAxis: [{ scaleType: 'point', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] }] },
    'All': { series: [{ data: [300, 310, 305, 320, 315, 330, 325, 340, 335, 350] }], xAxis: [{ scaleType: 'point', data: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'] }] },
  };

  // Mock data for Pie Chart
  const pieChartData = [
    { id: 0, value: 10, label: 'Stocks' },
    { id: 1, value: 15, label: 'Bonds' },
    { id: 2, value: 20, label: 'Real Estate' },
    { id: 3, value: 5, label: 'Cash' },
  ];

  return (
    <Card sx={{ minWidth: 275, mb: 3 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Portfolio Performance
        </Typography>

        <ButtonGroup variant="outlined" aria-label="timeframe selection" sx={{ mb: 2, gap: '8px' }}>

          
          {timeframes.map((timeframe) => (
            <Button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              variant={selectedTimeframe === timeframe ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'none',
                borderRadius: '20px', // More rounded corners
                minWidth: '60px', // Ensure consistent width
              }}
            >
              {timeframe}
            </Button>
          ))}
        </ButtonGroup>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
          <Box sx={{ width: '33.33%' }}>
            <Typography variant="subtitle2" color="text.secondary">Daily Change</Typography>
            <Typography variant="h6" color="green">+$123.45</Typography>
          </Box>
          <Box sx={{ width: '33.33%' }}>
            <Typography variant="subtitle2" color="text.secondary">Weekly Change</Typography>
            <Typography variant="h6" color="red">-$567.89</Typography>
          </Box>
          <Box sx={{ width: '33.33%' }}>
            <Typography variant="subtitle2" color="text.secondary">Monthly Change</Typography>
            <Typography variant="h6" color="green">+$1,234.56</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          Asset Allocation
        </Typography>
        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PieChart
            series={[
              {
                data: pieChartData,
                highlightScope: { faded: 'global', highlighted: 'item' },
                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
              },
            ]}
            height={200}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          Individual Asset Performance
        </Typography>
        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LineChart
            xAxis={lineChartData[selectedTimeframe].xAxis}
            series={lineChartData[selectedTimeframe].series}
            height={200}
            margin={{ left: 50, right: 50, top: 20, bottom: 20 }}
          />
        </Box>

      </CardContent>
    </Card>
  );
};

export default PortfolioPerformanceCard;
