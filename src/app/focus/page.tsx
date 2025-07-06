'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { initialAreas } from '@/lib/mock-data';
import type { Task } from '@/lib/types';
import { Play, Pause, RefreshCw, Crosshair } from 'lucide-react';

const FOCUS_DURATION = 25 * 60; // 25 minutes

export default function FocusPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const allTasks = initialAreas.flatMap(area => 
      area.projects.flatMap(project => 
        project.tasks.filter(task => !task.completed)
      )
    );
    setTasks(allTasks);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      const completedTask = tasks.find(t => t.id === selectedTaskId);
      toast({
        title: 'Focus Session Complete!',
        description: `Great job focusing on "${completedTask?.title || 'your task'}". You've earned a break!`,
      });
      setTimeLeft(FOCUS_DURATION);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft, selectedTaskId, tasks, toast]);

  const toggleTimer = useCallback(() => {
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

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(FOCUS_DURATION);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const selectedTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasks]);

  return (
    <div className="container mx-auto max-w-md p-4 sm:p-6 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Focus Mode</h1>
        <p className="text-muted-foreground">Choose a quest and eliminate distractions.</p>
      </header>

      <Card className="w-full bg-card/80 text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
            <Crosshair className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-6xl font-mono font-bold mt-4">
            {formatTime(timeLeft)}
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
              {tasks.length > 0 ? (
                 tasks.map(task => (
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
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Reset</span>
          </Button>
          <Button onClick={toggleTimer} size="lg" className="flex-grow">
            {isActive ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
            {isActive ? 'Pause' : 'Start'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
