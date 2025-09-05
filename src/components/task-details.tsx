
'use client';

import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useQuestData } from '@/context/quest-context';
import type { Task, Skill, Difficulty } from '@/lib/types';
import {
  Calendar as CalendarIcon,
  Folder,
  Command,
  Tag,
  Flame,
  AlignLeft,
  Clock,
  ArrowUp,
  Crosshair,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { GemIcon } from '@/components/icons/gem-icon';
import { Input } from './ui/input';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from './ui/separator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


interface TaskDetailsProps {
    task: Task | null;
    onClose: () => void;
}

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

export function TaskDetails({ task, onClose }: TaskDetailsProps) {
    const router = useRouter();
    const { areas, skills, updateTaskCompletion, updateTaskDetails } = useQuestData();
    const [editableTaskData, setEditableTaskData] = useState<Partial<Task>>({});
    const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);

    const selectableSkills = getFlattenedSkills(skills);

    useEffect(() => {
        if (task) {
            setEditableTaskData(task);
        }
    }, [task]);

    const { dialogArea, dialogProject } = useMemo(() => {
        if (!task) return { dialogArea: null, dialogProject: null };
        for (const a of areas) {
            const p = a.projects.find(p => p.id === task.projectId);
            if (p) return { dialogArea: a, dialogProject: p };
        }
        return { dialogArea: null, dialogProject: null };
    }, [task, areas]);
    
    const dialogSkill = useMemo(() => {
        if (!task?.skillId) return null;
        return findSkillRecursive(skills, task.skillId);
    }, [task, skills]);

    const handleTaskDataChange = (field: keyof Task, value: string | number | undefined | null) => {
        setEditableTaskData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleDetailBlur = (field: keyof Task) => {
        if(task && editableTaskData[field] !== task[field as keyof Task]) {
            updateTaskDetails(task.id, { [field]: editableTaskData[field] });
        }
    }

    const handleMarkdownBlur = () => {
        setIsEditingMarkdown(false);
        if (task && editableTaskData.markdown !== task.markdown) {
            updateTaskDetails(task.id, { markdown: editableTaskData.markdown });
        }
    }

    const handleFocusClick = () => {
        if (task) {
            onClose();
            router.push(`/focus?taskId=${task.id}`);
        }
    };

    const handleAreaChange = (newAreaId: string) => {
        if (!task) return;
        const newArea = areas.find(a => a.id === newAreaId);
        const newProjectId = newArea?.projects[0]?.id || null;
        updateTaskDetails(task.id, { projectId: newProjectId });
    };

    const handleProjectChange = (newProjectId: string) => {
        if (task) {
            updateTaskDetails(task.id, { projectId: newProjectId });
        }
    }
    
    const handleSkillChange = (newSkillId: string) => {
        if (task) {
            updateTaskDetails(task.id, { skillId: newSkillId === 'none' ? undefined : newSkillId });
        }
    }
    
    if (!task) return null;

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <VisuallyHidden>
                    <DialogTitle>Task Details</DialogTitle>
                    <DialogDescription>View and edit the details of your selected task.</DialogDescription>
                </VisuallyHidden>
            </DialogHeader>
            <div className="p-6 rounded-lg">
                <header className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
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
                    </div>
                </header>

                <div className="grid grid-cols-[120px_1fr] items-center gap-y-4 gap-x-6 text-sm">

                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Command className="h-4 w-4" /> Area</div>
                    <Select value={dialogArea?.id || ''} onValueChange={handleAreaChange}>
                        <SelectTrigger className="font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                            <SelectValue placeholder="Select an area" />
                        </SelectTrigger>
                        <SelectContent>
                            {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Folder className="h-4 w-4" /> Project</div>
                    <Select value={dialogProject?.id || ''} onValueChange={handleProjectChange} disabled={!dialogArea}>
                        <SelectTrigger className="font-semibold border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                            {dialogArea?.projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium"><Tag className="h-4 w-4" /> Skill Category</div>
                    <Select value={dialogSkill?.id || ''} onValueChange={handleSkillChange}>
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

                <div
                    onClick={() => setIsEditingMarkdown(true)}
                    className="prose dark:prose-invert min-h-[120px] w-full max-w-none rounded-lg p-2 cursor-text"
                >
                    {isEditingMarkdown ? (
                        <Textarea
                            autoFocus
                            id="markdown-editor"
                            value={editableTaskData.markdown || ''}
                            onChange={(e) => handleTaskDataChange('markdown', e.target.value)}
                            onBlur={handleMarkdownBlur}
                            placeholder="Write your note using Markdown..."
                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[120px] text-base"
                            rows={8}
                        />
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {editableTaskData.markdown || '*Click to add notes...*'}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
        </DialogContent>
    );
}

