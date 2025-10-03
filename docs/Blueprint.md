# App Blueprint: Questify

## 1. App Name
Questify - Gamified Task and Skill Management

## 2. App Description
Questify is a hybrid mobile and web application designed to help users manage their tasks, goals, and skills in a gamified manner. It leverages AI to provide smart suggestions for tasks, weekly missions, and XP values, making productivity engaging and rewarding. The application incorporates a robust local database for user data and supports PWA features for an enhanced web experience, with potential for hybrid app deployment via Capacitor for native mobile platforms.

## 3. Key Features (Overall)

*   **Gamified Task Management**: Users can create and manage tasks, earning experience points (XP) and in-app currency (Gems) upon completion.
*   **Skill Tracking and Development**: A "Skill Radar" visualizes user skill progression, allowing users to focus on specific areas of improvement.
*   **AI-Powered Suggestions**:
    *   **Smart Task Suggestions**: AI assists in generating relevant and challenging tasks.
    *   **Weekly Missions**: AI suggests themed missions to guide user focus.
    *   **XP Value Suggestions**: AI helps determine appropriate XP rewards for tasks.
*   **Calendar View**: Visual representation of upcoming tasks and completed goals.
*   **In-App Marketplace (Planned)**: A section for potential future expansions, possibly for purchasing cosmetic items or boosts with Gems.
*   **User Profiles**: Customizable user profiles, potentially with avatar selection.
*   **Responsive Design & Theming**: Supports both light and dark modes, adaptable to various screen sizes.
*   **Progressive Web App (PWA) Capabilities**: Offline support and installability for a native-like web experience.
*   **Hybrid App Deployment**: Designed to be wrapped with tools like Capacitor for deployment to Google Play Store and Apple App Store, reusing the existing web codebase.

## 4. Target Platforms
*   **Web**: Modern browsers (PWA enabled)
*   **Android**: Via Capacitor (Hybrid App)
*   **iOS**: Via Capacitor (Hybrid App)

## 5. Technology Stack (Current & Proposed)

*   **Frontend**: Next.js, React, TypeScript
*   **UI Components**: Shadcn/UI
*   **Styling**: Tailwind CSS
*   **AI Integration**: Genkit
*   **Local Database**: SQLite (via `src/lib/db.ts`)
*   **Hybrid Framework**: Capacitor (for mobile deployment)

## 6. Application Pages and User Flows

### 6.1. Home/Dashboard Page (`src/app/page.tsx`)

*   **Description**: The central hub where users get an overview of their progress, active quests, and upcoming tasks.
*   **Features**:
    *   Display current level, XP, and Gems.
    *   List of active/pending tasks with due dates.
    *   Quick access to task creation.
    *   Summary of recent achievements/completed quests.
    *   Notifications for upcoming deadlines or new missions.
    *   Bottom navigation bar for easy access to other core sections.
*   **User Flow**:
    1.  User opens the app/website.
    2.  User sees their current progress (XP, Level, Gems).
    3.  User views a list of their current tasks.
    4.  User can tap on a task to view details or mark it as complete.
    5.  User can tap a "+" button to add a new task.
    6.  User navigates to other sections using the bottom navigation.

### 6.2. Task Management (Modal/Dedicated Page)

*   **Description**: Interface for creating, viewing, editing, and completing individual tasks.
*   **Features**:
    *   Task title and description.
    *   Due date and time picker.
    *   Priority setting (e.g., Low, Medium, High, Critical).
    *   Option to link tasks to specific skills or areas.
    *   Toggle to mark task as complete (awards XP/Gems).
    *   AI-suggested XP value for the task.
    *   Delete task option.
*   **User Flow (Create Task)**:
    1.  User clicks "Add New Task" button (e.g., from Home Page).
    2.  A form/modal appears.
    3.  User enters task details (title, description, due date).
    4.  User optionally links to a skill/area.
    5.  (AI Integration): System suggests an XP value.
    6.  User clicks "Save Task".
    7.  Task appears in their task list.
*   **User Flow (Complete Task)**:
    1.  User views a task in their list.
    2.  User clicks "Mark as Complete" checkbox/button.
    3.  A success animation/toast appears, showing XP and Gems gained.
    4.  Task is removed from active list and moved to "Completed" history.

### 6.3. Profile Page (`src/app/profile/page.tsx`)

*   **Description**: Displays the user's overall progress, skill summary, and allows profile customization.
*   **Features**:
    *   User's chosen avatar.
    *   Overall level and total XP.
    *   "Skill Radar" visualization showing proficiency in different skill areas.
    *   List of acquired skills with individual progress bars.
    *   Achievements/badges earned.
    *   Option to change avatar (from available assets).
    *   Basic account settings.
*   **User Flow**:
    1.  User navigates to the Profile Page (e.g., from bottom nav).
    2.  User sees their avatar, overall stats, and skill radar.
    3.  User can tap on a skill on the radar or in the list to see more details about that specific skill.
    4.  User can access settings or change their avatar.

### 6.4. Skills Page (Specific Skill Details `src/app/skills/[skillId]/page.tsx`)

*   **Description**: Detailed view of an individual skill, its progress, and associated tasks.
*   **Features**:
    *   Skill name and description.
    *   Current skill level and XP towards next level.
    *   Progress bar for the skill.
    *   List of tasks associated with this skill (completed and pending).
    *   Graphs or charts showing skill progression over time.
    *   Option to add a new task directly linked to this skill.
*   **User Flow**:
    1.  User navigates to the Profile Page.
    2.  User taps on a specific skill (e.g., "Programming") from the list or Skill Radar.
    3.  User is taken to the "Programming" skill detail page.
    4.  User sees the skill's current level, progress, and relevant tasks.
    5.  User can add a new task that automatically links to "Programming".

### 6.5. Areas Page (Specific Area Details `src/app/areas/[areaId]/page.tsx`)

*   **Description**: Detailed view of an individual task area (e.g., "Work," "Personal," "Health"), its associated tasks, and goals.
*   **Features**:
    *   Area name and description.
    *   List of tasks categorized under this area (completed and pending).
    *   Progress towards area-specific goals (if any).
    *   Option to add a new task directly linked to this area.
*   **User Flow**:
    1.  User navigates to an "Areas" overview (if one exists, otherwise directly to an area from a task).
    2.  User taps on a specific area (e.g., "Work").
    3.  User is taken to the "Work" area detail page.
    4.  User sees all tasks associated with "Work".
    5.  User can add a new task that automatically links to "Work".

### 6.6. Focus Page (`src/app/focus/page.tsx`)

*   **Description**: A dedicated space for users to concentrate on a single task or a small set of tasks without distractions.
*   **Features**:
    *   Timer (e.g., Pomodoro timer) for focused work sessions.
    *   Display of the currently focused task.
    *   Ability to select a task to focus on.
    *   Minimalist UI to reduce distractions.
    *   Option to complete task directly from this page.
*   **User Flow**:
    1.  User navigates to the Focus Page.
    2.  User selects a task to focus on.
    3.  User starts a timer (e.g., 25 minutes).
    4.  User works on the task.
    5.  Timer ends, user gets a notification.
    6.  User can mark the task as complete or take a break.

### 6.7. Suggest Page (`src/app/suggest/page.tsx`)

*   **Description**: The interface for interacting with the AI to get smart suggestions for tasks, missions, and XP values.
*   **Features**:
    *   Input field for user's goals or current situation (for smart task suggestions).
    *   Button to generate "Weekly Missions".
    *   Display of AI-generated suggestions.
    *   Option to directly add a suggested task to the task list.
    *   (Future) Feedback mechanism for AI suggestions.
*   **User Flow (Smart Task Suggestion)**:
    1.  User navigates to the Suggest Page.
    2.  User types "I want to learn Python" into the input.
    3.  User clicks "Suggest Tasks".
    4.  AI generates a list of Python-related tasks.
    5.  User reviews suggestions and clicks "Add to Tasks" on desired ones.
*   **User Flow (Weekly Missions)**:
    1.  User navigates to the Suggest Page.
    2.  User clicks "Generate Weekly Missions".
    3.  AI presents a themed set of missions.
    4.  User can accept missions to add them to their task list.

### 6.8. Market Page (`src/app/market/page.tsx`)

*   **Description**: An in-app store where users can spend their earned Gems on cosmetic items or other in-game boosts.
*   **Features**:
    *   Display of available items (e.g., avatars, themes, special effects).
    *   Item descriptions and Gem prices.
    *   User's current Gem balance.
    *   Purchase button for each item.
    *   Confirmation dialog for purchases.
*   **User Flow**:
    1.  User navigates to the Market Page.
    2.  User browses available items.
    3.  User sees an avatar they like and checks its Gem price.
    4.  User clicks "Buy" button.
    5.  A confirmation appears.
    6.  Upon confirmation, Gems are deducted, and the item is added to their inventory/profile.

### 6.9. Calendar View (Integrated or separate component `src/components/calendar-view.tsx`)

*   **Description**: A visual calendar to track deadlines, completed tasks, and plan future activities.
*   **Features**:
    *   Monthly, weekly, or daily view options.
    *   Display of tasks with due dates.
    *   Highlighting of completed tasks.
    *   Ability to add tasks directly from the calendar.
    *   Navigation between dates.
*   **User Flow**:
    1.  User navigates to the Calendar View.
    2.  User sees their upcoming tasks for the current month.
    3.  User can click on a date to see tasks due on that day.
    4.  User can click on a blank date to quickly add a new task for that day.

## 7. Monetization Strategy (Future Consideration)
*   **In-App Purchases**: Potential for purchasing cosmetic items, unique avatars, or XP boosts in the marketplace using real money.

## 8. Color Scheme
The existing color scheme seems to be a modern, clean design. We can maintain this or opt for a slightly more vibrant, quest-themed palette, for example:
*   **Primary**: #4CAF50 (Green - representing growth/completion)
*   **Secondary**: #ffc107ff (Amber - representing rewards/energy)
*   **Accent**: #2196F3 (Blue - representing focus/knowledge)
*   **Background**: #121212 (Dark for dark mode) / #FFFFFF (Light for light mode)

## 9. Future Enhancements
*   Multi-user collaboration on quests.
*   Integration with external calendars.
*   More advanced AI-driven personalization.
