import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface AssetCardProps {
  title: string;
  value: string;
}

const AssetCard: React.FC<AssetCardProps> = ({ title, value }) => {
  return (
    <Card sx={{ minWidth: 275, mb: 3 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14, textTransform: 'uppercase' }} color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
