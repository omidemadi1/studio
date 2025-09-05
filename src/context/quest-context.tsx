
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Area, Task, Project, User, Skill, WeeklyMission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as QuestActions from '@/actions/quest-actions';

interface QuestContextType {
  areas: Area[];
  user: User;
  skills: Skill[];
  tasks: Task[];
  weeklyMissions: WeeklyMission[];
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

  useEffect(() => setAreas(initialAreas), [initialAreas]);
  useEffect(() => setUser(initialUser), [initialUser]);
  useEffect(() => setSkills(initialSkills), [initialSkills]);
  useEffect(() => setWeeklyMissions(initialWeeklyMissions), [initialWeeklyMissions]);
  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const addXp = useCallback(async (xp: number, message?: string) => {
    const oldUser = user;
    const isLevelUp = oldUser.xp + xp >= oldUser.nextLevelXp;
    
    const updatedUser = await QuestActions.addXp(xp);
    setUser(updatedUser);
    
    if (message) {
        toast({ title: "XP Gained!", description: message });
    }
    if (isLevelUp) {
        toast({ title: "Level Up!", description: `Congratulations, you've reached level ${oldUser.level + 1}!` });
    }
  }, [user, toast]);

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
    
    if(result) {
        setUser(result.user);
        setTasks(result.tasks);
        setSkills(result.skills);
        setAreas(result.areas);

        const totalXpEarned = taskData.task.xp + (bonusXp || 0);
        toast({
            title: completed ? 'Quest Complete!' : 'Quest Updated',
            description: completed ? `You earned ${totalXpEarned} XP for "${taskData.task.title}"!` : 'Quest marked as incomplete.',
        });
        
        const findSkill = (skillList: Skill[], skillId: string | undefined): Skill | undefined => {
            if (!skillId) return undefined;
            for (const s of skillList) {
                if (s.id === skillId) return s;
                if (s.subSkills) {
                    const found = findSkill(s.subSkills, skillId);
                    if (found) return found;
                }
            }
            return undefined;
        }

        if (result.skillLeveledUp) {
            const skill = findSkill(skills, result.skillId);
            const updatedSkill = findSkill(result.skills, result.skillId);
            if (skill && updatedSkill) {
                toast({
                    title: "Skill Level Up!",
                    description: `${skill.name} has reached level ${updatedSkill.level}!`
                });
            }
        }
    }
  }, [getTask, toast, skills]);
  
  const addArea = async (name: string, icon: string) => {
    const updatedAreas = await QuestActions.addArea(name, icon);
    setAreas(updatedAreas);
    toast({ title: 'Area Created', description: `New area "${name}" has been added.`});
  };

  const updateArea = async (id: string, name: string, icon: string) => {
    const updatedAreas = await QuestActions.updateArea(id, name, icon);
    setAreas(updatedAreas);
    toast({ title: 'Area Updated' });
  };
  
  const archiveArea = async (id: string, archived: boolean) => {
    const updatedAreas = await QuestActions.archiveArea(id, archived);
    setAreas(updatedAreas);
    toast({ title: archived ? 'Area Archived' : 'Area Unarchived' });
  };

  const deleteArea = async (id: string) => {
    const updatedAreas = await QuestActions.deleteArea(id);
    setAreas(updatedAreas);
    toast({ title: 'Area Deleted', variant: "destructive" });
  };

  const addProject = async (areaId: string, name: string) => {
    const updatedAreas = await QuestActions.addProject(areaId, name);
    setAreas(updatedAreas);
    toast({ title: 'Project Created', description: `New project "${name}" has been added.`});
  };

  const updateProject = async (id: string, name: string) => {
    const updatedAreas = await QuestActions.updateProject(id, name);
    setAreas(updatedAreas);
    toast({ title: 'Project Updated' });
  };
  
  const deleteProject = async (id: string, areaId: string) => {
    const updatedAreas = await QuestActions.deleteProject(id, areaId);
    setAreas(updatedAreas);
    toast({ title: 'Project Deleted' });
  };

  const addTask = async (task: Task, areaId?: string) => {
    const { tasks: updatedTasks, areas: updatedAreas } = await QuestActions.addTask(task, areaId);
    setTasks(updatedTasks);
    setAreas(updatedAreas);
    toast({ title: "Quest Created!", description: `AI has assigned ${task.xp} XP to your new quest.` });
  };

  const deleteTask = async (id: string) => {
    const { tasks: updatedTasks, areas: updatedAreas } = await QuestActions.deleteTask(id);
    setTasks(updatedTasks);
    setAreas(updatedAreas);
    toast({ title: 'Task Deleted', variant: "destructive" });
  };
  
  const updateTaskDetails = async (taskId: string, details: Partial<Task>) => {
    const { tasks: updatedTasks, areas: updatedAreas } = await QuestActions.updateTaskDetails(taskId, details);
    setTasks(updatedTasks);
    setAreas(updatedAreas);
  };
  
  const updateUser = async (newUserData: Partial<User>) => {
      const updatedUser = await QuestActions.updateUser(newUserData);
      setUser(updatedUser);
      toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
  };

  const addSkill = async (name: string, icon: string, parentId?: string) => {
    const updatedSkills = await QuestActions.addSkill(name, icon, parentId);
    setSkills(updatedSkills);
    toast({ title: 'Skill Added', description: `New skill "${name}" is now ready to level up.` });
  };

  const updateSkill = async (id: string, name: string, icon: string) => {
    const updatedSkills = await QuestActions.updateSkill(id, name, icon);
    setSkills(updatedSkills);
  }

  const deleteSkill = async (id: string) => {
    const updatedSkills = await QuestActions.deleteSkill(id);
    setSkills(updatedSkills);
  }

  const resetDatabase = async () => {
    const result = await QuestActions.resetDatabase();
    setUser(result.user);
    setSkills(result.skills);
    setTasks(result.tasks);
    setAreas(result.areas);
    setWeeklyMissions(result.weeklyMissions);
    toast({ title: 'Data Reset', description: 'All your data has been wiped clean.' });
  }

  const duplicateArea = async (areaId: string) => {
    const updatedAreas = await QuestActions.duplicateArea(areaId);
    setAreas(updatedAreas);
    toast({ title: 'Area Duplicated' });
  }

  const duplicateProject = async (projectId: string) => {
    const updatedAreas = await QuestActions.duplicateProject(projectId);
    setAreas(updatedAreas);
    toast({ title: 'Project Duplicated' });
  }

  const duplicateTask = async (taskId: string) => {
    const { tasks: updatedTasks, areas: updatedAreas } = await QuestActions.duplicateTask(taskId);
    setTasks(updatedTasks);
    setAreas(updatedAreas);
    toast({ title: 'Task Duplicated' });
  }

  const maybeGenerateWeeklyMissions = useCallback(async () => {
    const newMissions = await QuestActions.maybeGenerateWeeklyMissions();
    setWeeklyMissions(newMissions);
  }, []);

  const updateWeeklyMissionCompletion = useCallback(async (missionId: string, completed: boolean) => {
      const result = await QuestActions.updateWeeklyMissionCompletion(missionId, completed);
      if (result) {
          setUser(result.user);
          const updatedMissions = weeklyMissions.map(m => m.id === missionId ? { ...m, completed } : m);
          setWeeklyMissions(updatedMissions);
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
  }, [toast, weeklyMissions]);

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
