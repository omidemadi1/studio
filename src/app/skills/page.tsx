'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { skills, user } from '@/lib/mock-data';
import SkillRadar from '@/components/skill-radar';
import { GemIcon } from '@/components/icons/gem-icon';

export default function SkillsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Skills & Wallet</h1>
        <p className="text-muted-foreground">Your hero's progress and treasures.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
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
        
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="font-headline">Skill Radar</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <SkillRadar />
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
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
