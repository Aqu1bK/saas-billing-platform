'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// --- FIXED IMPORT: Remove Grid, use Box for layout ---
import {
  Container,
  Typography,
  // Grid, // Remove Grid import to avoid TS errors
  Card,
  CardContent,
  Box, // Use Box for responsive layout
  CircularProgress,
  Alert,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    mrr: 0,
    churnRate: 0,
    ltv: 0,
    trialConversion: 0,
  });
  const [mrrData, setMrrData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [mrrRes, churnRes, ltvRes, trialRes] = await Promise.all([
          api.get('/api/analytics/mrr'),
          api.get('/api/analytics/churn'),
          api.get('/api/analytics/ltv'),
          api.get('/api/analytics/trial-conversion'),
        ]);

        setMetrics({
          mrr: mrrRes.data.current,
          churnRate: churnRes.data[churnRes.data.length - 1]?.churn_rate || 0,
          ltv: ltvRes.data.ltv,
          trialConversion: trialRes.data.conversion_rate,
        });

        setMrrData(
          mrrRes.data.historical.map((item: any) => ({
            name: item.name,
            MRR: item.MRR,
          }))
        );
      } catch (err: any) {
        setError('Failed to load analytics: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'MRR',
      value: `$${metrics.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Churn Rate',
      value: `${metrics.churnRate.toFixed(2)}%`,
      change: '-0.8%',
      changeType: 'negative',
      icon: <TrendingDownIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'LTV',
      value: `$${metrics.ltv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '+5.2%',
      changeType: 'positive',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Trial Conversion',
      value: `${metrics.trialConversion.toFixed(2)}%`,
      change: '+3.1%',
      changeType: 'positive',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          Analytics Dashboard
        </Typography>
      </motion.div>

      {/* --- FIXED LAYOUT: Stat Cards using Box instead of Grid --- */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
        {/* Use Box as a flex container for the stat cards */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // Stack on xs, row on sm+
            flexWrap: 'wrap',
            gap: 3, // Spacing between cards (like Grid spacing={3})
            mb: 4,
          }}
        >
          {statCards.map((card, index) => (
            // Use Box for each card item with responsive width
            <Box
              key={index}
              sx={{
                // Responsive width: 100% on xs, ~50% on sm, ~25% on md
                width: {
                  xs: '100%', // xs={12}
                  sm: 'calc(50% - 12px)', // ~sm={6} (50% width minus half the gap)
                  md: 'calc(25% - 18px)', // ~md={3} (25% width minus 3/4 of the gap)
                },
                minWidth: 240, // Prevents cards from getting too narrow
              }}
            >
              <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card sx={{ height: '100%', display: 'flex', p: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {card.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: card.changeType === 'positive' ? 'success.main' : 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        mt: 1,
                      }}
                    >
                      {card.changeType === 'positive' ? (
                        <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                      ) : (
                        <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                      )}
                      {card.change}
                    </Typography>
                  </Box>
                  <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{card.icon}</Box>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>
      </motion.div>
      {/* --- END FIXED LAYOUT: Stat Cards --- */}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              MRR Trend
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mrrData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="MRR"
                    stroke="#4338ca" // Indigo 700
                    strokeWidth={2}
                    dot={{ strokeWidth: 2, r: 4, fill: '#ffffff' }}
                    activeDot={{ r: 6, stroke: '#4338ca', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* --- FIXED LAYOUT: Charts using Box instead of Grid --- */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
        {/* Use Box as a flex container for the charts */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' }, // Stack on xs-sm, row on md+
            gap: 3, // Spacing between charts (like Grid spacing={3})
          }}
        >
          {/* Chart 1 Box Item */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}> {/* xs={12} md={6} */}
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Subscription Status
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">Subscription status distribution chart</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Chart 2 Box Item */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}> {/* xs={12} md={6} */}
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Top Plans
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">Plan popularity chart</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </motion.div>
      {/* --- END FIXED LAYOUT: Charts --- */}
    </Container>
  );
};

export default Dashboard;