'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

/**
 * SessionMonitor - Monitors session expiration and handles auto-logout
 */
export function SessionMonitor() {
  const { isAuthenticated, getSessionInfo, logout } = useAuth();
  const router = useRouter();
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      const sessionInfo = getSessionInfo();
      
      if (!sessionInfo.isValid) {
        console.log('[SessionMonitor] Session expired, logging out');
        logout();
        router.push('/login?expired=true');
        return;
      }

      // Check if session will expire soon (within 1 hour)
      if (sessionInfo.tokenExpiry && !sessionInfo.rememberMe && !hasWarned) {
        const timeUntilExpiry = sessionInfo.tokenExpiry.getTime() - Date.now();
        const oneHour = 60 * 60 * 1000;

        if (timeUntilExpiry > 0 && timeUntilExpiry < oneHour) {
          const minutes = Math.floor(timeUntilExpiry / (60 * 1000));
          console.log(`[SessionMonitor] Session will expire in ${minutes} minutes`);
          setHasWarned(true);
        }
      }
    };

    // Check session immediately
    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getSessionInfo, logout, router, hasWarned]);

  return null; // This component doesn't render anything
}
