// frontend/src/app/account/dashboard/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import AccountLayout from '@/components/Account/AccountLayout';

const AccountDashboardRouter = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Inside frontend/src/app/account/dashboard/page.tsx -> useEffect

useEffect(() => {
  console.log("[AccountDashboardRouter] useEffect triggered. Status:", status);
  if (status === 'loading') {
    console.log("[AccountDashboardRouter] Session is loading...");
    return; // Do nothing while loading
  }

  if (status === 'unauthenticated') {
    console.log("[AccountDashboardRouter] User not authenticated. Redirecting to login...");
    // If not authenticated, redirect to login
    signIn(); // Or router.push('/login')
    return;
  }

  // If authenticated, check role and redirect
  if (session?.user) {
    // --- CRITICAL: Safely access user data and role ---
    const userEmail = session.user.email;
    // Use type assertion to access custom properties like 'role'
    const userRole = (session.user as any).role || 'member'; // Default to 'member' if missing
    const userTenantId = (session.user as any).tenantId || 'default'; // Default to 'default' if missing
    
    console.log(`[AccountDashboardRouter] User authenticated - Email: ${userEmail}, Role: ${userRole}, Tenant ID: ${userTenantId}`);

    let redirectPath = '/account/member-dashboard'; // Default redirect path

    // --- ROLE-BASED REDIRECTION LOGIC ---
    switch (userRole) {
      case 'member':
        console.log("[AccountDashboardRouter] Role is 'member'. Redirecting to member dashboard...");
        redirectPath = '/account/member-dashboard';
        break;
      case 'billing_manager':
        console.log("[AccountDashboardRouter] Role is 'billing_manager'. Redirecting to billing manager dashboard...");
        redirectPath = '/account/billing-manager-dashboard';
        break;
      case 'admin':
        console.log("[AccountDashboardRouter] Role is 'admin'. Redirecting to admin panel...");
        redirectPath = '/account/admin';
        break;
      default:
        console.warn(`[AccountDashboardRouter] Unknown role '${userRole}'. Redirecting to default member dashboard.`);
        redirectPath = '/account/member-dashboard'; // Fallback redirect
    }
    // --- END ROLE-BASED REDIRECTION LOGIC ---

    console.log(`[AccountDashboardRouter] Final redirect path determined: ${redirectPath}`);
    
    // --- CRITICAL: Perform the redirection ---
    // Check if we are already on the target path to prevent infinite loops
    if (window.location.pathname !== redirectPath) {
      console.log(`[AccountDashboardRouter] Initiating router.push to: ${redirectPath}`);
      router.push(redirectPath); // Use push for standard navigation
      console.log(`[AccountDashboardRouter] router.push initiated to: ${redirectPath}`);
    } else {
      console.log(`[AccountDashboardRouter] Already on target path: ${redirectPath}. No redirect needed.`);
    }
    console.log("[AccountDashboardRouter] --- END (Authenticated - Redirect Logic Completed) ---");
    return; // Exit useEffect after initiating redirect
  } else {
    // Edge case: status is 'authenticated' but session.user is missing
    console.error("[AccountDashboardRouter] CRITICAL: Status is 'authenticated' but session.user is missing or null!");
    console.log("[AccountDashboardRouter] Redirecting to login as a safety measure...");
    signIn(); // Or router.push('/login')
    console.log("[AccountDashboardRouter] --- END (Authenticated - No User Data) ---");
  }
}, [status, session, router]); // Add router to dependencies

  // --- RENDER LOGIC BASED ON STATUS ---
  console.log("[AccountDashboardRouter/Render] Rendering based on status:", status);

  if (status === 'loading' || (status === 'authenticated' && !session?.user)) {
    console.log("[AccountDashboardRouter/Render] Showing loading spinner...");
    return (
      <AccountLayout activeSection="Dashboard Router">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </AccountLayout>
    );
  }

  if (status === 'unauthenticated') {
    console.log("[AccountDashboardRouter/Render] Showing unauthenticated alert...");
    return (
      <AccountLayout activeSection="Dashboard Router">
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="warning">
            You need to be logged in to access your account dashboard.
            <Button onClick={() => signIn()} variant="outlined" sx={{ ml: 2 }}>
              Login
            </Button>
          </Alert>
        </Container>
      </AccountLayout>
    );
  }

  // This should rarely be reached if the useEffect redirects correctly
  console.log("[AccountDashboardRouter/Render] Showing default redirect message...");
  return (
    <AccountLayout activeSection="Dashboard Router">
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Card elevation={4} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Redirecting...
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Taking you to your account dashboard.
              </Typography>
              <Box display="flex" justifyContent="center" mt={2}>
                <CircularProgress size={32} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </AccountLayout>
  );
  // --- END RENDER LOGIC ---
};

export default AccountDashboardRouter;