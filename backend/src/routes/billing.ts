// backend/src/routes/billing.ts
import { Router } from 'express';
import {
  getPlans,
  createSubscription,
  cancelSubscription,
  updatePaymentMethod,
  getBillingPortal, // We will protect this one
  webhookHandler
} from '../controllers/billing';
import { requireRole } from '../middleware/rbac'; // Import the RBAC middleware

const router = Router();

// --- Public routes (no auth needed for checkout) ---
router.get('/plans', getPlans);
router.post('/create-subscription', createSubscription);
// --- END Public routes ---

// --- Authenticated routes ---
// Routes that require a user to be identified (e.g., logged in or associated with a subscription)
router.post('/update-payment-method', updatePaymentMethod);
router.post('/cancel-subscription', cancelSubscription); // You might also want to protect this with RBAC
// --- END Authenticated routes ---

// --- RBAC Protected Routes ---
// Routes that require specific user roles within a tenant

// Protect the billing portal route: Only 'billing_manager' or 'admin' can access it.
// We apply the middleware directly to this route.
router.get('/portal', requireRole('billing_manager'), getBillingPortal);

// Example: You could also protect canceling subscription with RBAC if needed
// router.post('/cancel-subscription', requireRole('billing_manager'), cancelSubscription);
// --- END RBAC Protected Routes ---

// --- Webhook endpoint (Stripe will call this) ---
// IMPORTANT: Webhooks are called directly by Stripe, not by a user in your app.
// They MUST NOT be protected by user authentication or RBAC middleware.
// Stripe verification happens inside the webhookHandler itself using the webhook secret.
router.post('/webhook', webhookHandler);
// --- END Webhook endpoint ---

export default router;