// frontend/src/app/account/billing/page.tsx
'use client';

import React, { useState,useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import AccountLayout from '@/components/Account/AccountLayout'; // Ensure correct path

const BillingPage = () => {
  const {  data:session, status } = useSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await axios.get('/api/billing/get-subscription');
        setSubscription(response.data);
        setIsSubscribed(!!response.data);
      } catch (err: any) {
        setError('Failed to load subscription details.');
      }
    };

    if (status === 'authenticated') {
      fetchSubscription();
    }
  }, [status]);

  const handleUpdatePaymentMethod = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/billing/update-payment-method');
      if (response.status === 200) {
        alert('Payment method updated successfully.');
      }
    } catch (err: any) {
      setError('Failed to update payment method.');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to cancel your subscription?');
      if (!confirmed) return;

      const response = await axios.post('/api/billing/cancel-subscription');
      if (response.status === 200) {
        alert('Subscription canceled successfully.');
        setIsSubscribed(false);
      }
    } catch (err: any) {
      setError('Failed to cancel subscription.');
    }
  };

  if (status === 'loading') {
    return (
      <AccountLayout activeSection="Billing">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </Box>
      </AccountLayout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <AccountLayout activeSection="Billing">
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            You need to be logged in to view this page.
          </Typography>
        </Container>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout activeSection="Billing">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Billing Information
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Manage your subscription and payment methods.
        </Typography>

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {isSubscribed ? (
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Your Subscription
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You are currently on the {subscription?.plan} plan.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Your subscription renews on {subscription?.renewalDate}.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Next billing amount: ${subscription?.nextBillingAmount}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleUpdatePaymentMethod}
                sx={{ mr: 2 }}
              >
                Update Payment Method
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Your Subscription
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You currently have no active subscription.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>
    </AccountLayout>
  );
};

export default BillingPage;