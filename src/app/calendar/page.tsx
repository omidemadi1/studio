
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getDay,
} from 'date-fns';
import { useQuestData } from '@/context/quest-context';
import type { Task } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalendarView = 'monthly' | 'weekly';

// Task Card Component
const TaskCard = ({ task, onUpdate }: { task: Task; onUpdate: (taskId: string, completed: boolean) => void }) => {
  const { areas } = useQuestData();

  const projectInfo = useMemo(() => {
    for (const area of areas) {
      const project = area.projects.find(p => p.id === task.projectId);
      if (project) {
        return { name: project.name, areaName: area.name };
      }
    }
    return null;
  }, [areas, task.projectId]);

  return (
    <Card className="bg-background/50 p-2 text-xs rounded-md mb-1 shadow-sm">
      <p className="font-semibold truncate mb-1">{task.title}</p>
      {projectInfo && (
        <div className="flex items-center gap-1 text-muted-foreground mb-2">
          <Folder className="h-3 w-3" />
          <span className="truncate">{projectInfo.name}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          id={`cal-task-${task.id}`}
          checked={task.completed}
          onCheckedChange={(checked) => onUpdate(task.id, !!checked)}
          className="h-4 w-4"
        />
        <label htmlFor={`cal-task-${task.id}`} className="text-xs">Done</label>
      </div>
    </Card>
  );
};

// Draggable Task Wrapper
const DraggableTaskWrapper = ({ task, onUpdate }: { task: Task, onUpdate: (taskId: string, completed: boolean) => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 1000 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...listeners} 
            {...attributes}
            className="relative cursor-grab active:cursor-grabbing"
        >
            <TaskCard task={task} onUpdate={onUpdate} />
        </div>
    );
};


// Main Calendar Page Component
export default function CalendarPage() {
  const { tasks, updateTaskCompletion, updateTaskDetails } = useQuestData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('monthly');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require pointer to move 8px before dragging starts
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const taskId = active.id as string;
        const newDueDateISO = over.id as string;

        const originalTask = tasks.find(t => t.id === taskId);
        if (originalTask?.dueDate && !isSameDay(new Date(originalTask.dueDate), new Date(newDueDateISO))) {
            updateTaskDetails(taskId, { dueDate: newDueDateISO });
        }
    }
  };

  const tasksWithDueDate = useMemo(() => {
    return tasks.filter(task => !!task.dueDate);
  }, [tasks]);

  const handleNext = () => {
    if (view === 'monthly') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handlePrev = () => {
    if (view === 'monthly') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const daysToRender = view === 'monthly' ? monthDays : weekDays;

  const getTasksForDay = useCallback((day: Date) => {
    return tasksWithDueDate.filter(task => task.dueDate && isSameDay(new Date(task.dueDate), day));
  }, [tasksWithDueDate]);
  
  const weekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const DayCellDroppable = ({ day, children }: {day: Date, children: React.ReactNode}) => {
    const { isOver, setNodeRef } = useDroppable({
        id: day.toISOString(),
    });
    return (
        <div ref={setNodeRef} className={cn('h-full p-1 transition-colors', isOver && 'bg-primary/10 rounded-lg')}>
            {children}
        </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="container mx-auto p-4 sm:p-6 flex flex-col">
        <header className="flex items-center justify-between mb-4 flex-shrink-0">
            <h1 className="text-2xl font-headline font-bold">
            {format(currentDate, view === 'monthly' ? 'MMMM yyyy' : 'MMMM')}
            </h1>
            <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
                <TabsList>
                <TabsTrigger value="monthly">Month</TabsTrigger>
                <TabsTrigger value="weekly">Week</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="flex items-center gap-1 rounded-md border p-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="h-8 px-3" onClick={handleToday}>
                Today
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            </div>
        </header>
        
        <div className="grid grid-cols-7 flex-shrink-0">
            {weekHeaders.map(dayHeader => (
                <div key={dayHeader} className="text-center text-xs font-bold text-muted-foreground p-2 border-b">
                    {dayHeader}
                </div>
            ))}
        </div>

        <div className="grid grid-cols-7">
            {daysToRender.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const tasksForDay = getTasksForDay(day);

            return (
                <div
                key={index}
                className={cn(
                    'border-t border-r flex flex-col min-h-[120px]',
                    {
                    'bg-muted/10': !isCurrentMonth && view === 'monthly',
                    'border-l': getDay(day) === 0,
                    }
                )}
                >
                    <DayCellDroppable day={day}>
                        <div
                            className={cn(
                            'text-right text-xs mb-1 px-1',
                            {
                                'text-muted-foreground': !isCurrentMonth && view === 'monthly',
                                'text-primary font-bold': isToday,
                            }
                            )}
                        >
                            {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                            {tasksForDay.map(task => (
                                <DraggableTaskWrapper key={task.id} task={task} onUpdate={updateTaskCompletion} />
                            ))}
                        </div>
                    </DayCellDroppable>
                </div>
            );
            })}
        </div>
        </div>
    </DndContext>
  );
}
