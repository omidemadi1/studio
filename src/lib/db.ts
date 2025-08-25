
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// This helps avoid new connections on every hot-reload in development
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var db: Database.Database | undefined;
}

const initializeDb = () => {
    // Ensure the directory exists
    const dbPath = path.join(process.cwd(), '.db');
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }
    const dbFile = path.join(dbPath, 'questify.db');

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
    insertUser.run(1, 'Hero Gamer', 5, 1250, 2000, 420, 'https://placehold.co/100x100.png');

    const insertSkill = dbInstance.prepare('INSERT INTO skills (id, name, level, points, maxPoints, icon) VALUES (?, ?, ?, ?, ?, ?)');
    const skillsToSeed = [
        { id: 'strength', name: 'Strength', level: 4, points: 300, maxPoints: 1000, icon: 'Dumbbell' },
        { id: 'intellect', name: 'Intellect', level: 6, points: 750, maxPoints: 1000, icon: 'Lightbulb' },
        { id: 'health', name: 'Health', level: 5, points: 500, maxPoints: 1000, icon: 'Heart' },
        { id: 'finance', name: 'Finance', level: 3, points: 200, maxPoints: 1000, icon: 'Wallet' },
        { id: 'career', name: 'Career', level: 5, points: 600, maxPoints: 1000, icon: 'Briefcase' },
        { id: 'knowledge', name: 'Knowledge', level: 7, points: 850, maxPoints: 1000, icon: 'BookOpen' },
    ];
    skillsToSeed.forEach(skill => insertSkill.run(skill.id, skill.name, skill.level, skill.points, skill.maxPoints, skill.icon));

    const insertArea = dbInstance.prepare('INSERT INTO areas (id, name, icon) VALUES (?, ?, ?)');
    const insertProject = dbInstance.prepare('INSERT INTO projects (id, name, areaId) VALUES (?, ?, ?)');
    const insertTask = dbInstance.prepare('INSERT INTO tasks (id, title, completed, xp, description, notes, links, difficulty, dueDate, skillId, projectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
    const initialAreas = [
      {
        id: 'work',
        name: 'Work',
        icon: 'Briefcase',
        projects: [
          {
            id: 'proj1',
            name: 'Q2 Roadmap',
            tasks: [
              { id: 't1', title: 'Finalize project specs', completed: true, xp: 50, description: 'Write up the final specifications for the Q2 roadmap.', notes: 'Check with marketing before finalizing.', links: 'https://docs.google.com/document/d/...', difficulty: 'Medium', dueDate: '2025-01-28', skillId: 'career' },
              { id: 't2', title: 'Develop prototype', completed: false, xp: 150, difficulty: 'Hard', dueDate: '2025-02-15', skillId: 'career' },
              { id: 't3', title: 'User testing session', completed: false, xp: 100, difficulty: 'Medium', dueDate: '2025-02-20', skillId: 'intellect' },
            ],
          },
          {
            id: 'proj2',
            name: 'Website Redesign',
            tasks: [
              { id: 't4', title: 'Create wireframes', completed: true, xp: 75, difficulty: 'Easy', dueDate: '2025-01-10', skillId: 'career' },
              { id: 't5', title: 'Design mockups', completed: false, xp: 100, difficulty: 'Medium', dueDate: '2025-01-25', skillId: 'career' },
            ],
          },
        ],
      },
      {
        id: 'health',
        name: 'Health & Fitness',
        icon: 'Heart',
        projects: [
          {
            id: 'proj3',
            name: 'Workout Routine',
            tasks: [
              { id: 't6', title: 'Morning run (5km)', completed: true, xp: 40, difficulty: 'Easy', skillId: 'health' },
              { id: 't7', title: 'Strength training', completed: false, xp: 50, difficulty: 'Medium', skillId: 'strength' },
              { id: 't8', title: 'Yoga session', completed: false, xp: 30, difficulty: 'Easy', skillId: 'health' },
            ],
          },
          {
            id: 'proj4',
            name: 'Meal Plan',
            tasks: [
                { id: 't9', title: 'Plan weekly meals', completed: true, xp: 25, difficulty: 'Easy', skillId: 'health' },
                { id: 't10', title: 'Go grocery shopping', completed: false, xp: 20, difficulty: 'Easy', skillId: 'health' },
            ],
          }
        ],
      },
      {
        id: 'finances',
        name: 'Finances',
        icon: 'Wallet',
        projects: [
          {
            id: 'proj5',
            name: 'Monthly Budget',
            tasks: [
              { id: 't11', title: 'Review monthly spending', completed: false, xp: 30, difficulty: 'Medium', skillId: 'finance' },
              { id: 't12', title: 'Allocate savings', completed: false, xp: 35, difficulty: 'Medium', skillId: 'finance' },
            ],
          },
        ],
      },
    ];

    initialAreas.forEach(area => {
        insertArea.run(area.id, area.name, area.icon);
        area.projects.forEach(project => {
            insertProject.run(project.id, project.name, area.id);
            project.tasks.forEach(task => {
                insertTask.run(task.id, task.title, task.completed ? 1: 0, task.xp, task.description || null, task.notes || null, task.links || null, task.difficulty, task.dueDate, task.skillId, project.id);
            });
        });
    });

    const insertMarketItem = dbInstance.prepare('INSERT INTO market_items (id, name, price, imageUrl, description) VALUES (?, ?, ?, ?, ?)');
    const marketItemsToSeed = [
        { id: 'item1', name: 'Health Potion', price: 50, imageUrl: 'https://placehold.co/200x200.png', description: 'Recovers 50 health points instantly.'},
        { id: 'item2', name: 'XP Booster (1hr)', price: 100, imageUrl: 'https://placehold.co/200x200.png', description: 'Doubles XP gain from all quests for one hour.'},
        { id: 'item3', name: 'Golden Key', price: 250, imageUrl: 'https://placehold.co/200x200.png', description: 'Unlocks a special legendary quest line.'},
        { id: 'item4', name: 'Ancient Scroll', price: 80, imageUrl: 'https://placehold.co/200x200.png', description: 'Reveals a hint for a difficult quest.'},
        { id: 'item5', name: 'Mystic Orb', price: 150, imageUrl: 'https://placehold.co/200x200.png', description: 'Increases Intellect skill points by 100.'},
        { id: 'item6', name: 'Premium Theme', price: 500, imageUrl: 'https://placehold.co/200x200.png', description: 'Unlock a new exclusive theme for the app.'},
    ];
    marketItemsToSeed.forEach(item => insertMarketItem.run(item.id, item.name, item.price, item.imageUrl, item.description));


    console.log("Database initialized successfully.");
    return dbInstance;
}

const db: Database.Database = global.db ?? initializeDb();

if (process.env.NODE_ENV !== 'production') {
  global.db = db;
}

export function initDb() {
    // This function is now just a placeholder to ensure the db is initialized.
    // The logic is handled in the global singleton pattern above.
}


export { db };
