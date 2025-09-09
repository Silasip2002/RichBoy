import React from 'react';
import Box from '@mui/material/Box';
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
    <Box
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        // No fixed positioning here, it will be part of the flex layout in index.tsx
        // The height will be managed by the parent flex container.
        borderRight: '1px solid rgba(0, 0, 0, 0.12)', // Add a visual separator
      }}
    >
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
  );
};

export default Sidebar;