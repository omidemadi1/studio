
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-[#4a413a] flex items-center justify-center min-h-screen text-white font-body">
      <div className="bg-[#2a2522] p-12 rounded-lg shadow-2xl max-w-md w-full text-center">
        <div className="mb-6">
          <Map className="h-16 w-16 mx-auto text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">404 - Path Lost</h1>
        <p className="text-gray-300 mb-8">
          You&apos;ve strayed from the path, adventurer. The map shows nothing
          here. This territory is uncharted.
        </p>

        <div className="relative mb-6">
          <Input
            type="search"
            placeholder="Search the realm..."
            className="bg-[#3e3834] border-[#5a514a] rounded-md pl-4 pr-10 py-2 w-full focus:ring-yellow-500 focus:border-yellow-500"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        <Button
          asChild
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-md text-lg"
        >
          <Link href="/dashboard">Return to Main Quest</Link>
        </Button>

        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Consult the World Map (Homepage)
          </Link>
        </div>
      </div>
    </div>
  );
}
