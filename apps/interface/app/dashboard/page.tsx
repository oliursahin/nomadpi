'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Device = Database['public']['Tables']['devices']['Row'];
type VPNConnection = Database['public']['Tables']['vpn_connections']['Row'];

export default function Dashboard() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [connections, setConnections] = useState<VPNConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (!user) return;

    // Fetch initial data
    const fetchData = async () => {
      const [devicesRes, connectionsRes] = await Promise.all([
        supabase.from('devices').select('*').eq('user_id', user.id),
        supabase.from('vpn_connections').select('*').eq('user_id', user.id),
      ]);

      if (devicesRes.data) setDevices(devicesRes.data);
      if (connectionsRes.data) setConnections(connectionsRes.data);
      setLoading(false);
    };

    fetchData();

    // Subscribe to real-time updates
    const devicesSubscription = supabase
      .channel('devices-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDevices((current) => [...current, payload.new as Device]);
          } else if (payload.eventType === 'UPDATE') {
            setDevices((current) =>
              current.map((device) =>
                device.id === payload.new.id ? (payload.new as Device) : device
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDevices((current) =>
              current.filter((device) => device.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      devicesSubscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeConnections = connections.filter((conn) => conn.status === 'connected');
  const totalDataUsed = activeConnections.reduce((acc, conn) => acc + (conn.config as any).dataUsed || 0, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back, {user?.email}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active Devices Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Devices</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {devices.filter((d) => d.status === 'online').length}
                    </div>
                    <div className="ml-2">
                      <span className="text-sm text-gray-500">of {devices.length} total</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Connections Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active VPN Connections</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {activeConnections.length}
                    </div>
                    <div className="ml-2">
                      <span className="text-sm text-gray-500">of {connections.length} total</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Data Usage Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Data Usage</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {(totalDataUsed / 1024 / 1024 / 1024).toFixed(2)} GB
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {devices.slice(0, 5).map((device) => (
              <li key={device.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          device.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                        }`}></span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{device.name}</p>
                        <p className="text-sm text-gray-500">{device.type}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Last connected:{' '}
                        {device.last_connected
                          ? new Date(device.last_connected).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
