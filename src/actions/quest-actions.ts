
'use server'

import { revalidatePath } from 'next/cache'
import type { Task, User, Skill, Project, Area, WeeklyMission } from '@/lib/types'
import { getAreas, getSkills, getAllTasks, getUser } from '@/lib/data'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
import { getWeek } from 'date-fns';
import { suggestWeeklyMissions } from '@/ai/flows/suggest-weekly-missions';

async function apiPost(path: string, body: any) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function apiPut(path: string, body: any) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function apiDelete(path: string) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    return null;
}

export async function addArea(name: string, icon: string) {
    await apiPost('/api/areas', { name, icon });
    revalidatePath('/manager');
    return getAreas();
}

export async function updateArea(id: string, name: string, icon: string) {
    await apiPut(`/api/areas/${id}`, { name, icon });
    revalidatePath('/manager');
    revalidatePath(`/areas/${id}`);
    return getAreas();
}

export async function archiveArea(id: string, archived: boolean) {
    await apiPut(`/api/areas/${id}`, { archived });
    revalidatePath('/manager');
    revalidatePath(`/areas/${id}`);
    revalidatePath('/profile/archived');
    return getAreas();
}

export async function deleteArea(id: string) {
    await apiDelete(`/api/areas/${id}`);
    revalidatePath('/manager');
    return getAreas();
}

export async function addProject(areaId: string, name: string) {
    await apiPost('/api/projects', { name, areaId });
    revalidatePath(`/areas/${areaId}`);
    revalidatePath('/manager');
    return getAreas();
}

export async function updateProject(id: string, name: string) {
    await apiPut(`/api/projects/${id}`, { name });
    revalidatePath('/manager');
    const areas = await getAreas();
    areas.forEach(area => revalidatePath(`/areas/${area.id}`));
    return areas;
}

export async function addTask(task: Task, areaId?: string) {
    await apiPost('/api/tasks', task);
    if (areaId) revalidatePath(`/areas/${areaId}`);
    // Revalidate all skill paths (both old skillId and new skillIds)
    if (task.skillId) revalidatePath(`/skills/${task.skillId}`);
    if (task.skillIds && task.skillIds.length > 0) {
        task.skillIds.forEach(skillId => revalidatePath(`/skills/${skillId}`));
    }
    revalidatePath('/manager');
    revalidatePath('/dashboard');
    return { tasks: getAllTasks(), areas: getAreas() };
}

export async function deleteTask(id: string): Promise<{ tasks: Task[], areas: Area[] }> {
    await apiDelete(`/api/tasks/${id}`);
    revalidatePath('/manager');
    revalidatePath('/dashboard');
    const skills = await getSkills();
    skills.forEach(skill => revalidatePath(`/skills/${skill.id}`));
    const areas = await getAreas();
    areas.forEach(area => revalidatePath(`/areas/${area.id}`));
    return { tasks: getAllTasks(), areas: getAreas() };
}

export async function addSkill(name: string, icon: string, parentId?: string) {
    await apiPost('/api/skills', { name, icon, parentId, level: 1, points: 0, maxPoints: 1000 });
    revalidatePath('/profile');
    revalidatePath('/manager');
    if (parentId) revalidatePath(`/skills/${parentId}`);
    return getSkills();
}

// Skill leveling and related logic is now handled by the API. Keep client
// side actions simple and rely on server to perform complex updates.



export async function updateTaskCompletion(taskId: string, completed: boolean, focusDuration?: number, bonusXp?: number) {
  // Delegate complex task completion logic (XP, skills, user updates) to the API
  await apiPut(`/api/tasks/${taskId}`, { completed, focusDuration, bonusXp });
  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  revalidatePath('/focus');
  revalidatePath('/manager');

  const skills = await getSkills();
  const areas = await getAreas();
  skills.forEach(s => revalidatePath(`/skills/${s.id}`));
  areas.forEach(a => revalidatePath(`/areas/${a.id}`));

  return {
    skillId: undefined,
    skillLeveledUp: false,
    bonusXp: bonusXp || 0,
    tasks: getAllTasks(),
    user: getUser(),
    skills: getSkills(),
    areas: getAreas()
  };
}

export async function updateTaskDetails(taskId: string, details: Partial<Task>) {
    await apiPut(`/api/tasks/${taskId}`, details);
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/manager');
    if (details.skillId) revalidatePath(`/skills/${details.skillId}`);
    return { tasks: await getAllTasks(), areas: await getAreas() };
}

export async function updateUser(newUserData: Partial<User>) {
    await apiPut('/api/users/me', newUserData);
    revalidatePath('/profile');
    return getUser();
}

export async function updateSkill(id: string, name: string, icon: string) {
    await apiPut(`/api/skills/${id}`, { name, icon });
    revalidatePath('/profile');
    revalidatePath(`/skills/${id}`);
    revalidatePath('/manager');
    return getSkills();
}

export async function deleteSkill(id: string) {
    await apiDelete(`/api/skills/${id}`);
    revalidatePath('/profile');
    revalidatePath('/manager');
    return getSkills();
}

export async function deleteProject(id: string, areaId: string) {
    await apiDelete(`/api/projects/${id}`);
    revalidatePath(`/areas/${areaId}`);
    revalidatePath('/manager');
    return getAreas();
}


export async function addXp(xp: number, tokens?: number) {
  // Delegate XP updates to the API
  await apiPost('/api/users/xp', { xp, tokens });
  revalidatePath('/profile');
  revalidatePath('/focus');
  return getUser();
}

export async function resetDatabase() {
    // Not implemented in API-backed mode
    revalidatePath('/');
    return {
        user: getUser(),
        skills: getSkills(),
        tasks: getAllTasks(),
        areas: getAreas(),
        weeklyMissions: []
    };
}

export async function duplicateTask(taskId: string): Promise<{ tasks: Task[], areas: Area[] }> {
    // Delegate duplication logic to the API or leave as not-implemented.
    // For now, return current state.
    revalidatePath('/manager');
    revalidatePath('/dashboard');
    return { tasks: await getAllTasks(), areas: await getAreas() };
}


export async function duplicateProject(projectId: string) {
    // Not implemented server-side yet. Return current data.
    revalidatePath('/manager');
    return getAreas();
}

export async function duplicateArea(areaId: string) {
    // Not implemented server-side yet. Return current data.
    revalidatePath('/manager');
    return getAreas();
}

// Weekly Missions
export async function maybeGenerateWeeklyMissions(): Promise<WeeklyMission[]> {
    // Request AI-generated missions from the API
    const user = await getUser();
    const skills = await getSkills();
    const response = await fetch(`${API_BASE}/api/missions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: user.level, skills: skills.map(s => s.id) }),
    });
    if (!response.ok) {
        console.error('Failed to generate missions:', await response.text());
        return [];
    }
    const missions = await response.json();
    revalidatePath('/dashboard');
    return missions as WeeklyMission[];
}

export async function updateWeeklyMissionCompletion(missionId: string, completed: boolean) {
    await apiPut(`/api/missions/${missionId}`, { completed });
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return null;
}
