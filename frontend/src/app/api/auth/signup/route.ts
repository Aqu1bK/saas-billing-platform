// frontend/src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
// --- FIX: Remove unused Pool import ---
// import { Pool } from 'pg'; // <-- REMOVE THIS LINE
// --- END FIX ---
import { getTenantPool, initGlobalPool } from '@/config/db'; // Ensure getTenantPool is imported

// --- DEBUG: Log environment variables (BE CAREFUL NOT TO LOG SECRETS) ---
console.log("[API/Auth/Signup] Initializing user signup endpoint...");
console.log("[API/Auth/Signup] NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);
console.log("[API/Auth/Signup] DB Config present:", !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME));
console.log("[API/Auth/Signup] DB_CONFIG (sanitized):", {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  // password: '[REDACTED]',
  port: parseInt(process.env.DB_PORT || '5432'),
});
// --- END DEBUG ---

export async function POST(request: NextRequest) {
  console.log("[API/Auth/Signup] POST request received");

  try {
    // --- STEP 1: Parse Request Body ---
    const body = await request.json();
    console.log("[API/Auth/Signup] Request body:", body);

    const { email, password, name, phone, age } = body;

    // --- STEP 2: Basic Validation ---
    if (!email || !password) {
      console.warn("[API/Auth/Signup] FAILURE: Missing email or password in credentials object.");
      console.log("[API/Auth/Signup] --- END (FAILURE - Missing Credentials) ---");
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // --- STEP 3: Sanitize Input ---
    const sanitizedEmail = email.trim().toLowerCase(); // Sanitize email
    console.log(`[API/Auth/Signup] Sanitized email: ${sanitizedEmail}`);

    // --- STEP 4: Determine Tenant ID ---
    // IMPORTANT: In a real app, derive this dynamically!
    // For this demo, we'll hardcode 'acme'. You MUST adapt this.
    const tenantId = 'acme'; // HARDCODED FOR DEMO, ADAPT FOR MT
    console.log(`[API/Auth/Signup] Using tenant ID: ${tenantId}`);

    if (!tenantId) {
      console.error("[API/Auth/Signup] FAILURE: Could not determine tenant ID. Login aborted.");
      console.log("[API/Auth/Signup] --- END (FAILURE - No Tenant ID) ---");
      return NextResponse.json({ error: 'Could not determine tenant ID. Signup aborted.' }, { status: 400 }); // 400 Bad Request
    }

    // --- STEP 5: Initialize Global Database Pool ---
    console.log(`[API/Auth/Signup] Attempting to initialize global database pool...`);
    await initGlobalPool(); // --- CRITICAL: Call initGlobalPool ---
    console.log(`[API/Auth/Signup] SUCCESS: Global database pool initialized.`);

    // --- STEP 6: Get Tenant-Specific Database Pool ---
    let pool;
    let client;
    let clientReleased = false; // Flag to track release status
    try {
      console.log(`[API/Auth/Signup] Attempting to get database pool for tenant '${tenantId}'...`);
      pool = await getTenantPool(tenantId); // Use the imported getTenantPool
      console.log(`[API/Auth/Signup] SUCCESS: Got database pool for tenant '${tenantId}'.`);

      console.log(`[API/Auth/Signup] Attempting to connect to database for tenant '${tenantId}'...`);
      client = await pool.connect();
      console.log(`[API/Auth/Signup] SUCCESS: Connected to database for tenant '${tenantId}'.`);

      try {
        console.log(`[API/Auth/Signup] Setting search_path to 'tenant_${tenantId}, public'...`);
        await client.query(`SET search_path TO tenant_${tenantId}, public`);
        console.log(`[API/Auth/Signup] SUCCESS: search_path set.`);

        // --- STEP 7: Check if User Already Exists ---
        console.log(`[API/Auth/Signup] Executing user lookup query for email '${sanitizedEmail}'...`);
        const result = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [sanitizedEmail]
        );
        console.log(`[API/Auth/Signup] Query executed. Rows returned: ${result.rows.length}`);

        if (result.rows.length > 0) {
          console.log(`[API/Auth/Signup] FAILURE: User with email '${sanitizedEmail}' already exists in tenant '${tenantId}'.`);
          console.log("[API/Auth/Signup] --- END (FAILURE - User Already Exists) ---");
          return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 }); // 409 Conflict
        }

        // --- STEP 8: Hash Password ---
        const saltRounds = 10; // Bcrypt salt rounds
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(`[API/Auth/Signup] Password hashed for user: ${sanitizedEmail}`);

        // --- STEP 9: Insert New User into the Database ---
        console.log(`[API/Auth/Signup] Executing user insertion query for email '${sanitizedEmail}'...`);
        const insertResult = await client.query(
          `INSERT INTO users (email, password, role, tenantid, name, phone, age)
           VALUES ($1, $2, 'member', $3, $4, $5, $6)
           RETURNING id, email, role, tenantid`,
          [sanitizedEmail, hashedPassword, tenantId, name || null, phone || null, age ? parseInt(age, 10) : null]
        );

        const newUser = insertResult.rows[0];
        console.log(`[API/Auth/Signup] New user created: ID=${newUser.id}, Email=${newUser.email}, Role=${newUser.role || 'member'}, Tenant ID=${tenantId}`);

        // --- STEP 10: Prepare Session Data ---
        const userDataForSession = {
          id: newUser.id ? String(newUser.id) : '',
          email: newUser.email ? String(newUser.email) : '',
          role: newUser.role && String(newUser.role).trim() !== '' ? String(newUser.role) : 'member', // Default to 'member'
          tenantId: newUser.tenantid ? String(newUser.tenantid) : 'default', // Default to 'default'
          // Add other non-sensitive user data if needed
        };

        // --- STEP 11: Respond with Success ---
        return NextResponse.json(
          {
            message: 'User created successfully.',
            user: userDataForSession,
          },
          { status: 201 } // 201 Created
        );

      } finally {
        // --- STEP 12: Cleanup Inner ---
        if (client && !clientReleased) {
          console.log(`[API/Auth/Signup] Releasing database client for tenant '${tenantId}' (inner attempt 1)...`);
          client.release();
          clientReleased = true; // Mark as released
          console.log(`[API/Auth/Signup] Database client released (inner).`);
        } else if (client && clientReleased) {
          console.warn(`[API/Auth/Signup] WARNING: Attempted to release database client for tenant '${tenantId}' again (inner). Already released.`);
        } else {
          console.log(`[API/Auth/Signup] No database client to release (inner) for tenant '${tenantId}'.`);
        }
      }
    } catch (dbError: any) {
      // --- STEP 13: Handle Database Errors ---
      console.error('[API/Auth/Signup] DB Error during signup:', dbError);
      // Don't expose internal errors directly to the client
      return NextResponse.json(
        { error: 'Failed to create user account: ' + (dbError.message || 'Unknown database error') },
        { status: 500 } // 500 Internal Server Error
      );
    } finally {
      // --- STEP 14: Cleanup Outer ---
      if (client && !clientReleased) {
        console.log(`[API/Auth/Signup] Releasing database client for tenant '${tenantId}' (outer attempt 2 - safety net)...`);
        client.release();
        clientReleased = true; // Mark as released
        console.log(`[API/Auth/Signup] Database client released (outer - safety net).`);
      } else if (client && clientReleased) {
        // This is expected if the inner finally already released it.
        console.log(`[API/Auth/Signup] Database client for tenant '${tenantId}' already released (outer - safety net check).`);
      } else {
        console.log(`[API/Auth/Signup] No database client to release in outer finally for tenant '${tenantId}'.`);
      }
      // Consider if pool needs cleanup, though getTenantPool likely manages it.
    }
  } catch (error: any) {
    // --- STEP 15: Handle Unexpected Errors ---
    console.error('[API/Auth/Signup] Unexpected error during signup:', error);
    // Don't expose internal errors directly to the client
    return NextResponse.json(
      { error: 'Failed to create user account. Please try again later.' },
      { status: 500 } // 500 Internal Server Error
    );
  }
}