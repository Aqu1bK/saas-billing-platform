// frontend/src/app/api/user/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { getTenantPool, initGlobalPool } from '@/config/db'; // Adjust path if needed
import { Pool } from 'pg';

// --- DEBUG: Log environment variables (BE CAREFUL NOT TO LOG SECRETS) ---
console.log("[API/User/Dashboard] Initializing user dashboard endpoint...");
console.log("[API/User/Dashboard] NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);
console.log("[API/User/Dashboard] DB Config present:", !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME));
console.log("[API/User/Dashboard] DB_CONFIG (sanitized):", {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  // password: '[REDACTED]',
  port: parseInt(process.env.DB_PORT || '5432'),
});
// --- END DEBUG ---

export async function GET(request: NextRequest) {
  console.log("[API/User/Dashboard] GET request received");

  try {
    // --- STEP 1: Initialize Global Pool ---
    // Ensure the global database pool is initialized before calling getTenantPool
    // This resolves the "Global pool not initialized" error.
    console.log(`[API/User/Dashboard] Attempting to initialize global database pool...`);
    await initGlobalPool(); // --- CRITICAL: Call initGlobalPool ---
    console.log(`[API/User/Dashboard] SUCCESS: Global database pool initialized.`);
    // --- END STEP 1 ---

    // --- STEP 2: Authenticate User ---
    // Use getServerSession to get the user's session server-side
    // This ensures the user is authenticated before allowing dashboard access
    const session = await getServerSession(nextAuthOptions);
    console.log("[API/User/Dashboard] Session retrieved:", session ? "Present" : "Absent");

    if (!session || !session.user) {
      console.warn("[API/User/Dashboard] FAILURE: User not authenticated or session missing.");
      console.log("[API/User/Dashboard] --- END (FAILURE - Not Authenticated) ---");
      return NextResponse.json({ error: 'You must be logged in to access your dashboard.' }, { status: 401 }); // 401 Unauthorized
    }

    // --- STEP 3: Access User Data ---
    // Access user data correctly from session
    // Use type assertion to access custom properties like 'id', 'email', 'role', 'tenantid'
    const userId = (session.user as any).id;
    const userEmail = session.user.email; // Standard property
    const userRole = (session.user as any).role; // Use type assertion for custom properties
    const tenantId = (session.user as any).tenantId; // Fixed: Use tenantId (camelCase) instead of tenantid
    console.log(`[API/User/Dashboard] Authenticated user: ID=${userId}, Email=${userEmail}, Role=${userRole}, Tenant ID=${tenantId}`);

    // --- STEP 4: Validate User Data ---
    if (!userId || !tenantId) {
      console.error("[API/User/Dashboard] FAILURE: User ID or Tenant ID missing from session.");
      console.log("[API/User/Dashboard] --- END (FAILURE - Missing IDs) ---");
      return NextResponse.json({ error: 'User ID or Tenant ID is missing from your session.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 5: Determine Tenant ID ---
    // IMPORTANT: In a real app, derive this dynamically!
    // For this demo, we'll use the tenantId from the session.
    // This assumes your NextAuth.js setup correctly populates session.user.tenantid.
    console.log(`[API/User/Dashboard] Using tenant ID from session: ${tenantId}`);

    if (!tenantId) {
      console.error("[API/User/Dashboard] FAILURE: Could not determine tenant ID. Dashboard access aborted.");
      console.log("[API/User/Dashboard] --- END (FAILURE - No Tenant ID) ---");
      return NextResponse.json({ error: 'Could not determine tenant ID. Dashboard access aborted.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 6: Database Interaction ---
    let pool;
    let client;
    let clientReleased = false; // Flag to track release status
    try {
      console.log(`[API/User/Dashboard] Attempting to get database pool for tenant '${tenantId}'...`);
      pool = await getTenantPool(tenantId);
      console.log(`[API/User/Dashboard] SUCCESS: Got database pool for tenant '${tenantId}'.`);

      console.log(`[API/User/Dashboard] Attempting to connect to database for tenant '${tenantId}'...`);
      client = await pool.connect();
      console.log(`[API/User/Dashboard] SUCCESS: Connected to database for tenant '${tenantId}'.`);

      try {
        console.log(`[API/User/Dashboard] Setting search_path to 'tenant_${tenantId}, public'...`);
        await client.query(`SET search_path TO tenant_${tenantId}, public`);
        console.log(`[API/User/Dashboard] SUCCESS: search_path set.`);

        // --- STEP 7: Fetch User Details ---
        console.log(`[API/User/Dashboard] Executing user details fetch query for user ID '${userId}'...`);
        const result = await client.query(
          `SELECT id, email, name, phone, age, role, tenantid, stripe_customer_id, created_at, updated_at
           FROM users
           WHERE id = $1`,
          [userId]
        );
        console.log(`[API/User/Dashboard] Query executed. Rows returned: ${result.rows.length}`);

        // --- STEP 8: Check User Existence ---
        if (result.rows.length === 0) {
          console.log(`[API/User/Dashboard] FAILURE: User with ID '${userId}' NOT found in tenant '${tenantId}'.`);
          console.log("[API/User/Dashboard] --- END (FAILURE - User Not Found) ---");
          return NextResponse.json({ error: 'User details not found.' }, { status: 404 }); // 404 Not Found
        }

        const userDetails = result.rows[0];
        console.log(`[API/User/Dashboard] SUCCESS: User details fetched - ID=${userDetails.id}, Email=${userDetails.email}, Name=${userDetails.name || 'NULL'}, Phone=${userDetails.phone || 'NULL'}, Age=${userDetails.age || 'NULL'}, Role=${userDetails.role || 'NULL'}, Tenant ID=${userDetails.tenantid || 'NULL'}, Stripe Customer ID=${userDetails.stripe_customer_id || 'NULL'}, Created At=${userDetails.created_at}, Updated At=${userDetails.updated_at}`);

        // --- STEP 9: Success ---
        console.log(`[API/User/Dashboard] SUCCESS: Dashboard data fetch completed for user '${userDetails.email}' in tenant '${tenantId}'.`);
        console.log("[API/User/Dashboard] --- END (SUCCESS) ---");
        return NextResponse.json(
          {
            message: 'User details fetched successfully.',
            user: {
              id: userDetails.id ? String(userDetails.id) : '',
              email: userDetails.email ? String(userDetails.email) : '',
              name: userDetails.name ? String(userDetails.name) : '',
              phone: userDetails.phone ? String(userDetails.phone) : '',
              age: userDetails.age ? parseInt(String(userDetails.age), 10) : null, // Convert to number
              role: userDetails.role && String(userDetails.role).trim() !== '' ? String(userDetails.role) : 'member', // Default to 'member'
              tenantid: userDetails.tenantid ? String(userDetails.tenantid) : 'default', // Default to 'default'
              stripeCustomerId: userDetails.stripe_customer_id ? String(userDetails.stripe_customer_id) : '',
              createdAt: userDetails.created_at ? new Date(userDetails.created_at).toISOString() : '',
              updatedAt: userDetails.updated_at ? new Date(userDetails.updated_at).toISOString() : '',
              // Add other non-sensitive user data if needed
            },
          },
          { status: 200 } // 200 OK
        );

      } finally {
        // --- Cleanup Inner ---
        if (client && !clientReleased) {
          console.log(`[API/User/Dashboard] Releasing database client for tenant '${tenantId}' (inner attempt 1)...`);
          client.release();
          clientReleased = true; // Mark as released
          console.log(`[API/User/Dashboard] Database client released (inner).`);
        } else if (client && clientReleased) {
          console.warn(`[API/User/Dashboard] WARNING: Attempted to release database client for tenant '${tenantId}' again (inner). Already released.`);
        } else {
          console.log(`[API/User/Dashboard] No database client to release (inner) for tenant '${tenantId}'.`);
        }
      }
    } catch (dbError: any) {
      // --- Handle Database Errors ---
      console.error("[API/User/Dashboard] DB Error during dashboard data fetch:", dbError);
      // Don't expose internal errors directly to the client
      return NextResponse.json(
        { error: 'Failed to fetch user details: ' + (dbError.message || 'Unknown database error') },
        { status: 500 } // 500 Internal Server Error
      );
    } finally {
      // --- Cleanup Outer ---
      if (client && !clientReleased) {
        console.log(`[API/User/Dashboard] Releasing database client for tenant '${tenantId}' (outer attempt 2 - safety net)...`);
        client.release();
        clientReleased = true; // Mark as released
        console.log(`[API/User/Dashboard] Database client released (outer - safety net).`);
      } else if (client && clientReleased) {
        // This is expected if the inner finally already released it.
        console.log(`[API/User/Dashboard] Database client for tenant '${tenantId}' already released (outer - safety net check).`);
      } else {
        console.log(`[API/User/Dashboard] No database client to release in outer finally for tenant '${tenantId}'.`);
      }
      // Consider if pool needs cleanup, though getTenantPool likely manages it.
    }
  } catch (error: any) {
    // --- Handle Unexpected Errors ---
    console.error("[API/User/Dashboard] Unexpected error during dashboard data fetch:", error);
    // Don't expose internal errors directly to the client
    return NextResponse.json(
      { error: 'Failed to fetch user details. Please try again later.' },
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