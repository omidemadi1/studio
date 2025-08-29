
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
                icon TEXT NOT NULL
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
                notes TEXT,
                links TEXT,
                difficulty TEXT,
                dueDate TEXT,
                reminder INTEGER,
                skillId TEXT,
                focusDuration INTEGER DEFAULT 0,
                bonusXp INTEGER DEFAULT 0,
                projectId TEXT,
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
    
    // Check if projectId column in tasks table needs to be altered
    const tableInfo = dbInstance.pragma(`table_info(tasks)`) as { name: string, notnull: number }[];
    const projectIdColumn = tableInfo.find(col => col.name === 'projectId');
    
    if (projectIdColumn && projectIdColumn.notnull === 1) {
        console.log("Migrating tasks table: making 'projectId' nullable.");
        dbInstance.transaction(() => {
            dbInstance.exec('CREATE TABLE tasks_new (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, completed BOOLEAN NOT NULL DEFAULT 0, xp INTEGER NOT NULL, tokens INTEGER NOT NULL DEFAULT 0, description TEXT, notes TEXT, links TEXT, difficulty TEXT, dueDate TEXT, reminder INTEGER, skillId TEXT, focusDuration INTEGER DEFAULT 0, bonusXp INTEGER DEFAULT 0, projectId TEXT, FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE, FOREIGN KEY (skillId) REFERENCES skills (id) ON DELETE SET NULL)');
            dbInstance.exec('INSERT INTO tasks_new(id, title, completed, xp, tokens, description, notes, links, difficulty, dueDate, reminder, skillId, focusDuration, projectId, bonusXp) SELECT id, title, completed, xp, tokens, description, notes, links, difficulty, dueDate, reminder, skillId, focusDuration, projectId, bonusXp FROM tasks');
            dbInstance.exec('DROP TABLE tasks');
            dbInstance.exec('ALTER TABLE tasks_new RENAME TO tasks');
        })();
    }


    // Add 'tokens' column to 'tasks' table if it doesn't exist (for migration)
    try {
        dbInstance.prepare('SELECT tokens FROM tasks LIMIT 1').get();
    } catch (e) {
        console.log("Migrating tasks table: adding 'tokens' column.");
        dbInstance.exec('ALTER TABLE tasks ADD COLUMN tokens INTEGER NOT NULL DEFAULT 0');
    }

    // Add 'reminder' column to 'tasks' table if it doesn't exist (for migration)
    try {
        dbInstance.prepare('SELECT reminder FROM tasks LIMIT 1').get();
    } catch (e) {
        console.log("Migrating tasks table: adding 'reminder' column.");
        dbInstance.exec('ALTER TABLE tasks ADD COLUMN reminder INTEGER');
    }
    
    // Add 'skillId' column to 'tasks' table if it doesn't exist (for migration)
    try {
        dbInstance.prepare('SELECT skillId FROM tasks LIMIT 1').get();
    } catch (e) {
        console.log("Migrating tasks table: adding 'skillId' column.");
        dbInstance.exec('ALTER TABLE tasks ADD COLUMN skillId TEXT');
    }

    // Add 'parentId' column to 'skills' table if it doesn't exist (for migration)
    try {
        dbInstance.prepare('SELECT parentId FROM skills LIMIT 1').get();
    } catch (e) {
        console.log("Migrating skills table: adding 'parentId' column.");
        dbInstance.exec('ALTER TABLE skills ADD COLUMN parentId TEXT');
    }
    
    // Add 'bonusXp' column to 'tasks' table if it doesn't exist (for migration)
    try {
        dbInstance.prepare('SELECT bonusXp FROM tasks LIMIT 1').get();
    } catch (e) {
        console.log("Migrating tasks table: adding 'bonusXp' column.");
        dbInstance.exec('ALTER TABLE tasks ADD COLUMN bonusXp INTEGER DEFAULT 0');
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
