// frontend/src/components/Header/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

const Header = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#4338ca' }}> {/* Indigo background */}
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left Side - App Name */}
        <Typography
          variant="h6"
          component={Link} // Use Link for client-side navigation
          href="/"
          sx={{
            textDecoration: 'none',
            color: 'white',
            fontWeight: 'bold',
            '&:hover': {
              color: '#e0e7ff', // Lighter indigo on hover
            },
          }}
        >
          SaaS Billing Platform
        </Typography>

        {/* Right Side - Auth Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={Link}
            href="/login"
            sx={{
              fontWeight: 'medium',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Login
          </Button>
          <Button
            variant="outlined" // Outlined button for Sign Up
            component={Link}
            href="/signup"
            sx={{
              color: 'white',
              borderColor: 'white',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'white',
                color: '#4338ca', // Indigo text on hover
                borderColor: 'white',
              },
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;