'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GemIcon } from '@/components/icons/gem-icon';
import type { MarketItem } from '@/lib/types';

interface MarketPageClientProps {
  marketItems: MarketItem[];
}

export default function MarketPageClient({ marketItems }: MarketPageClientProps) {
  const { toast } = useToast();

  const handleBuy = (itemName: string, price: number) => {
    toast({
      title: 'Purchase Successful!',
      description: `You bought ${itemName} for ${price} tokens.`,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Spend your tokens on powerful items.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {marketItems.map((item) => (
          <Card key={item.id} className="flex flex-col bg-card/80 overflow-hidden">
            <CardHeader className="p-0">
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={200}
                height={200}
                className="w-full h-32 object-cover"
                data-ai-hint="fantasy item"
              />
            </CardHeader>
            <CardContent className="p-3 flex-1">
              <CardTitle className="text-base font-semibold font-headline mb-1">{item.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
            <CardFooter className="p-3">
              <Button
                className="w-full"
                variant="default"
                onClick={() => handleBuy(item.name, item.price)}
              >
                <GemIcon className="h-4 w-4 mr-2" />
                {item.price}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
