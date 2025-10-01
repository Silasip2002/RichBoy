import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Divider, Button, ButtonGroup } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import { useAuth } from '../contexts/AuthContext';
import { getAssetAllocation } from '../services/api';
import { Percent } from '@mui/icons-material';

type Timeframe = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'All';

const PortfolioPerformanceCard: React.FC = () => {
  const { token } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1Y'); // Default to 1 Year
  const [assetAllocation, setAssetAllocation] = useState<any[]>([]);

  const timeframes: Timeframe[] = ['1M', '3M', '6M', 'YTD', '1Y', 'All'];

  useEffect(() => {
    const fetchAssetAllocation = async () => {
      if (!token) return;
      try {
        const data = await getAssetAllocation(token);
        const pieChartData = Object.keys(data).map((key, index) => ({
          id: index,
          value: data[key],
          label: key,
        }));
        setAssetAllocation(pieChartData);
      } catch (error) {
        console.error('Failed to fetch asset allocation', error);
      }
    };

    fetchAssetAllocation();
  }, [token]);

  // Mock data for Line Chart
  const lineChartData: { [key in Timeframe]: { series: { data: number[] }[], xAxis: { scaleType: 'point', data: string[] }[] } } = {
    '1M': { series: [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }], xAxis: [{ scaleType: 'point', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] }] },
    '3M': { series: [{ data: [10, 20, 15, 25, 22, 30, 28, 35, 32, 40] }], xAxis: [{ scaleType: 'point', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'] }] },
    '6M': { series: [{ data: [50, 45, 60, 55, 70, 65, 80, 75, 90, 85] }], xAxis: [{ scaleType: 'point', data: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10'] }] },
    'YTD': { series: [{ data: [100, 110, 105, 120, 115, 130, 125, 140, 135, 150] }], xAxis: [{ scaleType: 'point', data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2'] }] },
    '1Y': { series: [{ data: [200, 210, 205, 220, 215, 230, 225, 240, 235, 250] }], xAxis: [{ scaleType: 'point', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] }] },
    'All': { series: [{ data: [300, 310, 305, 320, 315, 330, 325, 340, 335, 350] }], xAxis: [{ scaleType: 'point', data: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'] }] },
  };

  return (
    <Card sx={{ minWidth: 275, mb: 3 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Portfolio Performance
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 4,
            width: '100%',
          }}
        >
          <Box sx={{ width: { xs: '100%', md: '70%' }, minWidth: 0 }}>
            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
              Performance
            </Typography>
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* TOOD: AI coath suggestion */}
              AI Coach Suggestion!!
            </Box>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '30%' }, minWidth: 0 }}>
            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
              Allocation
            </Typography>
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: assetAllocation.map((entry) => ({ ...entry, label: entry.label.toUpperCase() })),
                    highlightScope: { fade: 'global', highlight: 'item' },
                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                    arcLabel: (item) => `${(item.value / assetAllocation.reduce((sum, entry) => sum + entry.value, 0) * 100).toFixed(2)}%`,
                    arcLabelMinAngle: 45,
                  },
                ]}
                height={200}
              />
            </Box>
          </Box>
        </Box>

      </CardContent>
    </Card>
  );
};

export default PortfolioPerformanceCard;