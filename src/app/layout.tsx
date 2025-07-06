import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/toaster";
import { QuestProvider } from "@/context/quest-context";

export const metadata: Metadata = {
  title: "Questify",
  description: "Manage tasks, build skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "font-body antialiased",
          "bg-background"
        )}
      >
        <QuestProvider>
          <div className="relative flex min-h-screen w-full flex-col">
            <main className="flex-1 pb-24">{children}</main>
            <BottomNav />
          </div>
          <Toaster />
        </QuestProvider>
      </body>
    </html>
  );
}
