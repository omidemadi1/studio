'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
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
import type { Task, Difficulty } from '@/lib/types';
import { skills } from '@/lib/mock-data';
import {
  Swords,
  PlusCircle,
  Loader2,
  Command,
  Folder,
  Tag,
  Flame,
  Calendar,
  AlignLeft,
  ArrowUp,
  StickyNote,
  Link as LinkIcon,
} from 'lucide-react';
import { suggestXpValue } from '@/ai/flows/suggest-xp-value';
import { useQuestData } from '@/context/quest-context';
import { Textarea } from '@/components/ui/textarea';

const areaSchema = z.object({
  name: z.string().min(1, 'Area name is required.'),
});

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
});

const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    Hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
    'Very Hard': 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
};

export default function QuestsPage() {
  const { toast } = useToast();
  const { areas, user, updateTaskCompletion, addTask, addArea, addProject, updateTaskDetails } = useQuestData();

  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [addProjectState, setAddProjectState] = useState<{ open: boolean; areaId: string | null }>({ open: false, areaId: null });
  const [addTaskState, setAddTaskState] = useState<{ open: boolean; areaId: string | null; projectId: string | null }>({ open: false, areaId: null, projectId: null });
  const [taskDetailState, setTaskDetailState] = useState<{ open: boolean; areaId: string | null; projectId: string | null; taskId: string | null; }>({ open: false, areaId: null, projectId: null, taskId: null });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});


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
            difficulty: xp > 120 ? 'Very Hard' : xp > 80 ? 'Hard' : xp > 40 ? 'Medium' : 'Easy',
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
    setTaskDetailState({
      open: true,
      areaId,
      projectId,
      taskId,
    });
  }

  const { areaId, projectId, taskId } = taskDetailState;
  const area = areas.find((a) => a.id === areaId);
  const project = area?.projects.find((p) => p.id === projectId);
  const task = project?.tasks.find((t) => t.id === taskId);
  const skill = skills.find(s => s.id === task?.skillId);

  React.useEffect(() => {
    if (task) {
      setEditableTaskData({
        description: task.description || '',
        notes: task.notes || '',
        links: task.links || '',
      });
      setIsEditingTask(false);
    }
  }, [task]);

  const handleTaskDataChange = (field: 'description' | 'notes' | 'links', value: string) => {
    setEditableTaskData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    if (!areaId || !projectId || !taskId || !task) return;
    updateTaskDetails(areaId, projectId, taskId, editableTaskData);
    setIsEditingTask(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTask(false);
    if (task) {
      setEditableTaskData({
        description: task.description || '',
        notes: task.notes || '',
        links: task.links || '',
      });
    }
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
        <DialogContent className="sm:max-w-xl">
          {task && areaId && projectId && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline pr-10">{task.title}</DialogTitle>
                <div className="absolute top-6 right-12">
                   <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) =>
                            updateTaskCompletion(areaId, projectId, task.id, !!checked)
                        }
                        className="w-5 h-5"
                    />
                </div>
              </DialogHeader>
              <div className="grid grid-cols-[120px_1fr] items-start gap-y-4 gap-x-4 text-sm mt-4">
                
                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                <div className="font-semibold pt-1">{area?.name}</div>

                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                <div className="font-semibold pt-1">{project?.name}</div>

                {skill && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                    <div className="font-semibold pt-1">{skill.name}</div>
                  </>
                )}

                {task.difficulty && (
                    <>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Flame className="h-4 w-4" /> Difficulty</div>
                        <div><Badge variant="outline" className={difficultyColors[task.difficulty]}>{task.difficulty}</Badge></div>
                    </>
                )}

                {task.dueDate && (
                    <>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Calendar className="h-4 w-4" /> Date</div>
                        <div className="font-semibold pt-1">{format(new Date(task.dueDate), 'PPP')}</div>
                    </>
                )}
                
                <div className="flex items-center gap-2 text-muted-foreground font-medium self-start pt-1"><AlignLeft className="h-4 w-4" /> Details</div>
                {isEditingTask ? (
                  <Textarea
                    value={editableTaskData.description}
                    onChange={(e) => handleTaskDataChange('description', e.target.value)}
                    placeholder="Add a description..."
                    className="text-sm"
                    rows={3}
                  />
                ) : (
                  <div className="font-semibold text-muted-foreground italic whitespace-pre-wrap pt-1">{task.description || 'No description added.'}</div>
                )}
                
                <div className="flex items-center gap-2 text-muted-foreground font-medium self-start pt-1"><StickyNote className="h-4 w-4" /> Notes</div>
                {isEditingTask ? (
                  <Textarea
                    value={editableTaskData.notes}
                    onChange={(e) => handleTaskDataChange('notes', e.target.value)}
                    placeholder="Add notes..."
                    className="text-sm"
                    rows={3}
                  />
                ) : (
                  <div className="font-semibold text-muted-foreground italic whitespace-pre-wrap pt-1">{task.notes || 'No notes added.'}</div>
                )}

                <div className="flex items-center gap-2 text-muted-foreground font-medium self-start pt-1"><LinkIcon className="h-4 w-4" /> Links</div>
                {isEditingTask ? (
                  <Textarea
                    value={editableTaskData.links}
                    onChange={(e) => handleTaskDataChange('links', e.target.value)}
                    placeholder="Add links, one per line..."
                    className="text-sm"
                    rows={3}
                  />
                ) : (
                  <div className="font-semibold text-muted-foreground italic whitespace-pre-wrap pt-1">{task.links || 'No links added.'}</div>
                )}

                <div className="flex items-center gap-2 text-muted-foreground font-medium"><ArrowUp className="h-4 w-4" /> XP</div>
                <div className="font-semibold pt-1">{task.xp}</div>
              </div>
              <DialogFooter className="pt-4">
              {isEditingTask ? (
                <div className="flex w-full justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditingTask(true)}>Edit Details</Button>
              )}
            </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
