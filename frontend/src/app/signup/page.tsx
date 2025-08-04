// frontend/src/app/signup/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const SignupPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  // Inside frontend/src/app/signup/page.tsx -> onSubmit function

// Inside frontend/src/app/signup/page.tsx -> onSubmit function

const onSubmit = async ( data: any) => {
  setIsLoading(true);
  setError(null);
  try {
    // Basic client-side validation (keep this if you like)
    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    // --- UPDATE/FIX: Send PLAINTEXT password to the backend API ---
    // The backend should handle hashing for security.
    // Remove client-side bcrypt hashing logic.
    const response = await fetch('/api/auth/signup', { // <-- This endpoint MUST exist
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include tenant ID if needed, or derive it on the backend
        'x-tenant-id': 'acme' // <-- HARDCODED FOR DEMO, ADAPT FOR MT
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password, // Send PLAINTEXT password
        name: data.name,
        phone: data.phone,
        age: data.age ? parseInt(data.age, 10) : null,
        // Default role should be set by the backend
        // role: 'member' // DON'T send role from client, set on server
      }),
    });
    // --- END UPDATE/FIX ---

    const result = await response.json();

    if (!response.ok) {
      // Handle server-side errors (e.g., 400, 409, 500)
      throw new Error(result.error || 'Signup failed.');
    }

    // On successful signup, redirect to login or show success message
    alert('Signup successful! Please log in.');
    router.push('/login');
  } catch (err: any) {
    setError(err.message || 'An unexpected error occurred during signup.');
  } finally {
    setIsLoading(false);
  }
};
  return (
    <>
      {/* CssBaseline for consistent styling */}
      <CssBaseline />
      <Container component="main" maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Card elevation={4} sx={{ mt: 2, mb: 2, p: 4, width: '100%', borderRadius: 2 }}>
          <CardContent>
            <Typography component="h1" variant="h5" align="center" sx={{ mb: 3, fontWeight: 'bold' }}>
              Create Your Account
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
                id="name"
                label="Full Name"
                autoComplete="name"
                autoFocus
                {...register('name')}
                InputLabelProps={{ style: { color: '#4338ca' } }}
                InputProps={{
                  style: { color: '#1e293b' }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                autoComplete="email"
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
                autoComplete="new-password"
                {...register('password', { required: 'Password is required' })}
                error={!!errors.password}
                helperText={errors.password ? String(errors.password.message) : ''}
                InputLabelProps={{ style: { color: '#4338ca' } }}
                InputProps={{
                  style: { color: '#1e293b' }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watch('password') || "Passwords do not match"
                })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword ? String(errors.confirmPassword.message) : ''}
                InputLabelProps={{ style: { color: '#4338ca' } }}
                InputProps={{
                  style: { color: '#1e293b' }
                }}
              />
              <TextField
                margin="normal"
                fullWidth
                label="Phone Number"
                type="tel"
                id="phone"
                autoComplete="tel"
                {...register('phone')}
                InputLabelProps={{ style: { color: '#4338ca' } }}
                InputProps={{
                  style: { color: '#1e293b' }
                }}
              />
              <TextField
                margin="normal"
                fullWidth
                label="Age"
                type="number"
                id="age"
                InputProps={{ inputProps: { min: 1, max: 120 }, style: { color: '#1e293b' } }}
                InputLabelProps={{ style: { color: '#4338ca' } }}
                {...register('age')}
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
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link href="/login" variant="body2" sx={{ color: '#4338ca', '&:hover': { color: '#3730a3' } }}>
                  {"Already have an account? Sign in"}
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default SignupPage;