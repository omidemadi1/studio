'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { areas, dailyMissions, user } from '@/lib/mock-data';
import type { Task } from '@/lib/types';
import { CheckCircle2, Swords } from 'lucide-react';

export default function QuestsPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState(() =>
    areas.flatMap((area) => area.projects.flatMap((p) => p.tasks))
  );
  const [currentUser, setCurrentUser] = useState(user);

  const handleTaskToggle = (taskId: string, completed: boolean, xp: number) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed } : t
    );
    setTasks(updatedTasks);

    if (completed) {
      toast({
        title: 'Quest Complete!',
        description: `You earned ${xp} XP!`,
      });
      const newXp = currentUser.xp + xp;
      const newLevel =
        newXp >= currentUser.nextLevelXp
          ? currentUser.level + 1
          : currentUser.level;
      const newNextLevelXp =
        newXp >= currentUser.nextLevelXp
          ? currentUser.nextLevelXp * 2
          : currentUser.nextLevelXp;

      setCurrentUser((prev) => ({
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: newNextLevelXp,
      }));
    } else {
        setCurrentUser((prev) => ({
            ...prev,
            xp: Math.max(0, prev.xp - xp),
          }));
    }
  };

  const xpProgress = (currentUser.xp / currentUser.nextLevelXp) * 100;

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-bold text-primary">Questify</h1>
        <Avatar>
          <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-headline font-semibold mb-4 flex items-center gap-2">
          <Swords className="text-primary" /> Daily Missions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {dailyMissions.map((mission) => (
            <Card key={mission.id} className="bg-card/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{mission.title}</p>
                  <p className="text-sm text-muted-foreground">
                    + {mission.xp} XP, +{mission.tokens} Tokens
                  </p>
                </div>
                <Button size="sm" variant="outline">Start</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4">Your Quests</h2>
        <Accordion type="multiple" defaultValue={areas.map(a => a.id)} className="w-full">
          {areas.map((area) => (
            <AccordionItem key={area.id} value={area.id}>
              <AccordionTrigger className="text-xl font-headline hover:no-underline">
                <div className="flex items-center gap-3">
                    <area.icon className="w-6 h-6 text-accent" />
                    {area.name}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" defaultValue={area.projects.map(p => p.id)} className="w-full pl-4 border-l-2 border-primary/20">
                  {area.projects.map((project) => (
                    <AccordionItem key={project.id} value={project.id} className="border-b-0">
                      <AccordionTrigger className="font-semibold hover:no-underline">
                        {project.name}
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <ul className="space-y-3">
                          {project.tasks.map((task: Task) => (
                            <li
                              key={task.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={task.id}
                                checked={tasks.find(t => t.id === task.id)?.completed}
                                onCheckedChange={(checked) =>
                                  handleTaskToggle(task.id, !!checked, task.xp)
                                }
                                className="w-5 h-5"
                              />
                              <label
                                htmlFor={task.id}
                                className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {task.title}
                              </label>
                              <span className="text-xs font-bold text-primary">
                                +{task.xp} XP
                              </span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
