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
import type { Task } from '@/lib/types';
import { Swords, PlusCircle, Loader2 } from 'lucide-react';
import { suggestXpValue } from '@/ai/flows/suggest-xp-value';
import { Textarea } from '@/components/ui/textarea';
import { useQuestData } from '@/context/quest-context';

const areaSchema = z.object({
  name: z.string().min(1, 'Area name is required.'),
});

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
});

const taskDetailSchema = z.object({
  description: z.string().optional(),
  notes: z.string().optional(),
  links: z.string().optional(),
});

export default function QuestsPage() {
  const { toast } = useToast();
  const { areas, user, updateTaskCompletion, getAreaForProject, addTask, addArea, addProject, updateTaskDetails } = useQuestData();

  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [addProjectState, setAddProjectState] = useState<{ open: boolean; areaId: string | null }>({ open: false, areaId: null });
  const [addTaskState, setAddTaskState] = useState<{ open: boolean; areaId: string | null; projectId: string | null }>({ open: false, areaId: null, projectId: null });
  const [taskDetailState, setTaskDetailState] = useState<{ open: boolean; areaId: string | null; projectId: string | null; taskId: string | null; taskTitle: string | null; }>({ open: false, areaId: null, projectId: null, taskId: null, taskTitle: null });
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

  const taskDetailForm = useForm<z.infer<typeof taskDetailSchema>>({
    resolver: zodResolver(taskDetailSchema),
    defaultValues: {
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
            description: '',
            notes: '',
            links: '',
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
      taskDetailForm.reset({
        description: task.description || '',
        notes: task.notes || '',
        links: task.links || '',
      });
      setTaskDetailState({
        open: true,
        areaId,
        projectId,
        taskId,
        taskTitle: task.title,
      });
    }
  }

  function onSaveTaskDetails(data: z.infer<typeof taskDetailSchema>) {
    const { areaId, projectId, taskId } = taskDetailState;
    if (!areaId || !projectId || !taskId) return;

    updateTaskDetails(areaId, projectId, taskId, data);
    setTaskDetailState({ open: false, areaId: null, projectId: null, taskId: null, taskTitle: null });
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-bold text-primary">Questify</h1>
        <Avatar>
          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </header>

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
                              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => handleTaskClick(area.id, project.id, task.id)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  id={task.id}
                                  checked={task.completed}
                                  onCheckedChange={(checked) =>
                                    updateTaskCompletion(area.id, project.id, task.id, !!checked)
                                  }
                                  className="w-5 h-5"
                                />
                              </div>
                              <span
                                className="flex-1 text-sm font-medium leading-none"
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

      <Dialog open={taskDetailState.open} onOpenChange={(isOpen) => setTaskDetailState(prev => ({ ...prev, open: isOpen }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{taskDetailState.taskTitle}</DialogTitle>
            <DialogDescription>
              View and edit additional details for this quest.
            </DialogDescription>
          </DialogHeader>
          <Form {...taskDetailForm}>
            <form onSubmit={taskDetailForm.handleSubmit(onSaveTaskDetails)} className="space-y-4">
              <FormField
                control={taskDetailForm.control}
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
              <FormField
                control={taskDetailForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add personal notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taskDetailForm.control}
                name="links"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Links</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add relevant links, one per line..." {...field} />
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
    </div>
  );
}
