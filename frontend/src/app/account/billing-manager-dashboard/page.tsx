// frontend/src/app/account/billing-manager-dashboard/page.tsx
'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import AccountLayout from '@/components/Account/AccountLayout';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import Dashboard from '@/components/Dashboard/Dashboard';

const BillingManagerDashboardPage = () => {
  return (
    <ProtectedRoute allowedRoles={['billing_manager', 'admin']}>
      <AccountLayout activeSection="Billing Manager Dashboard">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Billing Manager Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Manage billing and subscriptions for your tenant.
          </Typography>
          <Dashboard />
        </Container>
      </AccountLayout>
    </ProtectedRoute>
  );
};

export default BillingManagerDashboardPage;