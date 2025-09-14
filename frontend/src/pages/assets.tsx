import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import AssetCard from '../components/AssetCard';
import AssetList from '../components/AssetList';


const Assets: React.FC = () => {
  const totalAssetValue = "$1,500,000.00";
  const assets = [
    { title: 'Stocks', value: '$800,000.00' },
    { title: 'Cryptocurrency', value: '$400,000.00' },
    { title: 'Real Estate', value: '$250,000.00' },
  ];

  const allCards = [{ title: 'Total Asset Value', value: totalAssetValue }, ...assets];

  return (
    <div> 
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2} sx={{ mt: 3 }}>
          {allCards.map((asset, index) => (
            // xs=12, sm=6, md=3 => 4 columns on md and larger, wraps on smaller screens
            <Grid item xs={12} sm={6} md={3} key={index} sx={{ display: 'flex' }}>
              {/* make the inner box stretch so AssetCard can fill full height */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AssetCard title={asset.title} value={asset.value} />
              </Box>
            </Grid>
          ))}
        </Grid>
        <AssetList />
      </Box>
    </div>
  );
};

export default Assets;