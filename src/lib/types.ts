export interface User {
  id: number;
  name: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  tokens: number;
  avatarUrl: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  points: number;
  maxPoints: number;
  icon: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Hard';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  xp: number;
  description?: string;
  notes?: string;
  links?: string;
  difficulty?: Difficulty;
  dueDate?: string;
  skillId?: string;
  focusDuration?: number;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  areaId: string;
}

export interface Area {
  id: string;
  name: string;
  icon: string;
  projects: Project[];
}

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

export interface WeeklyMission {
  id: string;
  title: string;
  description?: string;
  xp: number;
  tokens: number;
  completed: boolean;
  weekIdentifier: string;
}
