'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { PlusIcon } from '@heroicons/react/24/outline';

type Device = Database['public']['Tables']['devices']['Row'];

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', type: 'desktop' });
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (!user) return;

    const fetchDevices = async () => {
      const { data } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setDevices(data);
      setLoading(false);
    };

    fetchDevices();

    // Subscribe to real-time updates
    const subscription = supabase
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
            setDevices((current) => [payload.new as Device, ...current]);
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
      subscription.unsubscribe();
    };
  }, [user]);

  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase.from('devices').insert([
      {
        user_id: user.id,
        name: newDevice.name,
        type: newDevice.type,
        status: 'offline',
      },
    ]);

    if (!error) {
      setNewDevice({ name: '', type: 'desktop' });
      setShowAddDevice(false);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (!error) {
      setDevices((current) =>
        current.filter((device) => device.id !== deviceId)
      );
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Devices</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your devices and VPN connections
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddDevice(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Device
          </button>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Add New Device</h2>
            <form onSubmit={addDevice}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Device Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Device Type
                  </label>
                  <select
                    id="type"
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="laptop">Laptop</option>
                    <option value="mobile">Mobile</option>
                    <option value="tablet">Tablet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddDevice(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device List */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {devices.map((device) => (
            <li key={device.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          device.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                      ></span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-500">{device.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-500">
                      Last connected:{' '}
                      {device.last_connected
                        ? new Date(device.last_connected).toLocaleDateString()
                        : 'Never'}
                    </p>
                    <button
                      onClick={() => deleteDevice(device.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
