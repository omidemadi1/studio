

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, format } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Task, WeeklyMission } from '@/lib/types';
import {
  Sparkles,
  Swords,
  LayoutList,
  Calendar as CalendarIcon,
  Folder
} from 'lucide-react';
import { useQuestData } from '@/context/quest-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


type ViewMode = 'list' | 'calendar';

const MiniTaskCard = ({ task }: { task: Task }) => {
    return (
        <Card className={cn("p-2 text-xs rounded-md mb-1 shadow-sm", task.completed ? 'bg-muted/50' : 'bg-background/50')}>
            <p className={cn("font-semibold truncate", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
        </Card>
    );
};

export default function QuestsPage() {
  const { 
    user, 
    tasks,
    weeklyMissions,
    updateTaskCompletion,
    updateWeeklyMissionCompletion,
    maybeGenerateWeeklyMissions,
  } = useQuestData();

  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (isClient) {
      setTodaysTasks(tasks.filter(task => task.dueDate && isToday(new Date(task.dueDate)) && !task.completed));
    }
  }, [tasks, isClient]);

  useEffect(() => {
    async function fetchMissions() {
      setLoadingSuggestions(true);
      await maybeGenerateWeeklyMissions();
      setLoadingSuggestions(false);
    }
    fetchMissions();
  }, [maybeGenerateWeeklyMissions]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    return eachDayOfInterval({ start, end });
  }, []);

  const getTasksForDay = useCallback((day: Date) => {
    return tasks.filter(task => task.dueDate && isSameDay(new Date(task.dueDate), day));
  }, [tasks]);


  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-bold text-primary">Questify</h1>
        <Avatar>
          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </header>
      
      <section className="mb-8">
        {loadingSuggestions ? (
            <div className="grid md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        ) : weeklyMissions.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-headline font-semibold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-accent" />
                    Weekly Missions
                </h2>
                <div className='flex gap-2 items-center'>
                    <CarouselPrevious className="static translate-y-0" />
                    <CarouselNext className="static translate-y-0" />
                </div>
              </div>
              <CarouselContent>
                {weeklyMissions.map((mission: WeeklyMission) => (
                    <CarouselItem key={mission.id} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <Card className="bg-card/80 flex flex-col h-[130px]">
                            <CardContent className="p-4 flex-1 flex flex-col justify-between">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id={`mission-${mission.id}`}
                                        checked={mission.completed}
                                        onCheckedChange={(checked) => updateWeeklyMissionCompletion(mission.id, !!checked)}
                                        className="w-5 h-5 mt-1 flex-shrink-0"
                                    />
                                    <div className="flex-1 grid gap-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <label
                                                htmlFor={`mission-${mission.id}`}
                                                className={cn("font-medium leading-tight", mission.completed && "line-through text-muted-foreground")}
                                            >
                                                {mission.title}
                                            </label>
                                            <div className="text-xs font-bold text-primary whitespace-nowrap text-right">
                                                <div>+{mission.xp} XP</div>
                                                <div>& {mission.tokens} Tokens</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mission.description}</p>
                            </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
        ) : (
             <Card className="bg-card/80">
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground text-sm">No missions for this week. Check back later!</p>
                </CardContent>
             </Card>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-headline font-semibold flex items-center gap-2">
                <Swords className="w-6 h-6 text-accent" />
                Today's Quests
            </h2>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                    <TabsTrigger value="list"><LayoutList className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="calendar"><CalendarIcon className="h-4 w-4" /></TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        {viewMode === 'list' ? (
          <div className="space-y-3">
              {todaysTasks.length > 0 ? (
                  todaysTasks.map((task: Task) => (
                      <Card key={task.id} className="bg-card/80">
                          <CardContent className="p-3 flex items-center gap-4">
                              <Checkbox
                                  id={`task-${task.id}`}
                                  checked={task.completed}
                                  onCheckedChange={(checked) => updateTaskCompletion(task.id, !!checked)}
                                  className="w-5 h-5"
                              />
                              <label
                                  htmlFor={`task-${task.id}`}
                                  className={cn("flex-1 text-sm font-medium leading-none", task.completed && "line-through text-muted-foreground")}
                              >
                                  {task.title}
                              </label>
                              <span className="text-xs font-bold text-primary whitespace-nowrap">
                                  +{task.xp} XP
                              </span>
                          </CardContent>
                      </Card>
                  ))
              ) : (
                  <Card className="bg-card/80">
                      <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground text-sm">No quests scheduled for today. Time for a side quest?</p>
                          <Button variant="link" asChild className='mt-2'>
                            <Link href="/manager">Go to Manager</Link>
                          </Button>
                      </CardContent>
                  </Card>
              )}
          </div>
        ) : (
            <div className="grid grid-cols-7 border-t border-l">
                {weekDays.map(day => {
                    const tasksForDay = getTasksForDay(day);
                    const isCurrentDay = isToday(day);
                    return (
                        <div key={day.toISOString()} className={cn("border-r border-b p-2 min-h-[100px]", isCurrentDay && "bg-muted/30")}>
                            <div className={cn("text-center text-xs font-semibold mb-2", isCurrentDay && "text-primary")}>
                                <div>{format(day, 'EEE')}</div>
                                <div>{format(day, 'd')}</div>
                            </div>
                            <div className="space-y-1">
                                {tasksForDay.map(task => (
                                    <MiniTaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </section>
    </div>
  );
}
