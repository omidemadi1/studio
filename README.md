## File Structure
The project is organized as follows:

```
questify-web/
├── docs/                  # Project documentation (e.g., blueprint.md)
├── public/                # Static assets (icons, manifest, service worker, etc.)
├── src/
│   ├── actions/           # Server actions for data mutations and server-side logic
│   ├── ai/                # AI features, Genkit configs, and flows
│   ├── app/               # Next.js App Router: routes, layouts, and pages
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Shadcn/UI components
│   │   └── icons/         # Custom icon components
│   ├── context/           # React context for global state management
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities, types, database, and data definitions
├── apphosting.yaml        # App hosting configuration
├── docker-compose.yml     # Docker Compose setup (if present)
├── next.config.ts         # Next.js configuration
├── package.json           # Project metadata and dependencies
├── postcss.config.mjs     # PostCSS configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project overview and instructions
```

### Key Directories
- **src/app/**: App routes, layouts, and pages (Next.js App Router)
- **src/components/**: UI and icon components
- **src/actions/**: Server actions for backend logic
- **src/ai/**: AI flows and Genkit configuration
- **src/context/**: Global state management
- **src/hooks/**: Custom hooks
- **src/lib/**: Utilities, types, and database setup
- **public/**: Static assets and PWA files
- **docs/**: Project documentation

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