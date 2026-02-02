import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FlagIcon from '@mui/icons-material/Flag';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';

interface SidebarContentProps {
  onMenuItemClick: (menuItem: string) => void;
  selectedMenuItem: string;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon /> },
  { text: 'Transaction', icon: <ReceiptIcon /> },
  { text: 'Assets', icon: <AccountBalanceWalletIcon /> },
  { text: 'Goals', icon: <FlagIcon /> },
  { text: 'Settings', icon: <SettingsIcon /> },
];

const SidebarContent: React.FC<SidebarContentProps> = ({ onMenuItemClick, selectedMenuItem }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {user ? (
          <>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={selectedMenuItem === item.text}
                  onClick={() => onMenuItemClick(item.text)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        ) : null}
      </List>
      <Divider />
      <List>
        {user ? (
          <ListItem key="Logout" disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        ) : (
          <>
            <ListItem key="Login" disablePadding>
              <ListItemButton onClick={handleLogin}>
                <ListItemIcon>
                  <VpnKeyIcon />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem key="Register" disablePadding>
              <ListItemButton onClick={handleRegister}>
                <ListItemIcon>
                  <PersonAddIcon />
                </ListItemIcon>
                <ListItemText primary="Register" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </div>
  );
};

export default SidebarContent;
