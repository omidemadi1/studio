
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Area, Task, Project, User, Skill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import * as QuestActions from '@/actions/quest-actions';

interface QuestContextType {
  areas: Area[];
  user: User;
  skills: Skill[];
  tasks: Task[];
  updateTaskCompletion: (taskId: string, completed: boolean, focusDuration?: number) => void;
  updateTaskDetails: (taskId: string, details: Partial<Task>) => void;
  addArea: (name: string) => void;
  addProject: (areaId: string, name: string) => void;
  addTask: (areaId: string, projectId: string, task: Task) => void;
  addSkill: (name: string, icon: string) => void;
  updateSkill: (id: string, name: string, icon: string) => void;
  deleteSkill: (id: string) => void;
  deleteProject: (id: string, areaId: string) => void;
  updateUser: (newUserData: Partial<User>) => void;
  addXp: (xp: number, message?: string) => void;
  getTask: (taskId: string) => { task: Task; areaId: string; projectId: string } | null;
  getAreaById: (areaId: string) => Area | undefined;
  getTasksByAreaId: (areaId: string) => Task[];
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const QuestProvider = ({ 
    children,
    initialAreas,
    initialUser,
    initialSkills,
}: { 
    children: ReactNode,
    initialAreas: Area[],
    initialUser: User,
    initialSkills: Skill[],
}) => {
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [user, setUser] = useState<User>(initialUser);
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setAreas(initialAreas);
  }, [initialAreas]);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    setSkills(initialSkills);
  }, [initialSkills]);

  const addXp = useCallback(async (xp: number, message?: string) => {
    const oldUser = user;
    const isLevelUp = oldUser.xp + xp >= oldUser.nextLevelXp;
    
    await QuestActions.addXp(xp);
    
    if (message) {
        toast({ title: "XP Gained!", description: message });
    }
    if (isLevelUp) {
        toast({ title: "Level Up!", description: `Congratulations, you've reached level ${oldUser.level + 1}!` });
    }

    router.refresh();
  }, [user, toast, router]);


  const getTask = useCallback((taskId: string) => {
    for (const area of areas) {
      for (const project of area.projects) {
        const task = project.tasks.find(t => t.id === taskId);
        if (task) return { task, areaId: area.id, projectId: project.id };
      }
    }
    return null;
  }, [areas]);
  
  const getAreaById = useCallback((areaId: string) => {
    return areas.find(a => a.id === areaId);
  }, [areas]);

  const getTasksByAreaId = useCallback((areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    if (!area) return [];
    return area.projects.flatMap(p => p.tasks);
  }, [areas]);

  const updateTaskCompletion = useCallback(async (taskId: string, completed: boolean, focusDuration?: number) => {
    const taskData = getTask(taskId);
    if (!taskData) return;

    await QuestActions.updateTaskCompletion(taskId, completed, focusDuration);
    
    toast({
        title: completed ? 'Quest Complete!' : 'Quest Updated',
        description: completed ? `You earned ${taskData.task.xp} XP for "${taskData.task.title}"!` : 'Quest marked as incomplete.',
    });
    router.refresh();

  }, [getTask, toast, router]);
  
  const addArea = async (name: string) => {
    await QuestActions.addArea(name);
    toast({ title: 'Area Created', description: `New area "${name}" has been added.`});
    router.refresh();
  };

  const addProject = async (areaId: string, name: string) => {
    await QuestActions.addProject(areaId, name);
    toast({ title: 'Project Created', description: `New project "${name}" has been added.`});
    router.refresh();
  };
  
  const addTask = async (areaId: string, projectId: string, task: Task) => {
    await QuestActions.addTask(areaId, projectId, task);
    toast({ title: "Quest Created!", description: `AI has assigned ${task.xp} XP to your new quest.` });
    router.refresh();
  };
  
  const updateTaskDetails = async (taskId: string, details: Partial<Task>) => {
    await QuestActions.updateTaskDetails(taskId, details);
    router.refresh();
  };
  
  const updateUser = async (newUserData: Partial<User>) => {
      await QuestActions.updateUser(newUserData);
      toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
      router.refresh();
  };

  const addSkill = async (name: string, icon: string) => {
    await QuestActions.addSkill(name, icon);
    toast({ title: 'Skill Added', description: `New skill "${name}" is now ready to level up.` });
    router.refresh();
  };

  const updateSkill = async (id: string, name: string, icon: string) => {
    await QuestActions.updateSkill(id, name, icon);
    router.refresh();
  }

  const deleteSkill = async (id: string) => {
    await QuestActions.deleteSkill(id);
    router.refresh();
  }
  
  const deleteProject = async (id: string, areaId: string) => {
    await QuestActions.deleteProject(id, areaId);
    toast({ title: 'Project Deleted' });
    router.refresh();
  };

  const allTasks = useMemo(() => areas.flatMap(area => area.projects.flatMap(p => p.tasks)), [areas]);
  
  const value = { areas, user, skills, tasks: allTasks, updateTaskCompletion, updateTaskDetails, addArea, addProject, addTask, addSkill, updateSkill, deleteSkill, deleteProject, updateUser, addXp, getTask, getAreaById, getTasksByAreaId };

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};

export const useQuestData = () => {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuestData must be used within a QuestProvider');
  }
  return context;
};
