// backend/src/config/db.ts
import { Pool, PoolConfig } from 'pg';

// Define types for clarity
interface TenantConnection {
  tenantId: string;
  pool: Pool;
}

// Global connection pool for public schema (tenant management)
let globalPool: Pool | null = null;

// Tenant connection pools cache
const tenantConnections = new Map<string, TenantConnection>();

export const initGlobalPool = () => {
  console.log("[DB] Initializing global pool"); // Debug log
  const config: PoolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'saas_billing',
    password: process.env.DB_PASSWORD || '', // Make sure this is set correctly in .env
    port: parseInt(process.env.DB_PORT || '5432'),
  };
  console.log(`[DB] Global pool config: ${JSON.stringify({ ...config, password: '***' })}`); // Log config (hide password)

  globalPool = new Pool(config);
  return globalPool;
};

export const getTenantPool = async (tenantId: string): Promise<Pool> => {
  console.log(`[DB] Getting pool for tenant: ${tenantId}`); // Debug log
  // Return cached connection if exists
  if (tenantConnections.has(tenantId)) {
    console.log(`[DB] Using cached pool for tenant: ${tenantId}`); // Debug log
    return tenantConnections.get(tenantId)!.pool;
  }

  // Check if tenant exists in public schema
  if (!globalPool) {
    throw new Error("Global pool not initialized. Call initGlobalPool() first.");
  }
  const globalClient = await globalPool.connect();
  try {
    console.log("[DB] Checking tenant existence in global DB"); // Debug log
    const result = await globalClient.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Tenant '${tenantId}' not found in the global tenants table.`);
    }
    console.log(`[DB] Tenant '${tenantId}' found.`); // Debug log

    // Create tenant-specific connection config
    // It connects to the SAME database, but we will set the schema context.
    const config: PoolConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'saas_billing', // Same database
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '5432'),
      // We don't set search_path here directly in the config for Pool.
      // We handle it when acquiring a connection.
    };
    console.log(`[DB] Creating new pool for tenant: ${tenantId}`); // Debug log

    const pool = new Pool(config);

    // --- CRITICAL: Set up connection handler to set search_path on acquire ---
    // This ensures every connection from this pool starts with the right schema.
    pool.on('connect', async (client) => {
      try {
        console.log(`[DB/Pool] New connection acquired for tenant pool ${tenantId}. Setting search_path.`); // Debug
        await client.query(`SET search_path TO tenant_${tenantId}, public`);
        console.log(`[DB/Pool] search_path set to 'tenant_${tenantId}, public' for connection.`); // Debug
      } catch (err) {
        console.error(`[DB/Pool] Failed to set search_path on connect for tenant ${tenantId}:`, err);
        // Depending on policy, you might want to close the client or handle the error differently
        // For now, we log it.
      }
    });

    // Cache the new pool
    tenantConnections.set(tenantId, {
      tenantId,
      pool
    });
    console.log(`[DB] New pool created and cached for tenant: ${tenantId}`); // Debug log

    return pool;
  } finally {
    globalClient.release();
    console.log("[DB] Released global client used for tenant check"); // Debug log
  }
};

export const closeAllConnections = async () => {
  console.log("[DB] Closing all connections"); // Debug log
  if (globalPool) {
    await globalPool.end();
    console.log("[DB] Global pool closed"); // Debug log
  }

  for (const { pool, tenantId } of tenantConnections.values()) {
    console.log(`[DB] Closing pool for tenant: ${tenantId}`); // Debug log
    await pool.end();
  }

  tenantConnections.clear();
  console.log("[DB] All tenant pools closed and cache cleared"); // Debug log
};