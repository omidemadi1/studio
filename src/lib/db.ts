
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// This helps avoid new connections on every hot-reload in development
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var db: Database.Database | undefined;
}

const dbPath = path.join(process.cwd(), '.db');
const dbFile = path.join(dbPath, 'questify.db');

const initializeDb = () => {
    // Ensure the directory exists
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }
    
    const dbInstance = new Database(dbFile);
    dbInstance.pragma('journal_mode = WAL');
    console.log('Database connection established.');

    // Modular schema definition
    const schema = {
        users: `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                level INTEGER NOT NULL,
                xp INTEGER NOT NULL,
                nextLevelXp INTEGER NOT NULL,
                tokens INTEGER NOT NULL,
                avatarUrl TEXT
            );
        `,
        skills: `
            CREATE TABLE IF NOT EXISTS skills (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                level INTEGER NOT NULL,
                points INTEGER NOT NULL,
                maxPoints INTEGER NOT NULL,
                icon TEXT NOT NULL,
                parentId TEXT,
                FOREIGN KEY (parentId) REFERENCES skills (id) ON DELETE CASCADE
            );
        `,
        areas: `
            CREATE TABLE IF NOT EXISTS areas (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                icon TEXT NOT NULL,
                archived BOOLEAN NOT NULL DEFAULT 0
            );
        `,
        projects: `
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                areaId TEXT NOT NULL,
                FOREIGN KEY (areaId) REFERENCES areas (id) ON DELETE CASCADE
            );
        `,
        tasks: `
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT 0,
                xp INTEGER NOT NULL,
                tokens INTEGER NOT NULL DEFAULT 0,
                description TEXT,
                difficulty TEXT,
                dueDate TEXT,
                reminder INTEGER,
                skillId TEXT,
                skillIds TEXT,
                focusDuration INTEGER DEFAULT 0,
                bonusXp INTEGER DEFAULT 0,
                projectId TEXT,
                markdown TEXT,
                FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY (skillId) REFERENCES skills (id) ON DELETE SET NULL
            );
        `,
        market_items: `
            CREATE TABLE IF NOT EXISTS market_items (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                price INTEGER NOT NULL,
                imageUrl TEXT NOT NULL,
                description TEXT NOT NULL
            );
        `,
        weekly_missions: `
            CREATE TABLE IF NOT EXISTS weekly_missions (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                xp INTEGER NOT NULL,
                tokens INTEGER NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT 0,
                weekIdentifier TEXT NOT NULL
            );
        `,
    };

    // Create tables if they don't exist
    for (const tableName of Object.keys(schema)) {
      dbInstance.exec(schema[tableName as keyof typeof schema]);
    }
    
    // Migration for adding 'markdown' column to 'tasks' table
    const tableInfo = dbInstance.pragma(`table_info(tasks)`) as { name: string, notnull: number }[];
    const hasMarkdownColumn = tableInfo.some(col => col.name === 'markdown');
    
    if (!hasMarkdownColumn) {
        console.log("Migrating tasks table: adding 'markdown' column.");
        try {
            dbInstance.exec('ALTER TABLE tasks ADD COLUMN markdown TEXT');
        } catch (e) {
            console.error("Failed to add 'markdown' column, attempting table rebuild.", e);
            dbInstance.transaction(() => {
                dbInstance.exec(`CREATE TABLE tasks_new (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, completed BOOLEAN NOT NULL DEFAULT 0, xp INTEGER NOT NULL, tokens INTEGER NOT NULL DEFAULT 0, description TEXT, difficulty TEXT, dueDate TEXT, reminder INTEGER, skillId TEXT, focusDuration INTEGER DEFAULT 0, bonusXp INTEGER DEFAULT 0, projectId TEXT, markdown TEXT, FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE, FOREIGN KEY (skillId) REFERENCES skills (id) ON DELETE SET NULL)`);
                dbInstance.exec('INSERT INTO tasks_new(id, title, completed, xp, tokens, description, difficulty, dueDate, reminder, skillId, focusDuration, projectId, bonusXp) SELECT id, title, completed, xp, tokens, description, difficulty, dueDate, reminder, skillId, focusDuration, projectId, bonusXp FROM tasks');
                dbInstance.exec('DROP TABLE tasks');
                dbInstance.exec('ALTER TABLE tasks_new RENAME TO tasks');
            })();
        }
    }
    
    // Migration for adding 'skillIds' column to 'tasks' table for multi-skill support
    const hasSkillIdsColumn = tableInfo.some(col => col.name === 'skillIds');
    
    if (!hasSkillIdsColumn) {
        console.log("Migrating tasks table: adding 'skillIds' column for multi-skill support.");
        try {
            dbInstance.exec('ALTER TABLE tasks ADD COLUMN skillIds TEXT');
            // Migrate existing skillId values to skillIds as JSON array
            dbInstance.exec(`UPDATE tasks SET skillIds = json_array(skillId) WHERE skillId IS NOT NULL`);
        } catch (e) {
            console.error("Failed to add 'skillIds' column.", e);
        }
    }


    // Seed initial data only if users table is empty
    const userCount = dbInstance.prepare('SELECT count(*) as count FROM users').get() as { count: number };
    if (userCount.count === 0) {
        console.log("Seeding initial data...");
        const insertUser = dbInstance.prepare('INSERT INTO users (id, name, level, xp, nextLevelXp, tokens, avatarUrl) VALUES (?, ?, ?, ?, ?, ?, ?)');
        insertUser.run(1, 'New Adventurer', 1, 0, 100, 0, '/assets/avatars/default.png');
    }

    return dbInstance;
}

let db: Database.Database = global.db ?? initializeDb();

if (process.env.NODE_ENV !== 'production') {
  global.db = db;
}

export function initDb() {
    // This function is now just a placeholder to ensure the db is initialized.
    // The logic is handled in the global singleton pattern above.
}

export function resetDbFile() {
    if (db) {
        db.close();
        global.db = undefined; // Make sure the global ref is also cleared
    }
    if (fs.existsSync(dbFile)) {
        fs.unlinkSync(dbFile);
    }
    console.log("Database file deleted and connection closed.");
    // Re-initialize and update the references
    db = initializeDb();
    global.db = db;
}


export { db };
