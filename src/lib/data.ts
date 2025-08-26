import 'server-only';
import { db } from './db';
import type { User, Area, Project, Task, Skill, MarketItem, WeeklyMission } from './types';
import { getWeek } from 'date-fns';

function withErrorHandling<T>(fn: () => T, fallback: T): T {
    try {
        return fn();
    } catch (error) {
        console.error("Database operation failed:", error);
        return fallback;
    }
}

export function getUser(): User {
    return withErrorHandling(() => {
        const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as User;
        return user;
    }, { 
        id: 1, 
        name: 'Error User', 
        level: 1, 
        xp: 0, 
        nextLevelXp: 100, 
        tokens: 0, 
        avatarUrl: '' 
    });
}

export function getSkills(): Skill[] {
    return withErrorHandling(() => {
        return db.prepare('SELECT * FROM skills').all() as Skill[];
    }, []);
}

export function getAreas(): Area[] {
    return withErrorHandling(() => {
        const areas = db.prepare('SELECT * FROM areas').all() as Area[];
        
        const projectsStmt = db.prepare('SELECT * FROM projects WHERE areaId = ?');
        const tasksStmt = db.prepare('SELECT * FROM tasks WHERE projectId = ?');

        return areas.map(area => {
            const projects = projectsStmt.all(area.id) as Project[];
            const projectsWithTasks = projects.map(project => {
                const tasks = tasksStmt.all(project.id).map(t => ({...t, completed: !!(t as any).completed})) as Task[];
                return { ...project, tasks };
            });
            return { ...area, projects: projectsWithTasks };
        });
    }, []);
}

export function getMarketItems(): MarketItem[] {
    return withErrorHandling(() => {
        return db.prepare('SELECT * FROM market_items').all() as MarketItem[];
    }, []);
}

export function getWeeklyMissions(): WeeklyMission[] {
    const year = new Date().getFullYear();
    const week = getWeek(new Date());
    const weekIdentifier = `${year}-${week}`;

    return withErrorHandling(() => {
        return db.prepare('SELECT * FROM weekly_missions WHERE weekIdentifier = ?').all(weekIdentifier) as WeeklyMission[];
    }, []);
}
