
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuestData } from '@/context/quest-context';
import { Play, Pause, Hourglass, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function FocusPageContents() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const {
    tasks: allTasks,
    addXp,
    getTask,
    updateTaskCompletion,
  } = useQuestData();
  
  const paramTaskId = searchParams.get('taskId');

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(paramTaskId);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const availableTasks = useMemo(
    () => allTasks.filter((task) => !task.completed),
    [allTasks]
  );
  
  // When the param changes, update the selected task
  useEffect(() => {
    setSelectedTaskId(paramTaskId);
    // Reset timer if the task changes while active
    if (isActive) {
        setIsActive(false);
        setTimeElapsed(0);
    }
  }, [paramTaskId]);

  // Stopwatch logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimeElapsed((time) => time + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive]);

  const handleStartPause = useCallback(() => {
    if (!selectedTaskId) {
      toast({
        variant: 'destructive',
        title: 'No Task Selected',
        description: 'Please select a quest to focus on.',
      });
      return;
    }
    setIsActive(!isActive);
  }, [isActive, selectedTaskId, toast]);

  const handleStopwatchFinish = useCallback(() => {
    if (!selectedTaskId || !isActive) return;

    setIsActive(false);
    const result = getTask(selectedTaskId);
    if (!result) return;

    // Mark the task as completed, which also awards base XP and adds focus time
    updateTaskCompletion(selectedTaskId, true, timeElapsed);

    // Calculate bonus XP: 5% of task XP for every 5 minutes of focus
    const minutesFocused = Math.floor(timeElapsed / 60);
    const bonusXp = Math.floor(minutesFocused / 5) * Math.ceil(result.task.xp * 0.05);

    if (bonusXp > 0) {
      addXp(
        bonusXp
      );
       toast({
        title: 'Session Complete!',
        description: `You focused for ${minutesFocused} minutes and earned a bonus of ${bonusXp} XP!`,
      });
    } else {
      toast({
        title: 'Session Ended',
        description: 'Focus for at least 5 minutes to earn bonus XP next time!',
      });
    }

    setTimeElapsed(0);
    setSelectedTaskId(null);
  }, [
    selectedTaskId,
    isActive,
    timeElapsed,
    getTask,
    addXp,
    toast,
    updateTaskCompletion,
  ]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const selectedTask = useMemo(() => {
    return allTasks.find((t) => t.id === selectedTaskId) || null;
  }, [selectedTaskId, allTasks]);

  return (
      <div className="container relative z-10 mx-auto max-w-md p-4 sm:p-6 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-headline font-bold">Focus Zone</h1>
          <p className="text-muted-foreground">
            Pick a quest, start the stopwatch, and get to work.
          </p>
        </header>

        <Card className={cn(
          "w-full text-center mt-4 transition-all duration-500",
          isActive ? 'bg-primary/10 border-primary/20 shadow-lg shadow-primary/10' : 'bg-card/60 backdrop-blur-sm'
        )}>
          <CardHeader>
            <div className={cn(
              "mx-auto rounded-full p-4 w-fit transition-colors",
              isActive ? 'bg-primary/20' : 'bg-muted'
              )}>
              <Hourglass className={cn(
                "h-10 w-10 transition-colors",
                isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
            </div>
            <CardTitle className="text-6xl font-mono font-bold mt-4">
              {formatTime(timeElapsed)}
            </CardTitle>
            <CardDescription>
              {selectedTask
                ? `Focusing on: ${selectedTask.title}`
                : 'Select a quest to begin'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <Select
              onValueChange={setSelectedTaskId}
              value={selectedTaskId || ''}
              disabled={isActive}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a quest to focus on..." />
              </SelectTrigger>
              <SelectContent>
                {availableTasks.length > 0 ? (
                  availableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-tasks" disabled>
                    No available quests to focus on.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 px-6 pb-6">
            <Button onClick={handleStartPause} size="lg" className="flex-grow">
              {isActive ? (
                <Pause className="h-5 w-5 mr-2" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button
              onClick={handleStopwatchFinish}
              variant="destructive"
              size="lg"
              disabled={!isActive}
            >
              <StopCircle className="h-5 w-5 mr-2" />
              Finish
            </Button>
          </CardFooter>
        </Card>
      </div>
  );
}

export default function FocusPage() {
    return (
        <div className="relative min-h-[calc(100vh-8rem)] w-full overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="focus-bg-orb orb1"></div>
                <div className="focus-bg-orb orb2"></div>
                <div className="focus-bg-orb orb3"></div>
                <div className="focus-bg-orb orb4"></div>
            </div>
            <Suspense fallback={<div>Loading...</div>}>
                <FocusPageContents />
            </Suspense>
        </div>
    )
}
