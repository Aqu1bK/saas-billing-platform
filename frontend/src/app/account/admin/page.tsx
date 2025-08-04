// frontend/src/app/account/admin/page.tsx
'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import AccountLayout from '@/components/Account/AccountLayout';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';

const AdminPanelPage = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AccountLayout activeSection="Admin Panel">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Admin Panel
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Manage your SaaS platform settings.
          </Typography>

          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 3,
              width: '100%'
            }}
          >
            <Box 
              sx={{ 
                flex: '1 1 calc(50% - 24px)', 
                minWidth: 300,
                '@media (max-width: 600px)': {
                  flex: '1 1 100%'
                }
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    User Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add, remove, or modify user accounts and roles.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box 
              sx={{ 
                flex: '1 1 calc(50% - 24px)', 
                minWidth: 300,
                '@media (max-width: 600px)': {
                  flex: '1 1 100%'
                }
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Tenant Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure global settings for your tenant.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box 
              sx={{ 
                flex: '1 1 calc(50% - 24px)', 
                minWidth: 300,
                '@media (max-width: 600px)': {
                  flex: '1 1 100%'
                }
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Financial Reports
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View detailed financial reports and export data.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box 
              sx={{ 
                flex: '1 1 calc(50% - 24px)', 
                minWidth: 300,
                '@media (max-width: 600px)': {
                  flex: '1 1 100%'
                }
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    System Logs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor system activity and troubleshoot issues.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </AccountLayout>
    </ProtectedRoute>
  );
};

export default AdminPanelPage;