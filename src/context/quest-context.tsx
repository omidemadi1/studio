
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Area, Task, Project, User, Skill, WeeklyMission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import * as QuestActions from '@/actions/quest-actions';

interface QuestContextType {
  areas: Area[];
  user: User;
  skills: Skill[];
  tasks: Task[];
  weeklyMissions: WeeklyMission[];
  maybeGenerateWeeklyMissions: () => Promise<void>;
  updateWeeklyMissionCompletion: (missionId: string, completed: boolean) => void;
  updateTaskCompletion: (taskId: string, completed: boolean, focusDuration?: number, bonusXp?: number) => void;
  updateTaskDetails: (taskId: string, details: Partial<Task>) => void;
  addArea: (name: string, icon: string) => void;
  updateArea: (id: string, name: string, icon: string) => void;
  deleteArea: (id: string) => void;
  addProject: (areaId: string, name: string) => void;
  updateProject: (id: string, name: string) => void;
  deleteProject: (id: string, areaId: string) => void;
  addTask: (task: Task, areaId?: string) => void;
  deleteTask: (id: string) => void;
  addSkill: (name: string, icon: string, parentId?: string) => void;
  updateSkill: (id: string, name: string, icon: string) => void;
  deleteSkill: (id: string) => void;
  updateUser: (newUserData: Partial<User>) => void;
  addXp: (xp: number, message?: string) => void;
  getTask: (taskId: string) => { task: Task; areaId: string | null; projectId: string | null } | null;
  getAreaById: (areaId: string) => Area | undefined;
  getTasksByAreaId: (areaId: string) => Task[];
  resetDatabase: () => void;
  duplicateArea: (areaId: string) => void;
  duplicateProject: (projectId: string) => void;
  duplicateTask: (taskId: string) => void;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const QuestProvider = ({ 
    children,
    initialAreas,
    initialUser,
    initialSkills,
    initialWeeklyMissions,
    initialTasks
}: { 
    children: ReactNode,
    initialAreas: Area[],
    initialUser: User,
    initialSkills: Skill[],
    initialWeeklyMissions: WeeklyMission[],
    initialTasks: Task[],
}) => {
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [user, setUser] = useState<User>(initialUser);
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>(initialWeeklyMissions);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
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

  useEffect(() => {
    setWeeklyMissions(initialWeeklyMissions);
  }, [initialWeeklyMissions]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    if (task.projectId) {
      for (const area of areas) {
        const project = area.projects.find(p => p.id === task.projectId);
        if (project) {
          return { task, areaId: area.id, projectId: project.id };
        }
      }
    }
    
    // Task without a project
    return { task, areaId: null, projectId: null };
  }, [areas, tasks]);
  
  const getAreaById = useCallback((areaId: string) => {
    return areas.find(a => a.id === areaId);
  }, [areas]);

  const getTasksByAreaId = useCallback((areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    if (!area) return [];
    return area.projects.flatMap(p => p.tasks);
  }, [areas]);

  const updateTaskCompletion = useCallback(async (taskId: string, completed: boolean, focusDuration?: number, bonusXp?: number) => {
    const taskData = getTask(taskId);
    if (!taskData) return;

    const result = await QuestActions.updateTaskCompletion(taskId, completed, focusDuration, bonusXp);
    
    const totalXpEarned = taskData.task.xp + (bonusXp || 0);

    toast({
        title: completed ? 'Quest Complete!' : 'Quest Updated',
        description: completed ? `You earned ${totalXpEarned} XP for "${taskData.task.title}"!` : 'Quest marked as incomplete.',
    });
    
    // We need to flatten skills to find the one that leveled up
    const findSkill = (skills: Skill[], skillId: string | undefined): Skill | undefined => {
        if (!skillId) return undefined;
        for (const s of skills) {
            if (s.id === skillId) return s;
            if (s.subSkills) {
                const found = findSkill(s.subSkills, skillId);
                if (found) return found;
            }
        }
        return undefined;
    }

    if (result?.skillLeveledUp) {
        const skill = findSkill(skills, result.skillId);
        if (skill) {
            toast({
                title: "Skill Level Up!",
                description: `${skill.name} has reached level ${skill.level + 1}!`
            });
        }
    }

    router.refresh();

  }, [getTask, toast, router, skills]);
  
  const addArea = async (name: string, icon: string) => {
    await QuestActions.addArea(name, icon);
    toast({ title: 'Area Created', description: `New area "${name}" has been added.`});
    router.refresh();
  };

  const updateArea = async (id: string, name: string, icon: string) => {
    await QuestActions.updateArea(id, name, icon);
    toast({ title: 'Area Updated' });
    router.refresh();
  };

  const deleteArea = async (id: string) => {
    await QuestActions.deleteArea(id);
    toast({ title: 'Area Deleted', variant: "destructive" });
    router.refresh();
  };

  const addProject = async (areaId: string, name: string) => {
    await QuestActions.addProject(areaId, name);
    toast({ title: 'Project Created', description: `New project "${name}" has been added.`});
    router.refresh();
  };

  const updateProject = async (id: string, name: string) => {
    await QuestActions.updateProject(id, name);
    toast({ title: 'Project Updated' });
    router.refresh();
  };
  
  const deleteProject = async (id: string, areaId: string) => {
    await QuestActions.deleteProject(id, areaId);
    toast({ title: 'Project Deleted' });
    router.refresh();
  };

  const addTask = async (task: Task, areaId?: string) => {
    await QuestActions.addTask(task, areaId);
    toast({ title: "Quest Created!", description: `AI has assigned ${task.xp} XP to your new quest.` });
    router.refresh();
  };

  const deleteTask = async (id: string) => {
    await QuestActions.deleteTask(id);
    toast({ title: 'Task Deleted', variant: "destructive" });
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

  const addSkill = async (name: string, icon: string, parentId?: string) => {
    await QuestActions.addSkill(name, icon, parentId);
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

  const resetDatabase = async () => {
    await QuestActions.resetDatabase();
    toast({ title: 'Data Reset', description: 'All your data has been wiped clean.' });
    router.refresh();
  }

  const duplicateArea = async (areaId: string) => {
    await QuestActions.duplicateArea(areaId);
    toast({ title: 'Area Duplicated' });
    router.refresh();
  }

  const duplicateProject = async (projectId: string) => {
    await QuestActions.duplicateProject(projectId);
    toast({ title: 'Project Duplicated' });
    router.refresh();
  }

  const duplicateTask = async (taskId: string) => {
    await QuestActions.duplicateTask(taskId);
    toast({ title: 'Task Duplicated' });
    router.refresh();
  }

  const maybeGenerateWeeklyMissions = useCallback(async () => {
    const newMissions = await QuestActions.maybeGenerateWeeklyMissions();
    setWeeklyMissions(newMissions);
  }, []);

  const updateWeeklyMissionCompletion = useCallback(async (missionId: string, completed: boolean) => {
      const result = await QuestActions.updateWeeklyMissionCompletion(missionId, completed);
      if (result) {
          toast({
              title: "Mission Complete!",
              description: `You earned ${result.xp} XP and ${result.tokens} tokens!`
          });
          if (result.leveledUp) {
              toast({
                  title: "Level Up!",
                  description: `Congratulations, you've reached a new level!`
              });
          }
      }
      router.refresh();
  }, [toast, router]);

  const value = { 
    areas, 
    user, 
    skills, 
    tasks,
    weeklyMissions,
    maybeGenerateWeeklyMissions,
    updateWeeklyMissionCompletion,
    updateTaskCompletion, 
    updateTaskDetails, 
    addArea, 
    updateArea, 
    deleteArea, 
    addProject, 
    updateProject, 
    deleteProject, 
    addTask, 
    deleteTask, 
    addSkill, 
    updateSkill, 
    deleteSkill, 
    updateUser, 
    addXp, 
    getTask, 
    getAreaById, 
    getTasksByAreaId, 
    resetDatabase, 
    duplicateArea, 
    duplicateProject, 
    duplicateTask 
  };

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};

export const useQuestData = () => {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuestData must be used within a QuestProvider');
  }
  return context;
};
