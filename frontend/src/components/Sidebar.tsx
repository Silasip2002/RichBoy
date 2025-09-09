import React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';

const drawerWidth = 240;

interface SidebarProps {
  onMenuItemClick: (menuItem: string) => void;
  selectedMenuItem: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuItemClick, selectedMenuItem }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', marginTop: '64px' }, // Offset by AppBar height
      }}
    >
      {/* Removed Toolbar here as it was creating extra whitespace */}
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {[ 'Dashboard', 'Profile', 'Settings', 'Reports' ].map((text, index) => (
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
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
