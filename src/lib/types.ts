import type { LucideIcon } from 'lucide-react';

export interface User {
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
  icon: LucideIcon;
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
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Area {
  id: string;
  name: string;
  icon: LucideIcon;
  projects: Project[];
}

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}
