// backend/src/controllers/analytics.ts
import { Request, Response } from 'express';
// import { PoolClient } from 'pg'; // Optional for type hinting

// --- Helper function to safely get a number from a database result ---
const safeNumber = (value: any): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// --- MRR (Monthly Recurring Revenue) ---
export const getMRR = async (req: Request, res: Response) => {
  console.log(`[Analytics/MRR] Request received for tenant: ${req.tenantId}`);
  try {
    // Ensure req.tenantPool exists (set by tenantMiddleware)
    if (!req.tenantPool) {
      console.error('[Analytics/MRR] Tenant pool not found on request object.');
      return res.status(500).json({ error: 'Internal server error: Tenant context missing.' });
    }

    const client = await req.tenantPool.connect();
    console.log(`[Analytics/MRR] Acquired DB connection for tenant: ${req.tenantId}`);

    try {
      // --- Calculate current MRR ---
      const result = await client.query(`
        SELECT 
          COALESCE(SUM(CASE 
            WHEN p.interval = 'month' THEN p.price 
            WHEN p.interval = 'year' THEN p.price / 12.0
            ELSE 0 
          END), 0) AS current_mrr
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status IN ('active', 'trialing')
      `);

      const currentMRR = safeNumber(result.rows[0]?.current_mrr);
      console.log(`[Analytics/MRR] Current MRR calculated: ${currentMRR}`);

      // --- Get historical MRR data (last 6 months) ---
      const historicalResult = await client.query(`
        SELECT 
          DATE_TRUNC('month', s.start_date) AS month,
          COALESCE(SUM(CASE 
            WHEN p.interval = 'month' THEN p.price 
            WHEN p.interval = 'year' THEN p.price / 12.0
            ELSE 0 
          END), 0) AS mrr_value
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status IN ('active', 'trialing')
          AND s.start_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months' -- Last 6 months
        GROUP BY DATE_TRUNC('month', s.start_date)
        ORDER BY month
      `);

      
      // Line 58: Add type annotation for 'row'
      const historicalData = historicalResult.rows.map((row: any) => ({
      name: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      MRR: safeNumber(row.mrr_value) // Use 'MRR' key for Recharts
      }));

      console.log(`[Analytics/MRR] Sending response for tenant: ${req.tenantId}`);
      res.json({
        current: currentMRR,
        historical: historicalData
      });

    } finally {
      client.release();
      console.log(`[Analytics/MRR] Released DB connection for tenant: ${req.tenantId}`);
    }
  } catch (error: any) {
    console.error('[Analytics/MRR] Error calculating MRR:', error);
    // Send a more specific error message to help debugging
    res.status(500).json({ error: `Failed to calculate MRR: ${error.message}` });
  }
};

// --- Churn Rate ---
export const getChurnRate = async (req: Request, res: Response) => {
  console.log(`[Analytics/Churn] Request received for tenant: ${req.tenantId}`);
  try {
    if (!req.tenantPool) {
      console.error('[Analytics/Churn] Tenant pool not found on request object.');
      return res.status(500).json({ error: 'Internal server error: Tenant context missing.' });
    }

    const client = await req.tenantPool.connect();
    console.log(`[Analytics/Churn] Acquired DB connection for tenant: ${req.tenantId}`);

    try {
      // --- Calculate monthly churn rate ---
      // This query looks at subscriptions that ended within a month of starting
      // Note: This is a simplified churn calculation. Real-world churn is more complex.
      const result = await client.query(`
        WITH monthly_stats AS (
          SELECT
            DATE_TRUNC('month', start_date) AS month,
            COUNT(*) AS new_subscribers,
            COUNT(*) FILTER (
              WHERE end_date IS NOT NULL 
                AND end_date >= start_date 
                AND end_date < start_date + INTERVAL '1 month'
            ) AS churned_within_month
          FROM subscriptions
          WHERE start_date IS NOT NULL
          GROUP BY DATE_TRUNC('month', start_date)
          HAVING COUNT(*) > 0 -- Only months with new subs
        )
        SELECT
          month,
          new_subscribers,
          churned_within_month,
          CASE 
            WHEN new_subscribers > 0 
            THEN (churned_within_month::FLOAT / new_subscribers) * 100 
            ELSE 0 
          END AS churn_rate
        FROM monthly_stats
        ORDER BY month
      `);

      res.json(result.rows.map((row: any) => ({
      month: row.month,
      new_subscribers: parseInt(row.new_subscribers, 10) || 0,
      churned_within_month: parseInt(row.churned_within_month, 10) || 0,
      churn_rate: safeNumber(row.churn_rate)
      })));

    } finally {
      client.release();
      console.log(`[Analytics/Churn] Released DB connection for tenant: ${req.tenantId}`);
    }
  } catch (error: any) {
    console.error('[Analytics/Churn] Error calculating churn rate:', error);
    res.status(500).json({ error: `Failed to calculate churn rate: ${error.message}` });
  }
};

// --- LTV (Lifetime Value) ---
export const getLTV = async (req: Request, res: Response) => {
  console.log(`[Analytics/LTV] Request received for tenant: ${req.tenantId}`);
  try {
    if (!req.tenantPool) {
      console.error('[Analytics/LTV] Tenant pool not found on request object.');
      return res.status(500).json({ error: 'Internal server error: Tenant context missing.' });
    }

    const client = await req.tenantPool.connect();
    console.log(`[Analytics/LTV] Acquired DB connection for tenant: ${req.tenantId}`);

    try {
      // --- Calculate average LTV ---
      // Average revenue per month * Average subscription lifetime in months
      const result = await client.query(`
        SELECT
          COALESCE(AVG(monthly_value * subscription_lifetime_months), 0) AS avg_ltv
        FROM (
          SELECT
            s.id AS subscription_id,
            -- Calculate average monthly value for the subscription
            CASE 
              WHEN p.interval = 'year' THEN p.price / 12.0
              WHEN p.interval = 'month' THEN p.price
              ELSE 0
            END AS monthly_value,
            -- Calculate subscription lifetime in months
            GREATEST(
              EXTRACT(EPOCH FROM (COALESCE(s.end_date, NOW()) - s.start_date)) / (86400.0 * 30.0),
              0
            ) AS subscription_lifetime_months
          FROM subscriptions s
          JOIN plans p ON s.plan_id = p.id
          WHERE s.status IN ('canceled', 'active') -- Include active for ongoing calc?
          -- Consider only subscriptions that lasted some time to avoid skew
          AND (s.end_date IS NULL OR s.end_date > s.start_date + INTERVAL '1 day') 
        ) AS sub_values
      `);

      const ltv = safeNumber(result.rows[0]?.avg_ltv);
      console.log(`[Analytics/LTV] LTV calculated: ${ltv}`);

      console.log(`[Analytics/LTV] Sending response for tenant: ${req.tenantId}`);
      res.json({ ltv });

    } finally {
      client.release();
      console.log(`[Analytics/LTV] Released DB connection for tenant: ${req.tenantId}`);
    }
  } catch (error: any) {
    console.error('[Analytics/LTV] Error calculating LTV:', error);
    res.status(500).json({ error: `Failed to calculate LTV: ${error.message}` });
  }
};

// --- Trial to Paid Conversion ---
export const getTrialConversion = async (req: Request, res: Response) => {
  console.log(`[Analytics/TrialConv] Request received for tenant: ${req.tenantId}`);
  try {
    if (!req.tenantPool) {
      console.error('[Analytics/TrialConv] Tenant pool not found on request object.');
      return res.status(500).json({ error: 'Internal server error: Tenant context missing.' });
    }

    const client = await req.tenantPool.connect();
    console.log(`[Analytics/TrialConv] Acquired DB connection for tenant: ${req.tenantId}`);

    try {
      // --- Calculate trial conversion rate ---
      const result = await client.query(`
        SELECT
          COUNT(*) FILTER (WHERE trial_end IS NOT NULL) AS total_trials,
          COUNT(*) FILTER (WHERE trial_end IS NOT NULL AND status = 'active') AS converted_to_paid,
          COUNT(*) FILTER (WHERE trial_end IS NOT NULL AND status = 'canceled') AS not_converted,
          CASE
            WHEN COUNT(*) FILTER (WHERE trial_end IS NOT NULL) > 0
            THEN (COUNT(*) FILTER (WHERE trial_end IS NOT NULL AND status = 'active')::FLOAT /
                  COUNT(*) FILTER (WHERE trial_end IS NOT NULL)) * 100
            ELSE 0
          END AS conversion_rate
        FROM subscriptions
      `);

      const rowData = result.rows[0];
      const totalTrials = parseInt(rowData?.total_trials, 10) || 0;
      const converted = parseInt(rowData?.converted_to_paid, 10) || 0;
      const notConverted = parseInt(rowData?.not_converted, 10) || 0;
      const conversionRate = safeNumber(rowData?.conversion_rate);

      console.log(`[Analytics/TrialConv] Trial Conv: ${converted}/${totalTrials} = ${conversionRate}%`);

      console.log(`[Analytics/TrialConv] Sending response for tenant: ${req.tenantId}`);
      res.json({
        total_trials: totalTrials,
        converted_to_paid: converted,
        not_converted: notConverted,
        conversion_rate: conversionRate
      });

    } finally {
      client.release();
      console.log(`[Analytics/TrialConv] Released DB connection for tenant: ${req.tenantId}`);
    }
  } catch (error: any) {
    console.error('[Analytics/TrialConv] Error calculating trial conversion:', error);
    res.status(500).json({ error: `Failed to calculate trial conversion: ${error.message}` });
  }
};
