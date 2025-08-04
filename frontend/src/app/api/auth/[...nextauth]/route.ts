// frontend/src/app/api/auth/[...nextauth]/route.ts
// --- MINIMAL NEXT-AUTH SETUP FOR NEXT.JS APP ROUTER ---
// This file handles all authentication requests for NextAuth.js
// e.g., /api/auth/signin, /api/auth/callback/credentials, /api/auth/session, etc.

import NextAuth, { NextAuthOptions, User, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { getTenantPool, initGlobalPool } from '@/config/db'; // Ensure getTenantPool is imported

// --- DEBUG: Log environment variables (BE CAREFUL NOT TO LOG SECRETS) ---
console.log("[NextAuth/route.ts] Initializing NextAuth configuration...");
console.log("[NextAuth/route.ts] NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);
console.log("[NextAuth/route.ts] GOOGLE_CLIENT_ID present:", !!process.env.GOOGLE_CLIENT_ID);
console.log("[NextAuth/route.ts] GOOGLE_CLIENT_SECRET present:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("[NextAuth/route.ts] DB Config present:", !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME));
console.log("[NextAuth/route.ts] DB_CONFIG (sanitized):", {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  // password: '[REDACTED]',
  port: parseInt(process.env.DB_PORT || '5432'),
});
// --- END DEBUG ---

// --- DATABASE CONFIGURATION ---
const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_billing',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
};

console.log("[NextAuth/route.ts] DB_CONFIG (sanitized):", {
  user: DB_CONFIG.user,
  host: DB_CONFIG.host,
  database: DB_CONFIG.database,
  // password: '[REDACTED]',
  port: DB_CONFIG.port,
});
// --- END DATABASE CONFIGURATION ---

// --- HELPER: Get Tenant Pool (Simplified for Demo) ---
async function getTenantPoolHelper(tenantId: string) {
  console.log(`[NextAuth/getTenantPoolHelper] Creating pool for tenant: ${tenantId}`);
  const pool = new Pool(DB_CONFIG);
  console.log(`[NextAuth/getTenantPoolHelper] Pool created for tenant: ${tenantId}`);

  pool.on('error', (err) => {
    console.error(`[NextAuth/getTenantPoolHelper] Unexpected error on idle client pool for tenant ${tenantId}:`, err);
    // Handle pool error, e.g., reconnect logic if needed (complex for demo)
  });

  return pool;
}
// --- END HELPER ---

// --- NEXTAUTH CONFIGURATION ---
console.log("[NextAuth/route.ts] Defining NextAuth configuration object...");

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[NextAuth/Credentials/authorize] --- START ---");
        console.log("[NextAuth/Credentials/authorize] Raw credentials received:", credentials);

        // --- STEP 1: Validate Input ---
        if (!credentials?.email || !credentials?.password) {
          console.warn("[NextAuth/Credentials/authorize] FAILURE: Missing email or password in credentials object.");
          console.log("[NextAuth/Credentials/authorize] --- END (FAILURE - Missing Credentials) ---");
          return null; // Signal authentication failure to NextAuth
        }

        const email = credentials.email.trim().toLowerCase(); // Sanitize email
        const password = credentials.password;
        console.log(`[NextAuth/Credentials/authorize] Processing login attempt for email: '${email}'`);

        // --- STEP 2: Determine Tenant ID ---
        // IMPORTANT: In a real app, derive this dynamically!
        // For this demo, we'll hardcode 'acme'. You MUST adapt this.
        const tenantId = 'acme'; // <-- HARDCODED FOR DEMO, ADAPT FOR MT
        console.log(`[NextAuth/Credentials/authorize] Using tenant ID: '${tenantId}'`);

        if (!tenantId) {
          console.error("[NextAuth/Credentials/authorize] FAILURE: Could not determine tenant ID. Login aborted.");
          console.log("[NextAuth/Credentials/authorize] --- END (FAILURE - No Tenant ID) ---");
          return null; // Fail login
        }

        // --- STEP 3: Database Interaction ---
        let pool;
        let client;
        let clientReleased = false; // Flag to track release status
        try {
          console.log(`[NextAuth/Credentials/authorize] Attempting to initialize global database pool...`);
          await initGlobalPool(); // --- CRITICAL: Call initGlobalPool ---
          console.log(`[NextAuth/Credentials/authorize] SUCCESS: Global database pool initialized.`);

          console.log(`[NextAuth/Credentials/authorize] Attempting to get database pool for tenant '${tenantId}'...`);
          pool = await getTenantPool(tenantId); // Use the imported getTenantPool
          console.log(`[NextAuth/Credentials/authorize] SUCCESS: Got database pool for tenant '${tenantId}'.`);

          console.log(`[NextAuth/Credentials/authorize] Attempting to connect to database for tenant '${tenantId}'...`);
          client = await pool.connect();
          console.log(`[NextAuth/Credentials/authorize] SUCCESS: Connected to database for tenant '${tenantId}'.`);

          try {
            console.log(`[NextAuth/Credentials/authorize] Setting search_path to 'tenant_${tenantId}, public'...`);
            await client.query(`SET search_path TO tenant_${tenantId}, public`);
            console.log(`[NextAuth/Credentials/authorize] SUCCESS: search_path set.`);

            // --- STEP 4: Query User ---
            console.log(`[NextAuth/Credentials/authorize] Executing user lookup query for email '${email}'...`);
            const result = await client.query(
              'SELECT id, email, password, role, tenantid FROM users WHERE email = $1', // DB column is tenantid
              [email]
            );
            console.log(`[NextAuth/Credentials/authorize] Query executed. Rows returned: ${result.rows.length}`);

            // --- STEP 5: Check User Existence ---
            if (result.rows.length === 0) {
              console.log(`[NextAuth/Credentials/authorize] FAILURE: User with email '${email}' NOT found in tenant '${tenantId}'.`);
              console.log("[NextAuth/Credentials/authorize] --- END (FAILURE - User Not Found) ---");
              return null; // User not found
            }

            const user = result.rows[0];
            console.log(`[NextAuth/Credentials/authorize] SUCCESS: User found - ID: ${user.id}, Email: ${user.email}, Role: ${user.role || 'member'}, Has Password Hash: ${!!user.password}`);

            // --- STEP 6: Validate Password ---
            if (!user.password) {
                console.error(`[NextAuth/Credentials/authorize] FAILURE: User record for '${email}' has a NULL password hash. Cannot authenticate.`);
                console.log("[NextAuth/Credentials/authorize] --- END (FAILURE - Null Password Hash) ---");
                return null; // Inconsistent user data
            }

            console.log(`[NextAuth/Credentials/authorize] Attempting password comparison...`);
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log(`[NextAuth/Credentials/authorize] Password comparison result: ${isValidPassword}`);

            if (!isValidPassword) {
              console.log(`[NextAuth/Credentials/authorize] FAILURE: Invalid password provided for user '${email}'.`);
              console.log("[NextAuth/Credentials/authorize] --- END (FAILURE - Invalid Password) ---");
              return null; // Invalid password
            }

            // --- STEP 7: Success ---
            console.log(`[NextAuth/Credentials/authorize] SUCCESS: Authentication validated for user '${email}'.`);
            // --- FIX: Use tenantId (uppercase I) to match User type ---
            const userDataForSession: User = { // <-- Type is just User
              id: user.id ? String(user.id) : '',
              email: user.email ? String(user.email) : '',
              role: user.role && String(user.role).trim() !== '' ? String(user.role) : 'member', // Default to 'member'
              tenantId: user.tenantid ? String(user.tenantid) : 'default', // Map DB tenantid to User.tenantId
              // Add other non-sensitive user data if needed, ensuring they are strings
              name: user.name ? String(user.name) : '', // If your DB has a name column
              phone: user.phone ? String(user.phone) : '', // If your DB has a phone column
              age: user.age ? String(user.age) : '', // If your DB has an age column (store as string in session)
            };
            console.log(`[NextAuth/Credentials/authorize] Returning user data for session:`, userDataForSession);
            console.log("[NextAuth/Credentials/authorize] --- END (SUCCESS) ---");
            return userDataForSession;

          } finally {
            // --- STEP 8: Cleanup Inner ---
            if (client && !clientReleased) {
              console.log(`[NextAuth/Credentials/authorize] Releasing database client for tenant '${tenantId}' (inner attempt 1)...`);
              client.release();
              clientReleased = true; // Mark as released
              console.log(`[NextAuth/Credentials/authorize] Database client released (inner).`);
            } else if (client && clientReleased) {
              console.warn(`[NextAuth/Credentials/authorize] WARNING: Attempted to release database client for tenant '${tenantId}' again (inner). Already released.`);
            } else {
              console.log(`[NextAuth/Credentials/authorize] No database client to release (inner) for tenant '${tenantId}'.`);
            }
          }
        } catch (dbError: any) {
          // --- STEP 9: Handle Database Errors ---
          console.error("[NextAuth/Credentials/authorize] DB Error during authorization:", dbError);
          // Don't expose internal errors directly to the client
          console.log("[NextAuth/Credentials/authorize] --- END (FAILURE - DB Error) ---");
          return null;
        } finally {
          // --- STEP 10: Cleanup Outer ---
          if (client && !clientReleased) {
            console.log(`[NextAuth/Credentials/authorize] Releasing database client for tenant '${tenantId}' (outer attempt 2 - safety net)...`);
            client.release();
            clientReleased = true; // Mark as released
            console.log(`[NextAuth/Credentials/authorize] Database client released (outer - safety net).`);
          } else if (client && clientReleased) {
            // This is expected if the inner finally already released it.
            console.log(`[NextAuth/Credentials/authorize] Database client for tenant '${tenantId}' already released (outer - safety net check).`);
          } else {
            console.log(`[NextAuth/Credentials/authorize] No database client to release in outer finally for tenant '${tenantId}'.`);
          }
          // Consider if pool needs cleanup, though getTenantPool likely manages it.
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // profile(profile) {
      //   return {
      //     id: profile.sub,
      //     name: `${profile.given_name} ${profile.family_name}`,
      //     email: profile.email,
      //     image: profile.picture,
      //     // tenantId: 'default_tenant_for_google', // Determine dynamically
      //     role: 'member'
      //   }
      // }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("[NextAuth/callbacks/jwt] --- START ---");
      console.log("[NextAuth/callbacks/jwt] Token received (before processing):", token);
      console.log("[NextAuth/callbacks/jwt] User object received from authorize:", user);

      // On sign in, `user` object is available from authorize/provider.profile
      if (user) {
        console.log("[NextAuth/callbacks/jwt] New user signing in, populating token...");
        // Populate the JWT token with user details
        // --- FIX: Use tenantId (uppercase I) to match User type ---
        token.id = user.id ? String(user.id) : '';
        token.email = user.email ? String(user.email) : '';
        token.role = (user as any).role ? String((user as any).role) : 'member'; // Default to 'member'
        token.tenantId = (user as any).tenantId ? String((user as any).tenantId) : 'default'; // Use tenantId from user object
        // Add other user data if needed, ensuring they are strings
        (token as any).name = (user as any).name ? String((user as any).name) : ''; // If your DB has a name column
        (token as any).phone = (user as any).phone ? String((user as any).phone) : ''; // If your DB has a phone column
        (token as any).age = (user as any).age ? String((user as any).age) : ''; // If your DB has an age column (store as string in token)
        console.log("[NextAuth/callbacks/jwt] SUCCESS: Token populated with user data.");
      } else {
        console.log("[NextAuth/callbacks/jwt] Existing session, token unchanged.");
      }

      console.log("[NextAuth/callbacks/jwt] Final token:", token);
      console.log("[NextAuth/callbacks/jwt] --- END ---");
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth/callbacks/session] --- START ---");
      console.log("[NextAuth/callbacks/session] Session received (before processing):", session);
      console.log("[NextAuth/callbacks/session] Token received:", token);

      // Make user details from the JWT token available on the session object
      if (session.user) {
        console.log("[NextAuth/callbacks/session] Populating session with token data...");
        // --- FIX: Use tenantId (uppercase I) to match User type ---
        session.user.id = token.id ? String(token.id) : '';
        session.user.email = token.email ? String(token.email) : '';
        session.user.role = token.role ? String(token.role) : 'member'; // Default to 'member'
        session.user.tenantId = token.tenantId ? String(token.tenantId) : 'default'; // Use tenantId from token
        // Add other user data if needed, ensuring they are strings
        (session.user as any).name = token.name ? String(token.name) : ''; // If your DB has a name column
        (session.user as any).phone = token.phone ? String(token.phone) : ''; // If your DB has a phone column
        (session.user as any).age = token.age ? String(token.age) : ''; // If your DB has an age column (store as string in session)
        console.log("[NextAuth/callbacks/session] SUCCESS: Session populated with token data.");
      } else {
        console.warn("[NextAuth/callbacks/session] WARNING: session.user is undefined!");
      }

      console.log("[NextAuth/callbacks/session] Final session:", session);
      console.log("[NextAuth/callbacks/session] --- END ---");
      return session;
    },
    // You might need to add signIn callback to restrict access based on tenant or other criteria
    // async signIn({ user, account, profile }) { ... }
  },
  session: {
    strategy: "jwt", // Use JWT for server-side sessions
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login', // Custom sign-in page
    signOut: '/login', // Redirect here after logout
    error: '/login?error=CredentialsSignIn', // Redirect on credential login error
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
};

console.log("[NextAuth/route.ts] NextAuth configuration object defined successfully.");

const handler = NextAuth(nextAuthOptions);

console.log("[NextAuth/route.ts] NextAuth({...}) call completed successfully.");
console.log("[NextAuth/route.ts] NextAuth returned handlers object:", !!handler);

// --- CRITICAL: Export the handlers for Next.js App Router ---
// The `handler` function from `NextAuth(config)` needs to be exported
// as both `GET` and `POST` named exports for the App Router.
// This is the STANDARD and RECOMMENDED way.
console.log("[NextAuth/route.ts] Exporting handlers: GET, POST");
export { handler as GET, handler as POST };
console.log("[NextAuth/route.ts] Handlers exported successfully.");