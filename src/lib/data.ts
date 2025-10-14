import 'server-only';
import type { User, Area, Project, Task, Skill, MarketItem, WeeklyMission } from './types';
import { getWeek } from 'date-fns';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) {
        console.error('API GET failed', path, await res.text());
        return Promise.reject(new Error(`API GET ${path} failed`));
    }
    return res.json();
}

export async function getUser(): Promise<User> {
    return apiGet<User>('/api/users/me');
}

export async function getSkills(): Promise<Skill[]> {
    return apiGet<Skill[]>('/api/skills');
}

export async function getAllTasks(): Promise<Task[]> {
    return apiGet<Task[]>('/api/tasks');
}

export async function getAreas(): Promise<Area[]> {
    return apiGet<Area[]>('/api/areas');
}

export async function getArchivedAreas(): Promise<Area[]> {
    // API doesn't have a dedicated archived list endpoint; filter client-side
    const all = await getAreas();
    return all.filter(a => a.archived);
}

export async function getMarketItems(): Promise<MarketItem[]> {
    return apiGet<MarketItem[]>('/api/market');
}

export async function getWeeklyMissions(): Promise<WeeklyMission[]> {
    const year = new Date().getFullYear();
    const week = getWeek(new Date());
    const weekIdentifier = `${year}-${week}`;
    // Try to call the API endpoint for missions
    return apiGet<WeeklyMission[]>('/api/missions');
}
export function getAllTasks(): Task[] {

