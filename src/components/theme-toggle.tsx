
'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
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
    return (
        <div className="flex w-full items-center justify-between">
            <span className="flex items-center">
                <Sun className="h-4 w-4 mr-2 inline-block dark:hidden" />
                <Moon className="h-4 w-4 mr-2 hidden dark:inline-block" />
                Toggle Theme
            </span>
        </div>
    );
  }

  return (
    <button onClick={toggleTheme} className="w-full flex items-center">
        <Sun className="h-4 w-4 mr-2 inline-block dark:hidden" />
        <Moon className="h-4 w-4 mr-2 hidden dark:inline-block" />
        <span>Toggle Theme</span>
    </button>
  );
}
