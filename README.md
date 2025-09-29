## Application Structure
This project follows a typical Next.js application structure, with several key directories and files:

-   **`src/app`**: Contains the Next.js application routes and pages. Each folder within `app` typically represents a route segment, and `page.tsx` within a segment defines the UI for that route.
    -   `src/app/layout.tsx`: The root layout of the application.
    -   `src/app/page.tsx`: The home page of the application.
    -   `src/app/focus/page.tsx`, `src/app/market/page.tsx`, `src/app/profile/page.tsx`, `src/app/suggest/page.tsx`: Specific feature pages.
    -   `src/app/areas/[areaId]/page.tsx`, `src/app/skills/[skillId]/page.tsx`: Dynamic route pages for displaying details of a specific area or skill.
-   **`src/actions`**: Houses server actions used for data mutations and other server-side operations, such as `quest-actions.ts`.
-   **`src/ai`**: Dedicated to AI-related functionalities, including Genkit configurations and flows.
    -   `src/ai/dev.ts`, `src/ai/genkit.ts`: Configuration and setup for Genkit.
    -   `src/ai/flows`: Contains specific AI flows like `suggest-smart-tasks.ts` and `suggest-xp-value.ts`.
-   **`src/components`**: Reusable UI components used throughout the application.
    -   `src/components/ui`: Shadcn/UI components (e.g., `button.tsx`, `dialog.tsx`, `input.tsx`).
    -   `src/components/icons`: Custom icon components.
    -   `src/components/bottom-nav.tsx`, `src/components/calendar-view.tsx`, `src/components/skill-radar.tsx`, `src/components/theme-toggle.tsx`: Application-specific components.
-   **`src/context`**: Provides React context for global state management, such as `quest-context.tsx`.
-   **`src/hooks`**: Custom React hooks for encapsulating reusable logic, like `use-toast.ts`.
-   **`src/lib`**: Contains utility functions, data definitions, database connections, and types.
    -   `src/lib/db.ts`: Sets up and initializes the local SQLite database (`app.db`) for storing user data, skills, tasks, etc.
    -   `src/lib/data.ts`, `src/lib/mock-data.ts`: Data management and mock data.
    -   `src/lib/types.ts`: TypeScript type definitions.
    -   `src/lib/utils.ts`: General utility functions.
    -   `src/lib/icon-map.ts`: Mapping for icons.
-   **`public`**: Static assets served directly by Next.js.
    -   `public/manifest.json`: Web App Manifest for PWA features.
    -   `public/sw.js`, `public/workbox-e43f5367.js`: Service Worker and Workbox related files for offline capabilities.
    -   `public/icon-*.png`: Application icons.
-   **`docs`**: Documentation files for the project, such as `blueprint.md`.
-   **`next.config.ts`**: Next.js configuration file.
-   **`tailwind.config.ts`**, **`postcss.config.mjs`**: Configuration files for Tailwind CSS and PostCSS.
-   **`package.json`**: Defines project metadata and dependencies.
-   **`tsconfig.json`**: TypeScript configuration.
-   **`apphosting.yaml`**: Configuration for application hosting (likely Google Cloud App Hosting).

## Current Application Architecture

The application currently utilizes a **Full-stack Next.js Architecture**, which can be characterized as a **Modular Monolith**. This means:

*   **Frontend & Backend Integration**: Next.js provides a unified framework for both the user interface (React) and server-side logic (API Routes, Server Actions), all within a single codebase.
*   **Technologies**:
    *   **Frontend**: React, TypeScript, Tailwind CSS for a modern, responsive user experience.
    *   **Backend**: Next.js server actions and API routes, likely interacting with a lightweight database.
    *   **Database**: A local SQLite database (`app.db`) is used for managing application data (users, quests, skills, tasks).
    *   **Artificial Intelligence (AI)**: Integrated using Google Genkit, with specific AI flows (`src/ai/flows`) for features like smart task suggestions.
    *   **PWA Capabilities**: Files in the `public` directory (e.g., `manifest.json`, `sw.js`) indicate support for Progressive Web App features, enabling an app-like experience.

This architecture is effective for rapid development and deployment, keeping the entire application within a single, coherent deployment unit.

## Future Architectural Roadmap: Microservices

To enhance scalability, allow for independent development teams, and provide technological flexibility for specific, complex domains (like AI and Blockchain), the application is planned to evolve towards a microservices architecture. This transition will be iterative, focusing on decoupling key functionalities into independent services.

**Candidates for Microservices:**

1.  **AI Services Microservice:**
    *   **Rationale**: AI functionalities, especially those involving complex models or heavy computational loads (e.g., Genkit flows for task suggestions, XP value calculation), often benefit from independent scaling and specialized environments. Decoupling this allows for dedicated resource allocation and potentially different technology stacks better suited for machine learning.
    *   **Scope**: This microservice would encapsulate all AI-related logic found in `src/ai`. The main Next.js application would interact with this service via a well-defined API (e.g., REST or gRPC).
    *   **Data Management**: This service would manage its own data (e.g., AI model configurations, training data, or historical prediction logs) in its dedicated data store.

2.  **Blockchain Integration Microservice:**
    *   **Rationale**: Given the plan to incorporate blockchain technology, creating a dedicated microservice for this domain is crucial. Blockchain interactions (e.g., managing wallets, sending transactions, interacting with smart contracts, querying on-chain data) can be complex, often involve external dependencies, and require high security. Isolating this logic protects the core application and allows for specialized development and monitoring.
    *   **Scope**: This microservice would handle all interactions with the blockchain (e.g., Polygon). It would expose a simplified API for the Next.js application to perform blockchain-related operations without needing to understand the underlying complexities.
    *   **Data Management**: This service would maintain its own data, which might include off-chain caches of blockchain data, transaction statuses, or user-specific blockchain credentials (in a secure manner).

**Core Application (Next.js Monolith as a Client/Gateway):**

The existing Next.js application would evolve to act as a **client or API Gateway** to these new microservices. It would continue to manage:

*   **User Interface (UI)**: Presenting the frontend to users.
*   **Core Business Logic**: Managing quests, skills, user profiles, and other functionalities that remain central to the application's primary purpose.
*   **Internal Database**: It would retain its own dedicated database (e.g., the current SQLite database, potentially migrating to a more robust relational database like PostgreSQL for production) to manage its core domain data (users, quests, skills, tasks). This adheres to the "Database per Service" principle where each service owns its data.

**Key Considerations for the Transition:**

*   **Inter-service Communication**: Define clear APIs (REST, gRPC, Message Queues) for how the Next.js application will communicate with the new AI and Blockchain microservices.
*   **Data Consistency**: Implement strategies to maintain data consistency across services, especially if data needs to be replicated or synchronized.
*   **Observability**: Establish robust logging, monitoring, and tracing across all services to understand system behavior and troubleshoot issues.
*   **Deployment & Operations**: Microservices introduce increased operational complexity. Tools for orchestration (e.g., Kubernetes), continuous integration/continuous deployment (CI/CD), and infrastructure as code will become vital.

This roadmap outlines a strategic move towards a more distributed and scalable architecture, allowing the application to grow and adapt more effectively to future demands and new feature integrations.


## Publishing on Your Own Server (Self-Hosting)
This section details the steps to deploy this Next.js application on your own server, rather than using cloud-specific hosting solutions. This involves building the application, running it with Node.js, and using a reverse proxy for robust production serving.

### 1. Prepare Your Server
*   **Operating System**: A Linux-based operating system (e.g., Ubuntu, Debian, CentOS) is generally recommended.
*   **Node.js and npm/yarn**: Install Node.js (which includes npm) or Yarn on your server. It's often beneficial to use a Node Version Manager (like `nvm`) to easily manage Node.js versions.
    ```bash
    # Example for Ubuntu:
    sudo apt update
    sudo apt install nodejs npm

    # Recommended: Install nvm (Node Version Manager)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
    nvm install --lts # Install the latest LTS version
    nvm use --lts
    ```
*   **Git**: Install Git to clone your project repository.
    ```bash
    sudo apt install git
    ```

### 2. Get Your Code on the Server
*   **Clone Your Repository**: Navigate to the directory where you want to host your application and clone your Git repository.
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```

### 3. Install Dependencies and Build the Application
*   **Install Dependencies**: Install all project dependencies.
    ```bash
    npm install # or yarn install
    ```
*   **Build for Production**: Create an optimized production build of your Next.js application. This will generate the `.next` directory.
    ```bash
    npm run build # or yarn build
    ```

### 4. Environment Variables
*   If your application relies on environment variables (e.g., API keys, database connection strings), you must set them on your server. You can use a `.env.production` file in your project root (ensure it's not committed to Git) or configure them directly via your process manager.

### 5. Start the Application
*   Next.js provides a simple command to start the production server:
    ```bash
    npm start # or yarn start
    ```
    By default, this will run your application on `http://localhost:3000`.

### 6. Process Management (Highly Recommended for Production)
For a stable production environment, use a process manager like **PM2** to keep your application running continuously, manage restarts, and handle logs.

*   **Install PM2**:
    ```bash
    npm install -g pm2
    ```
*   **Start Your App with PM2**:
    ```bash
    pm2 start npm --name "your-app-name" -- start
    # If using yarn:
    # pm2 start yarn --name "your-app-name" -- start
    ```
*   **Save PM2 Process List**: This ensures your application starts automatically after a server reboot.
    ```bash
    pm2 save
    pm2 startup # Follow the instructions it provides to set up startup script
    ```
*   **Monitor (Optional)**:
    ```bash
    pm2 monit
    ```

### 7. Set Up a Reverse Proxy (Essential for Production)
A reverse proxy (e.g., Nginx or Caddy) is critical for:
*   Serving your app on standard web ports (80 for HTTP, 443 for HTTPS).
*   Handling SSL/TLS encryption (HTTPS).
*   Improving security and performance by acting as a buffer and efficiently serving static assets.

#### Using Nginx (Example)
*   **Install Nginx**:
    ```bash
    sudo apt install nginx
    ```
*   **Configure Nginx**: Create a new configuration file in `/etc/nginx/sites-available/` (e.g., `your-app-name.conf`).
    ```nginx
    server {
        listen 80;
        server_name your_domain.com www.your_domain.com; # Replace with your actual domain

        location / {
            proxy_pass http://localhost:3000; # The port your Next.js app is running on
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Optional: Serve static files (like public/* or .next/static/*) directly from Nginx
        # location /_next/static {
        #     alias /path/to/your-project/.next/static; # Adjust path
        #     expires 30d;
        #     access_log off;
        # }
        # location / {
        #     root /path/to/your-project/public; # Adjust path
        #     try_files $uri $uri/ =404;
        # }
    }
    ```
    *Replace `/path/to/your-project/` with the actual absolute path to your project directory on the server.*
*   **Enable the Configuration**: Create a symbolic link to `sites-enabled`.
    ```bash
    sudo ln -s /etc/nginx/sites-available/your-app-name.conf /etc/nginx/sites-enabled/
    ```
*   **Test and Reload Nginx**:
    ```bash
    sudo nginx -t # Test Nginx configuration for syntax errors
    sudo systemctl reload nginx # Apply the new configuration
    ```

### 8. Set Up HTTPS with Certbot (Highly Recommended)
*   **Install Certbot**:
    ```bash
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot
    ```
*   **Get an SSL Certificate**:
    ```bash
    sudo certbot --nginx -d your_domain.com -d www.your_domain.com
    ```
    Follow the interactive prompts. Certbot will automatically configure Nginx to use HTTPS and handle certificate renewals.

By following these comprehensive steps, your Next.js application will be successfully deployed and accessible on your own server, running securely with HTTPS.


## Creating an Android Application from this Web App
The `docs/blueprint.md` file indicates that the original plan for an Android version of this application was to build a **native mobile app using Flutter**. However, if you wish to leverage the existing Next.js web codebase to create an Android app, here are a few approaches:

### Rebuilding Natively (Flutter, Kotlin/Java) - As per Blueprint
This approach provides the most robust native experience but requires rewriting the frontend.

*   **How it works:** You develop a new Android application (using Flutter, Kotlin for native Android, or Java) that consumes your web application's backend API. The current Next.js application's server actions (`src/actions`) and database logic (`src/lib/db.ts`) would need to be exposed through a dedicated REST API layer for the native app to consume.
*   **Steps:**
    1.  **Set up Flutter/Android Studio:** Install the necessary SDKs and development environment.
    2.  **Design and Develop:** Re-implement the UI and user experience using Flutter, Kotlin, or Java.
    3.  **API Integration:** Create a dedicated REST API layer (e.g., using Node.js/Express, or Next.js API routes) to expose data and business logic from your existing backend to the native app.
    4.  **Database/Blockchain:** Integrate directly with local storage (if needed for offline capabilities) and the Polygon blockchain via their respective SDKs (e.g., `moralis-sdk`).
    5.  **Build and Deploy:** Build the APK/AAB and publish it to the Google Play Store.