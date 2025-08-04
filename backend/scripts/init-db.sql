-- Public schema (global tenant management)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to create a new tenant
CREATE OR REPLACE FUNCTION create_tenant(tenant_id VARCHAR, tenant_name VARCHAR)
RETURNS VOID AS $$
BEGIN
  -- Create tenant record
  INSERT INTO tenants (id, name) VALUES (tenant_id, tenant_name);
  
  -- Create tenant schema
  EXECUTE format('CREATE SCHEMA tenant_%I', tenant_id);
  
  -- Create tenant-specific tables
  EXECUTE format('
    CREATE TABLE tenant_%I.users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT ''member'',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', tenant_id);
  
  EXECUTE format('
    CREATE TABLE tenant_%I.plans (
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
    )
  ', tenant_id);
  
  EXECUTE format('
    CREATE TABLE tenant_%I.subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES tenant_%I.users(id),
      plan_id UUID NOT NULL REFERENCES tenant_%I.plans(id),
      status VARCHAR(20) DEFAULT ''trialing'',
      stripe_subscription_id VARCHAR(255),
      stripe_customer_id VARCHAR(255),
      trial_start TIMESTAMP,
      trial_end TIMESTAMP,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', tenant_id, tenant_id, tenant_id);
  
  -- Add indexes
  EXECUTE format('CREATE INDEX idx_subscriptions_user ON tenant_%I.subscriptions(user_id)', tenant_id);
  EXECUTE format('CREATE INDEX idx_subscriptions_plan ON tenant_%I.subscriptions(plan_id)', tenant_id);
END;
$$ LANGUAGE plpgsql;