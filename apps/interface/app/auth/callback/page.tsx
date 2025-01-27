'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      
      if (token) {
        // Store the token
        localStorage.setItem('auth_token', token);
        document.cookie = `auth_token=${token}; path=/; max-age=2592000`; // 30 days
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Handle error
        console.error('No token received');
        router.push('/?error=auth_failed');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h2 className="text-2xl font-medium text-gray-900">Completing authentication...</h2>
        <p className="mt-2 text-sm text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
