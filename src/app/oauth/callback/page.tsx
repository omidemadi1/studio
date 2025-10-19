'use client';

import { useEffect, useState } from 'react';
// @ts-ignore - Next.js navigation types are properly installed
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const isNewUser = searchParams.get('isNewUser') === 'true';
      const error = searchParams.get('error');

      if (error) {
        setError(
          error === 'invalid_email'
            ? 'Invalid email address'
            : error === 'oauth_failed'
            ? 'Authentication failed. Please try again.'
            : 'An error occurred during authentication'
        );
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!token) {
        setError('No authentication token received');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        await handleOAuthCallback(token);
        router.push('/dashboard');
      } catch (err) {
        setError('Failed to complete authentication');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    processCallback();
  }, [searchParams, router, handleOAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-4">Completing Sign In</h2>
            <p className="text-gray-600">Please wait while we authenticate your account...</p>
          </>
        )}
      </div>
    </div>
  );
}
