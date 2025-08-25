
'use server'

import { db, resetDbFile } from '@/lib/db'
import type { Task, User, Skill, Project, Area } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function addArea(name: string) {
  const id = `area-${Date.now()}`
  // 'Briefcase' is used as a default icon
  db.prepare('INSERT INTO areas (id, name, icon) VALUES (?, ?, ?)').run(id, name, 'Briefcase')
  revalidatePath('/')
  revalidatePath('/areas')
}

export async function updateArea(id: string, name: string) {
  db.prepare('UPDATE areas SET name = ? WHERE id = ?').run(name, id);
  revalidatePath('/');
  revalidatePath(`/areas/${id}`);
}

export async function deleteArea(id: string) {
    db.prepare('DELETE FROM areas WHERE id = ?').run(id);
    revalidatePath('/');
}

export async function addProject(areaId: string, name: string) {
  const id = `proj-${Date.now()}`
  db.prepare('INSERT INTO projects (id, name, areaId) VALUES (?, ?, ?)').run(id, name, areaId)
  revalidatePath(`/areas/${areaId}`)
  revalidatePath('/')
}

export async function updateProject(id: string, name: string) {
    db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name, id);
    revalidatePath('/');
    // We don't know the areaId here, so we can't revalidate the specific area page.
    // A full revalidation might be needed, or the areaId needs to be passed.
    // For now, revalidating the home page should be sufficient.
}

export async function addTask(areaId: string, projectId: string, task: Task) {
    db.prepare('INSERT INTO tasks (id, title, completed, xp, description, notes, links, difficulty, dueDate, skillId, focusDuration, projectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(task.id, task.title, task.completed ? 1 : 0, task.xp, task.description, task.notes, task.links, task.difficulty, task.dueDate, task.skillId, task.focusDuration || 0, projectId);
    revalidatePath(`/areas/${areaId}`);
    revalidatePath(`/skills/${task.skillId}`);
    revalidatePath('/');
}

export async function deleteTask(id: string) {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
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
        let skillIdToRevalidate: string | undefined;
        let skillLeveledUp = false;

        if (focusDuration) {
            db.prepare('UPDATE tasks SET completed = ?, focusDuration = (focusDuration + ?) WHERE id = ?').run(completed ? 1 : 0, focusDuration, taskId);
        } else {
            db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(completed ? 1 : 0, taskId);
        }

        const task = db.prepare('SELECT xp, skillId FROM tasks WHERE id = ?').get(taskId) as Task;
        if (task) {
            const xpChange = completed ? task.xp : -task.xp;
            skillIdToRevalidate = task.skillId;
            
            // Update user XP and level
            const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as User;
            if (user) {
                const newXp = user.xp + xpChange;
                let newLevel = user.level;
                let newNextLevelXp = user.nextLevelXp;
                if (completed && newXp >= user.nextLevelXp) {
                    newLevel = user.level + 1;
                    newNextLevelXp = user.nextLevelXp * 2;
                } else if (!completed && newXp < user.nextLevelXp / 2 && newLevel > 1) {
                    newLevel = user.level -1;
                    newNextLevelXp = user.nextLevelXp / 2;
                }
                db.prepare('UPDATE users SET xp = ?, level = ?, nextLevelXp = ? WHERE id = 1').run(newXp, newLevel, newNextLevelXp);
            }

            // Update skill points and level
            if (task.skillId) {
                const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(task.skillId) as Skill;
                if (skill) {
                    let newPoints = skill.points + xpChange;
                    let newSkillLevel = skill.level;
                    let newMaxPoints = skill.maxPoints;

                    if (completed && newPoints >= skill.maxPoints) {
                        newSkillLevel = skill.level + 1;
                        newMaxPoints = Math.floor(skill.maxPoints * 1.5);
                        skillLeveledUp = true;
                    } else if (!completed && newPoints < 0 && newSkillLevel > 1) {
                        // De-leveling logic
                        const prevMaxPoints = Math.ceil(skill.maxPoints / 1.5);
                        newSkillLevel = skill.level - 1;
                        newMaxPoints = prevMaxPoints;
                        newPoints = prevMaxPoints + newPoints; // newPoints is negative here
                    }
                    
                    db.prepare('UPDATE skills SET points = ?, level = ?, maxPoints = ? WHERE id = ?')
                      .run(newPoints, newSkillLevel, newMaxPoints, task.skillId);
                }
            }
        }
        return { skillId: skillIdToRevalidate, skillLeveledUp };
    });
    
    const result = transaction();

    revalidatePath('/')
    revalidatePath('/profile');
    revalidatePath('/focus');
    if (result && result.skillId) {
        revalidatePath(`/skills/${result.skillId}`);
    }

    return result;
}

export async function updateTaskDetails(taskId: string, details: Partial<Task>) {
  const { title, description, notes, links, dueDate, skillId } = details;
  const oldTask = db.prepare('SELECT skillId FROM tasks WHERE id = ?').get(taskId) as Task;
  
  const updates: string[] = [];
  const params: (string|number|null|undefined)[] = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }
  if (links !== undefined) {
    updates.push('links = ?');
    params.push(links);
  }
  if (dueDate !== undefined) {
    updates.push('dueDate = ?');
    params.push(dueDate);
  }
  if (skillId !== undefined) {
    updates.push('skillId = ?');
    params.push(skillId);
  }
  
  if (updates.length > 0) {
    params.push(taskId);
    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);
  }
  
  revalidatePath('/');
  if (oldTask?.skillId) revalidatePath(`/skills/${oldTask.skillId}`);
  if (skillId && skillId !== oldTask?.skillId) revalidatePath(`/skills/${skillId}`);
}

export async function updateUser(newUserData: Partial<User>) {
    const { name, avatarUrl } = newUserData;
    db.prepare('UPDATE users SET name = ?, avatarUrl = ? WHERE id = 1').run(name, avatarUrl);
    revalidatePath('/profile');
}

export async function updateSkill(id: string, name: string, icon: string) {
    db.prepare('UPDATE skills SET name = ?, icon = ? WHERE id = ?').run(name, icon, id);
    revalidatePath('/profile');
    revalidatePath(`/skills/${id}`);
}

export async function deleteSkill(id: string) {
    // Set skillId to null for tasks that use this skill
    db.prepare('UPDATE tasks SET skillId = NULL WHERE skillId = ?').run(id);
    db.prepare('DELETE FROM skills WHERE id = ?').run(id);
    revalidatePath('/profile');
    revalidatePath('/');
}

export async function deleteProject(id: string, areaId: string) {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    revalidatePath(`/areas/${areaId}`);
    revalidatePath('/');
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

export async function resetDatabase() {
    resetDbFile();
    revalidatePath('/');
}

const duplicateTaskTransaction = db.transaction((task: Task, newProjectId: string) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask = { ...task, id: newTaskId, projectId: newProjectId, title: `${task.title} (copy)` };
    db.prepare('INSERT INTO tasks (id, title, completed, xp, description, notes, links, difficulty, dueDate, skillId, focusDuration, projectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(newTask.id, newTask.title, newTask.completed ? 1 : 0, newTask.xp, newTask.description, newTask.notes, newTask.links, newTask.difficulty, newTask.dueDate, newTask.skillId, newTask.focusDuration || 0, newProjectId);
});

const duplicateProjectTransaction = db.transaction((project: Project, newAreaId: string) => {
    const newProjectId = `proj-${Date.now()}`;
    const newProject = { ...project, id: newProjectId, areaId: newAreaId, name: `${project.name} (copy)` };
    db.prepare('INSERT INTO projects (id, name, areaId) VALUES (?, ?, ?)').run(newProject.id, newProject.name, newProject.areaId);

    const tasks = db.prepare('SELECT * FROM tasks WHERE projectId = ?').all(project.id) as Task[];
    for (const task of tasks) {
        duplicateTaskTransaction(task, newProjectId);
    }
});

export async function duplicateTask(taskId: string) {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;
    if (task) {
        duplicateTaskTransaction(task, task.projectId);
        revalidatePath('/');
    }
}

export async function duplicateProject(projectId: string) {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as Project;
    if (project) {
        duplicateProjectTransaction(project, project.areaId);
        revalidatePath('/');
    }
}

export async function duplicateArea(areaId: string) {
    const transaction = db.transaction(() => {
        const area = db.prepare('SELECT * FROM areas WHERE id = ?').get(areaId) as Area;
        if (!area) return;

        const newAreaId = `area-${Date.now()}`;
        const newAreaName = `${area.name} (copy)`;
        db.prepare('INSERT INTO areas (id, name, icon) VALUES (?, ?, ?)').run(newAreaId, newAreaName, area.icon);

        const projects = db.prepare('SELECT * FROM projects WHERE areaId = ?').all(areaId) as Project[];
        for (const project of projects) {
            duplicateProjectTransaction(project, newAreaId);
        }
    });

    transaction();
    revalidatePath('/');
}
