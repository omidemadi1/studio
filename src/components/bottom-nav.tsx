'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Store, User, Crosshair, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Quests', icon: Swords },
  { href: '/market', label: 'Market', icon: Store },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/focus', label: 'Focus', icon: Crosshair },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto grid h-16 max-w-md grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                isActive ? 'text-primary' : ''
              )}
            >
              <item.icon
                className="h-6 w-6"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
