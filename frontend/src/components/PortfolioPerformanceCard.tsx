import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Box, Divider, Button, CircularProgress, Alert } from '@mui/material';
import { PieChart } from '@mui/x-charts';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getAssetAllocation, getAICoachAdvice } from '../services/api';

interface AssetAllocationData {
  id: number;
  value: number;
  label: string;
}

interface AICoachData {
  advice: string;
  financial_summary: {
    total_balance: number;
    total_spent_last_30_days: number;
    total_asset_value: number;
  };
}

const PortfolioPerformanceCard: React.FC = () => {
  const { token } = useAuth();
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocationData[]>([]);
  const [aiCoachData, setAiCoachData] = useState<AICoachData | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [displayedAdvice, setDisplayedAdvice] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);

  const CACHE_KEY = 'ai_coach_advice_cache';
  const CACHE_TIMESTAMP_KEY = 'ai_coach_advice_timestamp';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const getCachedAdvice = useCallback((): AICoachData | null => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION) {
          return JSON.parse(cachedData);
        }
      }
    } catch (error) {
      console.error('Error reading cached advice:', error);
    }
    return null;
  }, []);

  const setCachedAdvice = useCallback((data: AICoachData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error caching advice:', error);
    }
  }, []);

  const isCacheExpired = useCallback((): boolean => {
    try {
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        return now - timestamp >= CACHE_DURATION;
      }
    } catch (error) {
      console.error('Error checking cache expiration:', error);
    }
    return true;
  }, []);

  const typeAdvice = useCallback((text: string) => {
    setDisplayedAdvice('');
    setIsTyping(true);
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedAdvice(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, []);

  const fetchAICoachAdvice = useCallback(async (forceRefresh: boolean = false) => {
    if (!token) return;
    setIsLoadingAdvice(true);
    setAdviceError(null);

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedAdvice = getCachedAdvice();
        if (cachedAdvice && !isCacheExpired()) {
          setAiCoachData(cachedAdvice);
          typeAdvice(cachedAdvice.advice);
          setIsLoadingAdvice(false);
          return;
        }
      }

      // Fetch fresh data
      const data = await getAICoachAdvice(token);
      setAiCoachData(data);
      setCachedAdvice(data);
      typeAdvice(data.advice);
    } catch (error) {
      console.error('Failed to fetch AI coach advice', error);
      setAdviceError('Failed to load AI coach advice. Please try again.');

      // Try to load cached data as fallback
      const cachedAdvice = getCachedAdvice();
      if (cachedAdvice) {
        setAiCoachData(cachedAdvice);
        typeAdvice(cachedAdvice.advice);
        setAdviceError('Showing cached advice. Please refresh to get latest insights.');
      }
    } finally {
      setIsLoadingAdvice(false);
    }
  }, [token, typeAdvice, getCachedAdvice, setCachedAdvice, isCacheExpired]);

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
    fetchAICoachAdvice();
    injectStyles();
  }, [token, fetchAICoachAdvice]);



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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" component="div">
                AI Coach Insights
              </Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => fetchAICoachAdvice(true)}
                disabled={isLoadingAdvice}
                sx={{ textTransform: 'none' }}
              >
                {isLoadingAdvice ? 'Loading...' : 'Refresh'}
              </Button>
            </Box>
            <Box sx={{ height: 200, overflowY: 'auto' }}>
              {isLoadingAdvice ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={24} />
                </Box>
              ) : adviceError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {adviceError}
                </Alert>
              ) : aiCoachData ? (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      fontSize: '0.875rem',
                      position: 'relative'
                    }}
                  >
                    {displayedAdvice}
                    {isTyping && <span className="typing-cursor">|</span>}
                  </Typography>

                  {aiCoachData.financial_summary && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                      <Typography variant="caption" color="text.secondary">
                        Financial Snapshot (Last 30 days):
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          • Total Balance: ${aiCoachData.financial_summary.total_balance.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" display="block">
                          • Total Spent: ${aiCoachData.financial_summary.total_spent_last_30_days.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" display="block">
                          • Investment Value: ${aiCoachData.financial_summary.total_asset_value.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No AI coach advice available at the moment.
                </Typography>
              )}
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

const TypingCursorStyles = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .typing-cursor {
    animation: blink 1s infinite;
    color: #1976d2;
    font-weight: bold;
  }
`;

const injectStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('typing-cursor-styles')) return;

  const styleSheet = document.createElement('style');
  styleSheet.id = 'typing-cursor-styles';
  styleSheet.textContent = TypingCursorStyles;
  document.head.appendChild(styleSheet);
};

export default PortfolioPerformanceCard;