

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuestData } from '@/context/quest-context';
import { iconMap } from '@/lib/icon-map';
import { cn } from '@/lib/utils';
import type { Task, Difficulty, Skill, Area, Project } from '@/lib/types';
import { format } from 'date-fns';

import {
    ArrowLeft, Lightbulb, Pencil, Trash2, Folder, Check,
    Command, Tag, Flame, Calendar as CalendarIcon, AlignLeft,
    Clock, ArrowUp, Crosshair,
    PlusCircle, GitBranch, Sparkles, Copy, Expand,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogClose,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    Form, FormControl, FormField, FormItem,
    FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { GemIcon } from '@/components/icons/gem-icon';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { suggestXpValue } from '@/ai/flows/suggest-xp-value';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required.'),
  icon: z.string().min(1, 'An icon is required.'),
});

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

// Component to prevent hydration errors from date formatting
const ClientFormattedDate = ({ dateString, formatString }: { dateString: string; formatString: string }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(format(new Date(dateString), formatString));
  }, [dateString, formatString]);

  // Render a placeholder on the server and initial client render
  if (!formattedDate) {
    return <span className="cursor-default">...</span>;
  }

  return <span className="cursor-default">{formattedDate}</span>;
};


export default function SkillDetailPage() {
    const { skillId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { 
        skills, 
        tasks, 
        updateSkill, 
        deleteSkill, 
        areas, 
        updateTaskCompletion, 
        updateTaskDetails, 
        addSkill,
        addTask,
        deleteTask,
        duplicateTask,
    } = useQuestData();

    const [editSkillOpen, setEditSkillOpen] = useState(false);
    const [addSkillOpen, setAddSkillOpen] = useState(false);
    const [addTaskOpen, setAddTaskOpen] = useState(false);
    const [taskDetailState, setTaskDetailState] = useState<{ open: boolean; taskId: string | null; isExpanded: boolean; }>({ open: false, taskId: null, isExpanded: false });
    const [deleteTaskState, setDeleteTaskState] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
    const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    
    const selectableSkills = getFlattenedSkills(skills);

    const skill = useMemo(() => findSkillRecursive(skills, skillId as string), [skillId, skills]);

    const getAllSubSkillIds = (s: Skill): string[] => {
        return [s.id, ...(s.subSkills?.flatMap(getAllSubSkillIds) || [])];
    }
    
    const relatedTasks = useMemo(() => {
        if (!skill) return [];
        const allSkillIds = getAllSubSkillIds(skill);
        return tasks.filter(t => t.skillId && allSkillIds.includes(t.skillId));
    }, [skill, tasks]);

    const skillForm = useForm<z.infer<typeof skillSchema>>({
        resolver: zodResolver(skillSchema),
        values: { name: skill?.name || '', icon: skill?.icon || '' },
    });

    const taskForm = useForm<z.infer<typeof taskSchema>>({
        resolver: zodResolver(taskSchema),
        defaultValues: { title: '', description: '' },
    });
     const selectedAreaIdForTask = taskForm.watch('areaId');
    const availableProjects = areas.find(a => a.id === selectedAreaIdForTask)?.projects || [];


    useEffect(() => {
        if (addTaskOpen && skill) {
            taskForm.reset();
            // A skill can be a parent or a child, we want to pre-select it if it's a selectable one
            const isSelectable = !skill.subSkills || skill.subSkills.length === 0;
            if (isSelectable) {
                taskForm.setValue('skillId', skill.id);
            }
        }
    }, [addTaskOpen, skill, taskForm]);
    
    const subSkillForm = useForm<z.infer<typeof skillSchema>>({
        resolver: zodResolver(skillSchema),
        defaultValues: { name: '', icon: '' },
    });

    if (!skill) {
        return notFound();
    }

    const SkillIcon = iconMap[skill.icon] || Lightbulb;
    const progress = (skill.points / skill.maxPoints) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const onUpdateSkill = (data: z.infer<typeof skillSchema>) => {
        updateSkill(skill.id, data.name, data.icon);
        setEditSkillOpen(false);
        toast({ title: "Skill Updated!", description: "Your skill has been successfully updated." });
    };
    
    const onAddSubSkill = (data: z.infer<typeof skillSchema>) => {
        addSkill(data.name, data.icon, skill.id);
        subSkillForm.reset();
        setAddSkillOpen(false);
        toast({ title: 'Sub-skill Created' });
    };
    
    const onAddTask = async (data: z.infer<typeof taskSchema>) => {
        setIsCreatingTask(true);
        try {
            const result = await suggestXpValue({ title: data.title });
            
            const newTask: Task = {
                id: `task-${Date.now()}`,
                title: data.title,
                completed: false,
                xp: result.xp,
                tokens: result.tokens,
                description: data.description || '',
                difficulty: result.xp > 120 ? 'Very Hard' : result.xp > 80 ? 'Hard' : result.xp > 40 ? 'Medium' : 'Easy',
                dueDate: data.dueDate?.toISOString(),
                skillId: data.skillId,
                projectId: data.projectId,
            };
            
            addTask(newTask, data.areaId);
            taskForm.reset();
            setAddTaskOpen(false);
        } catch (error) {
            console.error("Failed to add task:", error);
            toast({
                variant: "destructive",
                title: "Error Creating Task",
                description: "Could not suggest XP value. Please try again."
            });
        } finally {
            setIsCreatingTask(false);
        }
    };


    const onDeleteSkill = () => {
        deleteSkill(skill.id);
        toast({ title: "Skill Deleted", description: `The skill "${skill.name}" has been removed.`, variant: "destructive" });
        router.push('/profile');
    };

    const handleTaskClick = (taskId: string) => {
        const task = relatedTasks.find(t => t.id === taskId);
        if (task) {
          setEditableTaskData({
            title: task.title ?? '',
            description: task.description ?? '',
            markdown: task.markdown ?? '',
          });
        }
        setTaskDetailState(prev => ({ ...prev, open: true, taskId }));
    };

    const handleDeleteTask = () => {
        if (!deleteTaskState.task) return;
        deleteTask(deleteTaskState.task.id);
        setDeleteTaskState({ open: false, task: null });
    };


    const handleTaskDataChange = (field: keyof Task, value: string | number | undefined) => {
        if (!taskDetailState.taskId) return;
        setEditableTaskData(prev => ({ ...prev, [field]: value }));
        updateTaskDetails(taskDetailState.taskId, { [field]: value });
    };

    const { taskId } = taskDetailState;
    const currentTask = relatedTasks.find(t => t.id === taskId);
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

    const handleFocusClick = () => {
        if (!taskId) return;
        setTaskDetailState(prev => ({ ...prev, open: false }));
        router.push(`/focus?taskId=${taskId}`);
    };
    
    const backHref = skill.parentId ? `/skills/${skill.parentId}` : '/profile';

    return (
        <>
            <div className="container mx-auto max-w-6xl p-4 sm:p-6">
                <header className="mb-6 flex items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={backHref}>
                                <ArrowLeft />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-3">
                            <SkillIcon className="w-8 h-8 text-accent" />
                            <h1 className="text-3xl font-headline font-bold">{skill.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                        <Button variant="outline" size="sm" disabled>
                                            <Sparkles className="h-4 w-4 mr-2" /> AI Upgrade
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Coming soon</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button variant="outline" size="sm" onClick={() => {
                            skillForm.reset({ name: skill.name, icon: skill.icon });
                            setEditSkillOpen(true);
                        }}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                <span className="font-bold"> {skill.name}</span> skill and all its sub-skills.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={onDeleteSkill}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                    </div>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-card/80 p-6 flex flex-col items-center text-center">
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle
                                        className="text-muted/20"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="transparent"
                                    />
                                    <circle
                                        className="text-primary"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                                    <div className="relative mb-2">
                                        <SkillIcon className="h-10 w-10 text-accent" />
                                        <div className="absolute -top-1 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold border-2 border-card">
                                            {skill.level}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-xl font-headline font-semibold mt-4">{skill.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{skill.points} / {skill.maxPoints} XP to next level</p>
                        </Card>
                        
                        {skill.subSkills && skill.subSkills.length > 0 && (
                            <Card className="bg-card/80">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <GitBranch className="h-5 w-5 text-primary" />
                                        Skill Tree
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {skill.subSkills.map(subSkill => {
                                        const SubSkillIcon = iconMap[subSkill.icon] || Lightbulb;
                                        return (
                                            <Link href={`/skills/${subSkill.id}`} key={subSkill.id} className="block p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <SubSkillIcon className="w-6 h-6 text-accent flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <p className="font-semibold font-headline">{subSkill.name}</p>
                                                            <p className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">Lvl {subSkill.level}</p>
                                                        </div>
                                                        <Progress value={(subSkill.points / subSkill.maxPoints) * 100} className="h-1 mt-1" />
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" onClick={() => setAddSkillOpen(true)}>
                                        <PlusCircle className="h-4 w-4 mr-2" /> Add Sub-skill
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                         {(!skill.subSkills || skill.subSkills.length === 0) && !skill.parentId && (
                             <Button variant="outline" className="w-full" onClick={() => setAddSkillOpen(true)}>
                                <PlusCircle className="h-4 w-4 mr-2" /> Add Sub-skill
                            </Button>
                         )}
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="bg-card/80 h-full flex flex-col">
                            <CardHeader>
                                <CardTitle>Related Quests</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                {relatedTasks.length > 0 ? (
                                    <div className="space-y-3">
                                    {relatedTasks.map((task: Task) => {
                                        const taskSkill = task.skillId ? findSkillRecursive(skills, task.skillId) : null;
                                        return (
                                            <ContextMenu key={task.id}>
                                                <ContextMenuTrigger>
                                                    <div
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                                                        onClick={() => handleTaskClick(task.id)}
                                                    >
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox
                                                                id={`task-${task.id}`}
                                                                checked={task.completed}
                                                                onCheckedChange={(checked) => updateTaskCompletion(task.id, !!checked)}
                                                                className="w-5 h-5"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                          <p className={cn("text-sm font-medium leading-none", task.completed && "line-through text-muted-foreground")}>
                                                              {task.title}
                                                          </p>
                                                        </div>
                                                         <TooltipProvider>
                                                            <div className="flex items-center gap-4 text-xs ml-auto">
                                                                {taskSkill && taskSkill.id !== skill.id && (
                                                                     <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Badge variant="outline" className="cursor-default border-0 text-muted-foreground">{taskSkill.name}</Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Sub-skill</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {task.difficulty && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild><Badge variant="outline" className={cn("cursor-default border-0", task.difficulty ? difficultyColors[task.difficulty || 'Easy'] : '')}>{task.difficulty}</Badge></TooltipTrigger>
                                                                        <TooltipContent>Difficulty</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {task.tokens > 0 && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild><span className="cursor-default text-muted-foreground">{task.tokens}</span></TooltipTrigger>
                                                                        <TooltipContent>Tokens</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {task.dueDate && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className="text-muted-foreground">
                                                                                <ClientFormattedDate dateString={task.dueDate} formatString="MMM d" />
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Due Date</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                    <span className="text-xs font-bold text-primary whitespace-nowrap cursor-default">
                                                                        +{task.xp + (task.bonusXp || 0)} XP
                                                                    </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Experience Points</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </TooltipProvider>
                                                    </div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent>
                                                    <ContextMenuItem onSelect={() => handleTaskClick(task.id)}>
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
                                    })}
                                    </div>
                                ) : (
                                    <div className="text-center p-10 border-2 border-dashed rounded-lg h-full flex flex-col justify-center items-center">
                                        <p className="text-muted-foreground">No quests are currently assigned to this skill or its sub-skills.</p>
                                    </div>
                                )}
                            </CardContent>
                             <CardFooter>
                                <Button variant="outline" className="w-full" onClick={() => setAddTaskOpen(true)}>
                                    <PlusCircle className="h-4 w-4 mr-2" /> Add Quest
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={editSkillOpen} onOpenChange={setEditSkillOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Skill</DialogTitle>
                        <DialogDescription>
                            Change the name or icon for your skill.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...skillForm}>
                        <form onSubmit={skillForm.handleSubmit(onUpdateSkill)} className="space-y-4 py-4">
                            <FormField
                                control={skillForm.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Skill Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Programming" {...field} value={field.value || ''} />
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
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

             <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Sub-Skill</DialogTitle>
                        <DialogDescription>
                            Create a new sub-skill under <span className="font-bold">{skill.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...subSkillForm}>
                        <form onSubmit={subSkillForm.handleSubmit(onAddSubSkill)} className="space-y-4 py-4">
                            <FormField
                                control={subSkillForm.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sub-Skill Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Photoshop" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={subSkillForm.control}
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
                                <Button type="submit">Create Sub-Skill</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

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
                                    <FormLabel>Area (Optional)</FormLabel>
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
                                    <FormLabel>Project (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedAreaIdForTask}>
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
                                    {isCreatingTask ? <Loader2 className="animate-spin" /> : "Create Quest" }
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

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

                        {area && project && (
                            <>
                                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                                <div className="font-semibold text-left">{area?.name}</div>

                                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                                <div className="font-semibold text-left">{project?.name}</div>
                            </>
                        )}


                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                        <div className="font-semibold text-left">{currentTaskSkill?.name}</div>
                        
                        {currentTask.difficulty && (
                            <>
                                <div className="flex items-center gap-2 text-muted-foreground font-medium"><Flame className="h-4 w-4" /> Difficulty</div>
                                <div className='text-left'><Badge variant="outline" className={cn(currentTask.difficulty ? difficultyColors[currentTask.difficulty] : '')}>{currentTask.difficulty}</Badge></div>
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
                        <div className="text-left -mt-2">
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
