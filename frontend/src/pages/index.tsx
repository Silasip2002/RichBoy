import React, { useState } from 'react';
import Head from "next/head";
import Box from '@mui/material/Box';
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ContentArea from "../components/ContentArea";
import Toolbar from '@mui/material/Toolbar';

const drawerWidth = 240;

export default function Home() {
  const [selectedMenuItem, setSelectedMenuItem] = useState('Dashboard');

  const handleMenuItemClick = (menuItem: string) => {
    setSelectedMenuItem(menuItem);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Head>
        <title>RichBoy App</title>
        <meta name="description" content="Welcome to RichBoy App" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Toolbar /> {/* Spacer for the fixed AppBar */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}> {/* This box contains sidebar and main content */}
        <Sidebar onMenuItemClick={handleMenuItemClick} selectedMenuItem={selectedMenuItem} />
        <Box
          component="main"
                    sx={{
            flexGrow: 1,
            p: 3, // Add padding to the main content area
          }}
        >
          <ContentArea selectedMenuItem={selectedMenuItem} />
        </Box>
      </Box>
    </Box>
  );
}