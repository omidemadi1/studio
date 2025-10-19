import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

/**
 * Hook to protect routes that require authentication
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to check session status
 */
export function useSessionStatus() {
  const { getSessionInfo } = useAuth();
  
  const sessionInfo = getSessionInfo();
  
  return {
    isValid: sessionInfo.isValid,
    tokenExpiry: sessionInfo.tokenExpiry,
    lastActivity: sessionInfo.lastActivity,
    rememberMe: sessionInfo.rememberMe,
    timeUntilExpiry: sessionInfo.tokenExpiry 
      ? sessionInfo.tokenExpiry.getTime() - Date.now()
      : null,
  };
}
