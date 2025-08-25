
'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Task, Difficulty } from '@/lib/types';
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
});


const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    Hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
    'Very Hard': 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
};

type ViewMode = 'list' | 'calendar';

export default function QuestsPage() {
  const { toast } = useToast();
  const { areas, user, skills, updateTaskCompletion, addTask, addArea, addProject, updateTaskDetails, tasks } = useQuestData();

  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [addProjectState, setAddProjectState] = useState<{ open: boolean; areaId: string | null }>({ open: false, areaId: null });
  const [addTaskState, setAddTaskState] = useState<{ open: boolean; areaId: string | null; projectId: string | null }>({ open: false, areaId: null, projectId: null });
  const [taskDetailState, setTaskDetailState] = useState<{ open: boolean; areaId: string | null; projectId: string | null; taskId: string | null; }>({ open: false, areaId: null, projectId: null, taskId: null });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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

  function onAddArea(data: z.infer<typeof areaSchema>) {
    addArea(data.name);
    areaForm.reset();
    setAddAreaOpen(false);
  }

  function onAddProject(data: z.infer<typeof projectSchema>) {
    if (!addProjectState.areaId) return;
    addProject(addProjectState.areaId, data.name);
    projectForm.reset();
    setAddProjectState({ open: false, areaId: null });
  }

  async function onAddTask(data: z.infer<typeof taskSchema>) {
    if (!addTaskState.areaId || !addTaskState.projectId) return;

    setIsCreatingTask(true);
    try {
        const area = areas.find(a => a.id === addTaskState.areaId);
        const project = area?.projects.find(p => p.id === addTaskState.projectId);
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
            projectId: addTaskState.projectId,
        };
        
        addTask(addTaskState.areaId, addTaskState.projectId, newTask);
        
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
                  <PlusCircle className="h-6 w-6 text-primary" />
                  <span className="sr-only">Add Area</span>
              </Button>
            </div>
        </div>

        {viewMode === 'list' ? (
          <Accordion type="multiple" defaultValue={areas.map(a => a.id)} className="w-full">
            {areas.map((area) => {
              const AreaIcon = iconMap[area.icon] || Briefcase;
              return (
              <AccordionItem key={area.id} value={area.id}>
                <AccordionTrigger className="text-xl font-headline hover:no-underline">
                  <Link href={`/areas/${area.id}`} className="flex items-center gap-3">
                      <AreaIcon className="w-6 h-6 text-accent" />
                      {area.name}
                  </Link>
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="multiple" defaultValue={area.projects.map(p => p.id)} className="w-full pl-4 border-l-2 border-primary/20">
                    {area.projects.map((project) => (
                      <AccordionItem key={project.id} value={project.id} className="border-b-0">
                        <AccordionTrigger className="font-semibold hover:no-underline">
                          {project.name}
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <ul className="space-y-3">
                            {project.tasks.map((task: Task) => (
                              <li
                                key={task.id}
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
                            ))}
                            <li className="flex justify-center mt-2">
                                  <Button variant="ghost" size="sm" onClick={() => setAddTaskState({ open: true, areaId: area.id, projectId: project.id })}>
                                      <PlusCircle className="h-4 w-4 mr-2" /> Add Task
                                  </Button>
                            </li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    <div className="flex justify-center mt-2">
                          <Button variant="ghost" onClick={() => setAddProjectState({ open: true, areaId: area.id })}>
                              <PlusCircle className="h-5 w-5 mr-2" /> Add Project
                          </Button>
                      </div>
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            )})}
          </Accordion>
        ) : (
          <CalendarView />
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
          {currentTask && areaId && projectId && (
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
    </div>
  );
}
