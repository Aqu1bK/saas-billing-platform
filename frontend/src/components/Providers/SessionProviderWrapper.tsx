// frontend/src/components/Providers/SessionProviderWrapper.tsx
'use client'; // --- CRITICAL: Mark as Client Component ---

import React from 'react';
import { SessionProvider } from 'next-auth/react';

// --- Define the props interface ---
interface SessionProviderWrapperProps {
  children: React.ReactNode;
}

// --- Create the wrapper component as a Client Component ---
const SessionProviderWrapper: React.FC<SessionProviderWrapperProps> = ({ children }) => {
  // --- Render the SessionProvider with children ---
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
};

// --- Export the wrapper component ---
export default SessionProviderWrapper;