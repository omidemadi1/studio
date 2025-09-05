
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#110e1b] text-gray-200 bg-cover bg-center font-body"
      style={{
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")',
      }}
    >
      <div className="flex-grow bg-[#110e1b]/90">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-transparent backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <svg
                className="h-10 w-10 text-amber-400"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L4.5 5v3.09c0 6.45 4.54 11.64 7.5 12.83 2.96-1.19 7.5-6.38 7.5-12.83V5L12 2zm0 17.92c-2.07-.86-5.5-4.83-5.5-10.83V6.61l5.5-2.28 5.5 2.28v8.41c0 6-3.43 9.97-5.5 10.83zM11 15l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"></path>
              </svg>
              <h2 className="text-3xl font-title text-white">QuestForge</h2>
            </div>
            <nav className="hidden items-center gap-8 md:flex">
              <Link href="#" className="text-lg font-body hover:text-amber-400 transition-colors">
                Features
              </Link>
              <Link href="#" className="text-lg font-body hover:text-amber-400 transition-colors">
                Pricing
              </Link>
              <Link href="#" className="text-lg font-body hover:text-amber-400 transition-colors">
                Support
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="btn btn-secondary">
                Log In
              </Link>
              <Link href="/dashboard" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-16 text-center">
          <div
            className="relative overflow-hidden rounded-lg border-4 border-amber-600/50 bg-cover bg-center py-24 shadow-[0_0_40px_rgba(161,98,7,0.4)]"
            style={{
              backgroundImage: `linear-gradient(rgba(17, 14, 27, 0.9), rgba(17, 14, 27, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDD2SVqXaih_zyHV5e7cyGxsadd_RAmlFRpiB5tMigPDWi8AZTgmnmLJDLFJby3G8zwtyZyoK_9iVMsCRgYpugHrdsgreaIxFhDdF3NLSUyUoWSfqRQga3C90GR7HSCUJym4817DINNPws3wlxlKJtqWprxero1pau_fws3y_ISHgeFpIZqI3fC7_agR0UXvjmrfTWCFKecaMCzz0kq1B2gDGDzXuycviKFU1HLg0VOqKgbWaZaBTVvEqFFHPErZHv-gYMlDqOfEw")`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#110e1b] via-transparent to-transparent"></div>
            <div className="relative z-10 mx-auto max-w-4xl">
              <h1
                className="text-6xl font-title leading-tight tracking-wider text-amber-300 md:text-7xl"
                style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}
              >
                Forge Your Path to Productivity
              </h1>
              <p className="mt-6 text-xl text-gray-300 font-body max-w-2xl mx-auto">
                Embark on a quest to conquer your tasks and level up your life with QuestForge, the RPG-inspired task
                management app.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-6">
                <Link href="/dashboard" className="btn btn-primary text-xl px-8 py-4">
                  Begin Your Quest
                </Link>
                <Link href="#" className="btn btn-secondary text-xl px-8 py-4">
                  Learn More
                </Link>
              </div>
            </div>
          </div>

          <section className="py-24">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-5xl font-title text-amber-300 md:text-6xl">Unleash Your Inner Hero</h2>
              <p className="mt-4 text-xl text-gray-400 font-body">Powerful tools to aid you on your journey.</p>
              <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                <div className="transform rounded-lg border-2 border-amber-800/50 bg-[#1a1625]/80 p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-[#1a1625] hover:shadow-[0_0_30px_rgba(161,98,7,0.5)]">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 ring-2 ring-amber-400/20">
                    <span className="material-symbols-outlined text-5xl">swords</span>
                  </div>
                  <h3 className="mt-6 text-2xl font-title text-amber-200">Quest System</h3>
                  <p className="mt-3 text-base text-gray-400 font-body">
                    Turn tasks into epic quests with clear objectives and rewarding outcomes.
                  </p>
                </div>
                <div className="transform rounded-lg border-2 border-amber-800/50 bg-[#1a1625]/80 p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-[#1a1625] hover:shadow-[0_0_30px_rgba(161,98,7,0.5)]">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 ring-2 ring-amber-400/20">
                    <span className="material-symbols-outlined text-5xl">shield</span>
                  </div>
                  <h3 className="mt-6 text-2xl font-title text-amber-200">Skill Tree</h3>
                  <p className="mt-3 text-base text-gray-400 font-body">
                    Develop your skills as you complete tasks, unlocking new powers.
                  </p>
                </div>
                <div className="transform rounded-lg border-2 border-amber-800/50 bg-[#1a1625]/80 p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-[#1a1625] hover:shadow-[0_0_30px_rgba(161,98,7,0.5)]">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 ring-2 ring-amber-400/20">
                    <span className="material-symbols-outlined text-5xl">emoji_events</span>
                  </div>
                  <h3 className="mt-6 text-2xl font-title text-amber-200">Rewards &amp; Loot</h3>
                  <p className="mt-3 text-base text-gray-400 font-body">
                    Earn EXP, collect loot, and unlock achievements on your journey.
                  </p>
                </div>
                <div className="transform rounded-lg border-2 border-amber-800/50 bg-[#1a1625]/80 p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-[#1a1625] hover:shadow-[0_0_30px_rgba(161,98,7,0.5)]">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 ring-2 ring-amber-400/20">
                    <span className="material-symbols-outlined text-5xl">monitoring</span>
                  </div>
                  <h3 className="mt-6 text-2xl font-title text-amber-200">Progress Tracking</h3>
                  <p className="mt-3 text-base text-gray-400 font-body">
                    Visualize your growth with detailed reports and charts.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            className="rounded-lg border-2 border-amber-600/30 bg-[#1a1625]/50 py-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(26, 22, 37, 0.8), rgba(26, 22, 37, 0.9)), url('https://www.transparenttextures.com/patterns/old-map.png')",
            }}
          >
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-5xl font-title text-amber-300 md:text-6xl">Download QuestForge Now</h2>
              <p className="mt-4 text-xl text-amber-100/70 font-body">
                Start your adventure on any device. Your quest for productivity awaits.
              </p>
              <div className="mt-12 flex flex-wrap justify-center gap-8">
                <a
                  className="inline-flex items-center gap-4 rounded-md border border-amber-500/50 bg-black/30 px-6 py-4 font-body text-lg text-amber-200 transition-all hover:bg-amber-900/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-400/20"
                  href="#"
                >
                  <svg
                    className="h-8 w-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19.1,4.73a3.52,3.52,0,0,0-5.11,0,3.31,3.31,0,0,0-2,.88,3.31,3.31,0,0,0-2-.88,3.52,3.52,0,0,0-5.11,0c-2,2-2,5.28,0,7.24l.25.24,6.86,6.3,6.86-6.3.25-.24C21.1,10,21.1,6.72,19.1,4.73Zm-1.2,6.1-5.7,5.25L6.5,10.83a2.31,2.31,0,0,1,0-3.32,2.54,2.54,0,0,1,3.61,0l1.15,1.1a1,1,0,0,0,1.42,0l1.15-1.1a2.54,2.54,0,0,1,3.61,0,2.31,2.31,0,0,1,0,3.32Z"></path>
                  </svg>
                  <div>
                    <span className="text-sm">Download for</span>
                    <p className="text-xl font-bold font-title">iOS</p>
                  </div>
                </a>
                <a
                  className="inline-flex items-center gap-4 rounded-md border border-amber-500/50 bg-black/30 px-6 py-4 font-body text-lg text-amber-200 transition-all hover:bg-amber-900/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-400/20"
                  href="#"
                >
                  <svg
                    className="h-8 w-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20.57,14.86a.91.91,0,0,0-.43.14,1,1,0,0,0-.41,1.06,7,7,0,0,1,1.15,4.3,1,1,0,0,0,1.06.94,1,1,0,0,0,.94-1.06,8.87,8.87,0,0,0-1.46-5.22,1,1,0,0,0-1.25-.16Zm-15,1.21a1,1,0,0,0-1.06.94,8.87,8.87,0,0,0,1.46,5.22,1,1,0,0,0,1.25-.16,1,1,0,0,0,.41-1.06,7,7,0,0,1-1.15-4.3A1,1,0,0,0,5.57,16.07Z"></path>
                    <path d="M12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,1.54,5.5,1,1,0,0,0,1.8-.8,8,8,0,0,1,13.32,0,1,1,0,0,0,1.8.8A9.89,9.89,0,0,0,22,12,10,10,0,0,0,12,2Zm-1,8.75a1.25,1.25,0,1,1,2.5,0,1.25,1.25,0,0,1-2.5,0Zm3.75-2.5a1.25,1.25,0,1,1-2.5,0,1.25,1.25,0,0,1,2.5,0Zm-5,0a1.25,1.25,0,1,1-2.5,0,1.25,1.25,0,0,1,2.5,0Z"></path>
                  </svg>
                  <div>
                    <span className="text-sm">Get it on</span>
                    <p className="text-xl font-bold font-title">Android</p>
                  </div>
                </a>
                <a
                  className="inline-flex items-center gap-4 rounded-md border border-amber-500/50 bg-black/30 px-6 py-4 font-body text-lg text-amber-200 transition-all hover:bg-amber-900/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-400/20"
                  href="#"
                >
                  <svg
                    className="h-8 w-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M11,13.82l-3.2,2.75A1,1,0,0,1,6,15.75V8.25a1,1,0,0,1,1.6-.8l3.2,2.75a1,1,0,0,1,0,1.62ZM21.41,3H2.59A1.59,1.59,0,0,0,1,4.59V19.41A1.59,1.59,0,0,0,2.59,21H21.41A1.59,1.59,0,0,0,23,19.41V4.59A1.59,1.59,0,0,0,21.41,3ZM13,12l6.22-4.35A1,1,0,0,1,20,8.25v7.5a1,1,0,0,1-1.22.9L13,12Z"></path>
                  </svg>
                  <div>
                    <span className="text-sm">Download for</span>
                    <p className="text-xl font-bold font-title">Windows</p>
                  </div>
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer className="bg-black/50 py-8 border-t border-white/10">
        <div className="container mx-auto px-6 text-center text-gray-400 font-body">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-wrap justify-center gap-6 text-lg">
              <Link href="#" className="hover:text-amber-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-amber-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-amber-400 transition-colors">
                Contact Us
              </Link>
            </div>
            <div className="flex justify-center gap-6">
              <Link href="#" className="hover:text-amber-400 transition-colors">
                <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                </svg>
              </Link>
              <Link href="#" className="hover:text-amber-400 transition-colors">
                <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"></path>
                </svg>
              </Link>
              <Link href="#" className="hover:text-amber-400 transition-colors">
                <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                </svg>
              </Link>
            </div>
          </div>
          <p className="mt-8 text-base">© 2024 QuestForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
