
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Area, Task, Project, User } from '@/lib/types';
import { initialAreas, user as initialUser } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Briefcase } from 'lucide-react';

interface QuestContextType {
  areas: Area[];
  user: User;
  tasks: Task[];
  getAreaForProject: (projectId: string) => Area | undefined;
  updateTaskCompletion: (areaId: string, projectId: string, taskId: string, completed: boolean) => void;
  updateTaskDetails: (areaId: string, projectId: string, taskId: string, details: Partial<Omit<Task, 'id' | 'xp' | 'completed' | 'title'>>) => void;
  addArea: (name: string) => void;
  addProject: (areaId: string, name: string) => void;
  addTask: (areaId: string, projectId: string, task: Task) => void;
  updateUser: (newUserData: Partial<User>) => void;
  addXp: (xp: number, message?: string) => void;
  getTask: (taskId: string) => { task: Task; areaId: string; projectId: string } | null;
  startTaskTimer: (areaId: string, projectId: string, taskId: string) => void;
  endTaskTimer: (areaId: string, projectId: string, taskId: string) => void;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const QuestProvider = ({ children }: { children: ReactNode }) => {
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [user, setUser] = useState<User>(initialUser);
  const { toast } = useToast();

  const addXp = useCallback((xp: number, message?: string) => {
    setUser(currentUser => {
        const newXp = currentUser.xp + xp;
        const isLevelUp = newXp >= currentUser.nextLevelXp;
        const newLevel = isLevelUp ? currentUser.level + 1 : currentUser.level;
        const newNextLevelXp = isLevelUp ? currentUser.nextLevelXp * 2 : currentUser.nextLevelXp;
        
        if(isLevelUp) {
            toast({ title: "Level Up!", description: `Congratulations, you've reached level ${newLevel}!` });
        } else if (message) {
            toast({ title: "XP Gained!", description: message });
        }

        return {
            ...currentUser,
            xp: Math.max(0, newXp),
            level: newLevel,
            nextLevelXp: newNextLevelXp,
        };
    });
  }, [toast]);


  const updateTaskCompletion = useCallback((areaId: string, projectId: string, taskId: string, completed: boolean) => {
    let taskXp = 0;
    let taskTitle = '';

    const updatedAreas = areas.map((area) => {
      if (area.id === areaId) {
        return {
          ...area,
          projects: area.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                tasks: project.tasks.map((task) => {
                  if (task.id === taskId) {
                    taskXp = task.xp;
                    taskTitle = task.title;
                    return { ...task, completed };
                  }
                  return task;
                }),
              };
            }
            return project;
          }),
        };
      }
      return area;
    });

    setAreas(updatedAreas);
    
    if (completed) {
      addXp(taskXp);
      toast({
        title: 'Quest Complete!',
        description: `You earned ${taskXp} XP for "${taskTitle}"!`,
      });
    } else {
      setUser(prev => ({ ...prev, xp: Math.max(0, prev.xp - taskXp) }));
    }
  }, [areas, addXp, toast]);
  
  const addArea = (name: string) => {
    const newArea: Area = { id: `area-${Date.now()}`, name, icon: Briefcase, projects: [] };
    setAreas(prev => [...prev, newArea]);
  };

  const addProject = (areaId: string, name: string) => {
    const newProject: Project = { id: `proj-${Date.now()}`, name, tasks: [] };
    setAreas(prev =>
      prev.map(area =>
        area.id === areaId ? { ...area, projects: [...area.projects, newProject] } : area
      )
    );
  };
  
  const addTask = (areaId: string, projectId: string, task: Task) => {
    setAreas(prev =>
      prev.map(area =>
        area.id === areaId
          ? {
              ...area,
              projects: area.projects.map(project =>
                project.id === projectId
                  ? { ...project, tasks: [...project.tasks, task] }
                  : project
              ),
            }
          : area
      )
    );
    toast({ title: "Quest Created!", description: `AI has assigned ${task.xp} XP to your new quest.` });
  };
  
  const updateTaskDetails = (areaId: string, projectId: string, taskId: string, details: Partial<Omit<Task, 'id' | 'xp' | 'completed' | 'title'>>) => {
     setAreas(prev =>
      prev.map(area =>
        area.id === areaId
          ? {
              ...area,
              projects: area.projects.map(project =>
                project.id === projectId
                  ? {
                      ...project,
                      tasks: project.tasks.map(task =>
                        task.id === taskId ? { ...task, ...details } : task
                      ),
                    }
                  : project
              ),
            }
          : area
      )
    );
    toast({ title: 'Task Updated!', description: 'Your changes have been saved.' });
  };
  
  const updateUser = (newUserData: Partial<User>) => {
      setUser(prevUser => ({ ...prevUser, ...newUserData }));
      toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
  };

  const startTaskTimer = useCallback((areaId: string, projectId: string, taskId: string) => {
    setAreas(prev =>
      prev.map(area =>
        area.id === areaId
          ? {
              ...area,
              projects: area.projects.map(project =>
                project.id === projectId
                  ? {
                      ...project,
                      tasks: project.tasks.map(task =>
                        task.id === taskId ? { ...task, startDate: Date.now(), endDate: undefined } : task
                      ),
                    }
                  : project
              ),
            }
          : area
      )
    );
  }, []);

  const endTaskTimer = useCallback((areaId: string, projectId: string, taskId: string) => {
    setAreas(prev =>
      prev.map(area =>
        area.id === areaId
          ? {
              ...area,
              projects: area.projects.map(project =>
                project.id === projectId
                  ? {
                      ...project,
                      tasks: project.tasks.map(task =>
                        task.id === taskId ? { ...task, endDate: Date.now() } : task
                      ),
                    }
                  : project
              ),
            }
          : area
      )
    );
  }, []);

  const getTask = useCallback((taskId: string) => {
    for (const area of areas) {
      for (const project of area.projects) {
        const task = project.tasks.find(t => t.id === taskId);
        if (task) return { task, areaId: area.id, projectId: project.id };
      }
    }
    return null;
  }, [areas]);

  const getAreaForProject = useCallback((projectId: string) => {
    return areas.find(area => area.projects.some(p => p.id === projectId));
  }, [areas]);

  const allTasks = useMemo(() => areas.flatMap(area => area.projects.flatMap(p => p.tasks)), [areas]);
  
  const value = { areas, user, tasks: allTasks, getAreaForProject, updateTaskCompletion, updateTaskDetails, addArea, addProject, addTask, updateUser, addXp, getTask, startTaskTimer, endTaskTimer };

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};

export const useQuestData = () => {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuestData must be used within a QuestProvider');
  }
  return context;
};
