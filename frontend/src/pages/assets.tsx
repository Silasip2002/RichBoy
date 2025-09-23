import React, { useState, useEffect, useRef } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import AssetCard from '../components/AssetCard';
import { getAccounts, getAssets, getStockPrice } from '../services/api';
import AssetList from '../components/AssetList';
import { useAuth } from '../contexts/AuthContext';

const Assets: React.FC = () => {
  const { token } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const fetchAccounts = async () => {
        if (!token) return;
        try {
            const data = await getAccounts(token);
            setAccounts(data.results);
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

    const fetchAssets = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await getAssets(token);
            const assetsWithMarketPrice = await Promise.all(data.results.map(async (asset: any) => {
                let market_price = asset.price; // Default to purchase price
                if ((asset.asset_type === 'stocks' || asset.asset_type === 'crypto') && asset.symbol) {
                    try {
                        const priceData = await getStockPrice(token, asset.symbol, asset.asset_type);
                        if (priceData) {
                            market_price = priceData.price;
                        } else {
                            console.warn(`Could not find price for symbol: ${asset.symbol}`);
                        }
                    } catch (error) {
                        console.error(`Failed to fetch price for ${asset.symbol}`, error);
                    }
                }
                return { ...asset, market_price };
            }));
            setAssets(assetsWithMarketPrice);
            localStorage.setItem('cachedAssets', JSON.stringify({ assets: assetsWithMarketPrice, timestamp: Date.now() }));
        } catch (error) {
            console.error('Failed to fetch assets', error);
        } finally {
            setLoading(false);
        }
    };

    if (token && !hasFetched.current) {
        const cachedData = localStorage.getItem('cachedAssets');
        if (cachedData) {
            const { assets: cachedAssets, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                setAssets(cachedAssets);
                setLoading(false);
            } else {
                fetchAssets();
            }
        } else {
            fetchAssets();
        }
        fetchAccounts();
        hasFetched.current = true;
    }
  }, [token]);

  const totalAssetValue = assets.reduce((acc, asset) => acc + (asset.market_price * asset.quantity), 0).toFixed(2);
  const assetTypes = assets.reduce((acc, asset) => {
    if (!acc[asset.asset_type]) {
        acc[asset.asset_type] = 0;
    }
    acc[asset.asset_type] += asset.market_price * asset.quantity;
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
            <Grid item xs={12} sm={6} md={3} key={index} sx={{ display: 'flex' }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AssetCard title={asset.title} value={asset.value} />
              </Box>
            </Grid>
          ))}
        </Grid>
        <AssetList assets={assets} setAssets={setAssets} accounts={accounts} setAccounts={setAccounts} loading={loading} />
      </Box>
    </div>
  );
};

export default Assets;
