
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
            CREATE TABLE users (
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
            CREATE TABLE skills (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                level INTEGER NOT NULL,
                points INTEGER NOT NULL,
                maxPoints INTEGER NOT NULL,
                icon TEXT NOT NULL
            );
        `,
        areas: `
            CREATE TABLE areas (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                icon TEXT NOT NULL
            );
        `,
        projects: `
            CREATE TABLE projects (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                areaId TEXT NOT NULL,
                FOREIGN KEY (areaId) REFERENCES areas (id) ON DELETE CASCADE
            );
        `,
        tasks: `
            CREATE TABLE tasks (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT 0,
                xp INTEGER NOT NULL,
                description TEXT,
                notes TEXT,
                links TEXT,
                difficulty TEXT,
                dueDate TEXT,
                skillId TEXT,
                focusDuration INTEGER DEFAULT 0,
                projectId TEXT NOT NULL,
                FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY (skillId) REFERENCES skills (id) ON DELETE SET NULL
            );
        `,
        market_items: `
            CREATE TABLE market_items (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                price INTEGER NOT NULL,
                imageUrl TEXT NOT NULL,
                description TEXT NOT NULL
            );
        `,
        weekly_missions: `
            CREATE TABLE weekly_missions (
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

    const tableCheckStmt = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");

    // Create tables if they don't exist
    for (const [tableName, creationSql] of Object.entries(schema)) {
        const tableExists = tableCheckStmt.get(tableName);
        if (!tableExists) {
            dbInstance.exec(creationSql);
            console.log(`Created table: ${tableName}`);
        }
    }

    // Seed initial data only if users table is empty
    const userCount = dbInstance.prepare('SELECT count(*) as count FROM users').get() as { count: number };
    if (userCount.count === 0) {
        console.log("Seeding initial data...");
        const insertUser = dbInstance.prepare('INSERT INTO users (id, name, level, xp, nextLevelXp, tokens, avatarUrl) VALUES (?, ?, ?, ?, ?, ?, ?)');
        insertUser.run(1, 'New Adventurer', 1, 0, 100, 0, 'https://placehold.co/100x100.png');
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
    if (global.db) {
        global.db.close();
        global.db = undefined;
    }
    if (fs.existsSync(dbFile)) {
        fs.unlinkSync(dbFile);
    }
    console.log("Database file deleted.");
    db = initializeDb();
    global.db = db;
}


export { db };
