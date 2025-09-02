
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function ManagerPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-headline font-bold">Manager</h1>
        <p className="text-muted-foreground">Oversee all your quests and projects.</p>
      </header>

      <Card className="w-full max-w-md bg-card/80">
        <CardContent className="p-10 text-center">
          <div className="flex justify-center mb-4">
            <Construction className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-xl font-headline font-semibold">Coming Soon!</h2>
          <p className="text-muted-foreground mt-2">
            This section is under construction. Soon you'll be able to manage everything from here!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
