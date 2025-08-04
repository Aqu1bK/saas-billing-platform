// frontend/src/app/account/member-dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import AccountLayout from '@/components/Account/AccountLayout';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';

const MemberDashboardPage = () => {
  const {  data:session, status } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Fetch user data from your API
      const fetchUserData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Replace with your actual API call to fetch user data
          // const response = await fetch('/api/user/profile');
          // const data = await response.json();
          // setUserData(data);
          
          // For now, use session data
          setUserData(session.user);
        } catch (err: any) {
          setError('Failed to load user  ' + (err.message || 'Unknown error'));
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [session, status]);

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
      </Container>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['member', 'billing_manager', 'admin']}>
      <AccountLayout activeSection="Member Dashboard">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Welcome, {session?.user?.email}!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            This is your personalized member dashboard.
          </Typography>

          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Your Subscription
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Email:</strong> {session?.user?.email}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Name:</strong> {userData?.name || 'Not set'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Role:</strong> {session?.user?.role || 'Not set'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Tenant ID:</strong> {session?.user?.tenantId || 'Not set'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Age:</strong> {userData?.age || 'Not set'}
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </AccountLayout>
    </ProtectedRoute>
  );
};

export default MemberDashboardPage;