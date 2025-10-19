
import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/toaster";
import { QuestProvider } from "@/context/quest-context";
import { AuthProvider } from "@/context/auth-context";
import { SessionMonitor } from "@/components/session-monitor";

export const metadata: Metadata = {
  title: "Questify",
  description: "Manage tasks, build skills.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?display=swap&family=MedievalSharp&family=IM+Fell+English&family=Space+Grotesk:wght@400;500;700"
          rel="stylesheet"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" 
          rel="stylesheet" 
        />
        <meta name="theme-color" content="#F0D932" />
      </head>
      <body
        className={cn(
          "font-sans antialiased",
          "bg-background"
        )}
      >
        <AuthProvider>
          <QuestProvider>
            <SessionMonitor />
            <div className="relative flex min-h-screen w-full flex-col">
              <main className="flex-1 pb-24">{children}</main>
              <BottomNav />
            </div>
            <Toaster />
          </QuestProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
