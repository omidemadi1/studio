
'use client';

import { Paintbrush } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { MarketItem } from '@/lib/types';

interface MarketPageClientProps {
  marketItems: MarketItem[];
}

export default function MarketPageClient({ marketItems }: MarketPageClientProps) {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-headline font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Spend your tokens on powerful items.</p>
      </header>

      <Card className="w-full max-w-md bg-card/80">
        <CardContent className="p-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Paintbrush className="h-16 w-16 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-headline font-semibold">Under Renovation!</h2>
          <p className="text-muted-foreground mt-2">
            Our shopkeepers are busy stocking the shelves with legendary loot. Check back soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
