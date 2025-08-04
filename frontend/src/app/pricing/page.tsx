// // frontend/src/app/pricing/page.tsx
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, TextField } from '@mui/material';
// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
// import { getPlans } from '@/services/billing';
// import CheckoutForm from '@/components/Billing/CheckoutForm';
// import AnimatedPageWrapper from '@/components/ui/AnimatedPageWrapper';

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// const PricingPage = () => {
//   const [plans, setPlans] = useState<any[]>([]);
//   const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
//   const [email, setEmail] = useState('');
//   const [isEmailValid, setIsEmailValid] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchPlans = async () => {
//       try {
//         const data = await getPlans();
//         setPlans(data);
//       } catch (err: any) {
//         setError('Failed to load pricing plans: ' + err.message);
//       }
//     };

//     fetchPlans();
//   }, []);

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setEmail(value);
//     const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
//     setIsEmailValid(isValid);
//   };

//   const handlePlanSelect = (planId: string) => {
//     setSelectedPlan(planId);
//   };

//   const handleBack = () => {
//     setSelectedPlan(null);
//     setEmail('');
//     setIsEmailValid(false);
//   };

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1
//       }
//     }
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1
//     }
//   };

//   if (error) {
//     return (
//       <AnimatedPageWrapper>
//         <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
//           <Box sx={{ p: 4, backgroundColor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
//             <Typography variant="h6">{error}</Typography>
//             <Button onClick={() => window.location.reload()} variant="contained" sx={{ mt: 2 }}>
//               Retry
//             </Button>
//           </Box>
//         </Container>
//       </AnimatedPageWrapper>
//     );
//   }

//   return (
//     <AnimatedPageWrapper>
//       <Container maxWidth="lg" sx={{ py: 8 }}>
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <Typography variant="h2" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
//             Simple, Transparent Pricing
//           </Typography>
//           <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
//             Choose the plan that fits your needs.
//           </Typography>
//         </motion.div>

//         {selectedPlan ? (
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.4 }}
//           >
//             <Card sx={{ maxWidth: 'md', mx: 'auto', p: 4 }}>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
//                 <div>
//                   <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
//                     {plans.find(p => p.id === selectedPlan)?.name} Plan
//                   </Typography>
//                   <Typography variant="body1" color="text.secondary">
//                     {plans.find(p => p.id === selectedPlan)?.description}
//                   </Typography>
//                 </div>
//                 <Button onClick={handleBack} color="secondary">Back</Button>
//               </Box>

//               <TextField
//                 fullWidth
//                 label="Email Address"
//                 type="email"
//                 value={email}
//                 onChange={handleEmailChange}
//                 error={!!(email && !isEmailValid)}
//                 helperText={email && !isEmailValid ? "Please enter a valid email" : ""}
//                 sx={{ mb: 3 }}
//               />

//               {isEmailValid && (
//                 <Elements stripe={stripePromise}>
//                   <CheckoutForm
//                     planId={selectedPlan}
//                     email={email}
//                     onBack={handleBack}
//                   />
//                 </Elements>
//               )}
//             </Card>
//           </motion.div>
//         ) : (
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//           >
//             <Grid container spacing={4} justifyContent="center">
//               {plans.map((plan) => (
//                 <Grid item xs={12} sm={6} md={4} key={plan.id} component="div">
//                   <motion.div variants={itemVariants} whileHover={{ y: -10 }}>
//                     <Card
//                       sx={{
//                         height: '100%',
//                         display: 'flex',
//                         flexDirection: 'column',
//                         p: 3,
//                         border: '2px solid',
//                         borderColor: plan.id === 'pro' ? 'primary.main' : 'divider',
//                         position: 'relative',
//                         overflow: 'visible',
//                         transition: 'transform 0.3s ease, box-shadow 0.3s ease',
//                         '&:hover': {
//                           transform: 'translateY(-10px)',
//                           boxShadow: 8,
//                         },
//                       }}
//                     >
//                       {plan.id === 'pro' && (
//                         <Box
//                           sx={{
//                             position: 'absolute',
//                             top: -12,
//                             left: '50%',
//                             transform: 'translateX(-50%)',
//                             backgroundColor: 'primary.main',
//                             color: 'primary.contrastText',
//                             px: 2,
//                             py: 0.5,
//                             borderRadius: 1,
//                             fontSize: '0.75rem',
//                             fontWeight: 'bold',
//                             boxShadow: 2,
//                           }}
//                         >
//                           Most Popular
//                         </Box>
//                       )}
//                       <CardContent sx={{ flexGrow: 1 }}>
//                         <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>
//                           {plan.name}
//                         </Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
//                           <Typography variant="h3" component="span" sx={{ fontWeight: 'bold' }}>
//                             ${plan.price}
//                           </Typography>
//                           <Typography variant="body1" component="span" color="text.secondary" sx={{ ml: 0.5 }}>
//                             /mo
//                           </Typography>
//                         </Box>
//                         <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//                           {plan.description}
//                         </Typography>
//                         <Box component="ul" sx={{ pl: 2, mb: 3 }}>
//                           {plan.features.map((feature: string, index: number) => (
//                             <Box component="li" key={index} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
//                               <Box
//                                 component="span"
//                                 sx={{
//                                   color: 'success.main',
//                                   mr: 1,
//                                   mt: '2px', // Align icon with text
//                                 }}
//                               >
//                                 {/* Check icon */}
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
//                                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                                 </svg>
//                               </Box>
//                               <Typography variant="body2">{feature}</Typography>
//                             </Box>
//                           ))}
//                         </Box>
//                       </CardContent>
//                       <CardActions>
//                         <Button
//                           fullWidth
//                           variant={plan.id === 'pro' ? 'contained' : 'outlined'}
//                           size="large"
//                           onClick={() => handlePlanSelect(plan.id)}
//                           sx={{
//                             py: 1.5,
//                             fontWeight: 'bold',
//                           }}
//                         >
//                           Get started
//                         </Button>
//                       </CardActions>
//                     </Card>
//                   </motion.div>
//                 </Grid>
//               ))}
//             </Grid>
//           </motion.div>
//         )}
//       </Container>
//     </AnimatedPageWrapper>
//   );
// };

// export default PricingPage;

// frontend/src/app/pricing/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// --- Replace Grid import with Box ---
import { Container, Typography, Card, CardContent, CardActions, Button, Box, TextField } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { getPlans } from '@/services/billing';
import CheckoutForm from '@/components/Billing/CheckoutForm';
import AnimatedPageWrapper from '@/components/ui/AnimatedPageWrapper';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PricingPage = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getPlans();
        setPlans(data);
      } catch (err: any) {
        setError('Failed to load pricing plans: ' + err.message);
      }
    };

    fetchPlans();
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setIsEmailValid(isValid);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleBack = () => {
    setSelectedPlan(null);
    setEmail('');
    setIsEmailValid(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (error) {
    return (
      <AnimatedPageWrapper>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Box sx={{ p: 4, backgroundColor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
            <Typography variant="h6">{error}</Typography>
            <Button onClick={() => window.location.reload()} variant="contained" sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        </Container>
      </AnimatedPageWrapper>
    );
  }

  return (
    <AnimatedPageWrapper>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h2" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
            Choose the plan that fits your needs.
          </Typography>
        </motion.div>

        {selectedPlan ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card sx={{ maxWidth: 'md', mx: 'auto', p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <div>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                    {plans.find(p => p.id === selectedPlan)?.name} Plan
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {plans.find(p => p.id === selectedPlan)?.description}
                  </Typography>
                </div>
                <Button onClick={handleBack} color="secondary">Back</Button>
              </Box>

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                error={!!(email && !isEmailValid)}
                helperText={email && !isEmailValid ? "Please enter a valid email" : ""}
                sx={{ mb: 3 }}
              />

              {isEmailValid && (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    planId={selectedPlan}
                    email={email}
                    onBack={handleBack}
                  />
                </Elements>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* --- REPLACED MUI GRID WITH BOX FLEXBOX LAYOUT --- */}
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
                  <motion.div variants={itemVariants} whileHover={{ y: -10 }}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 3,
                        border: '2px solid',
                        borderColor: plan.id === 'pro' ? 'primary.main' : 'divider',
                        position: 'relative',
                        overflow: 'visible',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-10px)',
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
                        <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>
                          {plan.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                          <Typography variant="h3" component="span" sx={{ fontWeight: 'bold' }}>
                            ${plan.price}
                          </Typography>
                          <Typography variant="body1" component="span" color="text.secondary" sx={{ ml: 0.5 }}>
                            /mo
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {plan.description}
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                          {plan.features.map((feature: string, index: number) => (
                            <Box component="li" key={index} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                              <Box
                                component="span"
                                sx={{
                                  color: 'success.main',
                                  mr: 1,
                                  mt: '2px', // Align icon with text
                                }}
                              >
                                {/* Check icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </Box>
                              <Typography variant="body2">{feature}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          fullWidth
                          variant={plan.id === 'pro' ? 'contained' : 'outlined'}
                          size="large"
                          onClick={() => handlePlanSelect(plan.id)}
                          sx={{
                            py: 1.5,
                            fontWeight: 'bold',
                          }}
                        >
                          Get started
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Box>
                // --- END EACH PLAN CARD WRAPPER ---
              ))}
            </Box>
            {/* --- END REPLACED MUI GRID --- */}
          </motion.div>
        )}
      </Container>
    </AnimatedPageWrapper>
  );
};

export default PricingPage;