import React, { useMemo } from 'react';
import { Card, CardContent, Box, Typography, TextField, Select, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Autocomplete, Skeleton, useTheme, useMediaQuery } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAsset, deleteAsset, createAsset, getAssetDetails, searchSymbols } from '../services/api';

import { Asset, AssetData, Account } from '../types/asset';

// Debounce utility function for async functions
function debounceAsync(
  func: (keywords: string, assetType: string) => Promise<void>,
  wait: number
): (keywords: string, assetType: string) => void {
  let timeout: NodeJS.Timeout;
  return (keywords: string, assetType: string) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(keywords, assetType), wait);
  };
}

interface SymbolSearchItem {
  id: number;
  name: string;
  currency: string;
}

interface SymbolSearchItem {
  symbol: string;
  name: string;
}

const AssetList: React.FC<{ assets: Asset[], setAssets: React.Dispatch<React.SetStateAction<Asset[]>>, accounts: Account[], loading: boolean }> = ({ assets = [], setAssets, accounts = [], loading }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = React.useState(false);
  const [newAsset, setNewAsset] = React.useState<{
    name: string;
    symbol: string;
    asset_type: string;
    price: string;
    quantity: string;
    account?: number;
    cost: number;
  }>({ name: '', symbol: '', asset_type: 'stocks', price: '', quantity: '', cost: 0 });


  const [editAssetOpen, setEditAssetOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<Asset | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deletingAssetId, setDeletingAssetId] = React.useState<number | null>(null);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [symbolOptions, setSymbolOptions] = React.useState<{ label: string; value: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredAssets, setFilteredAssets] = React.useState<Asset[]>([]);

  // Debounced symbol search
  const debouncedSymbolSearch = useMemo(
    () => debounceAsync(async (keywords: string, assetType: string) => {
      if (keywords.length > 1 && token) {
        try {
          const data = await searchSymbols(token, keywords, assetType);
          setSymbolOptions(data.map((item: SymbolSearchItem) => ({
            label: `${item.symbol} - ${item.name}`,
            value: item.symbol,
            name: item.name
          })));
        } catch (error: unknown) {
          console.error('Failed to search symbols', error);
        }
      } else {
        setSymbolOptions([]);
      }
    }, 300),
    [token]
  );

  // Helper function for currency formatting
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { // 'en-US' for standard US formatting, can be dynamic
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  React.useEffect(() => {
    if (!assets) return;
    setFilteredAssets(
      assets.filter(asset =>
        asset.name.split(' - ')[0].toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, assets]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };

  const validate = (asset: Partial<Asset>) => {
    const newErrors: { [key: string]: string } = {};
    // Only validate name if it's not a stock/crypto asset (those get auto-filled)
    if ((asset.asset_type === 'real_estate' || asset.asset_type === 'cash') && !asset.name) {
      newErrors.name = 'Asset name is required';
    }

    // Price validation with decimal places check
    if (asset.price === undefined || asset.price === null || asset.price === 0 || asset.price === '') {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(String(asset.price)))) {
      newErrors.price = 'Price must be a number';
    } else {
      // Check decimal places for price (max 6 decimal places)
      const priceStr = String(asset.price);
      const decimalIndex = priceStr.indexOf('.');
      if (decimalIndex !== -1 && priceStr.length - decimalIndex - 1 > 6) {
        newErrors.price = 'Price cannot have more than 6 decimal places';
      }
    }

    // Quantity validation with decimal places check
    if (asset.quantity === undefined || asset.quantity === null || asset.quantity === 0 || asset.quantity === '') {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(parseFloat(String(asset.quantity)))) {
      newErrors.quantity = 'Quantity must be a number';
    } else {
      // Check decimal places for quantity (max 4 decimal places)
      const quantityStr = String(asset.quantity);
      const decimalIndex = quantityStr.indexOf('.');
      if (decimalIndex !== -1 && quantityStr.length - decimalIndex - 1 > 4) {
        newErrors.quantity = 'Quantity cannot have more than 4 decimal places';
      }
    }

    if (!asset.account) newErrors.account = 'Account is required';
    return newErrors;
  };

  const handleEditClick = (asset: Asset) => {
    const quantity = parseFloat(String(asset.quantity));
    const cost = parseFloat(String(asset.cost));
    setEditingAsset({
      ...asset,
      price: String(quantity > 0 ? (cost / quantity) : 0),
      quantity: String(quantity)
    });
    setEditAssetOpen(true);
  };

  // React Query mutations
  const updateAssetMutation = useMutation({
    mutationFn: (assetData: { id: number; asset: AssetData }) =>
      updateAsset(token!, assetData.id, assetData.asset),
    onSuccess: (data) => {
      const updatedAssets = assets.map((asset) =>
        asset.id === data.id ? { ...data, market_price: editingAsset?.market_price || asset.market_price } : asset
      );
      setAssets(updatedAssets);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setEditAssetOpen(false);
      setEditingAsset(null);
    },
    onError: (error) => {
      console.error('Failed to update asset', error);
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: number) => deleteAsset(token!, assetId),
    onSuccess: (_, assetId) => {
      const updatedAssets = assets.filter((asset) => asset.id !== assetId);
      setAssets(updatedAssets);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setDeleteConfirmOpen(false);
      setDeletingAssetId(null);
    },
    onError: (error) => {
      console.error('Failed to delete asset', error);
    }
  });

  const createAssetMutation = useMutation({
    mutationFn: (assetData: AssetData) => createAsset(token!, assetData),
    onSuccess: (data) => {
      const newAssets = [...assets, { ...data, market_price: data.price }];
      setAssets(newAssets);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to add asset', error);
    }
  });

  const handleUpdateAsset = () => {
    if (!editingAsset) return;
    const newErrors = validate(editingAsset);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const price = parseFloat(String(editingAsset.price));
    const quantity = parseFloat(String(editingAsset.quantity));
    const assetToSend = {
      ...editingAsset,
      price: price.toFixed(6),
      quantity: quantity.toFixed(4),
      cost: (price * quantity).toFixed(6),
    };

    if (editingAsset.id === undefined) {
      setEditingAsset(null);
      return;
    }

    updateAssetMutation.mutate({ id: editingAsset.id, asset: assetToSend });
  };

  const handleDeleteClick = (assetId: number) => {
    setDeletingAssetId(assetId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAsset = () => {
    if (!deletingAssetId) return;
    deleteAssetMutation.mutate(deletingAssetId);
  };

  const handleAddAsset = () => {
    if (!token) return;

    // For stock/crypto, ensure we have symbol before submitting
    if ((newAsset.asset_type === 'stocks' || newAsset.asset_type === 'crypto') && !newAsset.symbol) {
      setErrors({ symbol: 'Please select an asset from the search results' });
      return;
    }

    const newErrors = validate(newAsset as unknown as Asset);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const price = parseFloat(newAsset.price);
    const quantity = parseFloat(newAsset.quantity);

    const assetToSend = {
      ...newAsset,
      account: newAsset.account!,
      price: price.toFixed(6),
      quantity: quantity.toFixed(4),
      cost: (price * quantity).toFixed(6),
    };
    createAssetMutation.mutate(assetToSend);
  };

  
  const handleFetchPrice = async (symbol: string, type: 'new' | 'edit', assetType: string) => {
    if (!symbol) {
      setErrors({ ...errors, symbol: 'Symbol is required to fetch price' });
      return;
    }
    try {
      const data = await getAssetDetails(token!, symbol, assetType);
      if (data) {
        if (type === 'new') {
          setNewAsset(prev => ({ ...prev, price: data.price, name: data.name || prev.name }));
        } else {
          setEditingAsset(prev => {
            if (!prev) return null;
            return { ...prev, market_price: data.price, name: data.name || prev.name };
          });
        }
        // Update the cache
        queryClient.setQueryData(['assetPrice', symbol, assetType], data);
      } else {
        setErrors({ ...errors, symbol: 'Could not fetch price' });
      }
    } catch (error) {
      console.error('Failed to fetch price', error);
      setErrors({ ...errors, symbol: 'Failed to fetch price' });
    }
  };

  const handleSymbolSearch = (keywords: string) => {
    debouncedSymbolSearch(keywords, newAsset.asset_type);
  };

  const getTypeChip = (type: string) => {
    let color: 'primary' | 'secondary' | 'default' | 'success' | 'warning' | 'error' | 'info' = 'default';
    switch (type) {
      case 'stocks':
        color = 'primary';
        break;
      case 'crypto':
        color = 'secondary';
        break;
      case 'real_estate':
        color = 'success';
        break;
      case 'cash':
        color = 'warning';
        break;
      default:
        color = 'default';
    }
    return <Chip label={type} color={color} size="small" />;
  };

  const renderSkeleton = () => (
    Array.from(new Array(5)).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton variant="text" /></TableCell>
        {!isMobile && <TableCell><Skeleton variant="text" /></TableCell>}
        {!isMobile && <TableCell><Skeleton variant="text" /></TableCell>}
        <TableCell><Skeleton variant="text" /></TableCell>
        <TableCell><Skeleton variant="text" /></TableCell>
        {!isMobile && <TableCell><Skeleton variant="text" /></TableCell>}
        <TableCell><Skeleton variant="text" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <Card sx={{
      mt: 4,
      mx: isSmallMobile ? 1 : 0,
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <CardContent sx={{
        px: isSmallMobile ? 1 : 2,
        pt: 2,
        pb: 3,
        '&:last-child': { pb: 3 }
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          mb: 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0,
          width: '100%'
        }}>
          <Typography
            variant={isSmallMobile ? "subtitle1" : "h6"}
            sx={{
              textAlign: isMobile ? 'center' : 'left',
              mb: isMobile ? 1 : 0
            }}
          >
            Your Assets
          </Typography>
          <Box sx={{
            display: 'flex',
            gap: isMobile ? 1 : 2,
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto',
            flexWrap: isSmallMobile ? 'nowrap' : 'wrap'
          }}>
            <TextField
              label="Search Asset"
              variant="outlined"
              size={isSmallMobile ? "small" : "small"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth={isMobile}
              sx={{ minWidth: isSmallMobile ? 140 : 200 }}
            />
            <Select
              defaultValue="all"
              size="small"
              fullWidth={isMobile}
              sx={{ minWidth: isSmallMobile ? 120 : 150 }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="stocks">Stocks</MenuItem>
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
              <MenuItem value="real_estate">Real Estate</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </Select>
            <Button
              variant="contained"
              onClick={handleClickOpen}
              fullWidth={isMobile}
              size={isSmallMobile ? "small" : "medium"}
            >
              Add Asset
            </Button>
          </Box>
        </Box>
        <Box sx={{
          overflowX: 'auto',
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch'
        }}>
          <TableContainer sx={{
            overflow: 'visible',
            maxWidth: '100%'
          }}>
            <Table
              sx={{
                minWidth: isSmallMobile ? 300 : isMobile ? 400 : 600,
                tableLayout: 'fixed'
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      minWidth: isSmallMobile ? 100 : 150,
                      maxWidth: isSmallMobile ? 120 : 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Asset
                  </TableCell>
                  {!isMobile && (
                    <TableCell sx={{ minWidth: 120 }}>Price/Cost</TableCell>
                  )}
                  {!isMobile && (
                    <TableCell sx={{ minWidth: 80 }}>Change</TableCell>
                  )}
                  <TableCell
                    sx={{
                      minWidth: isSmallMobile ? 60 : 80,
                      textAlign: 'center'
                    }}
                  >
                    Quantity
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: isSmallMobile ? 80 : 100,
                      textAlign: 'right'
                    }}
                  >
                    Market Value
                  </TableCell>
                  {!isMobile && (
                    <TableCell sx={{ minWidth: 80 }}>Type</TableCell>
                  )}
                  <TableCell
                    sx={{
                      minWidth: isSmallMobile ? 80 : 100,
                      textAlign: 'center'
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {loading ? renderSkeleton() : filteredAssets.map((asset, index) => {
                const marketValue = Number(asset.market_price) * Number(asset.quantity);
                const avgCost = Number(asset.quantity) > 0 ? Number(asset.cost) / Number(asset.quantity) : 0;
                const change = avgCost > 0 ? ((Number(asset.market_price) - avgCost) / avgCost) * 100 : 0;

                // Find the account for the current asset to get its currency
                const assetAccount = accounts.find(acc => acc.id === asset.account);
                const assetCurrency = assetAccount ? assetAccount.currency : 'USD'; // Default to USD if account not found

                return (
                  <TableRow key={index}>
                    <TableCell
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: isSmallMobile ? 120 : 200
                      }}
                    >
                      <Box>
                        <Typography
                          variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body1"}
                          sx={{ fontWeight: 'medium' }}
                          title={asset.name.split(' - ')[0]}
                        >
                          {asset.name.split(' - ')[0]}
                        </Typography>
                        {isMobile && (
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: isSmallMobile ? '0.7rem' : '0.75rem' }}
                            >
                              {formatCurrency(Number(asset.market_price), assetCurrency)} / {Number(asset.quantity) > 0 ? formatCurrency(avgCost, assetCurrency) : formatCurrency(0, assetCurrency)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {getTypeChip(asset.asset_type)}
                              {(() => {
                                if (change !== null && change !== undefined && !isNaN(change)) {
                                  const color = change >= 0 ? 'success.main' : 'error.main';
                                  return (
                                    <Typography variant="caption" color={color} sx={{ fontSize: isSmallMobile ? '0.65rem' : '0.75rem' }}>
                                      {change > 0 ? '+' : ''}{Number(change).toFixed(2)}%
                                    </Typography>
                                  );
                                }
                                return <Typography variant="caption" sx={{ fontSize: isSmallMobile ? '0.65rem' : '0.75rem' }}>-</Typography>;
                              })()}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Typography variant="body2" component="span">{formatCurrency(Number(asset.market_price), assetCurrency)}</Typography>
                          <Typography variant="body2" component="span" color="text.secondary">/</Typography>
                          <Typography variant="caption" component="span" color="text.secondary">
                            {Number(asset.quantity) > 0 ? formatCurrency(avgCost, assetCurrency) : formatCurrency(0, assetCurrency)}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    {!isMobile && (
                      <TableCell>
                        {(() => {
                          if (change !== null && change !== undefined && !isNaN(change)) {
                            const color = change >= 0 ? 'success.main' : 'error.main';
                            return (
                              <Typography variant="body2" color={color}>
                                {change > 0 ? '+' : ''}{Number(change).toFixed(2)}%
                              </Typography>
                            );
                          }
                          return <Typography variant="body2">-</Typography>;
                        })()}
                      </TableCell>
                    )}
                    <TableCell
                      sx={{
                        textAlign: 'center',
                        fontSize: isSmallMobile ? '0.75rem' : 'inherit'
                      }}
                    >
                      {Number(asset.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: 'right',
                        fontSize: isSmallMobile ? '0.75rem' : 'inherit'
                      }}
                    >
                      <Typography
                        variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body1"}
                        sx={{ fontWeight: 'medium' }}
                      >
                        {!isNaN(marketValue) ? formatCurrency(marketValue, assetCurrency) : formatCurrency(0, assetCurrency)}
                      </Typography>
                    </TableCell>
                    {!isMobile && <TableCell>{getTypeChip(asset.asset_type)}</TableCell>}
                    <TableCell
                      sx={{
                        textAlign: 'center',
                        px: isSmallMobile ? 0.5 : 1
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          aria-label="edit"
                          onClick={() => handleEditClick(asset)}
                          sx={{ p: isSmallMobile ? 0.5 : 1 }}
                        >
                          <EditIcon sx={{ fontSize: isSmallMobile ? '1rem' : '1.25rem' }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="delete"
                          onClick={() => asset.id && handleDeleteClick(asset.id)}
                          sx={{ p: isSmallMobile ? 0.5 : 1 }}
                        >
                          <DeleteIcon sx={{ color: 'error.main', fontSize: isSmallMobile ? '1rem' : '1.25rem' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogContent>
            {newAsset.asset_type === 'stocks' || newAsset.asset_type === 'crypto' ? (
              <Autocomplete
                options={symbolOptions}
                getOptionLabel={(option) => option.label}
                onInputChange={(_, newInputValue) => {
                  handleSymbolSearch(newInputValue);
                  if (errors.symbol) setErrors({ ...errors, symbol: '' });
                }}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setNewAsset(prev => ({ ...prev, name: newValue.name, symbol: newValue.value }));
                    handleFetchPrice(newValue.value, 'new', newAsset.asset_type);
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Asset Name" margin="dense" autoFocus error={!!errors.symbol} helperText={errors.symbol || 'Search and select an asset'} />}
              />
            ) : (
              <TextField
                autoFocus
                margin="dense"
                label="Asset Name"
                type="text"
                fullWidth
                value={newAsset.name}
                onChange={(e) => {
                  setNewAsset({ ...newAsset, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                error={!!errors.name}
                helperText={errors.name}
              />
            )}
            <Box sx={{ mt: 1 }}>
              <Select
                value={newAsset.account || ''}
                fullWidth
                margin="dense"
                onChange={(e) => {
                  setNewAsset({ ...newAsset, account: e.target.value ? Number(e.target.value) : undefined });
                  if (errors.account) setErrors({ ...errors, account: '' });
                }}
                displayEmpty
                error={!!errors.account}
              >
                <MenuItem value="" disabled>
                  Select Account
                </MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.account && <Typography color="error" variant="caption">{errors.account}</Typography>}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Select
                value={newAsset.asset_type}
                fullWidth
                margin="dense"
                onChange={(e) => {
                  setNewAsset({ ...newAsset, name: '', symbol: '', asset_type: e.target.value });
                  setSymbolOptions([]);
                }}
              >
                <MenuItem value="stocks">Stocks</MenuItem>
                <MenuItem value="crypto">Cryptocurrency</MenuItem>
                <MenuItem value="real_estate">Real Estate</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
              </Select>
            </Box>
            <TextField
              margin="dense"
              label="Price Per Unit"
              type="text"
              fullWidth
              value={newAsset.price}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string, numbers with optional decimal point
                if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) {
                  setNewAsset({ ...newAsset, price: value });
                  if (errors.price) setErrors({ ...errors, price: '' });
                }
              }}
              error={!!errors.price}
              helperText={errors.price || "Maximum 6 decimal places"}
            />
            <TextField
              margin="dense"
              label="Quantity/Shares"
              type="text"
              fullWidth
              value={newAsset.quantity}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string, numbers with optional decimal point
                if (value === '' || /^\d*\.?\d{0,4}$/.test(value)) {
                  setNewAsset({ ...newAsset, quantity: value });
                  if (errors.quantity) setErrors({ ...errors, quantity: '' });
                }
              }}
              error={!!errors.quantity}
              helperText={errors.quantity || "Maximum 4 decimal places"}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleAddAsset}>Add</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={editAssetOpen} onClose={() => { setEditAssetOpen(false); setErrors({}); }} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Asset Name"
              type="text"
              fullWidth
              value={editingAsset?.name || ''}
              onChange={(e) => {
                // Use functional updater and guard against null previous state
                setEditingAsset(prev => prev ? { ...prev, name: e.target.value } : prev);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={!!errors.name}
              helperText={errors.name}
            />
            <TextField
              margin="dense"
              label="Symbol"
              type="text"
              fullWidth
              value={editingAsset?.symbol || ''}
              onChange={(e) => {
                if (editingAsset) {
                  setEditingAsset({
                    ...editingAsset,
                    symbol: e.target.value
                  } as Asset);
                }
              }}
            />
            {editingAsset?.asset_type === 'stocks' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button onClick={() => handleFetchPrice(editingAsset.symbol, 'edit', editingAsset.asset_type)} variant="outlined" sx={{ mt: 1 }}>Fetch Price</Button>
              </Box>
            )}
            <TextField
              margin="dense"
              label="Market Price"
              type="text"
              fullWidth
              value={editingAsset?.market_price ? Number(editingAsset.market_price).toFixed(2) : ''}
              disabled
            />
            <Select
              value={String(editingAsset?.account || '')} fullWidth
              margin="dense"
              onChange={(e) => {
                if (editingAsset) {
                  setEditingAsset({
                    ...editingAsset,
                    account: Number(e.target.value)
                  } as Asset);
                }
                if (errors.account) setErrors({ ...errors, account: '' });
              }}
              displayEmpty
              error={!!errors.account}
            >
              <MenuItem value="" disabled>
                Select Account
              </MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account.id} value={String(account.id)}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
            {errors.account && <Typography color="error" variant="caption">{errors.account}</Typography>}
            <Select
              value={editingAsset?.asset_type || ''}
              fullWidth
              margin="dense"
              onChange={(e) => {
                if (editingAsset) {
                  setEditingAsset({
                    ...editingAsset,
                    asset_type: e.target.value
                  } as Asset);
                }
              }}
            >
              <MenuItem value="stocks">Stocks</MenuItem>
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
              <MenuItem value="real_estate">Real Estate</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </Select>
            <TextField
              margin="dense"
              label="Price Per Unit"
              type="text"
              fullWidth
              value={editingAsset?.price || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (editingAsset && (value === '' || /^\d*\.?\d{0,6}$/.test(value))) {
                  setEditingAsset({
                    ...editingAsset,
                    price: value
                  });
                }
                if (errors.price) setErrors({ ...errors, price: '' });
              }}
              error={!!errors.price}
              helperText={errors.price || "Maximum 6 decimal places"}
            />
            <TextField
              margin="dense"
              label="Quantity/Shares"
              type="text"
              fullWidth
              value={editingAsset?.quantity || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (editingAsset && (value === '' || /^\d*\.?\d{0,4}$/.test(value))) {
                  setEditingAsset({
                    ...editingAsset,
                    quantity: value
                  });
                }
                if (errors.quantity) setErrors({ ...errors, quantity: '' });
              }}
              error={!!errors.quantity}
              helperText={errors.quantity || "Maximum 4 decimal places"}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditAssetOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateAsset}>Save</Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this asset?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteAsset} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AssetList;