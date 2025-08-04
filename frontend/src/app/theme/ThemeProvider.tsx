// frontend/src/theme/ThemeProvider.tsx
'use client';
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Define a custom theme
const theme = createTheme({
  palette: {
    mode: 'light', // You can make this dynamic based on prefers-color-scheme
    primary: {
      main: '#4338ca', // Indigo 700
      light: '#818cf8', // Indigo 400
      dark: '#3730a3', // Indigo 900
    },
    secondary: {
      main: '#7c3aed', // Violet 600
      light: '#a78bfa', // Violet 400
      dark: '#5b21b6', // Violet 900
    },
    background: {
      default: 'rgb(240, 240, 245)', // --background-start-rgb
      paper: '#ffffff', // --surface-color
    },
    text: {
      primary: 'rgba(17, 24, 39, 0.87)', // --text-primary with opacity
      secondary: 'rgba(107, 114, 128, 0.87)', // --text-secondary with opacity
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12, // --border-radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Don't uppercase by default
          fontWeight: 600,
          borderRadius: '12px', // Match custom border radius
          transition: 'all 0.3s ease-in-out',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px', // Slightly larger than default
          transition: 'all 0.3s ease-in-out',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'visible', // Allow for hover effects that might overflow
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // Ensures Paper components (like Cards) use the Card style overrides
        // unless explicitly overridden.
      },
    },
  },
});

export default function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}