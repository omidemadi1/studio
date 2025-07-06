'use client';

import React, { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { useQuestData } from '@/context/quest-context';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';

export default function CalendarPage() {
  const { tasks, updateTaskCompletion } = useQuestData();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const tasksWithDueDate = useMemo(() => {
    return tasks.filter(task => !!task.dueDate);
  }, [tasks]);
  
  const scheduledDays = useMemo(() => {
    return tasksWithDueDate.map(task => new Date(task.dueDate!));
  }, [tasksWithDueDate]);

  const tasksForSelectedDay = useMemo(() => {
    if (!date) return [];
    return tasksWithDueDate.filter(task => isSameDay(new Date(task.dueDate!), date));
  }, [date, tasksWithDueDate]);

  const scheduledModifier = { scheduled: scheduledDays };
  const modifierStyles = {
    scheduled: {
      fontWeight: 700,
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Calendar</h1>
        <p className="text-muted-foreground">Your quests on a timeline.</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-auto flex justify-center">
          <Card className="bg-card/80 p-0 md:p-2 inline-block">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              modifiers={scheduledModifier}
              modifiersStyles={modifierStyles}
              className="p-0"
            />
          </Card>
        </div>

        <div className="flex-1 w-full">
            <Card className="bg-card/80">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">
                        Tasks for {date ? format(date, 'MMMM d, yyyy') : '...'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {tasksForSelectedDay.length > 0 ? (
                        <ul className="space-y-3">
                            {tasksForSelectedDay.map((task: Task) => (
                            <li
                                key={task.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                            >
                                <Checkbox
                                    id={`cal-${task.id}`}
                                    checked={task.completed}
                                    onCheckedChange={(checked) =>
                                        updateTaskCompletion(task.id, !!checked)
                                    }
                                    className="w-5 h-5"
                                />
                                <span className="flex-1 text-sm font-medium leading-none">
                                    {task.title}
                                </span>
                                {task.xp > 0 && 
                                  <span className="text-xs font-bold text-primary">
                                      +{task.xp} XP
                                  </span>
                                }
                            </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="py-6 text-center text-muted-foreground">
                           <p>No quests scheduled for this day.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
