
'use client';

import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Task, WeeklyMission, Area, Project, Skill, Difficulty } from '@/lib/types';
import {
  Sparkles,
  Swords,
  LayoutList,
  Calendar as CalendarIcon,
  Folder,
  Filter,
  ArrowUpDown,
  Command,
  Tag,
  Flame,
  AlignLeft,
  Clock,
  ArrowUp,
  Crosshair,
  Pencil,
  Trash2,
  Expand,
  Loader2,
  PlusCircle,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { GemIcon } from '@/components/icons/gem-icon';
import { suggestXpValue } from '@/ai/flows/suggest-xp-value';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';


type ViewMode = 'list' | 'calendar';
type TimeRange = 'today' | 'week' | 'month';
type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'xp-asc' | 'xp-desc' | 'area-asc' | 'project-asc' | 'skill-asc';
type TaskFilterOption = 'all' | 'incomplete' | 'completed';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  skillId: z.string().optional(),
  areaId: z.string().optional(),
  projectId: z.string().optional(),
});

const difficultyColors: Record<Difficulty, string> = {
    Easy: 'text-green-400',
    Medium: 'text-yellow-400',
    Hard: 'text-orange-400',
    'Very Hard': 'text-red-400',
};

const findSkillRecursive = (skills: Skill[], skillId: string): Skill | undefined => {
    for (const skill of skills) {
        if (skill.id === skillId) return skill;
        if (skill.subSkills) {
            const found = findSkillRecursive(skill.subSkills, skillId);
            if (found) return found;
        }
    }
    return undefined;
};

// Helper to flatten skills for the select dropdown
const getFlattenedSkills = (skills: Skill[]): Skill[] => {
    const flattened: Skill[] = [];
    const traverse = (skill: Skill) => {
        // A skill is selectable if it has no sub-skills
        if (!skill.subSkills || skill.subSkills.length === 0) {
            flattened.push(skill);
        }
        if (skill.subSkills) {
            skill.subSkills.forEach(traverse);
        }
    };
    skills.forEach(traverse);
    return flattened;
};

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
    areas,
    skills,
    updateTaskCompletion,
    updateWeeklyMissionCompletion,
    maybeGenerateWeeklyMissions,
    updateTaskDetails,
    addTask,
  } = useQuestData();

  const router = useRouter();
  const { toast } = useToast();

  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [sortOption, setSortOption] = useState<SortOption>('date-asc');
  const [taskFilter, setTaskFilter] = useState<TaskFilterOption>('incomplete');
  const [isClient, setIsClient] = useState(false);
  const [taskDetailState, setTaskDetailState] = useState<{ open: boolean; taskId: string | null; isExpanded: boolean; }>({ open: false, taskId: null, isExpanded: false });
  const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const selectableSkills = getFlattenedSkills(skills);

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '' },
  });

  const selectedAreaIdForTask = taskForm.watch('areaId');
  const availableProjects = areas.find(a => a.id === selectedAreaIdForTask)?.projects || [];

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    async function fetchMissions() {
      setLoadingSuggestions(true);
      await maybeGenerateWeeklyMissions();
      setLoadingSuggestions(false);
    }
    if (isClient) {
      fetchMissions();
    }
  }, [maybeGenerateWeeklyMissions, isClient]);

  const taskDetailsMap = useMemo(() => {
    const map = new Map<string, { area?: Area, project?: Project, skill?: Skill }>();
    tasks.forEach(task => {
        let area, project, skill;
        if (task.projectId) {
            for (const a of areas) {
                const p = a.projects.find(proj => proj.id === task.projectId);
                if (p) {
                    area = a;
                    project = p;
                    break;
                }
            }
        }
        if (task.skillId) {
            const findSkill = (skills: Skill[], skillId: string): Skill | undefined => {
                for (const s of skills) {
                    if (s.id === skillId) return s;
                    if (s.subSkills) {
                        const found = findSkill(s.subSkills, skillId);
                        if (found) return found;
                    }
                }
                return undefined;
            }
            skill = findSkill(skills, task.skillId);
        }
        map.set(task.id, { area, project, skill });
    });
    return map;
  }, [tasks, areas, skills]);

  const filteredAndSortedTasks = useMemo(() => {
    if (!isClient) return [];
    
    const now = new Date();
    let interval: Interval;
    switch (timeRange) {
        case 'today':
            interval = { start: now, end: now };
            break;
        case 'week':
            interval = { start: startOfWeek(now), end: endOfWeek(now) };
            break;
        case 'month':
            interval = { start: startOfMonth(now), end: endOfMonth(now) };
            break;
    }

    let filteredTasks = tasks.filter(task => {
        const isMatchingStatus = taskFilter === 'all' || (taskFilter === 'completed' ? task.completed : !task.completed);
        
        if (!isMatchingStatus) return false;

        if (timeRange === 'today') {
            return task.dueDate && isToday(new Date(task.dueDate));
        }
        
        return task.dueDate && isWithinInterval(new Date(task.dueDate), interval);
    });

    const getTaskDate = (task: Task, direction: 'asc' | 'desc'): number => {
        if (!task.dueDate) {
            return direction === 'asc' ? Infinity : -Infinity;
        }
        return new Date(task.dueDate).getTime();
    };

    switch (sortOption) {
        case 'date-asc':
            filteredTasks.sort((a, b) => getTaskDate(a, 'asc') - getTaskDate(b, 'asc'));
            break;
        case 'date-desc':
            filteredTasks.sort((a, b) => getTaskDate(b, 'desc') - getTaskDate(a, 'desc'));
            break;
        case 'name-asc':
            filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredTasks.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'xp-asc':
            filteredTasks.sort((a, b) => a.xp - b.xp);
            break;
        case 'xp-desc':
            filteredTasks.sort((a, b) => b.xp - a.xp);
            break;
        case 'area-asc':
            filteredTasks.sort((a, b) => {
                const areaA = taskDetailsMap.get(a.id)?.area?.name || 'zzzz';
                const areaB = taskDetailsMap.get(b.id)?.area?.name || 'zzzz';
                return areaA.localeCompare(areaB);
            });
            break;
        case 'project-asc':
            filteredTasks.sort((a, b) => {
                const projectA = taskDetailsMap.get(a.id)?.project?.name || 'zzzz';
                const projectB = taskDetailsMap.get(b.id)?.project?.name || 'zzzz';
                return projectA.localeCompare(projectB);
            });
            break;
        case 'skill-asc':
             filteredTasks.sort((a, b) => {
                const skillA = taskDetailsMap.get(a.id)?.skill?.name || 'zzzz';
                const skillB = taskDetailsMap.get(b.id)?.skill?.name || 'zzzz';
                return skillA.localeCompare(skillB);
            });
            break;
    }

    return filteredTasks;
  }, [tasks, isClient, timeRange, taskFilter, sortOption, taskDetailsMap]);


  const weekDays = useMemo(() => {
    if (!isClient) return [];
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    return eachDayOfInterval({ start, end });
  }, [isClient]);

  const monthDays = useMemo(() => {
    if (!isClient) return [];
    const start = startOfWeek(startOfMonth(new Date()));
    const end = endOfWeek(endOfMonth(new Date()));
    return eachDayOfInterval({ start, end });
  }, [isClient]);
  

  const getTasksForDay = useCallback((day: Date) => {
    return tasks.filter(task => task.dueDate && isSameDay(new Date(task.dueDate), day));
  }, [tasks]);

  const calendarDays = useMemo(() => {
    if (timeRange === 'week') return weekDays;
    if (timeRange === 'month') return monthDays;
    return [];
  }, [timeRange, weekDays, monthDays]);

    const handleTaskClick = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setEditableTaskData({
            title: task.title ?? '',
            description: task.description ?? '',
            markdown: task.markdown ?? '',
          });
        }
        setTaskDetailState(prev => ({ ...prev, open: true, taskId }));
    };

    const handleTaskDataChange = (field: keyof Task, value: string | number | undefined) => {
        if (!taskDetailState.taskId) return;
        setEditableTaskData(prev => ({ ...prev, [field]: value }));
        updateTaskDetails(taskDetailState.taskId, { [field]: value });
    };

    const handleFocusClick = () => {
        if (!taskDetailState.taskId) return;
        setTaskDetailState(prev => ({ ...prev, open: false }));
        router.push(`/focus?taskId=${taskDetailState.taskId}`);
    };
    
    const { taskId } = taskDetailState;
    const currentTask = tasks.find(t => t.id === taskId);
    const { area, project } = useMemo(() => {
        if (!currentTask?.projectId) return { area: null, project: null };
        for (const a of areas) {
            const p = a.projects.find(p => p.id === currentTask.projectId);
            if (p) return { area: a, project: p };
        }
        return { area: null, project: null };
    }, [currentTask, areas]);
    
    const currentTaskSkill = useMemo(() => {
        if (!currentTask?.skillId) return null;
        return findSkillRecursive(skills, currentTask.skillId);
    }, [currentTask, skills]);

  return (
      <>
    <div className="container mx-auto max-w-4xl p-4 sm-p-6">
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
                Quests
            </h2>
            <div className="flex items-center gap-2">
                 <TooltipProvider>
                    <Tooltip>
                        <DropdownMenu>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuRadioGroup value={taskFilter} onValueChange={(v) => setTaskFilter(v as TaskFilterOption)}>
                                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="incomplete">Incomplete</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <TooltipContent>
                            <p>Filter tasks</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <DropdownMenu>
                            <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <ArrowUpDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuRadioGroup value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                                <DropdownMenuRadioItem value="date-asc">Due Date</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="name-asc">Name</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="xp-desc">XP</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="area-asc">Area</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="project-asc">Project</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="skill-asc">Skill</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <TooltipContent>
                            <p>Sort tasks</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <TabsList className='hidden sm:inline-flex'>
                        <TabsTrigger value="list"><LayoutList className="h-4 w-4" /></TabsTrigger>
                        <TabsTrigger value="calendar"><CalendarIcon className="h-4 w-4" /></TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </div>

        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)} className='mb-4'>
            <TabsList className='w-full'>
                <TabsTrigger value="today" className='flex-1'>Today</TabsTrigger>
                <TabsTrigger value="week" className='flex-1'>This Week</TabsTrigger>
                <TabsTrigger value="month" className='flex-1'>This Month</TabsTrigger>
            </TabsList>
        </Tabs>

        {(viewMode === 'list' || timeRange === 'today') ? (
          <div className="space-y-3">
              {filteredAndSortedTasks.length > 0 ? (
                  filteredAndSortedTasks.map((task: Task) => {
                      const details = taskDetailsMap.get(task.id);
                      return (
                      <Card key={task.id} className="bg-card/80 cursor-pointer hover:bg-muted/50" onClick={() => handleTaskClick(task.id)}>
                          <CardContent className="p-3 flex items-center gap-4">
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        id={`task-list-${task.id}`}
                                        checked={task.completed}
                                        onCheckedChange={(checked) => updateTaskCompletion(task.id, !!checked)}
                                        className="w-5 h-5"
                                    />
                                </div>
                              <div className="flex-1">
                                  <label
                                      htmlFor={`task-list-${task.id}`}
                                      className={cn("text-sm font-medium leading-none cursor-pointer", task.completed && "line-through text-muted-foreground")}
                                  >
                                      {task.title}
                                  </label>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                      {details?.area && <div className="flex items-center gap-1"><Command className="h-3 w-3" />{details.area.name}</div>}
                                      {details?.project && <div className="flex items-center gap-1"><Folder className="h-3 w-3" />{details.project.name}</div>}
                                      {details?.skill && <div className="flex items-center gap-1"><Tag className="h-3 w-3" />{details.skill.name}</div>}
                                  </div>
                              </div>
                              <span className="text-xs font-bold text-primary whitespace-nowrap">
                                  +{task.xp} XP
                              </span>
                          </CardContent>
                      </Card>
                      )
                  })
              ) : (
                  <Card className="bg-card/80">
                      <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground text-sm">No quests scheduled for this period. Time for a side quest?</p>
                          <Button variant="link" asChild className='mt-2'>
                            <Link href="/manager">Go to Manager</Link>
                          </Button>
                      </CardContent>
                  </Card>
              )}
          </div>
        ) : (
            <div className="grid grid-cols-7 border-t border-l">
                {calendarDays.map(day => {
                    const tasksForDay = getTasksForDay(day);
                    const isCurrentDay = isToday(day);
                    const isCurrentMonth = timeRange === 'month' ? isSameDay(startOfMonth(new Date()), startOfMonth(day)) : true;
                    return (
                        <div key={day.toISOString()} className={cn("border-r border-b p-2 min-h-[100px]", isCurrentDay && "bg-muted/30", !isCurrentMonth && "bg-muted/10")}>
                            <div className={cn("text-center text-xs font-semibold mb-2", isCurrentDay && "text-primary", !isCurrentMonth && "text-muted-foreground")}>
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
        <Dialog open={taskDetailState.open} onOpenChange={(open) => setTaskDetailState(prev => ({ ...prev, open }))}>
            <DialogContent className={cn("sm:max-w-md", taskDetailState.isExpanded && "sm:max-w-3xl")}>
            {currentTask && (
                <>
                <DialogHeader className="flex flex-row items-start justify-between gap-4">
                    <VisuallyHidden>
                        <DialogTitle>{editableTaskData.title || ''}</DialogTitle>
                        <DialogDescription>Details for task: {editableTaskData.title || ''}. You can edit the details below.</DialogDescription>
                    </VisuallyHidden>
                    <Input
                        value={editableTaskData.title || ''}
                        onChange={(e) => handleTaskDataChange('title', e.target.value)}
                        className="text-xl font-bold font-headline h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <div className='flex items-center gap-2 flex-shrink-0'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setTaskDetailState(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}>
                                        <Expand className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Expand</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleFocusClick} disabled={currentTask.completed}>
                                    <Crosshair className="h-5 w-5" />
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Focus on this task</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Checkbox
                            checked={currentTask.completed}
                            onCheckedChange={(checked) =>
                                updateTaskCompletion(currentTask.id, !!checked)
                            }
                            className="w-5 h-5"
                        />
                    </div>
                </DialogHeader>
                
                <div className="grid grid-cols-[120px_1fr] items-center gap-y-4 gap-x-4 text-sm mt-4">
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                    <div className="font-semibold text-left">{area?.name}</div>

                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                    <div className="font-semibold text-left">{project?.name}</div>

                    {currentTaskSkill && (
                    <>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                        <div className="font-semibold text-left">{currentTaskSkill.name}</div>
                    </>
                    )}

                    {currentTask.difficulty && (
                        <>
                            <div className="flex items-center gap-2 text-muted-foreground font-medium"><Flame className="h-4 w-4" /> Difficulty</div>
                            <div className="text-left"><Badge variant="outline" className={cn(currentTask.difficulty ? difficultyColors[currentTask.difficulty] : '')}>{currentTask.difficulty}</Badge></div>
                        </>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground font-medium">Date</div>
                    <DateTimePicker
                        date={currentTask.dueDate ? new Date(currentTask.dueDate) : undefined}
                        setDate={(date) => {
                            if (!taskId) return;
                            updateTaskDetails(taskId, { dueDate: date?.toISOString() });
                        }}
                    />
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium self-start pt-2"><AlignLeft className="h-4 w-4" /> Details</div>
                    <div className="text-left">
                        <Textarea
                            value={editableTaskData.description || ''}
                            onChange={(e) => handleTaskDataChange('description', e.target.value)}
                            placeholder="Add a description..."
                            className="text-sm border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 -ml-2"
                            rows={2}
                        />
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><ArrowUp className="h-4 w-4" /> XP</div>
                    <div className="font-semibold text-left">{currentTask.xp + (currentTask.bonusXp || 0)}</div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><GemIcon className="h-4 w-4" /> Tokens</div>
                    <div className="font-semibold text-left">{currentTask.tokens}</div>

                    {currentTask.focusDuration && currentTask.focusDuration > 0 && (
                    <>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Clock className="h-4 w-4" /> Total Hours</div>
                        <div className="font-semibold text-left">
                        {`${Math.floor(currentTask.focusDuration / 3600)}h ${Math.floor((currentTask.focusDuration % 3600) / 60)}m`}
                        </div>
                    </>
                    )}
                </div>
                <Separator />
                <div>
                  <Label htmlFor="markdown-editor" className="text-muted-foreground font-medium">Markdown Details</Label>
                  <Textarea
                    id="markdown-editor"
                    value={editableTaskData.markdown || ''}
                    onChange={(e) => handleTaskDataChange('markdown', e.target.value)}
                    placeholder="Add detailed notes in Markdown..."
                    className="mt-2"
                    rows={taskDetailState.isExpanded ? 15 : 5}
                  />
                </div>
                </>
            )}
            </DialogContent>
        </Dialog>
    </>
  );
}
