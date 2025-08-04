// backend/src/middleware/tenant.ts
import { Request, Response, NextFunction } from 'express';
import { getTenantPool } from '../config/db';

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("[TenantMiddleware] Incoming request"); // Debug log
    // Get tenant ID from subdomain or header
    let tenantId = req.subdomains[0]; // For subdomain like acme.localhost:3000

    if (!tenantId) {
      // If no subdomain, try header
      tenantId = req.headers['x-tenant-id'] as string;
      console.log(`[TenantMiddleware] Tenant ID from header: ${tenantId}`); // Debug log
    }

    if (!tenantId) {
      console.error("[TenantMiddleware] Missing tenant ID");
      return res.status(400).json({ error: 'Tenant ID is required (via subdomain or x-tenant-id header)' });
    }

    console.log(`[TenantMiddleware] Identified tenant: ${tenantId}`); // Debug log

    // --- CRITICAL: Get the tenant-specific pool ---
    const tenantPool = await getTenantPool(tenantId);
    console.log(`[TenantMiddleware] Got tenant pool for: ${tenantId}`); // Debug log

    // --- CRITICAL: Attach tenant info to the request ---
    req.tenantPool = tenantPool;
    req.tenantId = tenantId;

    // --- CRITICAL: Set the search_path on the pool itself ---
    // This ensures any new connection from this pool starts with the correct schema.
    // We do this once when setting up the pool in getTenantPool, but let's double-check.
    // Actually, better to ensure it's set on the connection acquired in the controller.
    // Let's leave this middleware focused on attaching the pool.

    next();
  } catch (error: any) {
    console.error('[TenantMiddleware] Error:', error);
    res.status(400).json({ error: `Invalid tenant or setup error: ${error.message}` });
  }
};