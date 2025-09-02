

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { WeeklyMission } from '@/lib/types';
import {
  Sparkles,
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


export default function QuestsPage() {
  const { 
    user, 
    weeklyMissions,
    updateWeeklyMissionCompletion,
    maybeGenerateWeeklyMissions,
  } = useQuestData();

  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    async function fetchMissions() {
      setLoadingSuggestions(true);
      await maybeGenerateWeeklyMissions();
      setLoadingSuggestions(false);
    }
    fetchMissions();
  }, [maybeGenerateWeeklyMissions]);


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
    </div>
  );
}

    