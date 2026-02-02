import React from 'react';
import { Card, CardContent, Typography, useTheme, useMediaQuery } from '@mui/material';

interface AssetCardProps {
  title: string;
  value: number;
  currency: string;
}

const AssetCard: React.FC<AssetCardProps> = ({ title, value, currency }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <Card sx={{
      minWidth: isMobile ? 'auto' : 275,
      mb: 3,
      width: isMobile ? '100%' : 'auto',
      mx: isMobile ? 0 : 1
    }}>
      <CardContent sx={{
        textAlign: 'center',
        py: isMobile ? 2 : 3,
        px: isMobile ? 2 : 3
      }}>
        <Typography
          sx={{
            fontSize: isMobile ? 12 : 14,
            textTransform: 'uppercase',
            mb: 1
          }}
          color="text.secondary"
          gutterBottom
        >
          {title}
        </Typography>
        <Typography
          variant={isMobile ? "h6" : "h5"}
          component="div"
          sx={{
            fontWeight: 'bold',
            wordBreak: 'break-all'
          }}
        >
          {formatCurrency(value, currency)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
