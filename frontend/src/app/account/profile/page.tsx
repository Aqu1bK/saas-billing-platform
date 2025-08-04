// frontend/src/app/account/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import AccountLayout from '@/components/Account/AccountLayout';

const ProfilePage = () => {
  const {  data:session, status } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | null>(null); // Use number type for age
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state for data fetching

  // --- FETCH USER PROFILE DATA ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status !== 'authenticated') return;

      try {
        setLoading(true);
        setError(null);

        // --- CALL YOUR NEW BACKEND PROFILE API ---
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Include tenant ID if needed, or derive it on the backend
            // 'x-tenant-id': 'acme' // <-- HARDCODED FOR DEMO, ADAPT FOR MT
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch profile data.');
        }

        // --- POPULATE STATE WITH FETCHED DATA ---
        setName(result.user.name || '');
        setPhone(result.user.phone || '');
        setAge(result.user.age ? parseInt(result.user.age, 10) : null); // Ensure age is a number
        // Role, Tenant ID, Email are typically from session, but you can override if needed
        // setEmail(result.user.email || '');

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while fetching profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session, status]);
  // --- END FETCH USER PROFILE DATA ---

  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // --- Call the backend update profile API ---
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          phone: phone,
          age: age,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Profile update failed.');
      }

      // On successful update, show success message
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during profile update.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // ... (rest of your delete account logic remains the same) ...
    try {
      const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
      if (!confirmed) return;

      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Include tenant ID if needed, or derive it on the backend
          'x-tenant-id': 'acme' // <-- HARDCODED FOR DEMO, ADAPT FOR MT
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Account deletion failed.');
      }

      alert('Account deleted successfully. You will be redirected to the login page.');
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account: ' + (err.message || 'Please try again.'));
    }
  };

  if (status === 'loading' || loading) { // Show loading state
    return (
      <AccountLayout activeSection="Profile">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AccountLayout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <AccountLayout activeSection="Profile">
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="warning">You need to be logged in to view this page.</Alert>
        </Container>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout activeSection="Profile">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Your Profile
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Manage your account settings.
        </Typography>

        {error && (
          <Alert severity="error">{error}</Alert>
        )}
        {success && (
          <Alert severity="success">Changes saved successfully!</Alert>
        )}

        <Card>
          <CardContent>
            <TextField
              label="Email Address"
              value={session?.user?.email}
              disabled
              fullWidth
              margin="normal"
            />
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Age"
              type="number"
              value={age ?? ''} // Handle null/undefined age
              onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : null)}
              fullWidth
              margin="normal"
              InputProps={{ inputProps: { min: 1, max: 120 } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveChanges}
              sx={{ mt: 2 }}
            >
              Save Changes
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteAccount}
              sx={{ mt: 2, ml: 2 }}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </Container>
    </AccountLayout>
  );
};

export default ProfilePage;