// frontend/src/config/db.ts
// --- FRONTEND DATABASE CONNECTION POOL MANAGER ---
// This file manages database connection pools for the frontend.
// It's used by frontend API routes (like /api/auth/signup) to interact with the backend database.
// It mirrors the structure of backend/src/config/db.ts for consistency in a SaaS multi-tenant setup.

import { Pool, PoolConfig } from 'pg';

// --- DEBUG: Log environment variables (BE CAREFUL NOT TO LOG SECRETS) ---
console.log("[Frontend/DB] Initializing frontend database pool manager...");
console.log("[Frontend/DB] DB Config present:", !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME));
console.log("[Frontend/DB] DB_CONFIG (sanitized):", {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  // password: '[REDACTED]',
  port: parseInt(process.env.DB_PORT || '5432'),
});
// --- END DEBUG ---

// --- DATABASE CONFIGURATION ---
// Define the database configuration object using environment variables
// Ensure these are set in frontend/.env.local for local development
const DB_CONFIG: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
};

console.log("[Frontend/DB] DB_CONFIG (final):", {
  user: DB_CONFIG.user,
  host: DB_CONFIG.host,
  database: DB_CONFIG.database,
  // password: '[REDACTED]',
  port: DB_CONFIG.port,
});
// --- END DATABASE CONFIGURATION ---

// --- GLOBAL CONNECTION POOL ---
// Create a single global connection pool for the frontend to interact with the main database
// This pool connects to the main 'saas_billing' database (public schema for tenant management)
let globalPool: Pool | null = null;

console.log("[Frontend/DB] Global connection pool initialized:", !!globalPool);
// --- END GLOBAL CONNECTION POOL ---

// --- TENANT CONNECTION POOLS CACHE ---
// A Map to store tenant-specific connection pools
// Key: tenantId (e.g., 'acme')
// Value: { tenantId: string, pool: Pool }
const tenantConnections = new Map<string, { tenantId: string; pool: Pool }>();

console.log("[Frontend/DB] Tenant connection pools cache initialized. Size:", tenantConnections.size);
// --- END TENANT CONNECTION POOLS CACHE ---

// --- HELPER: Initialize Global Pool ---
// Function to initialize the global connection pool
// This should be called once during application startup (e.g., in a serverless function handler)
export const initGlobalPool = async () => {
  console.log("[Frontend/DB/initGlobalPool] --- START ---");
  console.log("[Frontend/DB/initGlobalPool] Attempting to initialize global connection pool...");

  // Check if global pool already exists
  if (globalPool) {
    console.log("[Frontend/DB/initGlobalPool] Global pool already exists. Returning existing pool.");
    console.log("[Frontend/DB/initGlobalPool] --- END (SUCCESS - Pool Exists) ---");
    return globalPool;
  }

  try {
    console.log("[Frontend/DB/initGlobalPool] Creating new global connection pool...");
    // Create a new pool instance using the DB_CONFIG
    globalPool = new Pool(DB_CONFIG);
    console.log("[Frontend/DB/initGlobalPool] SUCCESS: New global connection pool created.");

    // Optional: Add pool error listener for debugging potential pool issues
    globalPool.on('error', (err) => {
      console.error(`[Frontend/DB/initGlobalPool] Unexpected error on idle client pool:`, err);
      // Handle pool error, e.g., reconnect logic if needed (complex for demo)
    });

    console.log("[Frontend/DB/initGlobalPool] Global pool error listener attached.");
    console.log("[Frontend/DB/initGlobalPool] --- END (SUCCESS - Pool Created) ---");
    return globalPool;
  } catch (error: any) {
    // Handle errors during pool initialization
    console.error("[Frontend/DB/initGlobalPool] CRITICAL FAILURE: An unexpected error occurred during global pool initialization:");
    console.error("[Frontend/DB/initGlobalPool] DB Error Details:", error);
    // Re-throw to signal failure to caller
    console.log("[Frontend/DB/initGlobalPool] --- END (FAILURE - DB Error) ---");
    throw error;
  }
};
// --- END HELPER ---

// --- HELPER: Get Tenant Pool ---
// Function to get a tenant-specific connection pool
// This creates a new pool for each tenant (simplified for demo)
// In a production app, you might want to cache and reuse pools like the backend does
// Inside frontend/src/config/db.ts -> getTenantPool function

// --- HELPER: Get Tenant Pool (Simplified for Demo) ---
// --- FIX: Apply release flag pattern to prevent double release of globalClient ---
export async function getTenantPool(tenantId: string) {
  console.log(`[Frontend/DB/getTenantPool] --- START ---`);
  console.log(`[Frontend/DB/getTenantPool] Attempting to get pool for tenant: ${tenantId}`);

  // --- STEP 1: Check if global pool is initialized ---
  if (!globalPool) {
    console.error(`[Frontend/DB/getTenantPool] FAILURE: Global pool not initialized. Call initGlobalPool() first.`);
    console.log(`[Frontend/DB/getTenantPool] --- END (FAILURE - No Global Pool) ---`);
    throw new Error("Global pool not initialized. Call initGlobalPool() first.");
  }
  // --- END STEP 1 ---

  // --- STEP 2: Check if tenant pool already exists in cache ---
  if (tenantConnections.has(tenantId)) {
    console.log(`[Frontend/DB/getTenantPool] Tenant pool for '${tenantId}' found in cache. Returning cached pool.`);
    const cachedPool = tenantConnections.get(tenantId)!.pool;
    console.log(`[Frontend/DB/getTenantPool] --- END (SUCCESS - Cached Pool) ---`);
    return cachedPool;
  }
  // --- END STEP 2 ---

  // --- STEP 3: Database Interaction ---
  let globalClient;
  // --- FIX: Introduce clientReleased flag ---
  let globalClientReleased = false; // <-- FLAG TO TRACK RELEASE STATUS

  try {
    console.log(`[Frontend/DB/getTenantPool] Attempting to connect to global database to check tenant '${tenantId}' existence...`);
    globalClient = await globalPool.connect();
    console.log(`[Frontend/DB/getTenantPool] SUCCESS: Connected to global database.`);

    try {
      console.log(`[Frontend/DB/getTenantPool] Setting search_path to 'public'...`);
      await globalClient.query(`SET search_path TO public`);
      console.log(`[Frontend/DB/getTenantPool] SUCCESS: search_path set to 'public'.`);

      // --- STEP 4: Query Tenant ---
      console.log(`[Frontend/DB/getTenantPool] Executing tenant lookup query for ID '${tenantId}'...`);
      const result = await globalClient.query(
        'SELECT * FROM tenants WHERE id = $1',
        [tenantId]
      );
      console.log(`[Frontend/DB/getTenantPool] Query executed. Rows returned: ${result.rows.length}`);

      // --- STEP 5: Check Tenant Existence ---
      if (result.rows.length === 0) {
        console.error(`[Frontend/DB/getTenantPool] FAILURE: Tenant '${tenantId}' NOT found in the global tenants table.`);
        console.log(`[Frontend/DB/getTenantPool] --- END (FAILURE - Tenant Not Found) ---`);
        throw new Error(`Tenant '${tenantId}' not found in the global tenants table.`);
      }

      const tenant = result.rows[0];
      console.log(`[Frontend/DB/getTenantPool] SUCCESS: Tenant '${tenantId}' found.`);
      console.log(`[Frontend/DB/getTenantPool] Tenant details:`, tenant);

      // --- STEP 6: Create Tenant-Specific Pool ---
      console.log(`[Frontend/DB/getTenantPool] Creating new pool for tenant '${tenantId}' with config (sanitized):`, {
        user: DB_CONFIG.user,
        host: DB_CONFIG.host,
        database: DB_CONFIG.database,
        // password: '[REDACTED]',
        port: DB_CONFIG.port,
      });

      const config: PoolConfig = {
        user: DB_CONFIG.user,
        host: DB_CONFIG.host,
        database: DB_CONFIG.database,
        password: DB_CONFIG.password,
        port: DB_CONFIG.port,
        // We don't set search_path here directly in the config for Pool.
        // We handle it when acquiring a connection.
      };

      const pool = new Pool(config);
      console.log(`[Frontend/DB/getTenantPool] SUCCESS: New pool created for tenant '${tenantId}'.`);

      // --- STEP 7: Add Pool Error Listener ---
      pool.on('error', (err) => {
        console.error(`[Frontend/DB/getTenantPool] Unexpected error on idle client pool for tenant ${tenantId}:`, err);
        // Handle pool error, e.g., reconnect logic if needed (complex for demo)
      });
      console.log(`[Frontend/DB/getTenantPool] Pool error listener attached for tenant ${tenantId}.`);

      // --- STEP 8: Cache the New Pool ---
      tenantConnections.set(tenantId, {
        tenantId,
        pool
      });
      console.log(`[Frontend/DB/getTenantPool] SUCCESS: New pool cached for tenant '${tenantId}'. Cache size:`, tenantConnections.size);

      console.log(`[Frontend/DB/getTenantPool] --- END (SUCCESS - New Pool Created) ---`);
      return pool;

    } finally {
      // --- FIX: Ensure globalClient.release() is called only once ---
      // --- STEP 9: Cleanup Inner ---
      if (globalClient && !globalClientReleased) {
        console.log(`[Frontend/DB/getTenantPool] Releasing global database client for tenant '${tenantId}' (inner attempt 1)...`);
        globalClient.release();
        globalClientReleased = true; // <-- MARK AS RELEASED
        console.log(`[Frontend/DB/getTenantPool] Global database client released (inner).`);
      } else if (globalClient && globalClientReleased) {
        console.warn(`[Frontend/DB/getTenantPool] WARNING: Attempted to release global database client for tenant '${tenantId}' again (inner). Already released.`);
      } else {
        console.log(`[Frontend/DB/getTenantPool] No global database client to release (inner) for tenant '${tenantId}'.`);
      }
      // Consider if pool needs cleanup, though globalPool likely manages it.
    }
  } catch (error: any) {
    // --- STEP 10: Handle Unexpected Errors ---
    console.error(`[Frontend/DB/getTenantPool] CRITICAL FAILURE: An unexpected error occurred during tenant pool creation for tenant ${tenantId}:`);
    console.error(`[Frontend/DB/getTenantPool] DB Error Details:`, error);
    // Re-throw to signal failure to caller
    console.log(`[Frontend/DB/getTenantPool] --- END (FAILURE - DB Error) ---`);
    throw error;
  } finally {
    // --- FIX: Ensure globalClient.release() is called only once ---
    // --- STEP 11: Cleanup Outer ---
    if (globalClient && !globalClientReleased) {
      console.log(`[Frontend/DB/getTenantPool] Releasing global database client for tenant '${tenantId}' (outer attempt 2 - safety net)...`);
      globalClient.release();
      globalClientReleased = true; // <-- MARK AS RELEASED
      console.log(`[Frontend/DB/getTenantPool] Global database client released (outer - safety net).`);
    } else if (globalClient && globalClientReleased) {
      console.warn(`[Frontend/DB/getTenantPool] WARNING: Attempted to release global database client for tenant '${tenantId}' again (outer - safety net). Already released.`);
    } else {
      console.log(`[Frontend/DB/getTenantPool] No global database client to release (outer - safety net) for tenant '${tenantId}'.`);
    }
    // Consider if pool needs cleanup, though globalPool likely manages it.
  }
  // --- END STEP 3: Database Interaction ---
}
// --- END HELPER: Get Tenant Pool (with Fix) ---
// --- END HELPER ---

// --- HELPER: Close All Connections ---
// Function to close all database connections (global and tenant-specific)
// This is useful for cleanup during server shutdown or testing
export const closeAllConnections = async () => {
  console.log(`[Frontend/DB/closeAllConnections] --- START ---`);
  console.log(`[Frontend/DB/closeAllConnections] Closing all database connections...`);

  if (globalPool) {
    console.log(`[Frontend/DB/closeAllConnections] Closing global pool...`);
    await globalPool.end();
    console.log(`[Frontend/DB/closeAllConnections] Global pool closed.`);
  }

  for (const { pool, tenantId } of tenantConnections.values()) {
    console.log(`[Frontend/DB/closeAllConnections] Closing pool for tenant: ${tenantId}...`);
    await pool.end();
  }

  tenantConnections.clear();
  console.log(`[Frontend/DB/closeAllConnections] All tenant pools closed and cache cleared. Cache size:`, tenantConnections.size);

  console.log(`[Frontend/DB/closeAllConnections] --- END ---`);
};
// --- END HELPER ---

console.log("[Frontend/DB] Frontend database pool manager initialized successfully.");