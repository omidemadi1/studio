
'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

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
  
  const renderIcon = () => {
    if (theme === 'dark') {
      return <Moon className="h-4 w-4 mr-2 hidden dark:inline-block" />;
    }
    return <Sun className="h-4 w-4 mr-2 inline-block dark:hidden" />;
  }

  return (
    <button onClick={toggleTheme} disabled={!mounted} className="w-full flex items-center">
        {mounted ? (
            theme === 'dark' ? (
                <Moon className="h-4 w-4 mr-2" />
            ) : (
                <Sun className="h-4 w-4 mr-2" />
            )
        ) : (
            <div className="h-4 w-4 mr-2" />
        )}
        <span>Toggle Theme</span>
    </button>
  );
}
