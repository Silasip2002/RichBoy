import React, { useState } from 'react';
import Head from "next/head";
import Box from '@mui/material/Box';
import Header from "../components/Header";
import SidebarContent from "../components/Sidebar";
import ContentArea from "../components/ContentArea";
import Toolbar from '@mui/material/Toolbar';
import ProtectedRoute from '../components/ProtectedRoute';
import Drawer from '@mui/material/Drawer';

const drawerWidth = 200;

export default function Home() {
  const [selectedMenuItem, setSelectedMenuItem] = useState('Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuItemClick = (menuItem: string) => {
    setSelectedMenuItem(menuItem);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex' }}>
        <Head>
          <title>RichBoy App</title>
          <meta name="description" content="Welcome to RichBoy App" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header handleDrawerToggle={handleDrawerToggle} />
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <SidebarContent onMenuItemClick={handleMenuItemClick} selectedMenuItem={selectedMenuItem} />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <SidebarContent onMenuItemClick={handleMenuItemClick} selectedMenuItem={selectedMenuItem} />
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
        >
          <Toolbar />
          <ContentArea selectedMenuItem={selectedMenuItem} />
        </Box>
      </Box>
    </ProtectedRoute>
  );
}
