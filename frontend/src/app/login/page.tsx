// frontend/src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from "next-auth/react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Link,
  Card,
  CardContent,
  CssBaseline,
} from '@mui/material';
import { useForm } from 'react-hook-form';

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

    // Inside frontend/src/app/login/page.tsx -> onSubmit function

const onSubmit = async (data: any) => {
  setIsLoading(true);
  setError(null);
  try {
    // --- UPDATE/FIX: Add callbackUrl to signIn call ---
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      // --- ADD THIS LINE ---
      callbackUrl: '/account/dashboard', // <-- REDIRECT TO ACCOUNT DASHBOARD AFTER SUCCESS
      // --- END ADDITION ---
    });
    // --- END UPDATE/FIX ---

    if (res?.error) {
      setError(res.error);
    } else {
      // On successful login, redirect to the account dashboard
      // --- UPDATE/FIX: Change redirect destination ---
      // router.push('/'); // <-- OLD (PROBLEMATIC) REDIRECT TO HOME
      router.push('/account/dashboard'); // <-- NEW (CORRECT) REDIRECT TO DASHBOARD
      // --- END UPDATE/FIX ---
      // Note: Even with redirect: false, specifying callbackUrl often works,
      // but explicitly pushing is a reliable fallback.
    }
  } catch (err: any) {
    setError(err.message || 'An unexpected error occurred.');
  } finally {
    setIsLoading(false);
  }
};

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl });
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google Sign-In.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* CssBaseline for consistent styling */}
      <CssBaseline />
      {/* --- FIX: Ensure the login page fills the viewport height --- */}
      {/* Wrap everything in a Box that takes at least full height and centers content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh', // Full viewport height
          // backgroundColor: 'background.default', // Optional: background color
        }}
      >
        {/* --- Main content area that grows --- */}
        <Box
          component="main"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1, // This makes the main area grow
            alignItems: 'center',
            justifyContent: 'center', // This centers the card vertically
            py: 4, // Some padding
          }}
        >
          <Container component="div" maxWidth="xs">
            <Card elevation={4} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography component="h1" variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Sign in to SaaS Platform
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    autoComplete="email"
                    autoFocus
                    {...register('email', { required: 'Email is required' })}
                    error={!!errors.email}
                    helperText={errors.email ? String(errors.email.message) : ''}
                    InputLabelProps={{ style: { color: '#4338ca' } }}
                    InputProps={{
                      style: { color: '#1e293b' }
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    {...register('password', { required: 'Password is required' })}
                    error={!!errors.password}
                    helperText={errors.password ? String(errors.password.message) : ''}
                    InputLabelProps={{ style: { color: '#4338ca' } }}
                    InputProps={{
                      style: { color: '#1e293b' }
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      background: 'linear-gradient(45deg, #4338ca, #7c3aed)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #3730a3, #5b21b6)',
                      },
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    sx={{
                      mb: 2,
                      py: 1.5,
                      borderColor: '#4338ca',
                      color: '#4338ca',
                      '&:hover': {
                        backgroundColor: '#4338ca',
                        color: '#ffffff',
                      },
                    }}
                    startIcon={
                      isLoading ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></span>
                      ) : null
                    }
                  >
                    {isLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
                  </Button>
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Link href="/signup" variant="body2" sx={{ color: '#4338ca', '&:hover': { color: '#3730a3' } }}>
                      {"Don't have an account? Sign Up"}
                    </Link>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Container>
        </Box>
        {/* --- Footer will be rendered by the RootLayout as usual --- */}
        {/* Because the main area above grows, it pushes the RootLayout's Footer down --- */}
      </Box>
    </>
  );
};

export default LoginPage;