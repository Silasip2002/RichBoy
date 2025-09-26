import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface AssetCardProps {
  title: string;
  value: number;
  currency: string;
}

const AssetCard: React.FC<AssetCardProps> = ({ title, value, currency }) => {
  // Helper function for currency formatting
  const formatCurrency = (val: number, curr: string) => {
      const effectiveCurrency = curr && curr.length === 3 ? curr : 'USD'; // Fallback to USD
      return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: effectiveCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
      }).format(val);
  };

  return (
    <Card sx={{ minWidth: 275, mb: 3 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14, textTransform: 'uppercase' }} color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {formatCurrency(value, currency)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
