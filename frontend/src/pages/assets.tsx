import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import AssetCard from '../components/AssetCard';
import AssetList from '../components/AssetList';
import { useAuth } from '../contexts/AuthContext';


const Assets: React.FC = () => {
  const { token } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/accounts/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.results);
            }
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

    const fetchAssets = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/assets/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                const assetsWithMarketPrice = await Promise.all(data.results.map(async (asset: any) => {
                    if (asset.asset_type === 'stocks' && asset.symbol) {
                        try {
                            const priceResponse = await fetch(`http://localhost:8000/api/get_stock_price/?symbol=${asset.symbol}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });
                            if (priceResponse.ok) {
                                const priceData = await priceResponse.json();
                                return { ...asset, price: priceData.price };
                            }
                        } catch (error) {
                            console.error(`Failed to fetch price for ${asset.symbol}`, error);
                        }
                    }
                    return asset;
                }));
                setAssets(assetsWithMarketPrice);
            }
        } catch (error) {
            console.error('Failed to fetch assets', error);
        }
    };

    if (token) {
        fetchAccounts();
        fetchAssets();
    }
  }, [token]);

  const totalAssetValue = assets.reduce((acc, asset) => acc + (asset.price * asset.quantity), 0).toFixed(2);
  const assetTypes = assets.reduce((acc, asset) => {
    if (!acc[asset.asset_type]) {
        acc[asset.asset_type] = 0;
    }
    acc[asset.asset_type] += asset.price * asset.quantity;
    return acc;
  }, {} as { [key: string]: number });

  const assetCards = Object.entries(assetTypes).map(([title, value]) => ({
    title,
    value: value.toFixed(2),
  }));

  const allCards = [{ title: 'Total Asset Value', value: totalAssetValue }, ...assetCards];

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
        <AssetList assets={assets} setAssets={setAssets} accounts={accounts} setAccounts={setAccounts} />
      </Box>
    </div>
  );
};

export default Assets;