// frontend/src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { getTenantPool, initGlobalPool } from '@/config/db'; // Adjust path if needed
import { Pool } from 'pg';

// --- DEBUG: Log environment variables (BE CAREFUL NOT TO LOG SECRETS) ---
console.log("[API/User/Profile] Initializing user profile endpoint...");
console.log("[API/User/Profile] NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);
console.log("[API/User/Profile] DB Config present:", !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME));
console.log("[API/User/Profile] DB_CONFIG (sanitized):", {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  // password: '[REDACTED]',
  port: parseInt(process.env.DB_PORT || '5432'),
});
// --- END DEBUG ---

export async function GET(request: NextRequest) {
  console.log("[API/User/Profile] GET request received");

  try {
    // --- STEP 1: Initialize Global Pool ---
    // Ensure the global database pool is initialized before calling getTenantPool
    // This resolves the "Global pool not initialized" error.
    console.log(`[API/User/Profile] Attempting to initialize global database pool...`);
    await initGlobalPool(); // --- CRITICAL: Call initGlobalPool ---
    console.log(`[API/User/Profile] SUCCESS: Global database pool initialized.`);
    // --- END STEP 1 ---

    // --- STEP 2: Authenticate User ---
    // Use getServerSession to get the user's session server-side
    // This ensures the user is authenticated before allowing profile access
    const session = await getServerSession(nextAuthOptions);
    console.log("[API/User/Profile] Session retrieved:", session ? "Present" : "Absent");

    if (!session || !session.user) {
      console.warn("[API/User/Profile] FAILURE: User not authenticated or session missing.");
      console.log("[API/User/Profile] --- END (FAILURE - Not Authenticated) ---");
      return NextResponse.json({ error: 'You must be logged in to access your profile.' }, { status: 401 }); // 401 Unauthorized
    }

    // --- STEP 3: Access User Data ---
    // Access user data correctly from session
    // Use type assertion to access custom properties like 'id', 'email', 'role', 'tenantId'
    const userId = (session.user as any).id;
    const userEmail = session.user.email; // Standard property
    const userRole = (session.user as any).role; // Use type assertion for custom properties
    const tenantId = (session.user as any).tenantId; // Use type assertion for custom properties
    console.log(`[API/User/Profile] Authenticated user: ID=${userId}, Email=${userEmail}, Role=${userRole}, Tenant ID=${tenantId}`);

    // --- STEP 4: Validate User Data ---
    if (!userId || !tenantId) {
      console.error("[API/User/Profile] FAILURE: User ID or Tenant ID missing from session.");
      console.log("[API/User/Profile] --- END (FAILURE - Missing IDs) ---");
      return NextResponse.json({ error: 'User ID or Tenant ID is missing from your session.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 5: Determine Tenant ID ---
    // IMPORTANT: In a real app, derive this dynamically!
    // For this demo, we'll use the tenantId from the session.
    // This assumes your NextAuth.js setup correctly populates session.user.tenantId.
    console.log(`[API/User/Profile] Using tenant ID from session: ${tenantId}`);

    if (!tenantId) {
      console.error("[API/User/Profile] FAILURE: Could not determine tenant ID. Profile access aborted.");
      console.log("[API/User/Profile] --- END (FAILURE - No Tenant ID) ---");
      return NextResponse.json({ error: 'Could not determine tenant ID. Profile access aborted.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 6: Database Interaction ---
    let pool;
    let client;
    let clientReleased = false; // Flag to track release status
    try {
      console.log(`[API/User/Profile] Attempting to get database pool for tenant '${tenantId}'...`);
      pool = await getTenantPool(tenantId);
      console.log(`[API/User/Profile] SUCCESS: Got database pool for tenant '${tenantId}'.`);

      console.log(`[API/User/Profile] Attempting to connect to database for tenant '${tenantId}'...`);
      client = await pool.connect();
      console.log(`[API/User/Profile] SUCCESS: Connected to database for tenant '${tenantId}'.`);

      try {
        console.log(`[API/User/Profile] Setting search_path to 'tenant_${tenantId}, public'...`);
        await client.query(`SET search_path TO tenant_${tenantId}, public`);
        console.log(`[API/User/Profile] SUCCESS: search_path set.`);

        // --- STEP 7: Fetch User Profile ---
        console.log(`[API/User/Profile] Executing user profile fetch query for user ID '${userId}'...`);
        const result = await client.query(
          `SELECT id, email, name, phone, age, role, tenantid, stripe_customer_id, created_at, updated_at
           FROM users
           WHERE id = $1`,
          [userId]
        );
        console.log(`[API/User/Profile] Query executed. Rows returned: ${result.rows.length}`);

        // --- STEP 8: Check User Existence ---
        if (result.rows.length === 0) {
          console.log(`[API/User/Profile] FAILURE: User with ID '${userId}' NOT found in tenant '${tenantId}'.`);
          console.log("[API/User/Profile] --- END (FAILURE - User Not Found) ---");
          return NextResponse.json({ error: 'User profile not found.' }, { status: 404 }); // 404 Not Found
        }

        const userProfile = result.rows[0];
        console.log(`[API/User/Profile] SUCCESS: User profile fetched - ID=${userProfile.id}, Email=${userProfile.email}, Name=${userProfile.name || 'NULL'}, Phone=${userProfile.phone || 'NULL'}, Age=${userProfile.age || 'NULL'}, Role=${userProfile.role || 'NULL'}, Tenant ID=${userProfile.tenantid || 'NULL'}, Stripe Customer ID=${userProfile.stripe_customer_id || 'NULL'}, Created At=${userProfile.created_at}, Updated At=${userProfile.updated_at}`);

        // --- STEP 9: Success ---
        console.log(`[API/User/Profile] SUCCESS: Profile fetch completed for user '${userProfile.email}' in tenant '${tenantId}'.`);
        console.log("[API/User/Profile] --- END (SUCCESS) ---");
        return NextResponse.json(
          {
            message: 'User profile fetched successfully.',
            user: {
              id: userProfile.id ? String(userProfile.id) : '',
              email: userProfile.email ? String(userProfile.email) : '',
              name: userProfile.name ? String(userProfile.name) : '',
              phone: userProfile.phone ? String(userProfile.phone) : '',
              age: userProfile.age ? parseInt(String(userProfile.age), 10) : null, // Convert to number
              role: userProfile.role && String(userProfile.role).trim() !== '' ? String(userProfile.role) : 'member', // Default to 'member'
              tenantId: userProfile.tenantid ? String(userProfile.tenantid) : 'default', // Default to 'default'
              stripeCustomerId: userProfile.stripe_customer_id ? String(userProfile.stripe_customer_id) : '',
              createdAt: userProfile.created_at ? new Date(userProfile.created_at).toISOString() : '',
              updatedAt: userProfile.updated_at ? new Date(userProfile.updated_at).toISOString() : '',
              // Add other non-sensitive user data if needed
            },
          },
          { status: 200 } // 200 OK
        );

      } finally {
        // --- STEP 10: Cleanup Inner ---
        if (client && !clientReleased) {
          console.log(`[API/User/Profile] Releasing database client for tenant '${tenantId}' (inner attempt 1)...`);
          client.release();
          clientReleased = true; // Mark as released
          console.log(`[API/User/Profile] Database client released (inner).`);
        } else if (client && clientReleased) {
          console.warn(`[API/User/Profile] WARNING: Attempted to release database client for tenant '${tenantId}' again (inner). Already released.`);
        } else {
          console.log(`[API/User/Profile] No database client to release (inner) for tenant '${tenantId}'.`);
        }
      }
    } catch (dbError: any) {
      // --- STEP 11: Handle Database Errors ---
      console.error("[API/User/Profile] DB Error during profile fetch:", dbError);
      // Don't expose internal errors directly to the client
      return NextResponse.json(
        { error: 'Failed to fetch user profile: ' + (dbError.message || 'Unknown database error') },
        { status: 500 } // 500 Internal Server Error
      );
    } finally {
      // --- STEP 12: Cleanup Outer ---
      if (client && !clientReleased) {
        console.log(`[API/User/Profile] Releasing database client for tenant '${tenantId}' (outer attempt 2 - safety net)...`);
        client.release();
        clientReleased = true; // Mark as released
        console.log(`[API/User/Profile] Database client released (outer - safety net).`);
      } else if (client && clientReleased) {
        // This is expected if the inner finally already released it.
        console.log(`[API/User/Profile] Database client for tenant '${tenantId}' already released (outer - safety net check).`);
      } else {
        console.log(`[API/User/Profile] No database client to release in outer finally for tenant '${tenantId}'.`);
      }
      // Consider if pool needs cleanup, though getTenantPool likely manages it.
    }
  } catch (error: any) {
    // --- STEP 13: Handle Unexpected Errors ---
    console.error("[API/User/Profile] Unexpected error during profile fetch:", error);
    // Don't expose internal errors directly to the client
    return NextResponse.json(
      { error: 'Failed to fetch user profile. Please try again later.' },
      { status: 500 } // 500 Internal Server Error
    );
  }
}

// --- Optional: Handle other methods if needed (POST, PUT, DELETE) ---
// If you don't need them, you can omit them.
// Next.js will automatically return 405 for unsupported methods.
// export async function POST() { ... }
// export async function PUT() { ... }
// export async function DELETE() { ... }