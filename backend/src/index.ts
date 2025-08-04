// backend/src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import analyticsRouter from './routes/analytics';
import { initGlobalPool } from './config/db';
import { tenantMiddleware } from './middleware/tenant';

// Load environment variables from .env file
dotenv.config();

// Initialize global DB connection pool for managing tenants
initGlobalPool();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware Setup ---
// Security: Set various HTTP headers for protection
app.use(helmet());
// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());
// Logging: Log HTTP requests to the console (dev format)
app.use(morgan('dev'));
// Parse incoming JSON requests
app.use(express.json());

// --- Route Setup ---

// Tenant identification middleware
// This MUST be placed before any routes that require tenant context
app.use(tenantMiddleware);

// Health check endpoint (useful for monitoring)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    tenant: req.tenantId, // Provided by tenantMiddleware
    timestamp: new Date().toISOString() 
  });
});

// --- API Routes ---
// Import and use the Tenants API routes
// (e.g., for creating new tenants like 'acme')
app.use('/api/tenants', require('./routes/tenants').default);

// Import and use the Billing API routes
// (e.g., for plans, creating subscriptions, webhooks)
app.use('/api/billing', require('./routes/billing').default);

// Import and use the Analytics API routes
// This connects the routes defined in './routes/analytics.ts'
// to the '/api/analytics' endpoint prefix.
app.use('/api/analytics', analyticsRouter);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`[Server] SaaS Billing Platform backend running on port ${PORT}`);
  console.log(`[Info] Ensure your PostgreSQL database 'saas_billing' is running.`);
  console.log(`[Info] Make sure Stripe CLI is listening: stripe listen --forward-to localhost:${PORT}/api/billing/webhook`);
});