
'use client';

import React, { useMemo, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuestData } from '@/context/quest-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { iconMap } from '@/lib/icon-map';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  ArrowLeft,
  LayoutGrid,
  TrendingUp,
  Target,
  PlusCircle,
  Loader2,
  Folder,
  Command,
  Tag,
  Flame,
  Calendar as CalendarIcon,
  AlignLeft,
  Clock,
  ArrowUp,
  Filter,
  ArrowUpDown,
  Trash2,
  LayoutList,
  Columns,
  ListChecks,
  Crosshair,
  Pencil,
  Check,
  Copy,
  Archive,
  Expand,
} from 'lucide-react';
import type { Task, Difficulty, Project, Skill, Area } from '@/lib/types';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { useToast } from '@/hooks/use-toast';
import { suggestXpValue } from '@/ai/flows/suggest-xp-value';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { GemIcon } from '@/components/icons/gem-icon';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

const areaSchema = z.object({
  name: z.string().min(1, 'Area name is required.'),
  icon: z.string().min(1, 'An icon is required.'),
});

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  projectId: z.string({ required_error: 'Please select a project.'}),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  reminder: z.number().optional(),
  skillId: z.string().optional(),
});

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required.'),
  icon: z.string().min(1, 'An icon is required.'),
});

const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    Hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
    'Very Hard': 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
};

type SortOption = 'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'date-asc' | 'date-desc';
type TaskFilterOption = 'all' | 'incomplete' | 'completed';
type ViewMode = 'projects' | 'tasks';

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

export default function AreaDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { areaId } = useParams();
  const { getAreaById, getTasksByAreaId, addProject, addTask, skills, areas, updateTaskCompletion, updateTaskDetails, deleteProject, updateProject, addSkill, duplicateProject, deleteTask, updateArea, deleteArea, archiveArea } = useQuestData();

  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [editProjectState, setEditProjectState] = useState<{ open: boolean, project: Project | null }>({ open: false, project: null });
  const [deleteProjectState, setDeleteProjectState] = useState<{ open: boolean, project: Project | null }>({ open: false, project: null });
  const [addTaskState, setAddTaskState] = useState<{ open: boolean; projectId: string | null }>({ open: false, projectId: null });
  const [deleteTaskState, setDeleteTaskState] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [taskFilter, setTaskFilter] = useState<TaskFilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [editAreaOpen, setEditAreaOpen] = useState(false);
  const [deleteAreaOpen, setDeleteAreaOpen] = useState(false);
  const [archiveAreaOpen, setArchiveAreaOpen] = useState(false);


  const selectableSkills = getFlattenedSkills(skills);
  const area = useMemo(() => getAreaById(areaId as string), [areaId, getAreaById]);
  const tasks = useMemo(() => getTasksByAreaId(areaId as string), [areaId, getTasksByAreaId]);

  const areaForm = useForm<z.infer<typeof areaSchema>>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: '', icon: '' },
  });

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '' },
  });

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });
  
  const skillForm = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: '', icon: '' },
  });

  const onAddSkill = (data: z.infer<typeof skillSchema>) => {
    addSkill(data.name, data.icon);
    skillForm.reset();
    setAddSkillOpen(false);
  };

  const sortedAndFilteredTasks = useMemo(() => {
    let filteredTasks = tasks.filter(task => {
        if (taskFilter === 'all') return true;
        return taskFilter === 'completed' ? task.completed : !task.completed;
    });

    const getTaskDate = (task: Task, direction: 'asc' | 'desc'): number => {
        if (!task.dueDate) {
            return direction === 'asc' ? Infinity : -Infinity;
        }
        return new Date(task.dueDate).getTime();
    };

    switch (sortOption) {
        case 'name-asc':
            filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredTasks.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'progress-asc': // Sort by completion status: incomplete first
            filteredTasks.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
            break;
        case 'progress-desc': // Sort by completion status: completed first
            filteredTasks.sort((a, b) => (b.completed ? 1 : 0) - (a.completed ? 1 : 0));
            break;
        case 'date-asc':
            filteredTasks.sort((a, b) => getTaskDate(a, 'asc') - getTaskDate(b, 'asc'));
            break;
        case 'date-desc':
            filteredTasks.sort((a, b) => getTaskDate(b, 'desc') - getTaskDate(a, 'desc'));
            break;
    }
    
    return filteredTasks;
  }, [tasks, taskFilter, sortOption]);


  const sortedAndFilteredProjects = useMemo(() => {
    if (!area) return [];

    const getProjectProgress = (project: Project) => {
        const totalTasks = project.tasks.length;
        if (totalTasks === 0) return 0;
        const completedTasks = project.tasks.filter(t => t.completed).length;
        return (completedTasks / totalTasks) * 100;
    };

    const getProjectDate = (project: Project, direction: 'asc' | 'desc'): number => {
        const dueDates = project.tasks
            .map(t => t.dueDate ? new Date(t.dueDate).getTime() : null)
            .filter((d): d is number => d !== null);
        if (dueDates.length === 0) {
            return direction === 'asc' ? Infinity : -Infinity;
        }
        return direction === 'asc' ? Math.min(...dueDates) : Math.max(...dueDates);
    };
    
    let sorted = [...area.projects];

    switch (sortOption) {
        case 'name-asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sorted.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'progress-asc':
            sorted.sort((a, b) => getProjectProgress(a) - getProjectProgress(b));
            break;
        case 'progress-desc':
            sorted.sort((a, b) => getProjectProgress(b) - getProjectProgress(a));
            break;
        case 'date-asc':
            sorted.sort((a, b) => getProjectDate(a, 'asc') - getProjectDate(b, 'asc'));
            break;
        case 'date-desc':
            sorted.sort((a, b) => getProjectDate(b, 'desc') - getProjectDate(a, 'desc'));
            break;
    }

    return sorted;
  }, [area, sortOption]);

  if (!area) {
    notFound();
  }
  
  function onAddProject(data: z.infer<typeof projectSchema>) {
    if (!area) return;
    addProject(area.id, data.name);
    projectForm.reset();
    setAddProjectOpen(false);
  }

  function onEditProject(data: z.infer<typeof projectSchema>) {
    if (!editProjectState.project) return;
    updateProject(editProjectState.project.id, data.name);
    setEditProjectState({ open: false, project: null });
    projectForm.reset();
  }

  const onEditArea = (data: z.infer<typeof areaSchema>) => {
    if (!area) return;
    updateArea(area.id, data.name, data.icon);
    setEditAreaOpen(false);
    toast({ title: "Area Updated!", description: "Your area has been successfully updated." });
  };

  const onArchiveArea = () => {
    if (!area) return;
    archiveArea(area.id, true);
    setArchiveAreaOpen(false);
    toast({ title: "Area Archived", description: `The area "${area.name}" has been archived.` });
    router.push('/');
  };
  
  const onDeleteArea = () => {
      if (!area) return;
      deleteArea(area.id);
      setDeleteAreaOpen(false);
      toast({ title: "Area Deleted", description: `The area "${area.name}" has been removed.`, variant: "destructive" });
      router.push('/');
  };


  async function onAddTask(data: z.infer<typeof taskSchema>) {
    if (!area) return;
    
    const projectId = data.projectId;
    if (!projectId) {
        toast({
            variant: "destructive",
            title: "Project Not Selected",
            description: "Please select a project for the task."
        });
        return;
    }


    setIsCreatingTask(true);
    try {
        const project = area.projects.find(p => p.id === projectId);
        const projectName = project ? project.name : '';

        const result = await suggestXpValue({ title: data.title, projectContext: projectName });
        const xp = result.xp;
        const tokens = result.tokens;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: data.title,
            completed: false,
            xp: xp,
            tokens: tokens,
            description: data.description || '',
            difficulty: xp > 120 ? 'Very Hard' : xp > 80 ? 'Hard' : xp > 40 ? 'Medium' : 'Easy',
            dueDate: data.dueDate?.toISOString(),
            reminder: data.reminder,
            skillId: data.skillId,
            projectId: projectId,
        };
        
        addTask(newTask, area.id);
        
        taskForm.reset();
        setAddTaskState({ open: false, projectId: null });
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

  const AreaIcon = iconMap[area.icon] || Briefcase;

  const completedTasks = tasks.filter((task) => task.completed);
  const totalTasks = tasks.length;
  const totalXp = completedTasks.reduce((sum, task) => sum + task.xp, 0);
  const totalTokens = completedTasks.reduce((sum, task) => sum + task.tokens, 0);
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  function handleTaskClick(taskId: string) {
    router.push(`/tasks/${taskId}`);
  }

  const handleDeleteProject = () => {
    if (!deleteProjectState.project) return;
    deleteProject(deleteProjectState.project.id, area.id)
    setDeleteProjectState({ open: false, project: null });
  };
  
  const handleDeleteTask = () => {
    if (!deleteTaskState.task) return;
    deleteTask(deleteTaskState.task.id);
    setDeleteTaskState({ open: false, task: null });
  };

  return (
    <>
      <div className="container mx-auto max-w-4xl p-4 sm:p-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className='flex items-center gap-4'>
              <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                  <ArrowLeft />
              </Link>
              </Button>
              <div className="flex items-center gap-3">
              <AreaIcon className="w-8 h-8 text-accent" />
              <h1 className="text-3xl font-headline font-bold">{area.name}</h1>
              </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => {
                            areaForm.reset({ name: area.name, icon: area.icon });
                            setEditAreaOpen(true);
                        }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Edit Area</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <AlertDialog open={archiveAreaOpen} onOpenChange={setArchiveAreaOpen}>
                            <AlertDialogTrigger asChild>
                               <Button variant="outline" size="icon">
                                  <Archive className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to archive this area?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Archiving this area will hide it from your main quest list. You can view archived areas later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onArchiveArea}>Archive</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Archive Area</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AlertDialog open={deleteAreaOpen} onOpenChange={setDeleteAreaOpen}>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" size="icon">
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the
                                  <span className="font-bold"> {area.name}</span> area.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onDeleteArea}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Delete Area</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionPercentage}%</div>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">XP Gained</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{area.projects.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
            </CardContent>
          </Card>
           <Card className="bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Earned</CardTitle>
              <GemIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-headline font-semibold capitalize">{viewMode}</h2>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className="bg-transparent p-0 h-auto">
                  <TabsTrigger value="projects" className="p-1.5 hover:bg-muted rounded-md data-[state=active]:bg-muted"><Columns className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="tasks" className="p-1.5 hover:bg-muted rounded-md data-[state=active]:bg-muted"><LayoutList className="h-4 w-4" /></TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
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
                              <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="progress-desc">Progress (High-Low)</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="progress-asc">Progress (Low-High)</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="date-asc">Due Date (Soonest)</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="date-desc">Due Date (Latest)</DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                      </DropdownMenu>
                       <TooltipContent>
                          <p>Sort {viewMode}</p>
                      </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                      <TooltipTrigger asChild>
                           <Button onClick={() => setAddProjectOpen(true)} size="icon" variant="ghost">
                              <PlusCircle className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                       <TooltipContent>
                          <p>Add project</p>
                      </TooltipContent>
                  </Tooltip>
              </TooltipProvider>

            </div>
          </div>
          {viewMode === 'projects' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAndFilteredProjects.map((project) => {
                const projectTasks = project.tasks;
                const filteredTasks = projectTasks.filter(task => {
                    if (taskFilter === 'all') return true;
                    return taskFilter === 'completed' ? task.completed : !task.completed;
                });
                const completedProjectTasks = projectTasks.filter(t => t.completed).length;
                const projectCompletion = projectTasks.length > 0 ? (completedProjectTasks / projectTasks.length) * 100 : 0;
                return (
                <ContextMenu key={project.id}>
                  <ContextMenuTrigger>
                    <Card className="bg-card/80 overflow-hidden flex flex-col">
                        <CardHeader>
                        <CardTitle className="text-xl font-bold font-headline">{project.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{completedProjectTasks} / {projectTasks.length} Done</span>
                            <Progress value={projectCompletion} className="w-24 h-2" />
                        </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                        <ul className="space-y-2">
                            {filteredTasks.map((task: Task) => (
                                <li
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleTaskClick(task.id)}
                                >
                                    <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        id={`task-${task.id}`}
                                        checked={task.completed}
                                        onCheckedChange={(checked) =>
                                            updateTaskCompletion(task.id, !!checked)
                                        }
                                        className="w-5 h-5"
                                    />
                                    </div>
                                    <span
                                    className={cn("flex-1 text-sm font-medium leading-none", task.completed && "line-through text-muted-foreground")}
                                    >
                                    {task.title}
                                    </span>
                                    <span className="text-xs font-bold text-primary">+{task.xp} XP</span>
                                </li>
                            ))}
                            {filteredTasks.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    {taskFilter === 'all' ? 'No tasks in this project yet.' : `No ${taskFilter} tasks.`}
                                </p>
                            )}
                        </ul>
                        </CardContent>
                        <CardFooter className='bg-muted/30 p-2 justify-center'>
                            <Button variant="ghost" size="sm" onClick={() => {
                                taskForm.reset({projectId: project.id});
                                setAddTaskState({open: true, projectId: project.id});
                            }}>
                                <PlusCircle className='h-4 w-4 mr-2'/> Add Task
                            </Button>
                        </CardFooter>
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                      <ContextMenuItem onSelect={() => {
                          projectForm.setValue('name', project.name);
                          setEditProjectState({ open: true, project });
                      }}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => duplicateProject(project.id)}>
                          <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => setDeleteProjectState({ open: true, project })}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                )
              })}
              {area.projects.length === 0 && (
                  <Card className="bg-card/80 border-2 border-dashed md:col-span-2">
                    <CardContent className="p-10 text-center">
                        <p className="text-muted-foreground mb-4">No projects here yet. Ready to start a new quest line?</p>
                        <Button variant="outline" onClick={() => setAddProjectOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>
                    </CardContent>
                  </Card>
              )}
            </div>
          ) : (
              <div className="space-y-2">
                  <Card 
                      className="flex items-center gap-3 p-3 bg-card/80 hover:bg-muted/50 transition-colors cursor-pointer border-2 border-dashed"
                      onClick={() => {
                        taskForm.reset();
                        setAddTaskState({open: true, projectId: null});
                      }}
                  >
                      <PlusCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Add new Task</span>
                  </Card>
                  {sortedAndFilteredTasks.map((task: Task) => (
                      <Card
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-card/80 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleTaskClick(task.id)}
                      >
                          <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                              id={`task-list-${task.id}`}
                              checked={task.completed}
                              onCheckedChange={(checked) => updateTaskCompletion(task.id, !!checked)}
                              className="w-5 h-5"
                          />
                          </div>
                          <span className={cn("flex-1 text-sm font-medium leading-none", task.completed && "line-through text-muted-foreground")}>
                          {task.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                              {area.projects.find(p => p.id === task.projectId)?.name}
                          </span>
                          <Badge variant="outline" className={cn(task.difficulty ? difficultyColors[task.difficulty || 'Easy'] : '')}>{task.difficulty}</Badge>
                          <span className="text-xs font-bold text-primary">+{task.xp} XP</span>
                      </Card>
                  ))}
                  {sortedAndFilteredTasks.length === 0 && (
                      <Card className="bg-card/80 border-2 border-dashed">
                          <CardContent className="p-10 text-center">
                              <p className="text-muted-foreground">
                                  {taskFilter === 'all' ? 'No tasks in this area yet.' : `No ${taskFilter} tasks found.`}
                              </p>
                          </CardContent>
                      </Card>
                  )}
              </div>
          )}
        </section>
      </div>
      
      <Dialog open={editAreaOpen} onOpenChange={setEditAreaOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Area</DialogTitle>
                <DialogDescription>
                    Change the name or icon for your area.
                </DialogDescription>
            </DialogHeader>
            <Form {...areaForm}>
                <form onSubmit={areaForm.handleSubmit(onEditArea)} className="space-y-4 py-4">
                    <FormField
                        control={areaForm.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Area Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Fitness" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={areaForm.control}
                        name="icon"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Icon</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" className="w-full justify-start" type="button">
                                            {field.value ? (
                                                <>
                                                    {React.createElement(iconMap[field.value], { className: 'h-4 w-4 mr-2' })}
                                                    {field.value}
                                                </>
                                            ) : 'Select an icon'}
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2 max-w-[240px] max-h-[200px] overflow-y-auto">
                                    <div className="grid grid-cols-6 gap-1">
                                        {Object.keys(iconMap).map((iconName) => {
                                            const IconComponent = iconMap[iconName];
                                            return (
                                                <Button
                                                    key={iconName}
                                                    variant="ghost"
                                                    size="icon"
                                                    type="button"
                                                    onClick={() => field.onChange(iconName)}
                                                    className={cn("relative", field.value === iconName && "bg-accent text-accent-foreground")}
                                                >
                                                    <IconComponent className="h-5 w-5" />
                                                    {field.value === iconName && <Check className="absolute bottom-0 right-0 h-3 w-3 text-white bg-green-500 rounded-full p-0.5" />}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>


      <Dialog open={addProjectOpen} onOpenChange={setAddProjectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Project</DialogTitle>
              <DialogDescription>
                Projects live inside Areas and group related tasks.
              </DialogDescription>
            </DialogHeader>
            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(onAddProject)} className="space-y-4">
                <FormField
                  control={projectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q3 Goals" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create Project</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
      </Dialog>

      <Dialog open={editProjectState.open} onOpenChange={(open) => setEditProjectState({ open, project: open ? editProjectState.project : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the name of your project.
              </DialogDescription>
            </DialogHeader>
            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(onEditProject)} className="space-y-4">
                <FormField
                  control={projectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q3 Goals" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
      </Dialog>

      <AlertDialog open={deleteProjectState.open} onOpenChange={(open) => setDeleteProjectState({ open, project: open ? deleteProjectState.project : null })}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the 
                  <span className="font-bold"> {deleteProjectState.project?.name}</span> project and all its tasks.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteProjectState({open: false, project: null})}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProject}>Continue</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>


      <Dialog open={addTaskState.open} onOpenChange={(open) => setAddTaskState({ open, projectId: open ? addTaskState.projectId : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Task</DialogTitle>
              <DialogDescription>
                Add a new quest to your project. The AI will assign a fair XP value.
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

                
                  <FormField
                      control={taskForm.control}
                      name="projectId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Project</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ''} value={field.value || ''}>
                                  <FormControl>
                                      <SelectTrigger disabled={!!addTaskState.projectId}>
                                          <SelectValue placeholder="Select a project" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {area.projects.map(project => (
                                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                
                
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
                                      setAddTaskState(prev => ({...prev, open: false}));
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
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" className="w-full justify-start" type="button">
                                    {field.value ? (
                                        <>
                                            {React.createElement(iconMap[field.value], { className: 'h-4 w-4 mr-2' })}
                                            {field.value}
                                        </>
                                    ) : 'Select an icon'}
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 max-w-[240px] max-h-[200px] overflow-y-auto">
                            <div className="grid grid-cols-6 gap-1">
                                {Object.keys(iconMap).map((iconName) => {
                                    const IconComponent = iconMap[iconName];
                                    return (
                                        <Button
                                            key={iconName}
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => field.onChange(iconName)}
                                            className={cn("relative", field.value === iconName && "bg-accent text-accent-foreground")}
                                        >
                                            <IconComponent className="h-5 w-5" />
                                            {field.value === iconName && <Check className="absolute bottom-0 right-0 h-3 w-3 text-white bg-green-500 rounded-full p-0.5" />}
                                        </Button>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
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
