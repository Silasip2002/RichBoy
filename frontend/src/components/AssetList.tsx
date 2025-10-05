import React, { useMemo } from 'react';
import { Card, CardContent, Box, Typography, TextField, Select, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Autocomplete, Skeleton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAsset, deleteAsset, createAsset, getAssetDetails, searchSymbols } from '../services/api';

import { Asset, AssetData, Account } from '../types/asset';

// Debounce utility function
function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
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
  const [open, setOpen] = React.useState(false);
  const [newAsset, setNewAsset] = React.useState<{
    name: string;
    symbol: string;
    asset_type: string;
    price: number;
    quantity: number;
    account?: number;
    cost: number;
  }>({ name: '', symbol: '', asset_type: 'stocks', price: 0, quantity: 0, cost: 0 });


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
    () => debounce(async (keywords: string, assetType: string) => {
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
    if (asset.price === undefined || asset.price === null || asset.price === 0) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(String(asset.price)))) {
      newErrors.price = 'Price must be a number';
    }

    if (asset.quantity === undefined || asset.quantity === null || asset.quantity === 0) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(parseFloat(String(asset.quantity)))) {
      newErrors.quantity = 'Quantity must be a number';
    }
    if (!asset.account) newErrors.account = 'Account is required';
    return newErrors;
  };

  const handleEditClick = (asset: Asset) => {
    const quantity = parseFloat(String(asset.quantity));
    const cost = parseFloat(String(asset.cost));
    setEditingAsset({
      ...asset,
      price: quantity > 0 ? (cost / quantity) : 0,
      quantity: quantity
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
      price: price.toFixed(2),
      quantity: quantity.toFixed(4),
      cost: (price * quantity).toFixed(2),
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

    const newErrors = validate(newAsset);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const assetToSend = {
      ...newAsset,
      account: newAsset.account!,
      price: newAsset.price.toString(),
      quantity: newAsset.quantity.toString(),
      cost: (newAsset.price * newAsset.quantity).toString(),
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
        <TableCell><Skeleton variant="text" /></TableCell>
        <TableCell><Skeleton variant="text" /></TableCell>
        <TableCell><Skeleton variant="text" /></TableCell>
        <TableCell><Skeleton variant="text" /></TableCell>
        <TableCell><Skeleton variant="text" /></TableCell>
        <TableCell><Skeleton variant="text" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Your Assets</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Search Asset"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select defaultValue="all" size="small">
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="stocks">Stocks</MenuItem>
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
              <MenuItem value="real_estate">Real Estate</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </Select>
            <Button variant="contained" onClick={handleClickOpen}>Add Asset</Button>
          </Box>
        </Box>
        <TableContainer >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell>Price/Cost</TableCell>
                <TableCell>Change</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Market Value</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actions</TableCell>
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
                    <TableCell>{asset.name.split(' - ')[0]}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* Apply formatting to market_price */}
                        <Typography variant="body2" component="span">{formatCurrency(Number(asset.market_price), assetCurrency)}</Typography>
                        <Typography variant="body2" component="span" color="text.secondary">/</Typography>
                        <Typography variant="caption" component="span" color="text.secondary">
                          {/* Apply formatting to average cost */}
                          {Number(asset.quantity) > 0 ? formatCurrency(avgCost, assetCurrency) : formatCurrency(0, assetCurrency)}
                        </Typography>
                      </Box>
                    </TableCell>
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
                    <TableCell>{Number(asset.quantity).toFixed(2)}</TableCell>
                    {/* Apply formatting to marketValue */}
                    <TableCell>{!isNaN(marketValue) ? formatCurrency(marketValue, assetCurrency) : formatCurrency(0, assetCurrency)}</TableCell>
                    <TableCell>{getTypeChip(asset.asset_type)}</TableCell>
                    <TableCell>
                      <IconButton size="small" aria-label="edit" onClick={() => handleEditClick(asset)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" aria-label="delete" onClick={() => asset.id && handleDeleteClick(asset.id)}>
                        <DeleteIcon sx={{ color: 'error.main' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={open} onClose={handleClose}>
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
              onChange={(e) => {
                setNewAsset({ ...newAsset, price: parseFloat(e.target.value) || 0 });
                if (errors.price) setErrors({ ...errors, price: '' });
              }}
              error={!!errors.price}
              helperText={errors.price}
            />
            <TextField
              margin="dense"
              label="Quantity/Shares"
              type="text"
              fullWidth
              onChange={(e) => {
                setNewAsset({ ...newAsset, quantity: parseFloat(e.target.value) || 0 });
                if (errors.quantity) setErrors({ ...errors, quantity: '' });
              }}
              error={!!errors.quantity}
              helperText={errors.quantity}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleAddAsset}>Add</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={editAssetOpen} onClose={() => { setEditAssetOpen(false); setErrors({}); }}>
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
                if (editingAsset) {
                  setEditingAsset({
                    ...editingAsset,
                    price: parseFloat(e.target.value) || 0
                  } as Asset);
                }
                if (errors.price) setErrors({ ...errors, price: '' });
              }}
              error={!!errors.price}
              helperText={errors.price}
            />
            <TextField
              margin="dense"
              label="Quantity/Shares"
              type="text"
              fullWidth
              value={editingAsset?.quantity || ''}
              onChange={(e) => {
                if (editingAsset) {
                  setEditingAsset({
                    ...editingAsset,
                    quantity: parseFloat(e.target.value) || 0
                  } as Asset);
                }
                if (errors.quantity) setErrors({ ...errors, quantity: '' });
              }}
              error={!!errors.quantity}
              helperText={errors.quantity}
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