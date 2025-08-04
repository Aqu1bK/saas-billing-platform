// frontend/src/components/Billing/Plans.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getPlans } from '@/services/billing';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
// - Import MUI Components -
import {
  Container,
  Typography,
  // Grid, // Remove Grid import
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Box, // Use Box for layout
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const Plans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPlans();
        setPlans(data);
      } catch (err: any) {
        console.error("Error fetching plans:", err);
        setError('Failed to load pricing plans: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Simple email validation
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setIsEmailValid(isValid);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Pricing Plans
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Choose the plan that's right for your business
        </Typography>
      </Box>

      {selectedPlan ? (
        <Box sx={{ maxWidth: 'md', mx: 'auto', mt: 4 }}>
          <Card sx={{ p: 4 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {plans.find((p) => p.id === selectedPlan)?.name} Plan
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {plans.find((p) => p.id === selectedPlan)?.description}
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={!!(email && !isEmailValid)}
              helperText={email && !isEmailValid ? "Please enter a valid email address" : ""}
              sx={{ mb: 3 }}
            />

            {isEmailValid && (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  planId={selectedPlan}
                  email={email}
                  onBack={() => setSelectedPlan(null)}
                />
              </Elements>
            )}

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button onClick={() => setSelectedPlan(null)} variant="outlined">
                Back to Plans
              </Button>
            </Box>
          </Card>
        </Box>
      ) : (
        // --- REPLACED MUI GRID WITH BOX FLEXBOX LAYOUT ---
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // Column on xs, Row on sm+
            flexWrap: 'wrap',
            gap: 4, // Equivalent to Grid spacing={4}
            justifyContent: 'center', // Center items if less than 3
          }}
        >
          {plans.map((plan) => (
            // --- EACH PLAN CARD WRAPPED IN A BOX ---
            <Box
              key={plan.id}
              sx={{
                // Responsive width using flex properties and sx
                width: {
                  xs: '100%', // Full width on extra small screens
                  sm: 'calc(50% - 16px)', // Roughly half width on small screens (minus half the gap)
                  md: 'calc(33.333% - 22px)', // Roughly one third width on medium screens (minus 2/3 of the gap)
                },
                minWidth: 280, // Prevent cards from getting too narrow
                maxWidth: 400, // Optional: Cap max width for very large screens
              }}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2,
                  border: '2px solid',
                  borderColor: plan.id === 'pro' ? 'primary.main' : 'divider',
                  position: 'relative',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8,
                  },
                }}
              >
                {plan.id === 'pro' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      boxShadow: 2,
                      zIndex: 1,
                    }}
                  >
                    Most Popular
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h4" component="h3" sx={{ fontWeight: 'bold' }}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                    <Typography variant="h2" component="span" sx={{ fontWeight: 'bold' }}>
                      ${plan.price}
                    </Typography>
                    <Typography variant="h6" component="span" color="text.secondary" sx={{ ml: 0.5 }}>
                      /mo
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {plan.description}
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 150 }}> {/* Adjust minHeight as needed */}
                    <List dense sx={{ py: 0 }}>
                      {plan.features.map((feature: string, index: number) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckCircleIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant={plan.id === 'pro' ? 'contained' : 'outlined'}
                    size="large"
                    onClick={() => handlePlanSelect(plan.id)}
                    sx={{ py: 1.5, fontWeight: 'bold' }}
                  >
                    Get started
                  </Button>
                </CardActions>
              </Card>
            </Box>
            // --- END EACH PLAN CARD WRAPPER ---
          ))}
        </Box>
        // --- END REPLACED MUI GRID ---
      )}
    </Container>
  );
};

export default Plans;