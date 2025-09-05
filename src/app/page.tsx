
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Apple, Download, Gamepad, Shield, Swords, TrendingUp, Trophy, Twitter, Wind } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: <Swords className="h-8 w-8 text-yellow-400" />,
    title: 'Quest System',
    description: 'Turn tasks into epic quests with clear objectives and rewarding outcomes.',
  },
  {
    icon: <Shield className="h-8 w-8 text-yellow-400" />,
    title: 'Skill Tree',
    description: 'Develop your skills as you complete tasks, unlocking new powers.',
  },
  {
    icon: <Trophy className="h-8 w-8 text-yellow-400" />,
    title: 'Rewards & Loot',
    description: 'Earn EXP, collect loot, and unlock achievements on your journey.',
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-yellow-400" />,
    title: 'Progress Tracking',
    description: 'Visualize your growth with detailed reports and charts.',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[#121212] text-white font-serif">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">QuestForge</h1>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-lg">
          <Link href="#" className="hover:text-yellow-400 transition-colors">Features</Link>
          <Link href="#" className="hover:text-yellow-400 transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-yellow-400 transition-colors">Support</Link>
        </nav>
        <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-white hover:text-yellow-400 hover:bg-transparent" asChild>
                <Link href="/dashboard">Log In</Link>
            </Button>
            <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black" asChild>
                <Link href="/dashboard">Sign Up</Link>
            </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 text-center">
        <div className="bg-black/20 p-12 rounded-lg border border-yellow-500/50" style={{
            backgroundImage: `url('https://picsum.photos/1200/400?blur=2')`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
            }}>
          <h2 className="text-5xl md:text-7xl font-bold text-yellow-400 leading-tight shadow-lg">
            Forge Your Path to Productivity
          </h2>
          <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto text-gray-300">
            Embark on a quest to conquer your tasks and level up your life with QuestForge, the RPG-inspired task management app.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500" asChild>
              <Link href="/dashboard">Begin Your Quest</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-gray-500 text-white hover:bg-gray-700 hover:border-gray-600">
              Learn More
            </Button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl md:text-5xl font-bold text-center text-yellow-400">
            Unleash Your Inner Hero
          </h3>
          <p className="text-center mt-2 text-gray-400">
            Powerful tools to aid you on your journey.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {features.map((feature, index) => (
              <Card key={index} className="bg-transparent border border-yellow-500/50 text-center p-6 hover:border-yellow-400 transition-all transform hover:-translate-y-2">
                <CardHeader className="flex justify-center items-center">
                  <div className="bg-yellow-500/10 p-4 rounded-full">
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="text-2xl font-bold text-white">{feature.title}</h4>
                  <p className="text-gray-400 mt-2">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-6 text-center">
            <h3 className="text-4xl md:text-5xl font-bold text-yellow-400">Download QuestForge Now</h3>
            <p className="mt-2 text-gray-400">Start your adventure on any device. Your quest for productivity awaits.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <Button variant="outline" size="lg" className="border-yellow-500/50 text-white hover:bg-yellow-500/10 hover:border-yellow-400 py-8 text-lg">
                    <Apple className="h-6 w-6 mr-2" /> Download for iOS
                </Button>
                 <Button variant="outline" size="lg" className="border-yellow-500/50 text-white hover:bg-yellow-500/10 hover:border-yellow-400 py-8 text-lg">
                    <Gamepad className="h-6 w-6 mr-2" /> Get it on Android
                </Button>
                 <Button variant="outline" size="lg" className="border-yellow-500/50 text-white hover:bg-yellow-500/10 hover:border-yellow-400 py-8 text-lg">
                    <Download className="h-6 w-6 mr-2" /> Download for Windows
                </Button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-yellow-500/30">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center">
            <div className="flex gap-6 text-gray-400">
                <Link href="#" className="hover:text-yellow-400">Privacy Policy</Link>
                <Link href="#" className="hover:text-yellow-400">Terms of Service</Link>
                <Link href="#" className="hover:text-yellow-400">Contact Us</Link>
            </div>
            <div className="text-gray-500 my-4 md:my-0">
                © 2024 QuestForge. All rights reserved.
            </div>
            <div className="flex gap-4">
                <Link href="#" className="text-gray-400 hover:text-yellow-400"><Twitter className="h-6 w-6" /></Link>
                <Link href="#" className="text-gray-400 hover:text-yellow-400"><Wind className="h-6 w-6" /></Link>
                <Link href="#" className="text-gray-400 hover:text-yellow-400"><Gamepad className="h-6 w-6" /></Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
