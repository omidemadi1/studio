
'use server'

import { db, resetDbFile } from '@/lib/db'
import type { Task, User, Skill, Project, Area, WeeklyMission } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { getWeek } from 'date-fns';
import { suggestWeeklyMissions } from '@/ai/flows/suggest-weekly-missions';

export async function addArea(name: string, icon: string) {
  const id = `area-${Date.now()}`
  db.prepare('INSERT INTO areas (id, name, icon) VALUES (?, ?, ?)').run(id, name, icon)
  revalidatePath('/')
  revalidatePath('/areas')
}

export async function updateArea(id: string, name: string, icon: string) {
  db.prepare('UPDATE areas SET name = ?, icon = ? WHERE id = ?').run(name, icon, id);
  revalidatePath('/');
  revalidatePath(`/areas/${id}`);
}

export async function archiveArea(id: string, archived: boolean) {
  db.prepare('UPDATE areas SET archived = ? WHERE id = ?').run(archived ? 1 : 0, id);
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

export async function addTask(task: Task, areaId?: string) {
    db.prepare('INSERT INTO tasks (id, title, completed, xp, tokens, description, difficulty, dueDate, reminder, skillId, focusDuration, projectId, bonusXp, markdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(task.id, task.title, task.completed ? 1 : 0, task.xp, task.tokens, task.description, task.difficulty, task.dueDate, task.reminder, task.skillId, task.focusDuration || 0, task.projectId || null, task.bonusXp || 0, task.markdown || null);
    
    if (areaId) {
      revalidatePath(`/areas/${areaId}`);
    }
    if (task.skillId) {
      revalidatePath(`/skills/${task.skillId}`);
    }
    revalidatePath('/');
}

export async function deleteTask(id: string) {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    revalidatePath('/');
}

export async function addSkill(name: string, icon: string, parentId?: string) {
  const id = `skill-${Date.now()}`;
  db.prepare(
    'INSERT INTO skills (id, name, level, points, maxPoints, icon, parentId) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, 1, 0, 1000, icon, parentId || null);
  revalidatePath('/profile');
  if (parentId) revalidatePath(`/skills/${parentId}`);
  revalidatePath('/');
}

const updateSkillAndParents = (skillId: string, xpChange: number, completed: boolean): { skillId: string, skillLeveledUp: boolean } | null => {
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as Skill;
    if (!skill) return null;

    let skillLeveledUp = false;
    let newPoints = skill.points + xpChange;
    let newSkillLevel = skill.level;
    let newMaxPoints = skill.maxPoints;

    if (completed && newPoints >= skill.maxPoints) {
        newSkillLevel = skill.level + 1;
        newMaxPoints = Math.floor(skill.maxPoints * 1.5);
        skillLeveledUp = true;
    } else if (!completed && newPoints < 0 && newSkillLevel > 1) {
        const prevMaxPoints = Math.ceil(skill.maxPoints / 1.5);
        newSkillLevel = skill.level - 1;
        newMaxPoints = prevMaxPoints;
        newPoints = prevMaxPoints + newPoints;
    }
    
    db.prepare('UPDATE skills SET points = ?, level = ?, maxPoints = ? WHERE id = ?')
      .run(newPoints, newSkillLevel, newMaxPoints, skillId);

    // If there's a parent, recursively update it
    if (skill.parentId) {
        updateSkillAndParents(skill.parentId, xpChange, completed);
    }
    
    return { skillId, skillLeveledUp };
};


export async function updateTaskCompletion(taskId: string, completed: boolean, focusDuration?: number, bonusXp?: number) {
    const transaction = db.transaction(() => {
        let skillIdToRevalidate: string | undefined;
        let skillLeveledUp = false;

        const setClauses = ['completed = ?'];
        const params: (number | string)[] = [completed ? 1 : 0];

        if (focusDuration) {
            setClauses.push('focusDuration = (focusDuration + ?)');
            params.push(focusDuration);
        }
        if (bonusXp) {
            setClauses.push('bonusXp = (bonusXp + ?)');
            params.push(bonusXp);
        }
        params.push(taskId);

        db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

        const task = db.prepare('SELECT xp, tokens, skillId FROM tasks WHERE id = ?').get(taskId) as Task;
        if (task) {
            const xpChange = completed ? (task.xp + (bonusXp || 0)) : -(task.xp + (bonusXp || 0));
            const tokenChange = completed ? task.tokens : -task.tokens;
            
            // Update user XP and level
            const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as User;
            if (user) {
                const newXp = user.xp + xpChange;
                const newTokens = user.tokens + tokenChange;
                let newLevel = user.level;
                let newNextLevelXp = user.nextLevelXp;
                if (completed && newXp >= user.nextLevelXp) {
                    newLevel = user.level + 1;
                    newNextLevelXp = user.nextLevelXp * 2;
                } else if (!completed && newXp < user.nextLevelXp / 2 && newLevel > 1) {
                    newLevel = user.level -1;
                    newNextLevelXp = user.nextLevelXp / 2;
                }
                db.prepare('UPDATE users SET xp = ?, level = ?, nextLevelXp = ?, tokens = ? WHERE id = 1').run(newXp, newLevel, newNextLevelXp, newTokens);
            }

            // Update skill points and level (recursively)
            if (task.skillId) {
                const result = updateSkillAndParents(task.skillId, xpChange, completed);
                if (result) {
                    skillIdToRevalidate = result.skillId;
                    skillLeveledUp = result.skillLeveledUp;
                }
            }
        }
        return { skillId: skillIdToRevalidate, skillLeveledUp, bonusXp: bonusXp || 0 };
    });
    
    const result = transaction();

    revalidatePath('/')
    revalidatePath('/profile');
    revalidatePath('/focus');
    if (result && result.skillId) {
        // Need to find the root parent to revalidate the correct skill page
        let currentSkillId: string | null = result.skillId;
        let rootSkillId = result.skillId;
        while(currentSkillId) {
            const skill = db.prepare('SELECT id, parentId FROM skills WHERE id = ?').get(currentSkillId) as {id: string, parentId: string | null};
            if(skill && skill.parentId) {
                rootSkillId = skill.parentId;
                currentSkillId = skill.parentId;
            } else {
                currentSkillId = null;
            }
        }
        revalidatePath(`/skills/${rootSkillId}`);
    }

    return result;
}

export async function updateTaskDetails(taskId: string, details: Partial<Task>) {
  const { title, description, dueDate, skillId, reminder, markdown } = details;
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
  if (dueDate !== undefined) {
    updates.push('dueDate = ?');
    params.push(dueDate);
  }
  if (skillId !== undefined) {
    updates.push('skillId = ?');
    params.push(skillId);
  }
  if (reminder !== undefined) {
    updates.push('reminder = ?');
    params.push(reminder);
  }
  if (markdown !== undefined) {
    updates.push('markdown = ?');
    params.push(markdown);
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
    // This will also delete sub-skills due to ON DELETE CASCADE
    db.prepare('DELETE FROM skills WHERE id = ?').run(id);
    revalidatePath('/profile');
    revalidatePath('/');
}

export async function deleteProject(id: string, areaId: string) {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    revalidatePath(`/areas/${areaId}`);
    revalidatePath('/');
}


export async function addXp(xp: number, tokens?: number) {
    const transaction = db.transaction(() => {
        const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as User;
        if (!user) return;

        const newXp = user.xp + xp;
        const newTokens = user.tokens + (tokens || 0);
        let newLevel = user.level;
        let newNextLevelXp = user.nextLevelXp;

        if (newXp >= user.nextLevelXp) {
            newLevel = user.level + 1;
            newNextLevelXp = user.nextLevelXp * 2;
        }
        
        db.prepare('UPDATE users SET xp = ?, level = ?, nextLevelXp = ?, tokens = ? WHERE id = 1').run(newXp, newLevel, newNextLevelXp, newTokens);
    });

    transaction();
    revalidatePath('/profile');
    revalidatePath('/focus');
}

export async function resetDatabase() {
    resetDbFile();
    revalidatePath('/');
}

export async function duplicateTask(taskId: string) {
    const transaction = db.transaction(() => {
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;
        if (!task) return;

        const newTaskId = `task-${Date.now()}`;
        const newTask = { ...task, id: newTaskId, title: `${task.title} (copy)` };
        db.prepare('INSERT INTO tasks (id, title, completed, xp, tokens, description, difficulty, dueDate, reminder, skillId, focusDuration, projectId, markdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(newTask.id, newTask.title, newTask.completed ? 1 : 0, newTask.xp, newTask.tokens, newTask.description, newTask.difficulty, newTask.dueDate, newTask.reminder, newTask.skillId, newTask.focusDuration || 0, task.projectId, newTask.markdown);
    });
    transaction();
    revalidatePath('/');
}


const duplicateProjectTransaction = db.transaction((project: Project, newAreaId: string) => {
    const newProjectId = `proj-${Date.now()}`;
    const newProject = { ...project, id: newProjectId, areaId: newAreaId, name: `${project.name} (copy)` };
    db.prepare('INSERT INTO projects (id, name, areaId) VALUES (?, ?, ?)').run(newProject.id, newProject.name, newProject.areaId);

    const tasks = db.prepare('SELECT * FROM tasks WHERE projectId = ?').all(project.id) as Task[];
    for (const task of tasks) {
        const taskToDuplicate = { ...task, projectId: newProjectId }; // This is needed to get TS to agree with the shape
        duplicateTask(taskToDuplicate.id);
    }
});

export async function duplicateProject(projectId: string) {
    const transaction = db.transaction(() => {
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as Project;
        if (!project) return;
        duplicateProjectTransaction(project, project.areaId);
    });

    transaction();
    revalidatePath('/');
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

// Weekly Missions
export async function maybeGenerateWeeklyMissions(): Promise<WeeklyMission[]> {
    const year = new Date().getFullYear();
    const week = getWeek(new Date());
    const weekIdentifier = `${year}-${week}`;

    const existingMissions = db.prepare('SELECT * FROM weekly_missions WHERE weekIdentifier = ?').all(weekIdentifier) as WeeklyMission[];

    if (existingMissions.length > 0) {
        return existingMissions;
    }

    const skills = db.prepare('SELECT * FROM skills').all() as Skill[];
    const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as User;
    
    const result = await suggestWeeklyMissions({
        currentSkills: skills.map(s => `${s.name} (Lvl ${s.level})`).join(', '),
        userLevel: user.level,
    });
    
    const insert = db.prepare('INSERT INTO weekly_missions (id, title, description, xp, tokens, completed, weekIdentifier) VALUES (?, ?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction((missions: any[]) => {
        for (const mission of missions) {
            insert.run(`mission-${weekIdentifier}-${Math.random()}`, mission.title, mission.description, mission.xp, mission.tokens, 0, weekIdentifier);
        }
    });

    try {
        transaction(result.missions);
        revalidatePath('/');
        return db.prepare('SELECT * FROM weekly_missions WHERE weekIdentifier = ?').all(weekIdentifier) as WeeklyMission[];
    } catch(e) {
        console.error("Failed to generate weekly missions:", e);
        return [];
    }
}

export async function updateWeeklyMissionCompletion(missionId: string, completed: boolean) {
    const transaction = db.transaction(() => {
        db.prepare('UPDATE weekly_missions SET completed = ? WHERE id = ?').run(completed ? 1 : 0, missionId);
        
        if (completed) {
            const mission = db.prepare('SELECT * FROM weekly_missions WHERE id = ?').get(missionId) as WeeklyMission;
            if (mission) {
                const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as User;
                
                const newXp = user.xp + mission.xp;
                const newTokens = user.tokens + mission.tokens;
                let newLevel = user.level;
                let newNextLevelXp = user.nextLevelXp;

                if (newXp >= user.nextLevelXp) {
                    newLevel = user.level + 1;
                    newNextLevelXp = user.nextLevelXp * 2;
                }
                
                db.prepare('UPDATE users SET xp = ?, level = ?, nextLevelXp = ?, tokens = ? WHERE id = 1').run(newXp, newLevel, newNextLevelXp, newTokens);
                
                return { xp: mission.xp, tokens: mission.tokens, leveledUp: newLevel > user.level };
            }
        }
        return null;
    });

    const result = transaction();
    revalidatePath('/');
    revalidatePath('/profile');
    return result;
}

    