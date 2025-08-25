
'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  if (!mounted) {
      return <div className="h-6 w-[52px]" />; // Placeholder for server render to avoid layout shift
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Theme</span>
      <button
        onClick={toggleTheme}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          theme === 'dark' ? 'bg-primary' : 'bg-input'
        )}
      >
        <span className="sr-only">Toggle theme</span>
        <span
          className={cn(
            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out',
            theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
          )}
        >
          <span
            className={cn(
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
              theme === 'dark' ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
            )}
            aria-hidden="true"
          >
            <Sun className="h-3 w-3 text-foreground" />
          </span>
          <span
            className={cn(
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
              theme === 'dark' ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
            )}
            aria-hidden="true"
          >
            <Moon className="h-3 w-3 text-primary" />
          </span>
        </span>
      </button>
    </div>
  );
}
