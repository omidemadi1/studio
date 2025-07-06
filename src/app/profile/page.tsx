'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { skills, user } from '@/lib/mock-data';
import { Settings } from 'lucide-react';
import SkillRadar from '@/components/skill-radar';
import { GemIcon } from '@/components/icons/gem-icon';

export default function ProfilePage() {
  const xpProgress = (user.xp / user.nextLevelXp) * 100;

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold">Profile & Skills</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Button>
      </header>

      <Card className="w-full bg-card/80 text-center mb-6">
        <CardContent className="p-6">
          <Avatar className="mx-auto h-24 w-24 border-4 border-primary">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="mt-4 text-2xl font-bold font-headline">{user.name}</h2>
          <p className="text-muted-foreground">Level {user.level}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Current Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">XP</span>
              <span className="text-sm font-medium">
                {user.xp} / {user.nextLevelXp}
              </span>
            </div>
            <Progress value={xpProgress} aria-label={`${xpProgress}% towards next level`} />
          </CardContent>
        </Card>
        
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <GemIcon className="h-6 w-6 text-primary" />
              Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{user.tokens.toLocaleString()}</div>
            <p className="text-muted-foreground">Tokens available to spend</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-card/80 mb-6">
        <CardHeader>
          <CardTitle className="font-headline">Skill Radar</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] md:h-[300px]">
          <SkillRadar />
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4">Skill Details</h2>
        <div className="space-y-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className='flex items-center gap-3'>
                    <skill.icon className="h-6 w-6 text-accent" />
                    <span className="font-headline font-semibold">
                      {skill.name} - Lvl {skill.level}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {skill.points} / {skill.maxPoints}
                  </span>
                </div>
                <Progress value={(skill.points / skill.maxPoints) * 100} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
