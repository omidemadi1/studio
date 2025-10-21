'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuestData } from '@/context/quest-context';
import SessionList from '@/components/session-list';

export default function ProfileSettingsPage() {
  const { user } = useQuestData();

  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-headline mb-4">Privacy & Security</h1>

      <Card className="mb-4 bg-card/80">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? <SessionList userId={user.id} /> : <div>Please sign in to manage sessions.</div>}
        </CardContent>
      </Card>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Other Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Coming soon — password changes, data export, connected apps.</p>
        </CardContent>
      </Card>
    </div>
  );
}
