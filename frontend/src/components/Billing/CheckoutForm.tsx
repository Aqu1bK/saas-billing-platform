'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { createSubscription } from '@/services/billing';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';

const CheckoutForm = ({ planId, email, onBack }: {
  planId: string;
  email: string;
  onBack: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
        billing_details: {
          email,
        },
      });

      if (cardError) {
        throw new Error(cardError.message || 'Failed to process card');
      }

      const { clientSecret } = await createSubscription({
        planId,
        email,
        paymentMethodId: paymentMethod.id,
        trialDays: 7,
      });

      if (clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);

        if (confirmError) {
          throw new Error(confirmError.message || 'Payment confirmation failed');
        }
      }

      window.location.href = '/checkout/success';
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#000',
        '::placeholder': {
          color: '#aab7c4',
        },
        '@media (prefers-color-scheme: dark)': {
          color: '#fff',
        }
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        </motion.div>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Credit or Debit Card
        </Typography>
        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            '&.StripeElement--focus': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 2px rgba(67, 56, 202, 0.2)',
            },
            '&.StripeElement--invalid': {
              borderColor: 'error.main',
            },
          }}
        >
          <CardElement options={cardElementOptions} />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Secure payment powered by Stripe. Test with card 4242 4242 4242 4242.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={onBack} disabled={loading} variant="outlined">
          Back
        </Button>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            disabled={!stripe || loading}
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.5 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                Processing...
              </>
            ) : (
              'Complete Subscription'
            )}
          </Button>
        </motion.div>
      </Box>
    </form>
  );
};

export default CheckoutForm;