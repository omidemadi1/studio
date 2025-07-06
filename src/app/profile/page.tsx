'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { user } from '@/lib/mock-data';
import { Settings } from 'lucide-react';

export default function ProfilePage() {
  const xpProgress = (user.xp / user.nextLevelXp) * 100;

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold">Profile</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Button>
      </header>

      <Card className="w-full bg-card/80 text-center">
        <CardContent className="p-6">
          <Avatar className="mx-auto h-24 w-24 border-4 border-primary">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="mt-4 text-2xl font-bold font-headline">{user.name}</h2>
          <p className="text-muted-foreground">Level {user.level}</p>
        </CardContent>
      </Card>

      <Card className="mt-6 bg-card/80">
        <CardHeader>
          <CardTitle>Current Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">XP</span>
            <span className="text-sm font-medium">
              {user.xp} / {user.nextLevelXp}
            </span>
          </div>
          <Progress value={xpProgress} aria-label={`${xpProgress}% towards next level`} />
        </CardContent>
      </Card>
    </div>
  );
}
