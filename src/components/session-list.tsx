'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface SessionItem {
  id: number;
  deviceName?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  loginTime: string;
  lastActivity?: string | null;
}

export default function SessionList({ userId }: { userId: number }) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.getSessionsForUser(userId);
      setSessions(resp || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleClose = async (sessionId: number) => {
    if (!confirm('Close this session? This will sign out that device.')) return;
    setLoading(true);
    try {
      await apiClient.closeSession(userId, sessionId);
      // Refresh list
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to close session');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOthers = async () => {
    if (!confirm('Close all other sessions? This will sign out other devices.')) return;
    setLoading(true);
    try {
      await apiClient.closeOtherSessions(userId);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to close other sessions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {sessions.length > 1 && (
        <div className="mb-4 flex justify-end">
          <button className="btn btn-sm btn-destructive" onClick={handleCloseOthers}>Close other sessions</button>
        </div>
      )}
      {error && <div className="text-destructive mb-2">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground mb-2">Loading...</div>}
      {sessions.length === 0 ? (
        <div className="text-sm text-muted-foreground">No active sessions found.</div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <div className="font-medium">{s.deviceName || s.deviceType || 'Unknown device'}</div>
                <div className="text-xs text-muted-foreground">IP: {s.ipAddress || '—'}</div>
                <div className="text-xs text-muted-foreground">Last activity: {s.lastActivity ? new Date(s.lastActivity).toLocaleString() : new Date(s.loginTime).toLocaleString()}</div>
              </div>
              <div>
                <Button variant="destructive" size="sm" onClick={() => handleClose(s.id)}>
                  Close session
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
