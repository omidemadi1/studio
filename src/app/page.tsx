'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { initialAreas, dailyMissions, user } from '@/lib/mock-data';
import type { Task, Project, Area } from '@/lib/types';
import { Swords, PlusCircle, Briefcase, Loader2 } from 'lucide-react';
import { suggestXpValue } from '@/ai/flows/suggest-xp-value';

const areaSchema = z.object({
  name: z.string().min(1, 'Area name is required.'),
});

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
});

export default function QuestsPage() {
  const { toast } = useToast();
  const [areas, setAreas] = useState(initialAreas);
  const [currentUser, setCurrentUser] = useState(user);

  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [addProjectState, setAddProjectState] = useState<{ open: boolean; areaId: string | null }>({ open: false, areaId: null });
  const [addTaskState, setAddTaskState] = useState<{ open: boolean; areaId: string | null; projectId: string | null }>({ open: false, areaId: null, projectId: null });
  const [isCreatingTask, setIsCreatingTask] = useState(false);

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
    defaultValues: { title: '' },
  });

  const handleTaskToggle = (areaId: string, projectId: string, taskId: string, completed: boolean) => {
    let taskXp = 0;

    const updatedAreas = areas.map((area) => {
      if (area.id === areaId) {
        return {
          ...area,
          projects: area.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                tasks: project.tasks.map((task) => {
                  if (task.id === taskId) {
                    taskXp = task.xp;
                    return { ...task, completed };
                  }
                  return task;
                }),
              };
            }
            return project;
          }),
        };
      }
      return area;
    });

    setAreas(updatedAreas);

    if (completed) {
      toast({
        title: 'Quest Complete!',
        description: `You earned ${taskXp} XP!`,
      });
      const newXp = currentUser.xp + taskXp;
      const newLevel =
        newXp >= currentUser.nextLevelXp
          ? currentUser.level + 1
          : currentUser.level;
      const newNextLevelXp =
        newXp >= currentUser.nextLevelXp
          ? currentUser.nextLevelXp * 2
          : currentUser.nextLevelXp;

      setCurrentUser((prev) => ({
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: newNextLevelXp,
      }));
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        xp: Math.max(0, prev.xp - taskXp),
      }));
    }
  };

  function onAddArea(data: z.infer<typeof areaSchema>) {
    const newArea: Area = {
      id: `area-${Date.now()}`,
      name: data.name,
      icon: Briefcase,
      projects: [],
    };
    setAreas((prev) => [...prev, newArea]);
    areaForm.reset();
    setAddAreaOpen(false);
  }

  function onAddProject(data: z.infer<typeof projectSchema>) {
    if (!addProjectState.areaId) return;
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name,
      tasks: [],
    };
    setAreas((prev) =>
      prev.map((area) =>
        area.id === addProjectState.areaId ? { ...area, projects: [...area.projects, newProject] } : area
      )
    );
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
        };

        setAreas((prev) =>
            prev.map((area) =>
                area.id === addTaskState.areaId
                    ? {
                        ...area,
                        projects: area.projects.map((project) =>
                            project.id === addTaskState.projectId
                                ? { ...project, tasks: [...project.tasks, newTask] }
                                : project
                        ),
                    }
                    : area
            )
        );
        
        toast({
            title: "Quest Created!",
            description: `AI has assigned ${xp} XP to your new quest.`
        });
        
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


  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-bold text-primary">Questify</h1>
        <Avatar>
          <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="avatar" />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-headline font-semibold mb-4 flex items-center gap-2">
          <Swords className="text-primary" /> Daily Missions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {dailyMissions.map((mission) => (
            <Card key={mission.id} className="bg-card/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{mission.title}</p>
                  <p className="text-sm text-muted-foreground">
                    + {mission.xp} XP, +{mission.tokens} Tokens
                  </p>
                </div>
                <Button size="sm" variant="outline">Start</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-headline font-semibold">Your Quests</h2>
            <Button variant="ghost" size="icon" onClick={() => setAddAreaOpen(true)}>
                <PlusCircle className="h-6 w-6 text-primary" />
                <span className="sr-only">Add Area</span>
            </Button>
        </div>
        <Accordion type="multiple" defaultValue={areas.map(a => a.id)} className="w-full">
          {areas.map((area) => (
            <AccordionItem key={area.id} value={area.id}>
              <AccordionTrigger className="text-xl font-headline hover:no-underline">
                <div className="flex items-center gap-3">
                    <area.icon className="w-6 h-6 text-accent" />
                    {area.name}
                </div>
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
                              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={task.id}
                                checked={task.completed}
                                onCheckedChange={(checked) =>
                                  handleTaskToggle(area.id, project.id, task.id, !!checked)
                                }
                                className="w-5 h-5"
                              />
                              <label
                                htmlFor={task.id}
                                className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {task.title}
                              </label>
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
          ))}
        </Accordion>
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
              <DialogFooter>
                <Button type="submit" disabled={isCreatingTask}>
                    {isCreatingTask ? <Loader2 className="animate-spin" /> : "Create Task" }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
