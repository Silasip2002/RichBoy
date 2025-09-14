import React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const drawerWidth = 240;

interface SidebarProps {
  onMenuItemClick: (menuItem: string) => void;
  selectedMenuItem: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuItemClick, selectedMenuItem }) => {
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
    <Box
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
      }}
    >
      <List>
        {user ? (
          <>
            {[ 'Dashboard', 'Transaction', 'Assets', 'Reports' ].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  selected={selectedMenuItem === text}
                  onClick={() => onMenuItemClick(text)}
                >
                  <ListItemIcon>
                    {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem key="Logout" disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem key="Login" disablePadding>
              <ListItemButton onClick={handleLogin}>
                <ListItemIcon>
                  <InboxIcon />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem key="Register" disablePadding>
              <ListItemButton onClick={handleRegister}>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="Register" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );
};

export default Sidebar;
