-- ===========================
-- SaaS Billing Platform: Multi-Tenant Database Schema
-- ===========================

-- 1. (Optional) Create the main database (run as superuser in psql, not needed if already created)
-- CREATE DATABASE saas_billing;

-- 2. Connect to your database in pgAdmin or psql
-- \c saas_billing

-- 3. Enable the uuid-ossp extension for UUID generation (run as superuser if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4. Create the global tenants table in the public schema
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(50) PRIMARY KEY,                -- Unique tenant ID (e.g., 'acme')
  name VARCHAR(100) NOT NULL,                -- Tenant display name
  domain VARCHAR(100) UNIQUE,                -- Optional: custom domain for tenant
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create a function to automate tenant schema and table creation
DROP FUNCTION IF EXISTS create_tenant(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION create_tenant(tenant_id VARCHAR, tenant_name VARCHAR)
RETURNS VOID AS $$
BEGIN
  -- Insert tenant record into the global tenants table
  INSERT INTO tenants (id, name) VALUES (tenant_id, tenant_name)
  ON CONFLICT (id) DO NOTHING;

  -- Create a dedicated schema for the tenant (e.g., tenant_acme)
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', 'tenant_' || tenant_id);

  -- Create the users table in the tenant schema
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT ''member'',
      stripe_customer_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )', 'tenant_' || tenant_id);

  -- Create the plans table in the tenant schema
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.plans (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT ''USD'',
      interval VARCHAR(20) DEFAULT ''month'',
      features JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )', 'tenant_' || tenant_id);

  -- Create the subscriptions table in the tenant schema
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES %I.users(id) ON DELETE CASCADE,
      plan_id UUID NOT NULL REFERENCES %I.plans(id) ON DELETE RESTRICT,
      status VARCHAR(20) DEFAULT ''trialing'',
      stripe_subscription_id VARCHAR(255) UNIQUE,
      stripe_customer_id VARCHAR(255),
      trial_start TIMESTAMP,
      trial_end TIMESTAMP,
      start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )', 'tenant_' || tenant_id, 'tenant_' || tenant_id, 'tenant_' || tenant_id);

  -- Create indexes for performance on subscriptions
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_subscriptions_user ON %I.subscriptions(user_id)', 'tenant_' || tenant_id, 'tenant_' || tenant_id);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_subscriptions_plan ON %I.subscriptions(plan_id)', 'tenant_' || tenant_id, 'tenant_' || tenant_id);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_subscriptions_status ON %I.subscriptions(status)', 'tenant_' || tenant_id, 'tenant_' || tenant_id);

END;
$$ LANGUAGE plpgsql;

-- 6. Create a new tenant (this will create the schema and tables for that tenant)
-- Replace 'acme' and 'ACME Corp' with your tenant's ID and name as needed
SELECT create_tenant('acme', 'ACME Corp');

-- 7. Insert default plans for the tenant (replace UUIDs if you use different ones in your code)
INSERT INTO tenant_acme.plans (id, name, description, price, currency, interval, features)
VALUES
  ('b0e7c2e2-1234-4a5b-8e1a-123456789abc', 'Basic', 'Perfect for small teams', 10, 'usd', 'month', '["5 users", "Basic support", "10GB storage"]'),
  ('c1f8d3f3-2345-4b6c-9f2b-23456789abcd', 'Pro', 'For growing businesses', 29, 'usd', 'month', '["Unlimited users", "Priority support", "100GB storage", "Advanced analytics"]'),
  ('e3a1b5c6-7890-4d2e-b3f1-567890abcdef', 'Enterprise', 'For large organizations', 99, 'usd', 'month', '["Everything in Pro", "Dedicated account manager", "Custom integrations", "SLA"]');

-- ===========================
-- End of SaaS Billing Platform Schema
-- ===========================

-- Role-Based Access Control (RBAC)

CREATE OR REPLACE FUNCTION create_tenant(tenant_id VARCHAR, tenant_name VARCHAR)
RETURNS VOID AS $$
BEGIN
  -- ... (other table creations) ...

  -- Create the users table in the tenant schema
  -- Make sure this block is exactly like this inside the function
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT ''member'',
      stripe_customer_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )', 'tenant_' || tenant_id);

   -- ... (rest of the function: plans, subscriptions, indexes, END) ...
END;
$$ LANGUAGE plpgsql;

-- Insert or update the test user in the tenant_acme schema with the billing_manager role
INSERT INTO tenant_acme.users (email, role)
VALUES ('testuser@example.com', 'billing_manager')
ON CONFLICT (email)
DO UPDATE SET role = EXCLUDED.role; -- If user exists, update their role

-- Check if the user was added/updated
SELECT * FROM tenant_acme.users WHERE email = 'testuser@example.com';