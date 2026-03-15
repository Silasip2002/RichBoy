import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '@mui/material';

interface HeaderProps {
  handleDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ handleDrawerToggle }) => {
  const { user } = useAuth();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Image
            src="/logo2.png"
            alt="RichBoy Logo"
            width={140}
            height={40}
            priority
            style={{
              marginRight: '10px',
              objectFit: 'contain'
            }}
          />
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <IconButton
            size="large"
            aria-label="show 17 new notifications"
            color="inherit"
          >
            <NotificationsIcon />
          </IconButton>
          <IconButton
            size="large"
            aria-label="account of current user"
            color="inherit"
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            color="inherit"
          >
            {user?.profile_picture ? (
              <Avatar alt={user.display_name || 'User'} src={user.profile_picture} sx={{ width: 32, height: 32 }} />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
