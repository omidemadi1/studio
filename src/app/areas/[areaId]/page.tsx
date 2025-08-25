
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
  CheckCircle,
  Target,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import type { Task } from '@/lib/types';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { useToast } from '@/hooks/use-toast';
import { suggestXpValue } from '@/ai/flows/suggest-xp-value';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  skillId: z.string().optional(),
});

export default function AreaDetailPage() {
  const { toast } = useToast();
  const { areaId } = useParams();
  const { getAreaById, getTasksByAreaId, addProject, addTask, skills, areas } = useQuestData();

  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addTaskState, setAddTaskState] = useState<{ open: boolean; projectId: string | null }>({ open: false, projectId: null });
  const [isCreatingTask, setIsCreatingTask] = useState(false);

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
          <h2 className="text-2xl font-headline font-semibold">Projects</h2>
          <Button onClick={() => setAddProjectOpen(true)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Project
          </Button>
        </div>
        <div className="space-y-4">
          {area.projects.map((project) => {
            const projectTasks = project.tasks;
            const completedProjectTasks = projectTasks.filter(t => t.completed).length;
            const projectCompletion = projectTasks.length > 0 ? (completedProjectTasks / projectTasks.length) * 100 : 0;
            return (
              <Card key={project.id} className="bg-card/80 overflow-hidden flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl font-bold font-headline">{project.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{completedProjectTasks} / {projectTasks.length} Done</span>
                    <Progress value={projectCompletion} className="w-24 h-2" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {projectTasks.slice(0, 5).map((task: Task) => (
                      <li key={task.id} className="flex items-center gap-3">
                        <CheckCircle className={`h-4 w-4 ${task.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                        <span className="text-xs font-bold text-primary">+{task.xp} XP</span>
                      </li>
                    ))}
                    {projectTasks.length > 5 && (
                        <li className="text-center text-sm text-muted-foreground pt-2">...and {projectTasks.length - 5} more.</li>
                    )}
                     {projectTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No tasks in this project yet.</p>
                     )}
                  </ul>
                </CardContent>
                <CardFooter className='bg-muted/30 p-2 justify-center'>
                    <Button variant="ghost" size="sm" onClick={() => setAddTaskState({open: true, projectId: project.id})}>
                        <PlusCircle className='h-4 w-4 mr-2'/> Add Task
                    </Button>
                </CardFooter>
              </Card>
            )
          })}
           {area.projects.length === 0 && (
              <Card className="bg-card/80 border-2 border-dashed">
                <CardContent className="p-10 text-center">
                    <p className="text-muted-foreground mb-4">No projects here yet. Ready to start a new quest line?</p>
                    <Button variant="outline" onClick={() => setAddProjectOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>
                </CardContent>
              </Card>
           )}
        </div>
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
    </>
  );
}
