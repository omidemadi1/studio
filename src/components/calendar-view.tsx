

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
import type { Task, Difficulty } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  Command,
  Tag,
  Flame,
  Calendar as CalendarIcon,
  AlignLeft,
  StickyNote,
  Link as LinkIcon,
  Clock,
  ArrowUp,
  PlusCircle,
  Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { GemIcon } from '@/components/icons/gem-icon';
import { Input } from './ui/input';

type CalendarViewMode = 'monthly' | 'weekly';

interface CalendarViewProps {
  onAddTaskClick: (date: Date) => void;
}

const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    Hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
    'Very Hard': 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
};

// Task Card Component
const TaskCard = ({ task }: { task: Task; }) => {
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
    <Card className={cn("p-2 text-xs rounded-md mb-1 shadow-sm", task.completed ? 'bg-muted/50' : 'bg-background/50')}>
      <p className={cn("font-semibold truncate mb-1", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
      {projectInfo && (
        <div className="flex items-center gap-1 text-muted-foreground mb-2">
          <Folder className="h-3 w-3" />
          <span className="truncate">{projectInfo.name}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-xs font-bold text-primary/80">+{task.xp} XP</span>
      </div>
    </Card>
  );
};

// Draggable Task Wrapper
const DraggableTaskWrapper = ({ task, onClick }: { task: Task, onClick: () => void }) => {
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
            onClick={onClick}
            className="relative cursor-grab active:cursor-grabbing"
        >
            <TaskCard task={task} />
        </div>
    );
};

// Day Cell Droppable
const DayCellDroppable = ({ day, children }: {day: Date, children: React.ReactNode}) => {
    const { isOver, setNodeRef } = useDroppable({
        id: day.toISOString(),
    });
    return (
        <div ref={setNodeRef} className={cn('h-full p-1 transition-colors relative group', isOver && 'bg-primary/10 rounded-lg')}>
            {children}
        </div>
    )
}

// Main Calendar View Component
export default function CalendarView({ onAddTaskClick }: CalendarViewProps) {
  const router = useRouter();
  const { tasks, areas, skills, updateTaskCompletion, updateTaskDetails } = useQuestData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewMode>('monthly');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});


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
        const newDueDateString = over.id as string;

        const originalTask = tasks.find(t => t.id === taskId);
        if (!originalTask) return;

        const newDueDate = new Date(newDueDateString);
        
        if (originalTask.dueDate) {
            const originalDate = new Date(originalTask.dueDate);
            newDueDate.setHours(originalDate.getHours());
            newDueDate.setMinutes(originalDate.getMinutes());
        }

        // Only update if the day is different
        if (!originalTask.dueDate || !isSameDay(new Date(originalTask.dueDate), newDueDate)) {
            updateTaskDetails(taskId, { dueDate: newDueDate.toISOString() });
        }
    }
  };
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditableTaskData({
        title: task.title,
        description: task.description || '',
        notes: task.notes || '',
        links: task.links || '',
    });
  };

  const handleTaskDataChange = (field: keyof Task, value: string) => {
    if (!selectedTask) return;
    setEditableTaskData(prev => ({ ...prev, [field]: value }));
    updateTaskDetails(selectedTask.id, { [field]: value });
  };
  
  const handleFocusClick = () => {
    if (!selectedTask) return;
    setSelectedTask(null);
    router.push(`/focus?taskId=${selectedTask.id}`);
  };

  const { project, area } = useMemo(() => {
    if (!selectedTask) return { project: null, area: null };
    for (const currentArea of areas) {
      const p = currentArea.projects.find(p => p.id === selectedTask.projectId);
      if (p) {
        return { project: p, area: currentArea };
      }
    }
    return { project: null, area: null };
  }, [selectedTask, areas]);

  const skill = useMemo(() => {
    if (!selectedTask?.skillId) return null;
    return skills.find(s => s.id === selectedTask.skillId);
  }, [selectedTask, skills]);

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

  return (
    <>
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col">
            <header className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-headline font-bold">
                {format(currentDate, view === 'monthly' ? 'MMMM yyyy' : 'MMMM')}
                </h2>
                <div className="flex items-center gap-2">
                <Tabs value={view} onValueChange={(v) => setView(v as CalendarViewMode)}>
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
                            <div className="flex justify-between items-center">
                                <span
                                    className={cn(
                                    'text-right text-xs px-1',
                                    {
                                        'text-muted-foreground': !isCurrentMonth && view === 'monthly',
                                        'text-primary font-bold': isToday,
                                    }
                                    )}
                                >
                                    {format(day, 'd')}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onAddTaskClick(day)}
                                >
                                    <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <div className="space-y-1">
                                {tasksForDay.map(task => (
                                    <DraggableTaskWrapper key={task.id} task={task} onClick={() => handleTaskClick(task)} />
                                ))}
                            </div>
                        </DayCellDroppable>
                    </div>
                );
                })}
            </div>
        </div>
    </DndContext>
    <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-xl">
          {selectedTask && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between gap-4">
                <VisuallyHidden>
                    <DialogTitle>{editableTaskData.title}</DialogTitle>
                    <DialogDescription>Details for task: {editableTaskData.title}. You can edit the details below.</DialogDescription>
                </VisuallyHidden>
                 <Input
                    value={editableTaskData.title}
                    onChange={(e) => handleTaskDataChange('title', e.target.value)}
                    className="text-2xl font-bold font-headline h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleFocusClick} disabled={selectedTask.completed}>
                            <Crosshair className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Focus on this task</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                   <Checkbox
                        checked={selectedTask.completed}
                        onCheckedChange={(checked) =>
                            updateTaskCompletion(selectedTask.id, !!checked)
                        }
                        className="w-5 h-5"
                    />
                </div>
              </DialogHeader>
              <div className="grid grid-cols-[120px_1fr] items-center gap-y-4 gap-x-4 text-sm mt-4">
                
                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                <div className="font-semibold">{area?.name}</div>

                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                <div className="font-semibold">{project?.name}</div>

                {skill && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                    <div className="font-semibold">{skill.name}</div>
                  </>
                )}

                {selectedTask.difficulty && (
                    <>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Flame className="h-4 w-4" /> Difficulty</div>
                        <div><Badge variant="outline" className={cn(selectedTask.difficulty ? difficultyColors[selectedTask.difficulty] : '')}>{selectedTask.difficulty}</Badge></div>
                    </>
                )}

                <>
                  <div className="flex items-center gap-2 text-muted-foreground font-medium"><CalendarIcon className="h-4 w-4" /> Due Date</div>
                  <DateTimePicker
                    date={selectedTask.dueDate ? new Date(selectedTask.dueDate) : undefined}
                    setDate={(date) => {
                      if (!selectedTask.id) return;
                      updateTaskDetails(selectedTask.id, { dueDate: date?.toISOString() });
                    }}
                  />
                </>

                <div className="flex items-center gap-2 text-muted-foreground font-medium"><ArrowUp className="h-4 w-4" /> XP</div>
                <div className="font-semibold">{selectedTask.xp}</div>

                <div className="flex items-center gap-2 text-muted-foreground font-medium"><GemIcon className="h-4 w-4" /> Tokens</div>
                <div className="font-semibold">{selectedTask.tokens}</div>
                
                {selectedTask.focusDuration && selectedTask.focusDuration > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Clock className="h-4 w-4" /> Total Hours</div>
                    <div className="font-semibold">
                      {`${Math.floor(selectedTask.focusDuration / 3600)}h ${Math.floor((selectedTask.focusDuration % 3600) / 60)}m`}
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground font-medium mb-1"><AlignLeft className="h-4 w-4" /> Details</div>
                  <Textarea
                    value={editableTaskData.description}
                    onChange={(e) => handleTaskDataChange('description', e.target.value)}
                    placeholder="Add a description..."
                    className="text-sm border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={3}
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground font-medium mb-1"><StickyNote className="h-4 w-4" /> Notes</div>
                  <Textarea
                    value={editableTaskData.notes}
                    onChange={(e) => handleTaskDataChange('notes', e.target.value)}
                    placeholder="Add notes..."
                    className="text-sm border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground font-medium mb-1"><LinkIcon className="h-4 w-4" /> Links</div>
                  <Textarea
                    value={editableTaskData.links}
                    onChange={(e) => handleTaskDataChange('links', e.target.value)}
                    placeholder="Add links, one per line..."
                    className="text-sm border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

    