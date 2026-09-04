# IMY-220-Project

IMY 220 (Advanced Web Technologies) Project: Photo Sharing Website.


## RUN WITH DOCKER COMPOSE (RECOMMENDED)

The easiest way to start both services together is using Docker Compose.

* **Astrea Frontend** — React/Vite application running on port `5173`
* **Astrea Backend** — Express server running on port `3000`

### 1. Clone the GitHub Repository
    a) Clone the Repo:
        git clone https://github.com/ramotheo/IMY-220-Project.git

    b) Navigate to the project folder:
        cd IMY-220-Project

### 2. Start the Application
    docker compose up -d --build

### 3. Open the application
    Once both containers are running, open:
        http://localhost:5173

    The frontend communicates with the backend through:
        http://localhost:3000


### 4. Stop the Application
    docker compose down

## RUN WITH INDIVIDUAL DOCKER COMMANDS
If you prefer to build and run the containers manually without Docker Compose:

### 1. Build the Frontend Docker Image
    docker build -t astrea-frontend ./frontend

### 2. Build the Backend Docker Image
    docker build -t astrea-backend ./backend

### 3. RUn the Backend Container
    docker run -d --name Astrea-Backend -p 3000:3000 astrea-backend

### 4. Run the Frontend Container
    docker run -d --name Astrea-Frontend -p 5173:5173 astrea-frontend

### 5. Verify Containers
    docker ps

    You should see both:
        * Astrea-Backend
        * Astrea-Frontend

### 6. Open the application

Once both containers are running, open:
    http://localhost:5173

The frontend communicates with the backend through:
    http://localhost:3000


## USEFUL DOCKER COMMANDS

### Stop the Frontend
    docker stop Astrea-Frontend

### Stop the Backend
    docker stop Astrea-Backend

### Start the Frontend
    docker start Astrea-Frontend

### Start the Backend
    docker start Astrea-Backend

### Restart the Frontend
    docker restart Astrea-Frontend

### Restart the Backend
    docker restart Astrea-Backend

### View Frontend Logs
    docker logs Astrea-Frontend

### View Backend Logs
    docker logs Astrea-Backend

### Stop Both Containers
    docker stop Astrea-Frontend Astrea-Backend

### Remove the Frontend Container
    docker rm -f Astrea-Frontend

### Remove the Backend Container
    docker rm -f Astrea-Backend

## GITHUB REPOSITORY

Add your GitHub repository link here:
    https://github.com/ramotheo/IMY-220-Project/