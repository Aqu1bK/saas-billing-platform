// frontend/src/components/Footer/Footer.tsx
'use client';

import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto', // Push footer to the bottom
        backgroundColor: '#f3f4f6', // Light gray background
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="body2"
          color="text.secondary"
          align="center" // Center the text
        >
          &copy; {new Date().getFullYear()} Aqu1bK. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;