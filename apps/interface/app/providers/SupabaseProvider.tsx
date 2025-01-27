'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient, type User } from '@supabase/auth-helpers-nextjs';

type SupabaseContextType = {
  user: User | null;
  isLoading: boolean;
};

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  isLoading: true,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    const getInitialUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.error('Error getting session:', error.message);
            setUser(null);
          } else {
            setUser(session?.user ?? null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialUser:', error);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    // Get initial session
    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
