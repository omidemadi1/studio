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

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  xp: number;
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

export interface DailyMission {
    id: string;
    title: string;
    xp: number;
    tokens: number;
}

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}
