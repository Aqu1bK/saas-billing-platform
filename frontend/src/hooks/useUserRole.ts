// frontend/src/hooks/useUserRole.ts
import { useSession } from 'next-auth/react';

export const useUserRole = () => {
  const {  data:session, status } = useSession();
  
  const userRole = session?.user?.role || 'member'; // Default to 'member' if no role
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  
  return {
    userRole,
    isAuthenticated,
    isLoading,
    isAdmin: userRole === 'admin',
    isBillingManager: userRole === 'billing_manager',
    isMember: userRole === 'member',
  };
};