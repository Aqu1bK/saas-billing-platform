// frontend/src/app/unauthorized/page.tsx
'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
} from '@mui/material';
import { useRouter } from 'next/navigation';

const UnauthorizedPage = () => {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          403
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Forbidden
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          You do not have permission to view this page.
        </Typography>
        <Alert severity="error" sx={{ width: '100%', mb: 4 }}>
          Access to this page is restricted to users with specific roles.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Go Home
        </Button>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;