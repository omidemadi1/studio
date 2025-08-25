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

### 1. Rebuilding Natively (Flutter, Kotlin/Java) - As per Blueprint
This approach provides the most robust native experience but requires rewriting the frontend.

*   **How it works:** You develop a new Android application (using Flutter, Kotlin for native Android, or Java) that consumes your web application's backend API. The current Next.js application's server actions (`src/actions`) and database logic (`src/lib/db.ts`) would need to be exposed through a dedicated REST API layer for the native app to consume.
*   **Steps:**
    1.  **Set up Flutter/Android Studio:** Install the necessary SDKs and development environment.
    2.  **Design and Develop:** Re-implement the UI and user experience using Flutter, Kotlin, or Java.
    3.  **API Integration:** Create a dedicated REST API layer (e.g., using Node.js/Express, or Next.js API routes) to expose data and business logic from your existing backend to the native app.
    4.  **Database/Blockchain:** Integrate directly with local storage (if needed for offline capabilities) and the Polygon blockchain via their respective SDKs (e.g., `moralis-sdk`).
    5.  **Build and Deploy:** Build the APK/AAB and publish it to the Google Play Store.

### 2. Progressive Web App (PWA) - Leveraging Existing Web Code
Your Next.js app already contains PWA-related files (`public/manifest.json`, `public/sw.js`, `public/workbox-e43f5367.js`), suggesting that PWA capabilities are either in place or planned. A PWA can be "installed" on an Android device, providing an app-like experience without needing an app store.

*   **How it works:** Users visit your web app in their browser, and the browser prompts them to "Add to Home Screen." Once installed, it behaves much like a native app:
    *   It gets its own icon on the home screen.
    *   Can run in full-screen mode without browser UI.
    *   Can work offline (if the service worker is properly configured).
    *   Can send push notifications.
*   **Steps:**
    1.  **Ensure PWA readiness:**
        *   Verify `public/manifest.json` is correctly configured with your app name, icons, start URL, and display mode (`"standalone"`).
        *   Ensure `public/sw.js` (service worker) effectively caches assets for offline use. You may need to enhance its caching strategies.
    2.  **Optimize for Mobile:** Ensure your existing Next.js app is highly responsive and optimized for touch interactions on smaller screens.
    3.  **Deploy:** Host your web app on a server (as described in the "Publishing on Your Own Server" section). Users can then visit the URL and install it from their browser.

### 3. Hybrid App (Wrapping with Tools like Capacitor or Cordova)
This approach wraps your existing web application inside a native shell (a WebView), allowing you to publish it to app stores while reusing most of your web codebase.

*   **How it works:** Tools like Capacitor or Cordova provide native "containers" for your web content. Your Next.js application runs inside a WebView within this native container, granting access to some native device features (camera, GPS, etc.) via plugins.
*   **Steps (using Capacitor as an example):**
    1.  **Build your Next.js app for production:**
        ```bash
        npm run build # or yarn build
        ```
        *Note: If you plan to use `next export` to generate static HTML, configure `next.config.ts` accordingly and export to a directory like `out` or `build`.*
    2.  **Install Capacitor CLI:**
        ```bash
        npm install -g @capacitor/cli
        ```
    3.  **Initialize Capacitor in your project:**
        ```bash
        npx cap init [app-name] [app-id]
        # Example: npx cap init "Questify App" com.yourcompany.questify
        ```
        Configure `capacitor.config.json` to point `webDir` to your Next.js build output directory (e.g., `out` or `.next`).
    4.  **Add Android platform:**
        ```bash
        npx cap add android
        ```
        This creates an `android` directory containing an Android Studio project.
    5.  **Copy your web assets:** After every Next.js build, you need to copy the built web assets into the Capacitor `webDir`.
        ```bash
        npx cap copy
        ```
    6.  **Open in Android Studio:**
        ```bash
        npx cap open android
        ```
        From Android Studio, you can run your app on an emulator or a physical device, build release APKs, and integrate native plugins.
    7.  **Implement Native Features (Optional):** Use Capacitor plugins to access device-specific APIs (e.g., camera, push notifications).
    8.  **Build and Deploy:** Build the APK/AAB from Android Studio and publish it to the Google Play Store.

**Recommendation Summary:**

*   For the best native performance and full mobile integration: **Rebuild with Flutter** (as per the blueprint).
*   For a quick app-like experience with minimal code changes: **Enhance PWA capabilities**.
*   To publish to the Google Play Store while reusing most of your web UI code: Use a **hybrid wrapper like Capacitor**.