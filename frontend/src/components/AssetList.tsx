import React, { useEffect } from 'react';
import { Card, CardContent, Box, Typography, TextField, Select, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Autocomplete, Skeleton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';

const AssetList: React.FC<{ assets: any[], setAssets: React.Dispatch<React.SetStateAction<any[]>>, accounts: any[], setAccounts: React.Dispatch<React.SetStateAction<any[]>>, loading: boolean }> = ({ assets, setAssets, accounts, setAccounts, loading }) => {
  const { token } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [addAccountOpen, setAddAccountOpen] = React.useState(false);
  const [newAccountName, setNewAccountName] = React.useState('');
  const [newAsset, setNewAsset] = React.useState<{
    name: string;
    symbol: string;
    asset_type: string;
    price: string;
    quantity: string;
    account: number | '';
    cost: string;
}>({ name: '', symbol: '', asset_type: 'stocks', price: '', quantity: '', account: '', cost: '' });
  
  
  const [editAssetOpen, setEditAssetOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deletingAssetId, setDeletingAssetId] = React.useState<number | null>(null);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [symbolOptions, setSymbolOptions] = React.useState<{ label: string; value: string }[]>([]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };

  const validate = (asset: any) => {
    const newErrors: { [key: string]: string } = {};
    if (!asset.name) newErrors.name = 'Asset name is required';
    if (!asset.price) newErrors.price = 'Price is required';
    if (isNaN(parseFloat(asset.price))) newErrors.price = 'Price must be a number';
    if (!asset.quantity) newErrors.quantity = 'Quantity is required';
    if (isNaN(parseFloat(asset.quantity))) newErrors.quantity = 'Quantity must be a number';
    if (!asset.account) newErrors.account = 'Account is required';
    return newErrors;
  };

  const handleEditClick = (asset: any) => {
    setEditingAsset({ ...asset, price: asset.quantity > 0 ? (asset.cost / asset.quantity).toFixed(2) : '0.00' });
    setEditAssetOpen(true);
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;
    const newErrors = validate(editingAsset);
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }
    const price = parseFloat(editingAsset.price);
    const quantity = parseFloat(editingAsset.quantity);
    const assetToSend = {
        ...editingAsset,
        price: price.toFixed(2),
        quantity: quantity.toFixed(4),
        cost: (price * quantity).toFixed(2),
    };
    try {
        const response = await fetch(`http://localhost:8000/api/assets/${editingAsset.id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(assetToSend),
        });
        if (response.ok) {
            const data = await response.json();
            setAssets(assets.map((asset) => (asset.id === data.id ? { ...data, market_price: editingAsset.market_price } : asset)));
            setEditAssetOpen(false);
            setEditingAsset(null);
        } else {
            const errorData = await response.json();
            console.error('Failed to update asset', errorData);
        }
    } catch (error) {
        console.error('Failed to update asset', error);
    }
  };

  const handleDeleteClick = (assetId: number) => {
    setDeletingAssetId(assetId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAsset = async () => {
    if (!deletingAssetId) return;
    try {
        const response = await fetch(`http://localhost:8000/api/assets/${deletingAssetId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (response.ok) {
            setAssets(assets.filter((asset) => asset.id !== deletingAssetId));
            setDeleteConfirmOpen(false);
            setDeletingAssetId(null);
        } else {
            console.error('Failed to delete asset');
        }
    } catch (error) {
        console.error('Failed to delete asset', error);
    }
  };

  

  const handleAddAsset = async () => {
    const newErrors = validate(newAsset);
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }
    const assetToSend = {
        ...newAsset,
        price: parseFloat(newAsset.price).toFixed(2),
        quantity: parseFloat(newAsset.quantity).toFixed(4),
        cost: (parseFloat(newAsset.price) * parseFloat(newAsset.quantity)).toFixed(2),
    };
    try {
        const response = await fetch('http://localhost:8000/api/assets/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(assetToSend),
        });
        if (response.ok) {
            const data = await response.json();
            setAssets([...assets, { ...data, market_price: data.price }]);
            handleClose();
        } else {
            const errorData = await response.json();
            console.error('Failed to add asset', errorData);
        }
    } catch (error) {
        console.error('Failed to add asset', error);
    }
  };

  const handleCreateAccount = async () => {
    try {
        const response = await fetch('http://localhost:8000/api/accounts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name: newAccountName }),
        });
        if (response.ok) {
            const data = await response.json();
            setAccounts([...accounts, data]);
            setNewAsset({ ...newAsset, account: data.id });
            setNewAccountName('');
            setAddAccountOpen(false);
        } else {
            console.error('Failed to create account');
        }
    } catch (error) {
        console.error('Failed to create account', error);
    }
  };

  const handleFetchPrice = async (symbol: string, type: 'new' | 'edit') => {
    if (!symbol) {
        setErrors({ ...errors, symbol: 'Symbol is required to fetch price' });
        return;
    }
    try {
        const response = await fetch(`http://localhost:8000/api/get_stock_price/?symbol=${symbol}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (response.ok) {
            const data = await response.json();
            if (type === 'new') {
                setNewAsset(prev => ({ ...prev, price: data.price, name: data.name || prev.name }));
            } else {
                setEditingAsset(prev => ({ ...prev, price: data.price, name: data.name || prev.name }));
            }
        } else {
            const errorData = await response.json();
            setErrors({ ...errors, symbol: errorData.error || 'Could not fetch price' });
        }
    } catch (error) {
        setErrors({ ...errors, symbol: 'Failed to fetch price' });
    }
  };

  const handleSymbolSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const keywords = event.target.value;
    if (keywords.length > 1) {
        try {
            const response = await fetch(`http://localhost:8000/api/search_symbols/?keywords=${keywords}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSymbolOptions(data.map((item: any) => ({ label: `${item.symbol} - ${item.name}`, value: item.symbol })));
            }
        } catch (error) {
            console.error('Failed to search symbols', error);
        }
    } else {
        setSymbolOptions([]);
    }
  };

  const handleRefreshPrices = async () => {
    const updatedAssets = await Promise.all(assets.map(async (asset) => {
        let market_price = asset.market_price;
        if (asset.asset_type === 'stocks' && asset.symbol) {
            try {
                const response = await fetch(`http://localhost:8000/api/get_stock_price/?symbol=${asset.symbol}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    market_price = data.price;
                }
            } catch (error) {
                console.error(`Failed to fetch price for ${asset.symbol}`, error);
            }
        }
        return { ...asset, market_price };
    }));
    setAssets(updatedAssets);
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
           <TextField label="Search Asset" variant="outlined" size="small" />
           <Select defaultValue="all" size="small">
             <MenuItem value="all">All Types</MenuItem>
             <MenuItem value="stocks">Stocks</MenuItem>
             <MenuItem value="crypto">Cryptocurrency</MenuItem>
             <MenuItem value="real_estate">Real Estate</MenuItem>
             <MenuItem value="cash">Cash</MenuItem>
           </Select>
           <Button variant="contained" onClick={handleClickOpen}>Add Asset</Button>
           <Button variant="outlined" onClick={handleRefreshPrices}>Refresh Prices</Button>
         </Box>
       </Box>
       <TableContainer >
         <Table>
           <TableHead>
             <TableRow>
               <TableCell>Asset</TableCell>
               <TableCell>Market Price</TableCell>
               <TableCell>Quantity</TableCell>
               <TableCell>Purchase Price</TableCell>
               <TableCell>Market Value</TableCell>
               <TableCell>Type</TableCell>
               <TableCell>Actions</TableCell>
             </TableRow>
           </TableHead>
           <TableBody>
             {loading ? renderSkeleton() : assets.map((asset, index) => (
               <TableRow key={index}>
                 <TableCell>{asset.name}</TableCell>
                 <TableCell>{asset.market_price}</TableCell>
                 <TableCell>{asset.quantity}</TableCell>
                 <TableCell>{asset.quantity > 0 ? (asset.cost / asset.quantity).toFixed(2) : '0.00'}</TableCell>
                 <TableCell>{(asset.market_price * asset.quantity).toFixed(2)}</TableCell>
                 <TableCell>{getTypeChip(asset.asset_type)}</TableCell>
                 <TableCell>
                   <IconButton size="small" aria-label="edit" onClick={() => handleEditClick(asset)}>
                     <EditIcon />
                   </IconButton>
                   <IconButton size="small" aria-label="delete" onClick={() => handleDeleteClick(asset.id)}>
                     <DeleteIcon sx={{ color: 'error.main' }} />
                   </IconButton>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </TableContainer>
       <Dialog open={open} onClose={handleClose}>
         <DialogTitle>Add New Asset</DialogTitle>
         <DialogContent>
           <TextField 
            autoFocus 
            margin="dense" 
            label="Asset Name" 
            type="text" 
            fullWidth 
            value={newAsset.name}
            disabled={newAsset.asset_type === 'stocks'}
            onChange={(e) => {
                setNewAsset({ ...newAsset, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={!!errors.name}
            helperText={errors.name}
            />
           {newAsset.asset_type === 'stocks' ? (
            <Autocomplete
                options={symbolOptions}
                getOptionLabel={(option) => option.label}
                onInputChange={(event, newInputValue) => {
                    handleSymbolSearch({ target: { value: newInputValue } } as any);
                }}
                onChange={(event, newValue) => {
                    if (newValue) {
                        setNewAsset({ ...newAsset, symbol: newValue.value });
                        handleFetchPrice(newValue.value, 'new');
                    }
                }}
                renderInput={(params) => <TextField {...params} label="Symbol" margin="dense" />}
            />
           ) : (
            <TextField 
                margin="dense" 
                label="Symbol" 
                type="text" 
                fullWidth 
                onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })} 
            />
           )}
           <Box sx={{ mt: 1 }}>
           <Select
            value={newAsset.account}
            fullWidth
            margin="dense"
            onChange={(e) => {
                if (e.target.value === 'create-new') {
                    setAddAccountOpen(true);
                } else {
                    setNewAsset({ ...newAsset, account: Number(e.target.value) });
                    if (errors.account) setErrors({ ...errors, account: '' });
                }
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
            <MenuItem value="create-new" sx={{ 
                backgroundColor: 'primary.main', 
                color: 'white', 
                '&:hover': {
                    backgroundColor: 'primary.dark',
                },
                m: 1,
                borderRadius: 1,
                textAlign: 'center'
            }}>Create New Account</MenuItem>
           </Select>
           {errors.account && <Typography color="error" variant="caption">{errors.account}</Typography>}
           </Box>
           <Box sx={{ mt: 2 }}>
           <Select defaultValue="stocks" fullWidth margin="dense" onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}>
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
                setNewAsset({ ...newAsset, price: e.target.value });
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
                setNewAsset({ ...newAsset, quantity: e.target.value });
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
       <Dialog open={addAccountOpen} onClose={() => setAddAccountOpen(false)}>
         <DialogTitle>Create New Account</DialogTitle>
         <DialogContent>
           <TextField
             autoFocus
             margin="dense"
             label="Account Name"
             type="text"
             fullWidth
             value={newAccountName}
             onChange={(e) => setNewAccountName(e.target.value)}
           />
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setAddAccountOpen(false)}>Cancel</Button>
           <Button onClick={handleCreateAccount}>Create</Button>
         </DialogActions>
       </Dialog>
       <Dialog open={editAssetOpen} onClose={() => {setEditAssetOpen(false); setErrors({});}}>
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
                setEditingAsset({ ...editingAsset, name: e.target.value });
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
            onChange={(e) => setEditingAsset({ ...editingAsset, symbol: e.target.value })}
          />
          {editingAsset?.asset_type === 'stocks' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button onClick={() => handleFetchPrice(editingAsset.symbol, 'edit')} variant="outlined" sx={{ mt: 1 }}>Fetch Price</Button>
            </Box>
           )}
          <Select
            value={String(editingAsset?.account || '')}
            fullWidth
            margin="dense"
            onChange={(e) => {
                setEditingAsset({ ...editingAsset, account: Number(e.target.value) });
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
            onChange={(e) => setEditingAsset({ ...editingAsset, asset_type: e.target.value })}
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
                setEditingAsset({ ...editingAsset, price: e.target.value });
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
                setEditingAsset({ ...editingAsset, quantity: e.target.value });
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