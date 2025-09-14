import React from 'react';
import { Card, CardContent, Box, Typography, TextField, Select, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const AssetList: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [newAsset, setNewAsset] = React.useState({ name: '', symbol: '', type: 'stocks', price: '', quantity: '', account: '' });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddAsset = () => {
    console.log(newAsset);
    handleClose();
  };

  const accounts = [
    { id: 1, name: 'Brokerage Account' },
    { id: 2, name: 'Retirement Account' },
    { id: 3, name: 'Crypto Wallet' },
  ];

  const assets = [
    { name: 'Apple Inc.', price: '$175.00', change: '+1.25%', quantity: 100, value: '$17,500', type: 'Stocks' },
    { name: 'Bitcoin', price: '$40,000.00', change: '-2.5%', quantity: 0.5, value: '$20,000', type: 'Cryptocurrency' },
    { name: 'Rental Property', price: 'N/A', change: 'N/A', quantity: 1, value: '$200,000', type: 'Real Estate' },
    { name: 'Savings Account', price: 'N/A', change: 'N/A', quantity: 1, value: '$25,000', type: 'Cash' },
  ];

  const getTypeChip = (type: string) => {
    let color: 'primary' | 'secondary' | 'default' | 'success' | 'warning' | 'error' | 'info' = 'default';
    switch (type) {
      case 'Stocks':
        color = 'primary';
        break;
      case 'Cryptocurrency':
        color = 'secondary';
        break;
      case 'Real Estate':
        color = 'success';
        break;
      case 'Cash':
        color = 'warning';
        break;
      default:
        color = 'default';
    }
    return <Chip label={type} color={color} size="small" />;
  };

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
         </Box>
       </Box>
       <TableContainer >
         <Table>
           <TableHead>
             <TableRow>
               <TableCell>Asset</TableCell>
               <TableCell>Price</TableCell>
               <TableCell>24h Change</TableCell>
               <TableCell>Quantity</TableCell>
               <TableCell>Value</TableCell>
               <TableCell>Type</TableCell>
               <TableCell>Actions</TableCell>
             </TableRow>
           </TableHead>
           <TableBody>
             {assets.map((asset, index) => (
               <TableRow key={index}>
                 <TableCell>{asset.name}</TableCell>
                 <TableCell>{asset.price}</TableCell>
                 <TableCell>
                   <Typography color={asset.change.startsWith('+') ? 'success.main' : asset.change.startsWith('-') ? 'error.main' : 'text.primary'}>
                     {asset.change}
                   </Typography>
                 </TableCell>
                 <TableCell>{asset.quantity}</TableCell>
                 <TableCell>{asset.value}</TableCell>
                 <TableCell>{getTypeChip(asset.type)}</TableCell>
                 <TableCell>
                   <IconButton size="small" aria-label="edit">
                     <EditIcon />
                   </IconButton>
                   <IconButton size="small" aria-label="delete">
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
           <TextField autoFocus margin="dense" label="Asset Name" type="text" fullWidth onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} />
           <TextField margin="dense" label="Symbol" type="text" fullWidth onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })} />
           <Box sx={{ mt: 1 }}>
           <Select
            defaultValue=""
            fullWidth
            margin="dense"
            onChange={(e) => setNewAsset({ ...newAsset, account: e.target.value })}
            displayEmpty
           >
            <MenuItem value="" disabled>
                Select Account
            </MenuItem>
            {accounts.map((account) => (
                <MenuItem key={account.id} value={account.name}>
                    {account.name}
                </MenuItem>
            ))}
           </Select>
           </Box>
           <Box sx={{ mt: 2 }}>
           <Select defaultValue="stocks" fullWidth margin="dense" onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}>
             <MenuItem value="stocks">Stocks</MenuItem>
             <MenuItem value="crypto">Cryptocurrency</MenuItem>
             <MenuItem value="real_estate">Real Estate</MenuItem>
             <MenuItem value="cash">Cash</MenuItem>
           </Select>
           </Box>
           <TextField margin="dense" label="Price Per Unit" type="text" fullWidth onChange={(e) => setNewAsset({ ...newAsset, price: e.target.value })} />
           <TextField margin="dense" label="Quantity/Shares" type="text" fullWidth onChange={(e) => setNewAsset({ ...newAsset, quantity: e.target.value })} />
         </DialogContent>
         <DialogActions>
           <Button onClick={handleClose}>Cancel</Button>
           <Button onClick={handleAddAsset}>Add</Button>
         </DialogActions>
       </Dialog>
     </CardContent>
    </Card>
  );
};

export default AssetList;
