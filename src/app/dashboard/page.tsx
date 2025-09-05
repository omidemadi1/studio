
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
  Copy,
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { iconMap } from '@/lib/icon-map';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CalendarView from '@/components/calendar-view';


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

export default function DashboardPage() {
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
    addSkill,
    deleteTask,
    duplicateTask,
  } = useQuestData();

  const router = useRouter();
  const { toast } = useToast();

  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [sortOption, setSortOption] = useState<SortOption>('date-asc');
  const [taskFilter, setTaskFilter] = useState<TaskFilterOption>('incomplete');
  const [isClient, setIsClient] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [deleteTaskState, setDeleteTaskState] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });


  const selectableSkills = getFlattenedSkills(skills);

  useEffect(() => {
    if (selectedTask) {
        setEditableTaskData(selectedTask);
    }
  }, [selectedTask]);


  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '' },
  });

  const selectedAreaIdForTask = taskForm.watch('areaId');
  const availableProjectsForTask = areas.find(a => a.id === selectedAreaIdForTask)?.projects || [];
  
  useEffect(() => {
    taskForm.setValue('projectId', '');
  }, [selectedAreaIdForTask, taskForm]);

  async function onAddTask(data: z.infer<typeof taskSchema>) {
    const areaId = data.areaId;
    const projectId = data.projectId;

    setIsCreatingTask(true);
    try {
        const area = areas.find(a => a.id === areaId);
        const project = area?.projects.find(p => p.id === projectId);
        const projectName = project ? project.name : '';

        const result = await suggestXpValue({ title: data.title, projectContext: projectName });
        const xp = result.xp;
        const tokens = result.tokens;

        let dueDate = data.dueDate;
        if (!areaId && !projectId && !dueDate) {
            dueDate = new Date();
        }

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: data.title,
            completed: false,
            xp: xp,
            tokens: tokens,
            description: data.description || '',
            difficulty: xp > 120 ? 'Very Hard' : xp > 80 ? 'Hard' : xp > 40 ? 'Medium' : 'Easy',
            dueDate: dueDate?.toISOString(),
            reminder: undefined,
            skillId: data.skillId,
            projectId: projectId,
        };
        
        addTask(newTask, areaId);
        
        taskForm.reset();
        setAddTaskOpen(false);
    } catch (error) {
        console.error("Failed to suggest XP value:", error);
        toast({
            variant: "destructive",
            title: "AI Error",
            description: "Could not determine XP value. Please try again."
        });
    } finally {
        setIsCreatingTask(false);
    }
  }
  
  const skillForm = useForm<{name: string, icon: string}>({
      resolver: zodResolver(z.object({
          name: z.string().min(1, 'Skill name is required.'),
          icon: z.string().min(1, 'An icon is required.')
      })),
      defaultValues: { name: '', icon: '' },
  });

  const onAddSkill = (data: {name: string, icon: string}) => {
    addSkill(data.name, data.icon);
    skillForm.reset();
    setAddSkillOpen(false);
  };


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

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
    };

    const { dialogArea, dialogProject } = useMemo(() => {
        if (!selectedTask) return { dialogArea: null, dialogProject: null };
        for (const a of areas) {
            const p = a.projects.find(p => p.id === selectedTask.projectId);
            if (p) return { dialogArea: a, dialogProject: p };
        }
        return { dialogArea: null, dialogProject: null };
    }, [selectedTask, areas]);
    
    const dialogSkill = useMemo(() => {
        if (!selectedTask?.skillId) return null;
        return findSkillRecursive(skills, selectedTask.skillId);
    }, [selectedTask, skills]);
    
     const handleTaskDataChange = (field: keyof Task, value: string | number | undefined | null) => {
        setEditableTaskData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleDetailBlur = (field: keyof Task) => {
        if(selectedTask) {
            updateTaskDetails(selectedTask.id, { [field]: editableTaskData[field] });
        }
    }

    const handleMarkdownBlur = () => {
        setIsEditingMarkdown(false);
        if (selectedTask && editableTaskData.markdown !== selectedTask.markdown) {
            updateTaskDetails(selectedTask.id, { markdown: editableTaskData.markdown });
        }
    }

    const handleFocusClick = () => {
        if (selectedTask) {
            router.push(`/focus?taskId=${selectedTask.id}`);
        }
    };
     const handleDeleteTask = () => {
        if (!deleteTaskState.task) return;
        deleteTask(deleteTaskState.task.id);
        setDeleteTaskState({ open: false, task: null });
        setSelectedTask(null);
    };

    const handleAreaChange = (newAreaId: string) => {
        if (!selectedTask) return;
        const newArea = areas.find(a => a.id === newAreaId);
        const newProjectId = newArea?.projects[0]?.id || null;
        updateTaskDetails(selectedTask.id, { projectId: newProjectId });
    };

    const handleProjectChange = (newProjectId: string) => {
        if (selectedTask) {
            updateTaskDetails(selectedTask.id, { projectId: newProjectId });
        }
    }
    
    const handleSkillChange = (newSkillId: string) => {
        if (selectedTask) {
            updateTaskDetails(selectedTask.id, { skillId: newSkillId });
        }
    }

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
                    
                    <Tooltip>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    {viewMode === 'list' ? <LayoutList className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuRadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                                    <DropdownMenuRadioItem value="list">
                                        <LayoutList className="mr-2 h-4 w-4" />
                                        <span>List</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="calendar">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        <span>Calendar</span>
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <TooltipContent>
                            <p>View</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </div>
        </div>

        {viewMode === 'list' && (
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)} className='mb-4'>
                <TabsList className='w-full'>
                    <TabsTrigger value="today" className='flex-1'>Today</TabsTrigger>
                    <TabsTrigger value="week" className='flex-1'>This Week</TabsTrigger>
                    <TabsTrigger value="month" className='flex-1'>This Month</TabsTrigger>
                </TabsList>
            </Tabs>
        )}

        {viewMode === 'list' ? (
          <div className="grid gap-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-dashed hover:bg-muted/50"
                onClick={() => setAddTaskOpen(true)}
              >
                  <PlusCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Create New Quest</span>
              </Button>
              {filteredAndSortedTasks.length > 0 ? (
                  filteredAndSortedTasks.map((task: Task) => {
                      const details = taskDetailsMap.get(task.id);
                      return (
                        <ContextMenu key={task.id}>
                          <ContextMenuTrigger>
                            <Card className="bg-card/80 cursor-pointer hover:bg-muted/50" onClick={() => handleTaskClick(task)}>
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
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                              <ContextMenuItem onSelect={() => handleTaskClick(task)}>
                                  <Pencil className="h-4 w-4 mr-2" /> Edit
                              </ContextMenuItem>
                              <ContextMenuItem onSelect={() => duplicateTask(task.id)}>
                                  <Copy className="h-4 w-4 mr-2" /> Duplicate
                              </ContextMenuItem>
                              <ContextMenuItem onSelect={() => setDeleteTaskState({ open: true, task })}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
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
          <CalendarView onAddTaskClick={(date) => setAddTaskOpen(true)} />
        )}
      </section>
    </div>
    <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Quest</DialogTitle>
            <DialogDescription>
              Add a new quest. The AI will assign a fair XP value.
            </DialogDescription>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(onAddTask)} className="space-y-4">
               <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Run 5km" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={taskForm.control}
                  name="areaId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Area</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select an area" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {areas.map(area => (
                              <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={taskForm.control}
                  name="projectId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedAreaIdForTask}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {availableProjectsForTask.map(project => (
                              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>

              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add a description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={taskForm.control}
                  name="skillId"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Skill Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a skill" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectableSkills.map(skill => (
                            <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                          ))}
                            <Separator />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start opacity-70"
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setAddTaskOpen(false);
                                    setAddSkillOpen(true);
                                }}
                            >
                                <PlusCircle className="h-4 w-4 mr-2" /> Add new skill...
                            </Button>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DateTimePicker 
                            date={field.value} 
                            setDate={field.onChange}
                         />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isCreatingTask}>
                    {isCreatingTask ? <Loader2 className="animate-spin" /> : "Create Task" }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create a New Skill</DialogTitle>
                <DialogDescription>
                    Skills help you track progress in different areas of your life.
                </DialogDescription>
            </DialogHeader>
            <Form {...skillForm}>
                <form
                    onSubmit={skillForm.handleSubmit(onAddSkill)}
                    className="space-y-4 py-4"
                >
                    <FormField
                        control={skillForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Skill Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Programming" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={skillForm.control}
                        name="icon"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an icon" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.keys(iconMap).map((iconName) => (
                                            <SelectItem key={iconName} value={iconName}>
                                                {iconName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Create Skill</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
    <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <VisuallyHidden>
                    <DialogTitle>Task Details</DialogTitle>
                    <DialogDescription>View and edit the details of your selected task.</DialogDescription>
                </VisuallyHidden>
            </DialogHeader>
           {selectedTask && (
             <div className="p-6 rounded-lg">
                <header className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Input
                            value={editableTaskData.title || ''}
                            onChange={(e) => handleTaskDataChange('title', e.target.value)}
                            onBlur={() => handleDetailBlur('title')}
                            className="text-2xl lg:text-3xl font-bold font-headline h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                        />
                    </div>
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
                </header>

                <div className="grid grid-cols-[120px_1fr] items-center gap-y-4 gap-x-20 text-sm">

                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                    <Select value={dialogArea?.id || ''} onValueChange={handleAreaChange}>
                        <SelectTrigger className="font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                            <SelectValue placeholder="Select an area" />
                        </SelectTrigger>
                        <SelectContent>
                            {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                    <Select value={dialogProject?.id || ''} onValueChange={handleProjectChange} disabled={!dialogArea}>
                        <SelectTrigger className="font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                            {dialogArea?.projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                    <Select value={dialogSkill?.id || ''} onValueChange={handleSkillChange}>
                        <SelectTrigger className="font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                            <SelectValue placeholder="Select a skill" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectableSkills.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                             <SelectItem value="none">
                                <span className="text-muted-foreground">None</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {selectedTask.difficulty && (
                        <>
                            <div className="flex items-center gap-2 text-muted-foreground font-medium"><Flame className="h-4 w-4" /> Difficulty</div>
                            <div className="text-left"><Badge variant="outline" className={cn(selectedTask.difficulty ? difficultyColors[selectedTask.difficulty] : '')}>{selectedTask.difficulty}</Badge></div>
                        </>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><CalendarIcon className="h-4 w-4" /> Date</div>
                    <DateTimePicker
                        date={selectedTask.dueDate ? new Date(selectedTask.dueDate) : undefined}
                        setDate={(date) => {
                            updateTaskDetails(selectedTask.id, { dueDate: date?.toISOString() });
                        }}
                    />

                    <div className="flex items-center gap-2 text-muted-foreground font-medium self-start pt-2"><AlignLeft className="h-4 w-4" /> Details</div>
                    <div className="text-left -mt-2">
                        <Input
                            value={editableTaskData.description || ''}
                            onChange={(e) => handleTaskDataChange('description', e.target.value)}
                            onBlur={() => handleDetailBlur('description')}
                            placeholder="Add a description..."
                            className="text-sm border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent h-auto"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><ArrowUp className="h-4 w-4" /> XP</div>
                    <div className="font-semibold text-left">{selectedTask.xp + (selectedTask.bonusXp || 0)}</div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><GemIcon className="h-4 w-4" /> Tokens</div>
                    <div className="font-semibold text-left">{selectedTask.tokens}</div>

                    {selectedTask.focusDuration && selectedTask.focusDuration > 0 && (
                        <>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Clock className="h-4 w-4" /> Total Hours</div>
                        <div className="font-semibold text-left">
                            {`${Math.floor(selectedTask.focusDuration / 3600)}h ${Math.floor((selectedTask.focusDuration % 3600) / 60)}m`}
                        </div>
                        </>
                    )}
                </div>

                <Separator className="my-6"/>

                <div
                    onClick={() => setIsEditingMarkdown(true)}
                    className="prose dark:prose-invert min-h-[120px] w-full max-w-none rounded-lg p-2 cursor-text"
                >
                    {isEditingMarkdown ? (
                        <Textarea
                            autoFocus
                            id="markdown-editor"
                            value={editableTaskData.markdown || ''}
                            onChange={(e) => handleTaskDataChange('markdown', e.target.value)}
                            onBlur={handleMarkdownBlur}
                            placeholder="Write your note using Markdown..."
                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[120px] text-base"
                            rows={8}
                        />
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {editableTaskData.markdown || '*Click to add notes...*'}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
           )}
        </DialogContent>
    </Dialog>
     <AlertDialog open={deleteTaskState.open} onOpenChange={(open) => setDeleteTaskState({ open, task: open ? deleteTaskState.task : null })}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the 
                <span className="font-bold"> {deleteTaskState.task?.title}</span> task.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTaskState({open: false, task: null})}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
