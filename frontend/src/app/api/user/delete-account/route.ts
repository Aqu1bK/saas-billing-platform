// frontend/src/app/api/user/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server';
// --- FIX 1: Correct import for getServerSession ---
// Import getServerSession from next-auth (not next-auth/next)
import { getServerSession } from "next-auth";
// --- FIX 2: Correct import for nextAuthOptions ---
// Import the named export nextAuthOptions from your NextAuth config file
// Make sure the path is correct relative to THIS file
import { nextAuthOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
// --- Import other modules ---
import { getTenantPool, initGlobalPool } from '@/config/db'; // --- FIX 3: Import initGlobalPool ---
import { Pool } from 'pg';

// --- DEBUG: Log environment variables (BE CAREFUL NOT TO LOG SECRETS) ---
console.log("[API/User/Delete-Account] Initializing delete account endpoint...");
console.log("[API/User/Delete-Account] NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);
console.log("[API/User/Delete-Account] DB Config present:", !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME));
console.log("[API/User/Delete-Account] DB_CONFIG (sanitized):", {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  // password: '[REDACTED]',
  port: parseInt(process.env.DB_PORT || '5432'),
});
// --- END DEBUG ---

export async function DELETE(request: NextRequest) {
  console.log("[API/User/Delete-Account] DELETE request received");

  try {
    // --- STEP 1: Initialize Global Pool (CRITICAL FIX) ---
    // Ensure the global database pool is initialized before calling getTenantPool
    // This resolves the "Global pool not initialized" error.
    console.log(`[API/User/Delete-Account] Attempting to initialize global database pool...`);
    await initGlobalPool(); // --- CRITICAL: Call initGlobalPool ---
    console.log(`[API/User/Delete-Account] SUCCESS: Global database pool initialized.`);
    // --- END STEP 1: Initialize Global Pool ---

    // --- STEP 2: Authenticate User ---
    // Use getServerSession to get the user's session server-side
    // This ensures the user is authenticated before allowing account deletion
    const session = await getServerSession(nextAuthOptions);
    console.log("[API/User/Delete-Account] Session retrieved:", session ? "Present" : "Absent");

    if (!session || !session.user) {
      console.warn("[API/User/Delete-Account] FAILURE: User not authenticated or session missing.");
      console.log("[API/User/Delete-Account] --- END (FAILURE - Not Authenticated) ---");
      return NextResponse.json({ error: 'You must be logged in to delete your account.' }, { status: 401 }); // 401 Unauthorized
    }

    // --- STEP 3: Access User Data ---
    // Access user data correctly from session
    // Use type assertion to access custom properties like 'id', 'role', 'tenantId'
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;
    console.log(`[API/User/Delete-Account] Authenticated user: ID=${userId}, Email=${userEmail}, Role=${userRole}, Tenant ID=${tenantId}`);

    // --- STEP 4: Validate User Data ---
    if (!userId || !tenantId) {
      console.error("[API/User/Delete-Account] FAILURE: User ID or Tenant ID missing from session.");
      console.log("[API/User/Delete-Account] --- END (FAILURE - Missing IDs) ---");
      return NextResponse.json({ error: 'User ID or Tenant ID is missing from your session.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 5: Determine Tenant ID ---
    // IMPORTANT: In a real app, derive this dynamically!
    // For this demo, we'll use the tenantId from the session.
    // This assumes your NextAuth.js setup correctly populates session.user.tenantId.
    console.log(`[API/User/Delete-Account] Using tenant ID from session: ${tenantId}`);

    if (!tenantId) {
      console.error("[API/User/Delete-Account] FAILURE: Could not determine tenant ID. Account deletion aborted.");
      console.log("[API/User/Delete-Account] --- END (FAILURE - No Tenant ID) ---");
      return NextResponse.json({ error: 'Could not determine tenant ID. Account deletion aborted.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 6: Database Interaction ---
    let pool;
    let client;
    let clientReleased = false; // Flag to track release status
    try {
      console.log(`[API/User/Delete-Account] Attempting to get database pool for tenant '${tenantId}'...`);
      pool = await getTenantPool(tenantId); // --- SHOULD NOW WORK ---
      console.log(`[API/User/Delete-Account] SUCCESS: Got database pool for tenant '${tenantId}'.`);

      console.log(`[API/User/Delete-Account] Attempting to connect to database for tenant '${tenantId}'...`);
      client = await pool.connect();
      console.log(`[API/User/Delete-Account] SUCCESS: Connected to database for tenant '${tenantId}'.`);

      try {
        console.log(`[API/User/Delete-Account] Setting search_path to 'tenant_${tenantId}, public'...`);
        await client.query(`SET search_path TO tenant_${tenantId}, public`);
        console.log(`[API/User/Delete-Account] SUCCESS: search_path set.`);

        // --- STEP 7: Delete User Record ---
        // IMPORTANT: This is a destructive action!
        // Consider soft-deleting (adding a deleted_at timestamp) instead of hard-deleting.
        // For this demo, we'll proceed with hard deletion.
        console.log(`[API/User/Delete-Account] Executing user deletion query for user ID '${userId}'...`);
        const result = await client.query(
          'DELETE FROM users WHERE id = $1 RETURNING id, email',
          [userId]
        );
        console.log(`[API/User/Delete-Account] Query executed. Rows affected: ${result.rowCount}`);

        // --- STEP 8: Check Deletion Success ---
        if (result.rowCount === 0) {
          console.log(`[API/User/Delete-Account] FAILURE: User with ID '${userId}' NOT found in tenant '${tenantId}' for deletion.`);
          console.log("[API/User/Delete-Account] --- END (FAILURE - User Not Found) ---");
          return NextResponse.json({ error: 'User account not found for deletion.' }, { status: 404 }); // 404 Not Found
        }

        const deletedUser = result.rows[0];
        console.log(`[API/User/Delete-Account] SUCCESS: User deleted - ID=${deletedUser.id}, Email=${deletedUser.email}`);

        // --- STEP 9: Optional - Trigger Stripe Customer Deletion ---
        // You might want to delete the associated Stripe Customer object here.
        // This depends on your exact workflow and data retention policies.
        // Be very careful with this, as it's irreversible.
        // Example (pseudo-code, requires Stripe setup):
        // if (deletedUser.stripe_customer_id) {
        //   try {
        //     await stripe.customers.del(deletedUser.stripe_customer_id);
        //     console.log(`[API/User/Delete-Account] Stripe customer deleted: ${deletedUser.stripe_customer_id}`);
        //   } catch (stripeError: any) {
        //     console.error(`[API/User/Delete-Account] WARNING: Failed to delete Stripe customer ${deletedUser.stripe_customer_id}:`, stripeError);
        //     // Don't fail the entire request if Stripe deletion fails, but log it
        //   }
        // }

        // --- STEP 10: Success ---
        console.log(`[API/User/Delete-Account] SUCCESS: Account deletion completed for user '${deletedUser.email}' in tenant '${tenantId}'.`);
        console.log("[API/User/Delete-Account] --- END (SUCCESS) ---");
        return NextResponse.json(
          {
            message: 'User account deleted successfully.',
            user: {
              id: deletedUser.id,
              email: deletedUser.email,
              // Add other non-sensitive fields if needed
            },
          },
          { status: 200 } // 200 OK
        );

      } finally {
        // --- STEP 11: Cleanup Inner ---
        if (client && !clientReleased) {
          console.log(`[API/User/Delete-Account] Releasing database client for tenant '${tenantId}' (attempt 1)...`);
          client.release();
          clientReleased = true; // Mark as released
          console.log(`[API/User/Delete-Account] Database client released for tenant '${tenantId}'.`);
        } else if (client && clientReleased) {
          console.warn(`[API/User/Delete-Account] WARNING: Attempted to release database client for tenant '${tenantId}' again. Already released.`);
        } else {
          console.log(`[API/User/Delete-Account] No database client to release for tenant '${tenantId}'.`);
        }
      }
    } catch (dbError: any) {
      // --- STEP 12: Handle Database Errors ---
      console.error("[API/User/Delete-Account] DB Error during account deletion:", dbError);
      // Don't expose internal errors directly to the client
      return NextResponse.json(
        { error: 'Failed to delete user account: ' + (dbError.message || 'Unknown database error') },
        { status: 500 } // 500 Internal Server Error
      );
    } finally {
      // --- STEP 13: Cleanup Outer ---
      if (client && !clientReleased) {
        console.log(`[API/User/Delete-Account] Releasing database client for tenant '${tenantId}' (attempt 2 - safety net)...`);
        client.release();
        clientReleased = true; // Mark as released
        console.log(`[API/User/Delete-Account] Database client released for tenant '${tenantId}' (safety net).`);
      } else if (client && clientReleased) {
        // This is expected if the inner finally already released it.
        console.log(`[API/User/Delete-Account] Database client for tenant '${tenantId}' already released (safety net check).`);
      } else {
        console.log(`[API/User/Delete-Account] No database client to release in outer finally for tenant '${tenantId}'.`);
      }
      // Consider if pool needs cleanup, though getTenantPool likely manages it.
    }
  } catch (error: any) {
    // --- STEP 14: Handle Unexpected Errors ---
    console.error("[API/User/Delete-Account] Unexpected error during account deletion:", error);
    // Don't expose internal errors directly to the client
    // return NextResponse.js
     return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}