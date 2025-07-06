'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuestData } from '@/context/quest-context';
import { Play, Pause, RefreshCw, Crosshair, TimerIcon, Hourglass, StopCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FOCUS_DURATION = 25 * 60; // 25 minutes

export default function FocusPage() {
  const { toast } = useToast();
  const { tasks: allTasks, addXp, getTask } = useQuestData();
  
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const availableTasks = useMemo(() => allTasks.filter(task => !task.completed), [allTasks]);

  // Combined timer/stopwatch logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (mode === 'timer') {
          if (timeLeft > 0) {
            setTimeLeft((time) => time - 1);
          }
        } else {
          setTimeElapsed((time) => time + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, mode, timeLeft]);

  // Effect for timer completion
  useEffect(() => {
    if (mode === 'timer' && timeLeft === 0 && isActive) {
      setIsActive(false);
      const result = getTask(selectedTaskId!);
      if (result?.task) {
          addXp(result.task.xp);
          toast({
            title: 'Focus Session Complete!',
            description: `Great job! You earned ${result.task.xp} XP for focusing on "${result.task.title}".`,
          });
      }
      setTimeLeft(FOCUS_DURATION);
    }
  }, [mode, timeLeft, isActive, selectedTaskId, addXp, getTask, toast]);

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

  const handleReset = useCallback(() => {
    setIsActive(false);
    setTimeLeft(FOCUS_DURATION);
  }, []);
  
  const handleStopwatchFinish = useCallback(() => {
    if (!selectedTaskId || !isActive) return;
    
    setIsActive(false);
    const result = getTask(selectedTaskId);
    if (!result?.task) return;

    // Calculate bonus XP: 5% of task XP for every 5 minutes of focus
    const minutesFocused = Math.floor(timeElapsed / 60);
    const bonusXp = Math.floor(minutesFocused / 5) * Math.ceil(result.task.xp * 0.05);

    if (bonusXp > 0) {
        addXp(bonusXp, `You focused for ${minutesFocused} minutes and earned a bonus of ${bonusXp} XP!`);
    } else {
        toast({ title: 'Session Ended', description: 'Focus for at least 5 minutes to earn bonus XP!'});
    }

    setTimeElapsed(0);

  }, [selectedTaskId, isActive, timeElapsed, getTask, addXp, toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const selectedTask = useMemo(() => {
    return allTasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, allTasks]);

  const handleModeChange = (value: string) => {
    setIsActive(false);
    setMode(value as 'timer' | 'stopwatch');
    setTimeLeft(FOCUS_DURATION);
    setTimeElapsed(0);
  }

  return (
    <div className="container mx-auto max-w-md p-4 sm:p-6 flex flex-col items-center min-h-[calc(100vh-12rem)]">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Focus Zone</h1>
        <p className="text-muted-foreground">Choose a mode, pick a quest, and begin.</p>
      </header>
      
      <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timer"><TimerIcon className="mr-2 h-4 w-4"/> Pomodoro</TabsTrigger>
            <TabsTrigger value="stopwatch"><Hourglass className="mr-2 h-4 w-4"/> Stopwatch</TabsTrigger>
        </TabsList>
        <Card className="w-full bg-card/80 text-center mt-4">
            <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                    <Crosshair className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-6xl font-mono font-bold mt-4">
                    {mode === 'timer' ? formatTime(timeLeft) : formatTime(timeElapsed)}
                </CardTitle>
                <CardDescription>
                    {selectedTask ? `Focusing on: ${selectedTask.title}` : 'Select a quest to begin'}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
                <Select onValueChange={setSelectedTaskId} value={selectedTaskId || ''} disabled={isActive}>
                    <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a quest to focus on..." />
                    </SelectTrigger>
                    <SelectContent>
                    {availableTasks.length > 0 ? (
                        availableTasks.map(task => (
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
                    {isActive ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                    {isActive ? 'Pause' : 'Start'}
                </Button>
                {mode === 'timer' ? (
                    <Button onClick={handleReset} variant="outline" size="lg" disabled={isActive}>
                        <RefreshCw className="h-5 w-5" />
                        <span className="sr-only">Reset</span>
                    </Button>
                ) : (
                    <Button onClick={handleStopwatchFinish} variant="destructive" size="lg" disabled={!isActive}>
                        <StopCircle className="h-5 w-5 mr-2"/>
                        Finish
                    </Button>
                )}
            </CardFooter>
        </Card>
      </Tabs>
    </div>
  );
}
