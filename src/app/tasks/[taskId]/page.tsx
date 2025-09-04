
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { useQuestData } from '@/context/quest-context';
import { iconMap } from '@/lib/icon-map';
import { cn } from '@/lib/utils';
import type { Task, Difficulty, Skill, Area, Project } from '@/lib/types';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


import {
    ArrowLeft, Lightbulb, Pencil, Trash2, Folder, Check,
    Command, Tag, Flame, Calendar as CalendarIcon, AlignLeft,
    Clock, ArrowUp, Crosshair,
    PlusCircle, GitBranch, Sparkles, Copy, Expand,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GemIcon } from '@/components/icons/gem-icon';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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


export default function TaskDetailPage() {
    const { taskId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { 
        getTask,
        skills, 
        areas, 
        updateTaskCompletion, 
        updateTaskDetails, 
        deleteTask,
    } = useQuestData();

    const [isFullScreen, setIsFullScreen] = useState(false);
    
    const taskData = useMemo(() => getTask(taskId as string), [taskId, getTask]);
    
    const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});
    const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);

    const selectableSkills = getFlattenedSkills(skills);


    useEffect(() => {
        if (taskData) {
            setEditableTaskData(taskData.task);
        }
    }, [taskData]);

    if (!taskData) {
        return notFound();
    }

    const { task } = taskData;

    const { area, project } = useMemo(() => {
        if (!task.projectId) return { area: null, project: null };
        for (const a of areas) {
            const p = a.projects.find(p => p.id === task.projectId);
            if (p) return { area: a, project: p };
        }
        return { area: null, project: null };
    }, [task, areas]);
    
    const currentSkill = useMemo(() => {
        if (!task.skillId) return null;
        return findSkillRecursive(skills, task.skillId);
    }, [task, skills]);

    const handleTaskDataChange = (field: keyof Task, value: string | number | undefined | null) => {
        setEditableTaskData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleDetailBlur = (field: keyof Task) => {
        updateTaskDetails(task.id, { [field]: editableTaskData[field] });
    }

    const handleMarkdownBlur = () => {
        setIsEditingMarkdown(false);
        if (editableTaskData.markdown !== task.markdown) {
            updateTaskDetails(task.id, { markdown: editableTaskData.markdown });
        }
    }

    const handleFocusClick = () => {
        router.push(`/focus?taskId=${task.id}`);
    };

    const handleDeleteTask = () => {
        deleteTask(task.id);
        router.back();
    };

    const handleAreaChange = (newAreaId: string) => {
        // Find the first project in the new area and assign it
        const newArea = areas.find(a => a.id === newAreaId);
        const newProjectId = newArea?.projects[0]?.id || null;
        updateTaskDetails(task.id, { projectId: newProjectId });
    };

    const handleProjectChange = (newProjectId: string) => {
        updateTaskDetails(task.id, { projectId: newProjectId });
    }
    
    const handleSkillChange = (newSkillId: string) => {
        updateTaskDetails(task.id, { skillId: newSkillId });
    }

    return (
        <div className={cn(
            "container mx-auto p-4 sm:p-6 transition-all duration-300",
            isFullScreen ? "max-w-full" : "max-w-2xl"
        )}>
            <div className="bg-card/80 p-6 rounded-lg">
                <header className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft />
                        </Button>
                        <Input
                            value={editableTaskData.title || ''}
                            onChange={(e) => handleTaskDataChange('title', e.target.value)}
                            onBlur={() => handleDetailBlur('title')}
                            className="text-2xl lg:text-3xl font-bold font-headline h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                        />
                    </div>
                    <div className='flex items-center gap-2 flex-shrink-0'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(prev => !prev)}>
                                        <Expand className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Toggle Fullscreen</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleFocusClick} disabled={task.completed}>
                                    <Crosshair className="h-5 w-5" />
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Focus on this task</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) =>
                                updateTaskCompletion(task.id, !!checked)
                            }
                            className="w-5 h-5"
                        />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the 
                                <span className="font-bold"> {task.title}</span> task.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteTask}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </header>

                <div className="grid grid-cols-[120px_1fr] items-center gap-y-4 gap-x-6 text-sm">

                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                    <Select value={area?.id || ''} onValueChange={handleAreaChange}>
                        <SelectTrigger className="font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                            <SelectValue placeholder="Select an area" />
                        </SelectTrigger>
                        <SelectContent>
                            {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                    <Select value={project?.id || ''} onValueChange={handleProjectChange} disabled={!area}>
                        <SelectTrigger className="font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                            {area?.projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                    <Select value={currentSkill?.id || ''} onValueChange={handleSkillChange}>
                        <SelectTrigger className="font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                            <SelectValue placeholder="Select a skill" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectableSkills.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                             <SelectItem value="none">
                                <span className="text-muted-foreground">None</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {task.difficulty && (
                        <>
                            <div className="flex items-center gap-2 text-muted-foreground font-medium"><Flame className="h-4 w-4" /> Difficulty</div>
                            <div className="text-left"><Badge variant="outline" className={cn(task.difficulty ? difficultyColors[task.difficulty] : '')}>{task.difficulty}</Badge></div>
                        </>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><CalendarIcon className="h-4 w-4" /> Date</div>
                    <DateTimePicker
                        date={task.dueDate ? new Date(task.dueDate) : undefined}
                        setDate={(date) => {
                            updateTaskDetails(task.id, { dueDate: date?.toISOString() });
                        }}
                    />

                    <div className="flex items-center gap-2 text-muted-foreground font-medium self-start pt-2"><AlignLeft className="h-4 w-4" /> Details</div>
                    <div className="text-left -mt-2">
                        <Input
                            value={editableTaskData.description || ''}
                            onChange={(e) => handleTaskDataChange('description', e.target.value)}
                            onBlur={() => handleDetailBlur('description')}
                            placeholder="Add a description..."
                            className="text-sm border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent h-auto"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><ArrowUp className="h-4 w-4" /> XP</div>
                    <div className="font-semibold text-left">{task.xp + (task.bonusXp || 0)}</div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><GemIcon className="h-4 w-4" /> Tokens</div>
                    <div className="font-semibold text-left">{task.tokens}</div>

                    {task.focusDuration && task.focusDuration > 0 && (
                        <>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium"><Clock className="h-4 w-4" /> Total Hours</div>
                        <div className="font-semibold text-left">
                            {`${Math.floor(task.focusDuration / 3600)}h ${Math.floor((task.focusDuration % 3600) / 60)}m`}
                        </div>
                        </>
                    )}
                </div>

                <Separator className="my-6"/>

                <div className="transition-all">
                    {isEditingMarkdown ? (
                        <Textarea
                            autoFocus
                            id="markdown-editor"
                            value={editableTaskData.markdown || ''}
                            onChange={(e) => handleTaskDataChange('markdown', e.target.value)}
                            onBlur={handleMarkdownBlur}
                            placeholder="Write your note using Markdown..."
                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[120px] text-base"
                            rows={isFullScreen ? 25 : 8}
                        />
                    ) : (
                        <div
                            onClick={() => setIsEditingMarkdown(true)}
                            className="prose dark:prose-invert min-h-[120px] w-full max-w-none rounded-lg p-2 cursor-text"
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {editableTaskData.markdown || '*Click to add notes...*'}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
