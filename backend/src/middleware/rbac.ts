// backend/src/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';

// Define the roles in order of hierarchy (lower index = lower privilege)
const ROLES = {
  member: 0,
  billing_manager: 1,
  admin: 2,
  // owner: 3 // Optional: Highest level, perhaps the user who initially signed up
} as const;

type Role = keyof typeof ROLES;

// Middleware factory to check for a minimum required role
export const requireRole = (requiredRole: Role) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Assume req.user.id or req.user.email is set by an authentication middleware *after* tenantMiddleware
      // For this example, let's assume the email is available from the subscription context or auth.
      // A more robust system would have a full user authentication flow.
      // For now, we'll get the user email from the request context or session.
      // Let's assume for dashboard access, the user's email is somehow known (e.g., from session, token, or previous request context).
      // This is a simplification. In a real app, you'd have req.user.id or similar from authentication.

      // Placeholder: Get user identifier. This needs to be integrated with your auth system.
      // For demonstration, let's assume it's passed in a header or somehow available.
      // A real implementation would rely on a proper authentication system (JWT, sessions).
      const userEmail = req.headers['x-user-email'] as string | undefined; // Example header
      // OR, if you have user authentication implemented later:
      // const userId = req.user?.id;
      // const userEmail = req.user?.email;

      if (!userEmail) {
        console.warn("[RBAC] User email not found in request for role check.");
        return res.status(401).json({ error: 'Authentication required or user context missing.' });
      }

      if (!req.tenantPool) {
        console.error("[RBAC] Tenant pool not found on request object.");
        return res.status(500).json({ error: 'Internal server error: Tenant context missing for RBAC.' });
      }

      const client = await req.tenantPool.connect();
      try {
        // Query the tenant-specific users table for the user's role
        // Using the email as the identifier for now (as it's available from subscription flow)
        const result = await client.query(
          'SELECT role FROM users WHERE email = $1',
          [userEmail]
        );

        if (result.rows.length === 0) {
            // User not found in this tenant's database.
            // Depending on your auth flow, you might create them here with 'member' role,
            // or return 403/404. Let's assume they exist if they are accessing protected areas.
            console.warn(`[RBAC] User ${userEmail} not found in tenant ${req.tenantId} database.`);
            return res.status(403).json({ error: 'Access denied. User not found or not authorized for this tenant.' });
        }

        const userRole: Role = result.rows[0].role || 'member'; // Default to member if somehow null

        // Check if user's role meets or exceeds the required role
        const userRoleLevel = ROLES[userRole] ?? ROLES.member; // Default to member level if unknown role
        const requiredRoleLevel = ROLES[requiredRole];

        if (userRoleLevel >= requiredRoleLevel) {
          console.log(`[RBAC] Access GRANTED for user ${userEmail} (role: ${userRole}) to resource requiring ${requiredRole} in tenant ${req.tenantId}`);
          // Optionally attach user info to req for later use in controllers
          // req.currentUser = { email: userEmail, role: userRole, id: result.rows[0].id };
          next();
        } else {
          console.log(`[RBAC] Access DENIED for user ${userEmail} (role: ${userRole}) to resource requiring ${requiredRole} in tenant ${req.tenantId}`);
          return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('[RBAC] Error checking user role:', error);
      res.status(500).json({ error: 'Failed to verify permissions: ' + error.message });
    }
  };
};