
'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
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
  StickyNote,
  Link as LinkIcon,
  Clock,
  ArrowUp,
  Filter,
  ArrowUpDown,
  Trash2,
  LayoutList,
  Columns,
} from 'lucide-react';
import type { Task, Difficulty, Project } from '@/lib/types';
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

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  skillId: z.string().optional(),
});

const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    Hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
    'Very Hard': 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
};

type ProjectSortOption = 'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'date-asc' | 'date-desc';
type TaskFilterOption = 'all' | 'incomplete' | 'completed';
type ViewMode = 'projects' | 'tasks';


export default function AreaDetailPage() {
  const { toast } = useToast();
  const { areaId } = useParams();
  const { getAreaById, getTasksByAreaId, addProject, addTask, skills, areas, updateTaskCompletion, updateTaskDetails, deleteProject } = useQuestData();

  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addTaskState, setAddTaskState] = useState<{ open: boolean; projectId: string | null }>({ open: false, projectId: null });
  const [taskDetailState, setTaskDetailState] = useState<{ open: boolean; projectId: string | null; taskId: string | null; }>({ open: false, projectId: null, taskId: null });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});
  const [sortOption, setSortOption] = useState<ProjectSortOption>('name-asc');
  const [taskFilter, setTaskFilter] = useState<TaskFilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('projects');


  const area = useMemo(() => getAreaById(areaId as string), [areaId, getAreaById]);
  const tasks = useMemo(() => getTasksByAreaId(areaId as string), [areaId, getTasksByAreaId]);

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

  const filteredAreaTasks = useMemo(() => {
    return tasks.filter(task => {
      if (taskFilter === 'all') return true;
      return taskFilter === 'completed' ? task.completed : !task.completed;
    });
  }, [tasks, taskFilter]);

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

  async function onAddTask(data: z.infer<typeof taskSchema>) {
    if (!area || !addTaskState.projectId) return;

    setIsCreatingTask(true);
    try {
        const project = area.projects.find(p => p.id === addTaskState.projectId);
        const projectName = project ? project.name : '';

        const result = await suggestXpValue({ title: data.title, projectContext: projectName });
        const xp = result.xp;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: data.title,
            completed: false,
            xp: xp,
            description: data.description || '',
            notes: '',
            links: '',
            difficulty: xp > 120 ? 'Very Hard' : xp > 80 ? 'Hard' : xp > 40 ? 'Medium' : 'Easy',
            dueDate: data.dueDate?.toISOString(),
            skillId: data.skillId,
            projectId: addTaskState.projectId,
        };
        
        addTask(area.id, addTaskState.projectId, newTask);
        
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

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalXp = tasks.reduce((sum, task) => sum + task.xp, 0);
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  function handleTaskClick(projectId: string, taskId: string) {
    const project = area?.projects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    if (task) {
      setEditableTaskData({
        description: task.description || '',
        notes: task.notes || '',
        links: task.links || '',
      });
    }
    setTaskDetailState({
      open: true,
      projectId,
      taskId,
    });
  }
  
  const { projectId, taskId } = taskDetailState;
  const currentProject = area?.projects.find((p) => p.id === projectId);
  const currentTask = currentProject?.tasks.find((t) => t.id === taskId);
  const currentSkill = skills.find(s => s.id === currentTask?.skillId);

  const handleTaskDataChange = (field: 'description' | 'notes' | 'links', value: string) => {
    setEditableTaskData(prev => ({ ...prev, [field]: value }));
    if (!taskId) return;
    updateTaskDetails(taskId, { [field]: value });
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id, area.id)
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
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} of {totalTasks} quests done
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP Gained</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all quests in this area</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{area.projects.length}</div>
            <p className="text-xs text-muted-foreground">Active projects in this area</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-headline font-semibold capitalize">{viewMode}</h2>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="bg-transparent p-0">
                <TabsTrigger value="projects"><Columns className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="tasks"><LayoutList className="h-4 w-4" /></TabsTrigger>
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
                            <DropdownMenuRadioGroup value={sortOption} onValueChange={(v) => setSortOption(v as ProjectSortOption)}>
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
                        <p>Sort projects</p>
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
                                  onClick={() => handleTaskClick(project.id, task.id)}
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
                          <Button variant="ghost" size="sm" onClick={() => setAddTaskState({open: true, projectId: project.id})}>
                              <PlusCircle className='h-4 w-4 mr-2'/> Add Task
                          </Button>
                      </CardFooter>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <ContextMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className='h-4 w-4 mr-2'/> Delete Project
                          </ContextMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the 
                              <span className="font-bold"> {project.name}</span> project and all its tasks.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
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
                {filteredAreaTasks.map((task: Task) => (
                    <Card
                        key={task.id}
                        className="flex items-center gap-3 p-3 bg-card/80 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleTaskClick(task.projectId, task.id)}
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
                {filteredAreaTasks.length === 0 && (
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a skill" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skills.map(skill => (
                            <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                          ))}
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
                      <FormLabel>Due Date & Time</FormLabel>
                      <FormControl>
                        <DateTimePicker date={field.value} setDate={field.onChange} />
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
    
    <Dialog open={taskDetailState.open} onOpenChange={(open) => setTaskDetailState(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-xl">
          {currentTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline pr-10">{currentTask.title}</DialogTitle>
                <div className="absolute top-6 right-12">
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
                <div className="font-semibold">{area?.name}</div>

                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                <div className="font-semibold">{currentProject?.name}</div>

                {currentSkill && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                    <div className="font-semibold">{currentSkill.name}</div>
                  </>
                )}

                {currentTask.difficulty && (
                    <>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Flame className="h-4 w-4" /> Difficulty</div>
                        <div><Badge variant="outline" className={cn(currentTask.difficulty ? difficultyColors[currentTask.difficulty] : '')}>{currentTask.difficulty}</Badge></div>
                    </>
                )}

                <>
                  <div className="flex items-center gap-2 text-muted-foreground font-medium"><CalendarIcon className="h-4 w-4" /> Due Date</div>
                  <DateTimePicker
                    date={currentTask.dueDate ? new Date(currentTask.dueDate) : undefined}
                    setDate={(date) => {
                      if (!taskId) return;
                      updateTaskDetails(taskId, { dueDate: date?.toISOString() });
                    }}
                  />
                </>

                <div className="flex items-center gap-2 text-muted-foreground font-medium"><ArrowUp className="h-4 w-4" /> XP</div>
                <div className="font-semibold">{currentTask.xp}</div>
                
                {currentTask.focusDuration && currentTask.focusDuration > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Clock className="h-4 w-4" /> Total Hours</div>
                    <div className="font-semibold">
                      {`${Math.floor(currentTask.focusDuration / 3600)}h ${Math.floor((currentTask.focusDuration % 3600) / 60)}m`}
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6 space-y-2 text-sm">
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
