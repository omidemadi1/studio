'use server'

import { db } from '@/lib/db'
import type { Task, User } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function addArea(name: string) {
  const id = `area-${Date.now()}`
  // 'Briefcase' is used as a default icon
  db.prepare('INSERT INTO areas (id, name, icon) VALUES (?, ?, ?)').run(id, name, 'Briefcase')
  revalidatePath('/')
}

export async function addProject(areaId: string, name: string) {
  const id = `proj-${Date.now()}`
  db.prepare('INSERT INTO projects (id, name, areaId) VALUES (?, ?, ?)').run(id, name, areaId)
  revalidatePath('/')
}

export async function addTask(areaId: string, projectId: string, task: Task) {
    db.prepare('INSERT INTO tasks (id, title, completed, xp, description, notes, links, difficulty, dueDate, skillId, focusDuration, projectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(task.id, task.title, task.completed ? 1 : 0, task.xp, task.description, task.notes, task.links, task.difficulty, task.dueDate, task.skillId, task.focusDuration || 0, projectId);
    revalidatePath('/');
}

export async function addSkill(name: string, icon: string) {
  const id = `skill-${Date.now()}`;
  db.prepare(
    'INSERT INTO skills (id, name, level, points, maxPoints, icon) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, 1, 0, 1000, icon);
  revalidatePath('/profile');
  revalidatePath('/');
}

export async function updateTaskCompletion(taskId: string, completed: boolean, focusDuration?: number) {
    const transaction = db.transaction(() => {
        if (focusDuration) {
            db.prepare('UPDATE tasks SET completed = ?, focusDuration = (focusDuration + ?) WHERE id = ?').run(completed ? 1 : 0, focusDuration, taskId);
        } else {
            db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(completed ? 1 : 0, taskId);
        }

        const task = db.prepare('SELECT xp FROM tasks WHERE id = ?').get(taskId) as Task;
        if (task) {
            const xpChange = completed ? task.xp : -task.xp;
            
            const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as User;
            if (!user) return;

            const newXp = user.xp + xpChange;
            let newLevel = user.level;
            let newNextLevelXp = user.nextLevelXp;

            // Handle Level Up
            if (completed && newXp >= user.nextLevelXp) {
                newLevel = user.level + 1;
                newNextLevelXp = user.nextLevelXp * 2;
            }
            
            db.prepare('UPDATE users SET xp = ?, level = ?, nextLevelXp = ? WHERE id = 1').run(newXp, newLevel, newNextLevelXp);
        }
    });
    
    transaction();
    revalidatePath('/')
    revalidatePath('/profile');
    revalidatePath('/focus');
}

export async function updateTaskDetails(taskId: string, details: Partial<Task>) {
  const { description, notes, links, dueDate } = details;
  db.prepare('UPDATE tasks SET description = ?, notes = ?, links = ?, dueDate = ? WHERE id = ?')
    .run(description, notes, links, dueDate, taskId);
  revalidatePath('/');
}

export async function updateUser(newUserData: Partial<User>) {
    const { name, avatarUrl } = newUserData;
    db.prepare('UPDATE users SET name = ?, avatarUrl = ? WHERE id = 1').run(name, avatarUrl);
    revalidatePath('/profile');
}

export async function addXp(xp: number) {
    const transaction = db.transaction(() => {
        const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as User;
        if (!user) return;

        const newXp = user.xp + xp;
        let newLevel = user.level;
        let newNextLevelXp = user.nextLevelXp;

        if (newXp >= user.nextLevelXp) {
            newLevel = user.level + 1;
            newNextLevelXp = user.nextLevelXp * 2;
        }
        
        db.prepare('UPDATE users SET xp = ?, level = ?, nextLevelXp = ? WHERE id = 1').run(newXp, newLevel, newNextLevelXp);
    });

    transaction();
    revalidatePath('/profile');
    revalidatePath('/focus');
}
