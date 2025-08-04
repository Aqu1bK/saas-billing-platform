// // frontend/src/app/checkout/success/page.tsx
// 'use client'; // Use this if you need client-side hooks, otherwise it can be a server component

// import React, { useEffect } from 'react';
// import Link from 'next/link'; // Import Link for navigation

// const CheckoutSuccessPage = () => {
//   useEffect(() => {
//     // Optional: You can add analytics tracking here
//     // Example: trackEvent('Checkout Success');
//     console.log("Checkout Success Page Loaded");
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
//         <div className="text-center">
//           {/* Heroicon name: outline/check-circle */}
//           <svg className="mx-auto h-24 w-24 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>

//           <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
//             Payment Successful!
//           </h2>
//           <p className="mt-2 text-sm text-gray-600">
//             Thank you for your subscription. You're all set!
//           </p>
//         </div>

//         <div className="mt-8 bg-gray-50 p-4 rounded-md">
//           <h3 className="text-sm font-medium text-gray-900">What's next?</h3>
//           <div className="mt-2 text-sm text-gray-700">
//             <ul className="list-disc pl-5 space-y-1">
//               <li>You will receive a confirmation email shortly.</li>
//               <li>Your account has been upgraded.</li>
//               <li>You can manage your subscription in your account settings.</li>
//             </ul>
//           </div>
//         </div>

//         <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
//           <Link
//             href="/dashboard" // Link to your dashboard if you have one
//             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             Go to Dashboard
//           </Link>
//           <Link
//             href="/" // Link back to your home/pricing page
//             className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             Back to Home
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CheckoutSuccessPage;

// frontend/src/app/checkout/success/page.tsx
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
// --- Import MUI Components ---
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';

const CheckoutSuccessPage = () => {
  useEffect(() => {
    // Optional: You can add analytics tracking here
    // Example: trackEvent('Checkout Success');
    console.log("Checkout Success Page Loaded");
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default', // Uses theme background color
        py: 4, // Add some padding top and bottom
      }}
    >
      <Container maxWidth="sm">
        <Card raised sx={{ p: 4 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {/* Success Icon */}
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Payment Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Thank you for your subscription. You're all set!
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                What's next?
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary="You will receive a confirmation email shortly." />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Your account has been upgraded." />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary="You can manage your subscription in your account settings." />
                </ListItem>
              </List>
            </Box>
          </CardContent>

          <CardActions sx={{ justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Button
              component={Link}
              href="/dashboard"
              variant="contained"
              startIcon={<DashboardIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Go to Dashboard
            </Button>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              startIcon={<HomeIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Back to Home
            </Button>
          </CardActions>
        </Card>
      </Container>
    </Box>
  );
};

export default CheckoutSuccessPage;