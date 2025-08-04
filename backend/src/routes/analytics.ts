// import { Router } from 'express';

// // Use 'require' for consistency with your other route files (tenants, billing)
// // and to avoid potential import/export issues if your controllers aren't default exports.
// const { getMRR, getChurnRate, getLTV, getTrialConversion } = require('../controllers/analytics');

// const router = Router();

// // Define the routes and link them to the controller functions
// // These endpoints will be accessible under /api/analytics/
// // e.g., GET http://localhost:5000/api/analytics/mrr
// router.get('/mrr', getMRR);
// router.get('/churn', getChurnRate);
// router.get('/ltv', getLTV);
// router.get('/trial-conversion', getTrialConversion);

// export default router; // Export the configured router as the default export

// backend/src/routes/analytics.ts
import { Router } from 'express';
import { requireRole } from '../middleware/rbac'; // Import the RBAC middleware
import { getMRR, getChurnRate, getLTV, getTrialConversion } from '../controllers/analytics';

const router = Router();

// --- Apply RBAC middleware to all analytics routes ---
// Users need at least 'billing_manager' role to view analytics
const requireBillingManager = requireRole('billing_manager');

// Apply the middleware to all routes in this file
router.use(requireBillingManager);

// Define the routes (now protected)
router.get('/mrr', getMRR);
router.get('/churn', getChurnRate);
router.get('/ltv', getLTV);
router.get('/trial-conversion', getTrialConversion);

export default router;