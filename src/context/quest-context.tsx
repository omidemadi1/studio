
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Area, Task, Project, User, Skill, WeeklyMission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

interface QuestContextType {
  areas: Area[];
  user: User;
  skills: Skill[];
  tasks: Task[];
  weeklyMissions: WeeklyMission[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  maybeGenerateWeeklyMissions: () => Promise<void>;
  updateWeeklyMissionCompletion: (missionId: string, completed: boolean) => Promise<void>;
  updateTaskCompletion: (taskId: string, completed: boolean, focusDuration?: number, bonusXp?: number) => Promise<void>;
  updateTaskDetails: (taskId: string, details: Partial<Task>) => Promise<void>;
  addArea: (name: string, icon: string) => Promise<void>;
  updateArea: (id: string, name: string, icon: string) => Promise<void>;
  archiveArea: (id: string, archived: boolean) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  addProject: (areaId: string, name: string) => Promise<void>;
  updateProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string, areaId: string) => Promise<void>;
  addTask: (task: Task, areaId?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addSkill: (name: string, icon: string, parentId?: string) => Promise<void>;
  updateSkill: (id: string, name: string, icon: string) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
  addXp: (xp: number, message?: string) => Promise<void>;
  getTask: (taskId: string) => { task: Task; areaId: string | null; projectId: string | null } | null;
  getAreaById: (areaId: string) => Area | undefined;
  getTasksByAreaId: (areaId: string) => Task[];
  resetDatabase: () => Promise<void>;
  duplicateArea: (areaId: string) => Promise<void>;
  duplicateProject: (projectId: string) => Promise<void>;
  duplicateTask: (taskId: string) => Promise<void>;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const QuestProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data from API
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [areasData, skillsData, tasksData, userData] = await Promise.all([
        apiClient.getAreas(),
        apiClient.getSkills(),
        apiClient.getTasks(),
        apiClient.getUser(),
      ]);

      setAreas(areasData);
      setSkills(skillsData);
      setTasks(tasksData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  // Load data on mount and when auth changes
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Helper functions for local state
  const getTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    if (task.projectId) {
      for (const area of areas) {
        const project = area.projects?.find(p => p.id === task.projectId);
        if (project) {
          return { task, areaId: area.id, projectId: project.id };
        }
      }
    }
    return { task, areaId: null, projectId: null };
  }, [areas, tasks]);
  
  const getAreaById = useCallback((areaId: string) => {
    return areas.find(a => a.id === areaId);
  }, [areas]);

  const getTasksByAreaId = useCallback((areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    if (!area) return [];
    return area.projects?.flatMap(p => p.tasks || []) || [];
  }, [areas]);

  // API methods
  const addXp = useCallback(async (xp: number, message?: string) => {
    if (!user) return;
    const oldUser = user;
    const isLevelUp = oldUser.xp + xp >= oldUser.nextLevelXp;
    
    // This would need a backend endpoint - for now just show toast
    if (message) {
        toast({ title: "XP Gained!", description: message });
    }
    if (isLevelUp) {
        toast({ title: "Level Up!", description: `Congratulations, you've reached level ${oldUser.level + 1}!` });
    }
  }, [user, toast]);

  const updateTaskCompletion = useCallback(async (taskId: string, completed: boolean, focusDuration?: number, bonusXp?: number) => {
    try {
      await apiClient.updateTask(taskId, { completed });
      await refreshData();
      
      const taskData = getTask(taskId);
      if (taskData) {
        const totalXpEarned = taskData.task.xp + (bonusXp || 0);
        toast({
          title: completed ? 'Quest Complete!' : 'Quest Updated',
          description: completed ? `You earned ${totalXpEarned} XP!` : 'Quest marked as incomplete.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  }, [getTask, toast, refreshData]);
  
  const addArea = async (name: string, icon: string) => {
    try {
      await apiClient.createArea({ name, icon });
      await refreshData();
      toast({ title: 'Area Created', description: `New area "${name}" has been added.`});
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create area', variant: 'destructive' });
    }
  };

  const updateArea = async (id: string, name: string, icon: string) => {
    try {
      await apiClient.updateArea(id, { name, icon });
      await refreshData();
      toast({ title: 'Area Updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update area', variant: 'destructive' });
    }
  };
  
  const archiveArea = async (id: string, archived: boolean) => {
    try {
      await apiClient.updateArea(id, { archived });
      await refreshData();
      toast({ title: archived ? 'Area Archived' : 'Area Unarchived' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive area', variant: 'destructive' });
    }
  };

  const deleteArea = async (id: string) => {
    try {
      await apiClient.deleteArea(id);
      await refreshData();
      toast({ title: 'Area Deleted', variant: "destructive" });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete area', variant: 'destructive' });
    }
  };

  const addProject = async (areaId: string, name: string) => {
    try {
      await apiClient.createProject({ name, areaId });
      await refreshData();
      toast({ title: 'Project Created', description: `New project "${name}" has been added.`});
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create project', variant: 'destructive' });
    }
  };

  const updateProject = async (id: string, name: string) => {
    try {
      await apiClient.updateProject(id, { name });
      await refreshData();
      toast({ title: 'Project Updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update project', variant: 'destructive' });
    }
  };
  
  const deleteProject = async (id: string, areaId: string) => {
    try {
      await apiClient.deleteProject(id);
      await refreshData();
      toast({ title: 'Project Deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
    }
  };

  const addTask = async (task: Task, areaId?: string) => {
    try {
      await apiClient.createTask(task);
      await refreshData();
      toast({ title: "Quest Created!", description: `AI has assigned ${task.xp} XP to your new quest.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await apiClient.deleteTask(id);
      await refreshData();
      toast({ title: 'Task Deleted', variant: "destructive" });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  };
  
  const updateTaskDetails = async (taskId: string, details: Partial<Task>) => {
    try {
      await apiClient.updateTask(taskId, details);
      await refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };
  
  const updateUser = async (newUserData: Partial<User>) => {
    try {
      await apiClient.updateUser(newUserData);
      await refreshData();
      toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    }
  };

  const addSkill = async (name: string, icon: string, parentId?: string) => {
    try {
      await apiClient.createSkill({ name, icon, parentId, level: 1, points: 0, maxPoints: 1000 });
      await refreshData();
      toast({ title: 'Skill Added', description: `New skill "${name}" is now ready to level up.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create skill', variant: 'destructive' });
    }
  };

  const updateSkill = async (id: string, name: string, icon: string) => {
    try {
      await apiClient.updateSkill(id, { name, icon });
      await refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update skill', variant: 'destructive' });
    }
  }

  const deleteSkill = async (id: string) => {
    try {
      await apiClient.deleteSkill(id);
      await refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete skill', variant: 'destructive' });
    }
  }

  const resetDatabase = async () => {
    toast({ title: 'Not Implemented', description: 'Reset database is not available in API mode.' });
  }

  const duplicateArea = async (areaId: string) => {
    toast({ title: 'Not Implemented', description: 'Duplicate area is not yet implemented.' });
  }

  const duplicateProject = async (projectId: string) => {
    toast({ title: 'Not Implemented', description: 'Duplicate project is not yet implemented.' });
  }

  const duplicateTask = async (taskId: string) => {
    toast({ title: 'Not Implemented', description: 'Duplicate task is not yet implemented.' });
  }

  const maybeGenerateWeeklyMissions = useCallback(async () => {
    // Weekly missions would need backend support
    toast({ title: 'Not Implemented', description: 'Weekly missions are not yet implemented.' });
  }, [toast]);

  const updateWeeklyMissionCompletion = useCallback(async (missionId: string, completed: boolean) => {
    // Weekly missions would need backend support
    toast({ title: 'Not Implemented', description: 'Weekly missions are not yet implemented.' });
  }, [toast]);

  const value = { 
    areas, 
    user: user || {
      id: 0,
      name: 'Loading...',
      email: '',
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      tokens: 0,
      avatarUrl: '',
    }, 
    skills, 
    tasks,
    weeklyMissions,
    isLoading,
    refreshData,
    maybeGenerateWeeklyMissions,
    updateWeeklyMissionCompletion,
    updateTaskCompletion, 
    updateTaskDetails, 
    addArea, 
    updateArea, 
    archiveArea,
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
