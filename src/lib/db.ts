
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

    // Check if tables exist
    const tableCheck = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'users'").get();
    if (tableCheck) {
        return dbInstance; // DB already initialized
    }

    console.log("Initializing database schema and seeding data...");

    dbInstance.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            level INTEGER NOT NULL,
            xp INTEGER NOT NULL,
            nextLevelXp INTEGER NOT NULL,
            tokens INTEGER NOT NULL,
            avatarUrl TEXT
        );

        CREATE TABLE skills (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            level INTEGER NOT NULL,
            points INTEGER NOT NULL,
            maxPoints INTEGER NOT NULL,
            icon TEXT NOT NULL
        );

        CREATE TABLE areas (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            icon TEXT NOT NULL
        );

        CREATE TABLE projects (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            areaId TEXT NOT NULL,
            FOREIGN KEY (areaId) REFERENCES areas (id) ON DELETE CASCADE
        );

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
            FOREIGN KEY (skillId) REFERENCES skills (id)
        );

        CREATE TABLE market_items (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            imageUrl TEXT NOT NULL,
            description TEXT NOT NULL
        );
    `);

    // Seed data
    const insertUser = dbInstance.prepare('INSERT INTO users (id, name, level, xp, nextLevelXp, tokens, avatarUrl) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertUser.run(1, 'New Adventurer', 1, 0, 100, 0, 'https://placehold.co/100x100.png');

    console.log("Database initialized successfully.");
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
