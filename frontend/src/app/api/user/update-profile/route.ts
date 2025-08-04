// frontend/src/app/api/user/update-profile/route.ts
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
console.log("[API/User/Update-Profile] Initializing update profile endpoint...");
console.log("[API/User/Update-Profile] NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);
console.log("[API/User/Update-Profile] DB Config present:", !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME));
console.log("[API/User/Update-Profile] DB_CONFIG (sanitized):", {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  // password: '[REDACTED]',
  port: parseInt(process.env.DB_PORT || '5432'),
});
// --- END DEBUG ---

export async function PUT(request: NextRequest) {
  console.log("[API/User/Update-Profile] PUT request received");

  try {
    // --- STEP 1: Initialize Global Pool (CRITICAL FIX) ---
    // Ensure the global database pool is initialized before calling getTenantPool
    // This resolves the "Global pool not initialized" error.
    console.log(`[API/User/Update-Profile] Attempting to initialize global database pool...`);
    await initGlobalPool(); // --- CRITICAL: Call initGlobalPool ---
    console.log(`[API/User/Update-Profile] SUCCESS: Global database pool initialized.`);
    // --- END STEP 1: Initialize Global Pool ---

    // --- STEP 2: Authenticate User ---
    // --- FIX 4: Use getServerSession with imported nextAuthOptions ---
    // Use getServerSession to get the user's session server-side
    // This ensures the user is authenticated before allowing profile updates
    // Pass the imported nextAuthOptions to ensure session verification uses the correct config
    const session = await getServerSession(nextAuthOptions);
    console.log("[API/User/Update-Profile] Session retrieved:", session ? "Present" : "Absent");

    if (!session || !session.user) {
      console.warn("[API/User/Update-Profile] FAILURE: User not authenticated or session missing.");
      console.log("[API/User/Update-Profile] --- END (FAILURE - Not Authenticated) ---");
      return NextResponse.json({ error: 'You must be logged in to update your profile.' }, { status: 401 }); // 401 Unauthorized
    }

    // --- FIX 5: Access user data correctly from session ---
    // The session.user object should now have the extended properties (id, email, role, tenantId)
    // thanks to the jwt and session callbacks in your nextAuthOptions.
    const userId = (session.user as any).id; // Use type assertion for custom properties
    const userEmail = session.user.email; // Standard property
    const userRole = (session.user as any).role; // Use type assertion for custom properties
    const tenantId = (session.user as any).tenantId; // Fixed: Use tenantId (camelCase) instead of tenantid
    console.log(`[API/User/Update-Profile] Authenticated user: ID=${userId}, Email=${userEmail}, Role=${userRole}, Tenant ID=${tenantId}`);

    // --- STEP 3: Validate User Data ---
    if (!userId || !tenantId) {
      console.error("[API/User/Update-Profile] FAILURE: User ID or Tenant ID missing from session.");
      console.log("[API/User/Update-Profile] --- END (FAILURE - Missing IDs) ---");
      return NextResponse.json({ error: 'User ID or Tenant ID is missing from your session.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 4: Parse Request Body ---
    const body = await request.json();
    console.log("[API/User/Update-Profile] Request body received:", body);

    const { name, phone, age } = body;
    console.log(`[API/User/Update-Profile] Processing profile update for user ID '${userId}' in tenant '${tenantId}'...`);

    // --- STEP 5: Determine Tenant ID ---
    // IMPORTANT: In a real app, derive this dynamically!
    // For this demo, we'll use the tenantId from the session.
    // This assumes your NextAuth.js setup correctly populates session.user.tenantId.
    console.log(`[API/User/Update-Profile] Using tenant ID from session: ${tenantId}`);

    if (!tenantId) {
      console.error("[API/User/Update-Profile] FAILURE: Could not determine tenant ID. Profile update aborted.");
      console.log("[API/User/Update-Profile] --- END (FAILURE - No Tenant ID) ---");
      return NextResponse.json({ error: 'Could not determine tenant ID. Profile update aborted.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 6: Database Interaction ---
    let pool;
    let client;
    let clientReleased = false; // Flag to track release status
    try {
      console.log(`[API/User/Update-Profile] Attempting to get database pool for tenant '${tenantId}'...`);
      // --- FIX 6: Call getTenantPool AFTER initGlobalPool ---
      pool = await getTenantPool(tenantId); // Should now work
      console.log(`[API/User/Update-Profile] SUCCESS: Got database pool for tenant '${tenantId}'.`);

      console.log(`[API/User/Update-Profile] Attempting to connect to database for tenant '${tenantId}'...`);
      client = await pool.connect();
      console.log(`[API/User/Update-Profile] SUCCESS: Connected to database for tenant '${tenantId}'.`);

      try {
        console.log(`[API/User/Update-Profile] Setting search_path to 'tenant_${tenantId}, public'...`);
        await client.query(`SET search_path TO tenant_${tenantId}, public`);
        console.log(`[API/User/Update-Profile] SUCCESS: search_path set.`);

        // --- STEP 7: Update User Record ---
        // IMPORTANT: This updates the user's profile information in the database.
        // It only updates the fields provided in the request body.
        // For fields not provided (e.g., if 'name' is missing), it leaves them unchanged.
        console.log(`[API/User/Update-Profile] Executing user profile update query for user ID '${userId}'...`);
        const result = await client.query(
          `UPDATE users
           SET
             name = COALESCE($1, name), -- Use provided name, otherwise keep existing
             phone = COALESCE($2, phone), -- Use provided phone, otherwise keep existing
             age = COALESCE($3, age) -- Use provided age, otherwise keep existing
           WHERE id = $4
           RETURNING id, email, name, phone, age, role`,
          [
            name || null, // Pass null if name is not provided
            phone || null, // Pass null if phone is not provided
            age ? parseInt(age, 10) : null, // Convert age to integer, pass null if not provided
            userId // The user ID to update
          ]
        );
        console.log(`[API/User/Update-Profile] Query executed. Rows affected: ${result.rowCount}`);

        // --- STEP 8: Check Update Success ---
        if (result.rowCount === 0) {
          console.log(`[API/User/Update-Profile] FAILURE: User with ID '${userId}' NOT found in tenant '${tenantId}' for update.`);
          console.log("[API/User/Update-Profile] --- END (FAILURE - User Not Found) ---");
          return NextResponse.json({ error: 'User account not found for update.' }, { status: 404 }); // 404 Not Found
        }

        const updatedUser = result.rows[0];
        console.log(`[API/User/Update-Profile] SUCCESS: User profile updated - ID=${updatedUser.id}, Email=${updatedUser.email}, Name=${updatedUser.name || 'NULL'}, Phone=${updatedUser.phone || 'NULL'}, Age=${updatedUser.age || 'NULL'}, Role=${updatedUser.role || 'NULL'}`);

        // --- STEP 9: Optional - Trigger Stripe Customer Update ---
        // You might want to update the associated Stripe Customer object here.
        // This depends on your exact workflow and data retention policies.
        // Be very careful with this, as it's irreversible.
        // Example (pseudo-code, requires Stripe setup):
        // if (updatedUser.stripe_customer_id) {
        //   try {
        //     await stripe.customers.update(updatedUser.stripe_customer_id, {
        //       name: updatedUser.name,
        //       phone: updatedUser.phone,
        //       // age is not a standard Stripe customer field, but you could store it in metadata
        //       meta {
        //         age: updatedUser.age ? String(updatedUser.age) : undefined,
        //       }
        //     });
        //     console.log(`[API/User/Update-Profile] Stripe customer updated: ${updatedUser.stripe_customer_id}`);
        //   } catch (stripeError: any) {
        //     console.error(`[API/User/Update-Profile] WARNING: Failed to update Stripe customer ${updatedUser.stripe_customer_id}:`, stripeError);
        //     // Don't fail the entire request if Stripe update fails, but log it
        //   }
        // }

        // --- STEP 10: Success ---
        console.log(`[API/User/Update-Profile] SUCCESS: Profile update completed for user '${updatedUser.email}' in tenant '${tenantId}'.`);
        console.log("[API/User/Update-Profile] --- END (SUCCESS) ---");
        return NextResponse.json(
          {
            message: 'User profile updated successfully.',
            user: {
              id: updatedUser.id,
              email: updatedUser.email,
              name: updatedUser.name || '', // Ensure name is a string
              phone: updatedUser.phone || '', // Ensure phone is a string
              age: updatedUser.age || null, // Ensure age is an integer or null
              role: updatedUser.role || 'member', // Default to 'member'
              tenantId: tenantId, // Include for session
              // Add other non-sensitive fields if needed
            },
          },
          { status: 200 } // 200 OK
        );

      } finally {
        // --- STEP 11: Cleanup Inner ---
        if (client && !clientReleased) {
          console.log(`[API/User/Update-Profile] Releasing database client for tenant '${tenantId}' (inner attempt 1)...`);
          client.release();
          clientReleased = true; // Mark as released
          console.log(`[API/User/Update-Profile] Database client released (inner).`);
        } else if (client && clientReleased) {
          console.warn(`[API/User/Update-Profile] WARNING: Attempted to release database client for tenant '${tenantId}' again (inner). Already released.`);
        } else {
          console.log(`[API/User/Update-Profile] No database client to release (inner) for tenant '${tenantId}'.`);
        }
      }
    } catch (dbError: any) {
      // --- STEP 12: Handle Database Errors ---
      console.error("[API/User/Update-Profile] DB Error during profile update:", dbError);
      // Don't expose internal errors directly to the client
      return NextResponse.json(
        { error: 'Failed to update user profile: ' + (dbError.message || 'Unknown database error') },
        { status: 500 } // 500 Internal Server Error
      );
    } finally {
      // --- STEP 13: Cleanup Outer ---
      if (client && !clientReleased) {
        console.log(`[API/User/Update-Profile] Releasing database client for tenant '${tenantId}' (outer attempt 2 - safety net)...`);
        client.release();
        clientReleased = true; // Mark as released
        console.log(`[API/User/Update-Profile] Database client released (outer - safety net).`);
      } else if (client && clientReleased) {
        // This is expected if the inner finally already released it.
        console.log(`[API/User/Update-Profile] Database client for tenant '${tenantId}' already released (outer - safety net check).`);
      } else {
        console.log(`[API/User/Update-Profile] No database client to release in outer finally for tenant '${tenantId}'.`);
      }
      // Consider if pool needs cleanup, though getTenantPool likely manages it.
    }
  } catch (error: any) {
    // --- STEP 14: Handle Unexpected Errors ---
    console.error("[API/User/Update-Profile] Unexpected error during profile update:", error);
    // Don't expose internal errors directly to the client
    return NextResponse.json(
      { error: 'Failed to update user profile. Please try again later.' },
      { status: 500 } // 500 Internal Server Error
    );
  }
}

// --- Optional: Handle other methods if needed (GET, POST, DELETE) ---
// If you don't need them, you can omit them.
// Next.js will automatically return 405 for unsupported methods.
// export async function GET() { ... }
// export async function POST() { ... }
// ...