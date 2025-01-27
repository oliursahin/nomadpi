'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        timezone: profile.timezone,
        notification_preferences: profile.notification_preferences,
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your account settings and preferences
        </p>

        {message.text && (
          <div
            className={`mt-4 p-4 rounded-md ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={updateProfile} className="mt-6 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user?.email || ''}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={profile?.full_name || ''}
              onChange={(e) =>
                setProfile(profile ? { ...profile, full_name: e.target.value } : null)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-700"
            >
              Timezone
            </label>
            <select
              id="timezone"
              value={profile?.timezone || 'UTC'}
              onChange={(e) =>
                setProfile(profile ? { ...profile, timezone: e.target.value } : null)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="UTC">UTC</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">
              Notification Preferences
            </h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="email_notifications"
                  type="checkbox"
                  checked={profile?.notification_preferences?.email || false}
                  onChange={(e) =>
                    setProfile(
                      profile
                        ? {
                            ...profile,
                            notification_preferences: {
                              ...profile.notification_preferences,
                              email: e.target.checked,
                            },
                          }
                        : null
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="email_notifications"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="browser_notifications"
                  type="checkbox"
                  checked={profile?.notification_preferences?.browser || false}
                  onChange={(e) =>
                    setProfile(
                      profile
                        ? {
                            ...profile,
                            notification_preferences: {
                              ...profile.notification_preferences,
                              browser: e.target.checked,
                            },
                          }
                        : null
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="browser_notifications"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Browser Notifications
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="mt-10 pt-10 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Delete Account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Once you delete your account, you will lose all data associated with it.
          </p>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // Implement account deletion
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
