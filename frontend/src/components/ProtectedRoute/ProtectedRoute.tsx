// frontend/src/components/ProtectedRoute/ProtectedRoute.tsx
'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const {  data:session, status } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role || 'member';

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    if (status === 'unauthenticated') {
      router.push(redirectTo);
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      // Redirect to unauthorized page or home
      router.push('/unauthorized');
      return;
    }
  }, [status, userRole, allowedRoles, redirectTo, router]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">You need to be logged in to view this page.</Alert>
      </Container>
    );
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">Access Denied. You do not have permission to view this page.</Alert>
      </Container>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;