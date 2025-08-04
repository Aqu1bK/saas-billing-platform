import Stripe from 'stripe';
import { Request, Response } from 'express';

// Use the latest Stripe API version your SDK expects
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil'
});

// Mock product data (replace with DB in production)
// const PLANS = [
//   {
//     id: 'basic',
//     name: 'Basic',
//     description: 'Perfect for small teams',
//     price: 10,
//     currency: 'usd',
//     interval: 'month',
//     features: ['5 users', 'Basic support', '10GB storage']
//   },
//   {
//     id: 'pro',
//     name: 'Pro',
//     description: 'For growing businesses',
//     price: 29,
//     currency: 'usd',
//     interval: 'month',
//     features: ['Unlimited users', 'Priority support', '100GB storage', 'Advanced analytics']
//   },
//   {
//     id: 'enterprise',
//     name: 'Enterprise',
//     description: 'For large organizations',
//     price: 99,
//     currency: 'usd',
//     interval: 'month',
//     features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'SLA']
//   }
// ];

const PLANS = [
  {
    id: 'b0e7c2e2-1234-4a5b-8e1a-123456789abc',
    name: 'Basic',
    description: 'Perfect for small teams',
    price: 10,
    currency: 'usd',
    interval: 'month',
    features: ['5 users', 'Basic support', '10GB storage']
  },
  {
    id: 'c1f8d3f3-2345-4b6c-9f2b-23456789abcd',
    name: 'Pro',
    description: 'For growing businesses',
    price: 29,
    currency: 'usd',
    interval: 'month',
    features: ['Unlimited users', 'Priority support', '100GB storage', 'Advanced analytics']
  },
  {
    id: 'd2g9e4g4-3456-4c7d-af3c-3456789abcde',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 99,
    currency: 'usd',
    interval: 'month',
    features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'SLA']
  }
];



// Get available plans
export const getPlans = async (req: Request, res: Response) => {
  try {
    res.json(PLANS);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

// Create a new subscription
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { planId, email, paymentMethodId, trialDays = 0 } = req.body;
    if (!planId || !email || !paymentMethodId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const plan = PLANS.find(p => p.id === planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Find or create Stripe customer
    const customerList = await stripe.customers.list({ email });
    let customer: Stripe.Customer;
    if (customerList.data.length === 0) {
      customer = await stripe.customers.create({
        email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    } else {
      customer = customerList.data[0];
      // Attach and set default payment method
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId }
      });
    }

    // Create a Stripe price object on the fly (for demo; in prod, use pre-created prices)
    const price = await stripe.prices.create({
      unit_amount: plan.price * 100,
      currency: plan.currency,
      recurring: { interval: plan.interval as 'month' | 'year' },
      product_data: { name: plan.name }
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      trial_period_days: trialDays,
      expand: ['latest_invoice.payment_intent']
    });

    // Save to tenant DB
    const client = await req.tenantPool.connect();
    await client.query(`SET search_path TO tenant_${req.tenantId}`); // <-- Set schema
    try {
      await client.query('BEGIN');
      // Save user
      let userResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      let user;
      if (userResult.rows.length === 0) {
        user = (await client.query(
          'INSERT INTO users (email, stripe_customer_id) VALUES ($1, $2) RETURNING *',
          [email, customer.id]
        )).rows[0];
      } else {
        user = userResult.rows[0];
        if (!user.stripe_customer_id) {
          await client.query(
            'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
            [customer.id, user.id]
          );
        }
      }
      // Save subscription
      await client.query(
        `INSERT INTO subscriptions (
          user_id, 
          plan_id, 
          status, 
          stripe_subscription_id, 
          stripe_customer_id,
          trial_start,
          trial_end,
          start_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          planId,
          subscription.status,
          subscription.id,
          customer.id,
          subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          new Date(subscription.start_date * 1000)
        ]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Return client secret for payment confirmation
    const { latest_invoice } = subscription;
    const { payment_intent } = latest_invoice as any;
    res.json({
      subscriptionId: subscription.id,
      clientSecret: payment_intent ? payment_intent.client_secret : null
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

// Cancel a subscription
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    const client = await req.tenantPool.connect();
    await client.query(`SET search_path TO tenant_${req.tenantId}`); // <-- Set schema
    try {
      const result = await client.query(
        'SELECT * FROM subscriptions WHERE id = $1',
        [subscriptionId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      const subscription = result.rows[0];
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true
      });
      await client.query(
        'UPDATE subscriptions SET cancel_at_period_end = true WHERE id = $1',
        [subscriptionId]
      );
      res.json({ message: 'Subscription marked for cancellation' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Update payment method
export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }
    const client = await req.tenantPool.connect();
    await client.query(`SET search_path TO tenant_${req.tenantId}`); // <-- Set schema
    try {
      const result = await client.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [req.user.id]
      );
      if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      const customerId = result.rows[0].stripe_customer_id;
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId }
      });
      res.json({ message: 'Payment method updated successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
};

// Billing portal
export const getBillingPortal = async (req: Request, res: Response) => {
  try {
    const client = await req.tenantPool.connect();
    await client.query(`SET search_path TO tenant_${req.tenantId}`); // <-- Set schema
    try {
      const result = await client.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [req.user.id]
      );
      if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      const customerId = result.rows[0].stripe_customer_id;
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.FRONTEND_URL}/account/billing`
      });
      res.json({ url: session.url });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating billing portal:', error);
    res.status(500).json({ error: 'Failed to create billing portal' });
  }
};

// Stripe webhook handler
export const webhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // You must determine the correct tenant pool for the customer here!
  // For example, look up the customer in your global DB to find the tenant, then getTenantPool(tenantId)
  // For demo, we'll use a placeholder:
  const tenantPool = null; // TODO: Implement tenant pool lookup

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
      if (!req.tenantId) {
        throw new Error('tenantId is required for webhook handling');
      }
      await handleSubscriptionUpdate(event.data.object, tenantPool, req.tenantId);
      break;
    case 'invoice.payment_succeeded':
      if (!req.tenantId) {
        throw new Error('tenantId is required for webhook handling');
      }
      await handlePaymentSucceeded(event.data.object, tenantPool, req.tenantId);
      break;
    case 'invoice.payment_failed':
      if (!req.tenantId) {
        throw new Error('tenantId is required for webhook handling');
      }
      await handlePaymentFailed(event.data.object, tenantPool, req.tenantId);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.send({ received: true });
};

// Helper functions for webhook handling
async function handleSubscriptionUpdate(subscription: any, tenantPool: any, tenantId: string) {
  if (!tenantPool) return;
  const client = await tenantPool.connect();
  await client.query(`SET search_path TO tenant_${tenantId}`);
  try {
    await client.query(
      `UPDATE subscriptions 
       SET status = $1, cancel_at_period_end = $2 
       WHERE stripe_subscription_id = $3`,
      [subscription.status, subscription.cancel_at_period_end, subscription.id]
    );
  } finally {
    client.release();
  }
}

async function handlePaymentSucceeded(invoice: any, tenantPool: any, tenantId: string) {
  if (!tenantPool) return;
  const client = await tenantPool.connect();
  await client.query(`SET search_path TO tenant_${tenantId}`);
  try {
    await client.query(
      `UPDATE subscriptions 
       SET status = 'active' 
       WHERE stripe_subscription_id = $1`,
      [invoice.subscription]
    );
  } finally {
    client.release();
  }
}

async function handlePaymentFailed(invoice: any, tenantPool: any, tenantId: string) {
  if (!tenantPool) return;
  const client = await tenantPool.connect();
  await client.query(`SET search_path TO tenant_${tenantId}`);
  try {
    await client.query(
      `UPDATE subscriptions 
       SET status = 'past_due' 
       WHERE stripe_subscription_id = $1`,
      [invoice.subscription]
    );
    // Add notification/retry logic here
  } finally {
    client.release();
  }
}