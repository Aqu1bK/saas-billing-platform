// frontend/src/types/next-auth.d.ts
// --- EXTEND NEXT-AUTH TYPES ---
// This file extends the built-in types for next-auth
// to include custom properties like id, role, tenantId, name, phone, age

// Import the default types from next-auth
import 'next-auth';
import 'next-auth/jwt';

// --- DEFINE YOUR CUSTOM USER TYPE ---
// Define the additional properties you add to the user object
interface CustomUser {
  id: string; // UUID from your database
  email: string;
  role: string; // e.g., 'member', 'billing_manager', 'admin'
  tenantId: string; // e.g., 'acme'
  // --- ADD THESE NEW PROPERTIES ---
  name?: string | null; // Optional: User's full name
  phone?: string | null; // Optional: User's phone number
  age?: string | null; // Optional: User's age (stored as string in session)
  // --- END ADDITIONS ---
  // Add other properties if needed, e.g., image
  image?: string | null;
}
// --- END CUSTOM USER TYPE ---

// --- MODULE AUGMENTATION FOR next-auth ---
// Extend the built-in Session and User types
declare module 'next-auth' {
  // Extend the User type (available in the authorize callback)
  interface User extends CustomUser {}

  // Extend the Session type (available via useSession, getSession)
  interface Session {
    user: CustomUser; // Use your extended CustomUser type
  }
}

// --- MODULE AUGMENTATION FOR next-auth/jwk ---
// Extend the built-in JWT type (available in jwt and session callbacks)
declare module 'next-auth/jwt' {
  interface JWT extends CustomUser {} // Use your extended CustomUser type
}
// --- END MODULE AUGMENTATION ---