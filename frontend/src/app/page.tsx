// frontend/src/app/page.tsx
'use client';

import React from 'react';
import { motion, Variants, Transition } from 'framer-motion';
// --- Ensure correct and unambiguous MUI v7 imports ---
// --- REMOVE Grid import ---
import {
  Container,
  Typography,
  // Grid, // <-- Remove this Grid import
  Card,
  CardContent,
  CardActions,
  Button,
  Box, // <-- Keep Box for layout
} from '@mui/material';
import AnimatedPageWrapper from '@/components/ui/AnimatedPageWrapper';

// --- Create a Motion-Enabled Card Component ---
const MotionCard = motion(Card);
// --- End Motion Card ---

const HomePage = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      } as Transition,
    },
  };

  const features = [
    {
      title: 'Multi-Tenant Architecture',
      description: 'Securely isolate data for multiple clients with our robust schema-per-tenant system.',
    },
    {
      title: 'Stripe Integration',
      description: 'Handle payments, subscriptions, and webhooks seamlessly with Stripe\'s powerful API.',
    },
    {
      title: 'Advanced Analytics',
      description: 'Gain insights with real-time dashboards for MRR, churn, LTV, and conversion rates.',
    },
  ];

  return (
    <AnimatedPageWrapper>
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 6, md: 12 },
          px: 2,
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(67, 56, 202, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
          borderRadius: '0 0 50% 50% / 0 0 20% 20%',
          mb: 8,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" component="p" color="text.secondary" sx={{ mb: 4, maxWidth: 'md', mx: 'auto' }}>
            A scalable, secure platform to manage subscriptions, payments, and analytics for your software business.
          </Typography>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="contained"
              size="large"
              href="/billing"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #4338ca, #7c3aed)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #3730a3, #5b21b6)',
                },
              }}
            >
              Select Plan
            </Button>
          </motion.div>
        </motion.div>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            Powerful Features
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6, maxWidth: 'sm', mx: 'auto' }}>
            Everything you need to build and manage a successful SaaS business.
          </Typography>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* --- REPLACED MUI GRID WITH BOX FLEXBOX LAYOUT --- */}
          {/* Use Box with flex properties for responsive grid */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, // Column on xs, Row on sm+
              flexWrap: 'wrap',
              gap: 4, // Equivalent to Grid spacing={4}
              justifyContent: 'center', // Center items if less than 3
            }}
          >
            {features.map((feature, index) => (
              // --- EACH FEATURE CARD WRAPPED IN A BOX ---
              <Box
                key={index} // Key is on the direct child of .map
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
                <motion.div variants={itemVariants}>
                  <MotionCard
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      p: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                    whileHover={{ y: -10 }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color="primary">
                        Learn More
                      </Button>
                    </CardActions>
                  </MotionCard>
                </motion.div>
              </Box>
              // --- END EACH FEATURE CARD WRAPPER ---
            ))}
          </Box>
          {/* --- END REPLACED MUI GRID --- */}
        </motion.div>
      </Container>

      {/* CTA Section */}
      <Box sx={{ py: 8, textAlign: 'center', backgroundColor: 'background.paper', mt: 8 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Typography variant="h4" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            Ready to Scale Your Business?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Join hundreds of SaaS companies using our platform.
          </Typography>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outlined"
              size="large"
              href="/billing"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: '#fff',
                },
              }}
            >
              Select Plan
            </Button>
          </motion.div>
        </motion.div>
      </Box>
    </AnimatedPageWrapper>
  );
};

export default HomePage;