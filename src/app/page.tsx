

'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Task, Difficulty, Area, Project } from '@/lib/types';
import { iconMap } from '@/lib/icon-map';
import {
  Swords,
  PlusCircle,
  Loader2,
  Command,
  Folder,
  Tag,
  Flame,
  Calendar as CalendarIcon,
  AlignLeft,
  ArrowUp,
  StickyNote,
  Link as LinkIcon,
  Clock,
  Briefcase,
  Sparkles,
  LayoutList,
  Crosshair,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import { suggestXpValue } from '@/ai/flows/suggest-xp-value';
import { useQuestData } from '@/context/quest-context';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { suggestSmartTasks } from '@/ai/flows/suggest-smart-tasks';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalendarView from '@/components/calendar-view';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';


const areaSchema = z.object({
  name: z.string().min(1, 'Area name is required.'),
});

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  description: z.string().optional(),
  notes: z.string().optional(),
  links: z.string().optional(),
  dueDate: z.date().optional(),
  skillId: z.string().optional(),
  areaId: z.string({ required_error: 'Please select an area.'}),
  projectId: z.string({ required_error: 'Please select a project.'}),
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

type ViewMode = 'list' | 'calendar';

export default function QuestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { areas, user, skills, updateTaskCompletion, addTask, addArea, addProject, updateTaskDetails, tasks, deleteArea, updateArea, addSkill, deleteTask, deleteProject, updateProject } = useQuestData();

  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [editAreaState, setEditAreaState] = useState<{ open: boolean; area: Area | null }>({ open: false, area: null });
  const [deleteAreaState, setDeleteAreaState] = useState<{ open: boolean; area: Area | null }>({ open: false, area: null });
  const [addProjectState, setAddProjectState] = useState<{ open: boolean; areaId: string | null }>({ open: false, areaId: null });
  const [editProjectState, setEditProjectState] = useState<{ open: boolean, project: Project | null }>({ open: false, project: null });
  const [deleteProjectState, setDeleteProjectState] = useState<{ open: boolean, project: Project | null }>({ open: false, project: null });
  const [addTaskState, setAddTaskState] = useState<{ open: boolean; areaId: string | null; projectId: string | null; date?: Date }>({ open: false, areaId: null, projectId: null });
  const [taskDetailState, setTaskDetailState] = useState<{ open: boolean; areaId: string | null; projectId: string | null; taskId: string | null; }>({ open: false, areaId: null, projectId: null, taskId: null });
  const [deleteTaskState, setDeleteTaskState] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [addSkillOpen, setAddSkillOpen] = useState(false);


  useEffect(() => {
    async function fetchSuggestions() {
      setLoadingSuggestions(true);
      try {
        const completedTasks = tasks.filter(t => t.completed);
        const pastPerformance = completedTasks.length > 0 
          ? `Completed ${completedTasks.length} tasks. Recently completed: ${completedTasks.slice(0, 5).map(t => t.title).join(', ')}`
          : "No tasks completed yet.";
        
        const currentSkills = skills.map(s => `${s.name} (Lvl ${s.level})`).join(', ');
        
        const result = await suggestSmartTasks({
          pastPerformance,
          currentSkills,
          userPreferences: 'Looking for a mix of tasks to improve all skills.'
        });

        const taskLines = result.suggestedTasks
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-') || line.startsWith('*'))
          .map(line => line.substring(1).trim());

        setSuggestedTasks(taskLines);
      } catch (error) {
        console.error("Failed to fetch smart tasks:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }
    fetchSuggestions();
  }, [tasks, skills]);


  const areaForm = useForm<z.infer<typeof areaSchema>>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: '' },
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
      notes: '',
      links: '',
    },
  });
  
  const skillForm = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: '', icon: '' },
  });
  
  useEffect(() => {
    if (addTaskState.open && addTaskState.date) {
        taskForm.setValue('dueDate', addTaskState.date);
    }
     if (addTaskState.open) {
      taskForm.reset();
      if (addTaskState.areaId) taskForm.setValue('areaId', addTaskState.areaId);
      if (addTaskState.projectId) taskForm.setValue('projectId', addTaskState.projectId);
      if (addTaskState.date) taskForm.setValue('dueDate', addTaskState.date);
    }
  }, [addTaskState, taskForm]);

  const selectedAreaIdForTask = taskForm.watch('areaId');
  const availableProjects = areas.find(a => a.id === selectedAreaIdForTask)?.projects || [];


  function onAddArea(data: z.infer<typeof areaSchema>) {
    addArea(data.name);
    areaForm.reset();
    setAddAreaOpen(false);
  }

  function onEditArea(data: z.infer<typeof areaSchema>) {
    if (!editAreaState.area) return;
    updateArea(editAreaState.area.id, data.name);
    setEditAreaState({ open: false, area: null });
    areaForm.reset();
  }

  const handleDeleteArea = () => {
    if (!deleteAreaState.area) return;
    deleteArea(deleteAreaState.area.id);
    setDeleteAreaState({ open: false, area: null });
  };

  function onAddProject(data: z.infer<typeof projectSchema>) {
    if (!addProjectState.areaId) return;
    addProject(addProjectState.areaId, data.name);
    projectForm.reset();
    setAddProjectState({ open: false, areaId: null });
  }
  
  function onEditProject(data: z.infer<typeof projectSchema>) {
    if (!editProjectState.project) return;
    updateProject(editProjectState.project.id, data.name);
    setEditProjectState({ open: false, project: null });
    projectForm.reset();
  }
  
  const handleDeleteProject = () => {
    if (!deleteProjectState.project) return;
    deleteProject(deleteProjectState.project.id, deleteProjectState.project.areaId);
    setDeleteProjectState({ open: false, project: null });
  };

  const onAddSkill = (data: z.infer<typeof skillSchema>) => {
    addSkill(data.name, data.icon);
    skillForm.reset();
    setAddSkillOpen(false);
  };

  async function onAddTask(data: z.infer<typeof taskSchema>) {
    const areaId = data.areaId;
    const projectId = data.projectId;

    if (!areaId || !projectId) return;

    setIsCreatingTask(true);
    try {
        const area = areas.find(a => a.id === areaId);
        const project = area?.projects.find(p => p.id === projectId);
        const projectName = project ? project.name : '';

        const result = await suggestXpValue({ title: data.title, projectContext: projectName });
        const xp = result.xp;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: data.title,
            completed: false,
            xp: xp,
            description: data.description || '',
            notes: data.notes || '',
            links: data.links || '',
            difficulty: xp > 120 ? 'Very Hard' : xp > 80 ? 'Hard' : xp > 40 ? 'Medium' : 'Easy',
            dueDate: data.dueDate?.toISOString(),
            skillId: data.skillId,
            projectId: projectId,
        };
        
        addTask(areaId, projectId, newTask);
        
        taskForm.reset();
        setAddTaskState({ open: false, areaId: null, projectId: null });
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

  function handleTaskClick(areaId: string, projectId: string, taskId: string) {
    const area = areas.find((a) => a.id === areaId);
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
      areaId,
      projectId,
      taskId,
    });
  }

  const handleDeleteTask = () => {
    if (!deleteTaskState.task) return;
    deleteTask(deleteTaskState.task.id);
    setDeleteTaskState({ open: false, task: null });
  };

  const { areaId, projectId, taskId } = taskDetailState;
  const currentArea = areas.find((a) => a.id === areaId);
  const currentProject = currentArea?.projects.find((p) => p.id === projectId);
  const currentTask = currentProject?.tasks.find((t) => t.id === taskId);
  const currentSkill = skills.find(s => s.id === currentTask?.skillId);

  const handleTaskDataChange = (field: 'description' | 'notes' | 'links', value: string) => {
    setEditableTaskData(prev => ({ ...prev, [field]: value }));
    if (!taskId) return;
    updateTaskDetails(taskId, { [field]: value });
  };
  
  const handleFocusClick = () => {
    if (!taskId) return;
    setTaskDetailState(prev => ({ ...prev, open: false }));
    router.push(`/focus?taskId=${taskId}`);
  };


  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-bold text-primary">Questify</h1>
        <Avatar>
          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </header>
      
      <section className="mb-8">
        <h2 className="text-2xl font-headline font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            Daily Missions
        </h2>
        <Card className="bg-card/80">
            <CardContent className="p-6">
                {loadingSuggestions ? (
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-5 w-2/3" />
                    </div>
                ) : suggestedTasks.length > 0 ? (
                    <ul className="space-y-3">
                        {suggestedTasks.slice(0,3).map((task, index) => (
                            <li key={index} className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-sm font-medium">{task}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-sm text-center">No missions for today. Check back later!</p>
                )}
            </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-headline font-semibold">Your Quests</h2>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList>
                      <TabsTrigger value="list"><LayoutList className="h-4 w-4" /></TabsTrigger>
                      <TabsTrigger value="calendar"><CalendarIcon className="h-4 w-4" /></TabsTrigger>
                  </TabsList>
              </Tabs>
              <Button variant="ghost" size="icon" onClick={() => setAddAreaOpen(true)}>
                  <PlusCircle className="h-6 h-6 text-primary" />
                  <span className="sr-only">Add Area</span>
              </Button>
            </div>
        </div>

        {viewMode === 'list' ? (
          <Accordion type="multiple" defaultValue={areas.map(a => a.id)} className="w-full">
            {areas.map((area) => {
              const AreaIcon = iconMap[area.icon] || Briefcase;
              return (
              <ContextMenu key={area.id}>
                <ContextMenuTrigger>
                    <AccordionItem value={area.id}>
                    <AccordionTrigger className="text-xl font-headline hover:no-underline">
                      <Link href={`/areas/${area.id}`} className="flex items-center gap-3">
                          <AreaIcon className="w-6 h-6 text-accent" />
                          {area.name}
                      </Link>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Accordion type="multiple" defaultValue={area.projects.map(p => p.id)} className="w-full pl-4 border-l-2 border-primary/20">
                        {area.projects.map((project) => (
                          <ContextMenu key={project.id}>
                            <ContextMenuTrigger>
                              <AccordionItem value={project.id} className="border-b-0">
                                <AccordionTrigger className="font-semibold hover:no-underline">
                                  {project.name}
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                  <ul className="space-y-3">
                                    {project.tasks.map((task: Task) => (
                                      <ContextMenu key={task.id}>
                                        <ContextMenuTrigger>
                                          <li
                                            className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => handleTaskClick(area.id, project.id, task.id)}
                                          >
                                            <div onClick={(e) => e.stopPropagation()}>
                                              <Checkbox
                                                id={task.id}
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
                                            <span className="text-xs font-bold text-primary">
                                              +{task.xp} XP
                                            </span>
                                          </li>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent>
                                          <ContextMenuItem onSelect={() => handleTaskClick(area.id, project.id, task.id)}>
                                            <Pencil className="h-4 w-4 mr-2" /> View/Edit Details
                                          </ContextMenuItem>
                                          <ContextMenuItem onSelect={() => setDeleteTaskState({ open: true, task })}>
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Task
                                          </ContextMenuItem>
                                        </ContextMenuContent>
                                      </ContextMenu>
                                    ))}
                                    <li className="flex justify-center mt-2">
                                          <Button variant="ghost" size="sm" onClick={() => setAddTaskState({ open: true, areaId: area.id, projectId: project.id })}>
                                              <PlusCircle className="h-4 w-4 mr-2" /> Add Task
                                          </Button>
                                    </li>
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            </ContextMenuTrigger>
                             <ContextMenuContent>
                                <ContextMenuItem onSelect={() => {
                                    projectForm.setValue('name', project.name);
                                    setEditProjectState({ open: true, project });
                                }}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit Project
                                </ContextMenuItem>
                                <ContextMenuItem onSelect={() => setDeleteProjectState({ open: true, project })}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Project
                                </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                        <div className="flex justify-center mt-2">
                              <Button variant="ghost" onClick={() => setAddProjectState({ open: true, areaId: area.id })}>
                                  <PlusCircle className="h-5 w-5 mr-2" /> Add Project
                              </Button>
                          </div>
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onSelect={() => {
                        areaForm.setValue('name', area.name);
                        setEditAreaState({ open: true, area });
                    }}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit Area
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => setDeleteAreaState({ open: true, area })}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Area
                    </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )})}
          </Accordion>
        ) : (
          <CalendarView onAddTaskClick={(date) => setAddTaskState({ open: true, areaId: null, projectId: null, date })}/>
        )}
      </section>

      <Dialog open={addAreaOpen} onOpenChange={setAddAreaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Area</DialogTitle>
            <DialogDescription>
                Areas help you organize your quests, like "Work" or "Health".
            </DialogDescription>
          </DialogHeader>
          <Form {...areaForm}>
            <form onSubmit={areaForm.handleSubmit(onAddArea)} className="space-y-4">
              <FormField
                control={areaForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fitness" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Area</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={editAreaState.open} onOpenChange={(open) => setEditAreaState({ open, area: open ? editAreaState.area : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>
                Update the name of your area.
            </DialogDescription>
          </DialogHeader>
          <Form {...areaForm}>
            <form onSubmit={areaForm.handleSubmit(onEditArea)} className="space-y-4">
              <FormField
                control={areaForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fitness" {...field} />
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

    <AlertDialog open={deleteAreaState.open} onOpenChange={(open) => setDeleteAreaState({ open, area: open ? deleteAreaState.area : null })}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the 
                <span className="font-bold"> {deleteAreaState.area?.name}</span> area and all its projects and tasks.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAreaState({open: false, area: null})}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArea}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

      <Dialog open={addProjectState.open} onOpenChange={(open) => setAddProjectState({ open, areaId: open ? addProjectState.areaId : null })}>
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
      
      <Dialog open={addTaskState.open} onOpenChange={(open) => setAddTaskState({ open, areaId: open ? addTaskState.areaId : null, projectId: open ? addTaskState.projectId : null })}>
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
              
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={taskForm.control}
                  name="areaId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Area</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!!addTaskState.areaId}>
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={!!addTaskState.projectId || !selectedAreaIdForTask}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {availableProjects.map(project => (
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a skill" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skills.map(skill => (
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
                                    setAddTaskState(prev => ({ ...prev, open: false }));
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
          {currentTask && areaId && projectId && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-2xl font-bold font-headline">{currentTask.title}</DialogTitle>
                <div className='flex items-center gap-2'>
                  <TooltipProvider>
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
              <div className="grid grid-cols-[120px_1fr] items-start gap-y-4 gap-x-4 text-sm mt-4">
                
                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                <div className="font-semibold">{currentArea?.name}</div>

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
    </div>
  );
}
