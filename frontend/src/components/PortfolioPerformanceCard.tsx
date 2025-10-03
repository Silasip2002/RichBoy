import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { PieChart } from '@mui/x-charts';
import { useAuth } from '../contexts/AuthContext';
import { getAssetAllocation } from '../services/api';

interface AssetAllocationData {
  id: number;
  value: number;
  label: string;
}

const PortfolioPerformanceCard: React.FC = () => {
  const { token } = useAuth();
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocationData[]>([]);

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