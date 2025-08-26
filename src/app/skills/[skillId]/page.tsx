

'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuestData } from '@/context/quest-context';
import { iconMap } from '@/lib/icon-map';
import { cn } from '@/lib/utils';
import type { Task, Difficulty } from '@/lib/types';

import {
    ArrowLeft, Lightbulb, Pencil, Trash2, Folder, Check,
    Command, Tag, Flame, Calendar as CalendarIcon, AlignLeft,
    StickyNote, Link as LinkIcon, Clock, ArrowUp, Crosshair,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger, DialogClose,
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

export default function SkillDetailPage() {
    const { skillId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { skills, tasks, updateSkill, deleteSkill, areas, updateTaskCompletion, updateTaskDetails } = useQuestData();

    const [editSkillOpen, setEditSkillOpen] = useState(false);
    const [taskDetailState, setTaskDetailState] = useState<{ open: boolean; taskId: string | null; }>({ open: false, taskId: null });
    const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});

    const skill = useMemo(() => skills.find(s => s.id === skillId), [skillId, skills]);
    const relatedTasks = useMemo(() => tasks.filter(t => t.skillId === skillId), [skillId, tasks]);

    const skillForm = useForm<z.infer<typeof skillSchema>>({
        resolver: zodResolver(skillSchema),
        values: { name: skill?.name || '', icon: skill?.icon || '' },
    });

    if (!skill) {
        return notFound();
    }

    const SkillIcon = iconMap[skill.icon] || Lightbulb;

    const onUpdateSkill = (data: z.infer<typeof skillSchema>) => {
        updateSkill(skill.id, data.name, data.icon);
        setEditSkillOpen(false);
        toast({ title: "Skill Updated!", description: "Your skill has been successfully updated." });
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
            title: task.title,
            description: task.description || '',
            notes: task.notes || '',
            links: task.links || '',
          });
        }
        setTaskDetailState({ open: true, taskId });
    };

    const handleTaskDataChange = (field: keyof Task, value: string) => {
        if (!taskDetailState.taskId) return;
        setEditableTaskData(prev => ({ ...prev, [field]: value }));
        updateTaskDetails(taskDetailState.taskId, { [field]: value });
    };

    const { taskId } = taskDetailState;
    const currentTask = relatedTasks.find(t => t.id === taskId);
    const { area, project } = useMemo(() => {
        if (!currentTask) return { area: null, project: null };
        for (const a of areas) {
            const p = a.projects.find(p => p.id === currentTask.projectId);
            if (p) return { area: a, project: p };
        }
        return { area: null, project: null };
    }, [currentTask, areas]);

    const handleFocusClick = () => {
        if (!taskId) return;
        setTaskDetailState(prev => ({ ...prev, open: false }));
        router.push(`/focus?taskId=${taskId}`);
    };

    return (
        <>
            <div className="container mx-auto max-w-4xl p-4 sm:p-6">
                <header className="mb-6 flex items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/profile">
                                <ArrowLeft />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-3">
                            <SkillIcon className="w-8 h-8 text-accent" />
                            <h1 className="text-3xl font-headline font-bold">{skill.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditSkillOpen(true)}>
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
                                <span className="font-bold"> {skill.name}</span> skill and remove it from all associated tasks.
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

                <section>
                    <h2 className="text-2xl font-headline font-semibold mb-4">Related Quests</h2>
                    {relatedTasks.length > 0 ? (
                        <div className="space-y-3">
                        {relatedTasks.map((task: Task) => (
                            <Card
                                key={task.id}
                                className="flex items-center gap-3 p-3 bg-card/80 hover:bg-muted/50 transition-colors cursor-pointer"
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
                                <span className={cn("flex-1 text-sm font-medium leading-none", task.completed && "line-through text-muted-foreground")}>
                                {task.title}
                                </span>
                                <Badge variant="outline" className={cn(task.difficulty ? difficultyColors[task.difficulty] : '')}>{task.difficulty}</Badge>
                                <span className="text-xs font-bold text-primary">+{task.xp} XP</span>
                            </Card>
                        ))}
                        </div>
                    ) : (
                        <Card className="bg-card/80 border-2 border-dashed">
                            <CardContent className="p-10 text-center">
                                <p className="text-muted-foreground">No quests are currently assigned to this skill.</p>
                            </CardContent>
                        </Card>
                    )}
                </section>
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
                                                <Button variant="outline" className="w-full justify-start">
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
                                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={taskDetailState.open} onOpenChange={(open) => setTaskDetailState(prev => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-xl">
                {currentTask && (
                    <>
                    <DialogHeader className="flex flex-row items-start justify-between gap-4">
                        <VisuallyHidden>
                            <DialogTitle>{editableTaskData.title}</DialogTitle>
                            <DialogDescription>Details for task: {editableTaskData.title}. You can edit the details below.</DialogDescription>
                        </VisuallyHidden>
                        <Input
                            value={editableTaskData.title}
                            onChange={(e) => handleTaskDataChange('title', e.target.value)}
                            className="text-2xl font-bold font-headline h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <div className='flex items-center gap-2 flex-shrink-0'>
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
                    <div className="grid grid-cols-[120px_1fr] items-center gap-y-4 gap-x-4 text-sm mt-4">

                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                        <div className="font-semibold">{area?.name}</div>

                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                        <div className="font-semibold">{project?.name}</div>

                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                        <div className="font-semibold">{skill.name}</div>
                        
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

                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><GemIcon className="h-4 w-4" /> Tokens</div>
                        <div className="font-semibold">{currentTask.tokens}</div>
                        
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

    