'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSupabase } from './providers/SupabaseProvider';
import EmailSignIn from '@/components/auth/EmailSignIn';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useSupabase();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
          <h2 className="text-center text-2xl font-medium tracking-tight text-gray-900">
            Welcome to NomadPi
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show sign-in options if not authenticated
  return (
    <div className="min-h-screen flex flex-col justify-center bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
        <h2 className="text-center text-2xl font-medium tracking-tight text-gray-900">
          Welcome to NomadPi
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your VPN connections
        </p>

        {/* Email Sign In Form */}
        <EmailSignIn />

        {/* OAuth Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="mt-6 space-y-4">
          <button
            onClick={signInWithGoogle}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Continue with Google
          </button>
          <button
            onClick={signInWithGithub}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
