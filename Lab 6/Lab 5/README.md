# Lab 5 – Docker & Containerization (Dockerizing the Student REST API)

## Web Services & SOA Laboratory

**Technologies:** Docker • Docker Compose • Spring Boot (Java 17) • MongoDB • REST API

---

## 1. Lab Overview & Relation to Lab 4

This lab builds upon the **Lab 4 Student REST API** application. In Lab 4, the backend REST API was created using Spring Boot (Java 17) and connected to MongoDB. 

In **Lab 5**, we containerize the Student REST API and its MongoDB database environment using **Docker** and **Docker Compose**.

### Key Objectives Achieved:
1. Verified Docker installation (`docker --version`, `docker run hello-world`).
2. Tested the standalone Spring Boot Student REST API prior to containerization.
3. Created a multi-stage `Dockerfile` optimized for Spring Boot / Maven applications.
4. Built local Docker image `student-api:v1` and verified image registry.
5. Ran and tested single container API execution.
6. Containerized MongoDB (`mongo:latest`) and established inter-container communication using a dedicated bridge network `student-network`.
7. Externalized database connection and application settings via `MONGO_URI` and `PORT` environment variables.
8. Configured persistent database storage using Docker named volume `student-mongo-data`.
9. Orchestrated the complete multi-container setup (API + MongoDB + Volume + Network) using **Docker Compose** (`compose.yaml`).

---

## 2. Lab Architecture & Networking Model

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Docker Host / Machine                            │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Docker Network: student-network                    │  │
│  │                                                                       │  │
│  │  ┌───────────────────────────────┐     ┌───────────────────────────┐  │  │
│  │  │  Container: student-api       │     │  Container: mongodb       │  │  │
│  │  │  (Spring Boot REST API)       │─────│  (MongoDB Database)       │  │  │
│  │  │  Internal Port: 8080          │     │  Internal Port: 27017     │  │  │
│  │  └───────────────▲───────────────┘     └─────────────▲─────────────┘  │  │
│  └──────────────────│───────────────────────────────────│────────────────┘  │
│                     │                                   │                   │
│               Port Mapping                        Volume Mount              │
│               Host 8080:8080                            │                   │
│                     │                             ┌─────▼───────────────┐   │
│                     │                             │   Docker Volume:    │   │
│                     │                             │ student-mongo-data  │   │
│                     │                             │    (/data/db)       │   │
│                     │                             └─────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────────────────┘
                      │
           HTTP GET/POST/PUT/DELETE
                      │
             ┌────────┴────────┐
             │ Client / Postman│
             │ localhost:8080  │
             └─────────────────┘
```

---

## 3. Step-by-Step Implementation Guide

### Step 1 – Verify Docker Installation
Verify Docker Desktop installation and engine responsiveness:
```bash
docker --version
docker run hello-world
```

### Step 2 – Create Dockerfile & .dockerignore
Created `Dockerfile` in `student-api/` (and project root) utilizing a 2-stage build:
* **Stage 1 (Builder):** Uses `maven:3.9.6-eclipse-temurin-17` to compile source code and package the executable `.jar`.
* **Stage 2 (Runtime):** Uses lightweight `eclipse-temurin:17-jre` to execute the application.

```dockerfile
# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

Created `.dockerignore` to exclude build artifacts, git files, and temporary logs:
```
target/
.git/
.mvn/
mvnw
mvnw.cmd
.classpath
.project
.settings/
.idea/
*.iml
```

### Step 3 – Build Student API Docker Image
Build the Docker image tagged as `student-api:v1`:
```bash
docker build -t student-api:v1 .
docker images
```

### Step 4 – Run Single Student API Container
Run the containerized REST API with port mapping (`8080:8080`):
```bash
docker run --name student-api -p 8080:8080 student-api:v1
docker ps
```

### Step 5 – Test Containerized REST API with Postman
Test the containerized endpoints on `http://localhost:8080`:
* `GET /students` -> List all students
* `POST /students` -> Create new student
* `GET /students/{id}` -> Fetch student details
* `PUT /students/{id}` -> Update student record
* `DELETE /students/{id}` -> Remove student

### Step 6 – Run MongoDB Container
Run a standalone MongoDB container:
```bash
docker pull mongo:latest
docker run -d --name mongodb -p 27017:27017 mongo:latest
docker ps
```

### Step 7 – Docker Networking (Inter-Container Communication)
Create a dedicated bridge network and attach both containers:
```bash
docker network create student-network
docker network connect student-network mongodb
docker network connect student-network student-api
```

> **Important concept: `localhost` vs `mongodb`**  
> Inside a Docker container network, `localhost` points to the container itself (e.g. `student-api`). Containers communicate with each other using container/service names registered on the shared Docker DNS network (e.g., `mongodb:27017`).

### Step 8 – Configure Environment Variables
Configured Spring Boot `application.properties` to support environment variables:
```properties
spring.data.mongodb.uri=${MONGO_URI:mongodb+srv://studentadmin:qC!S4nSFU2d7scm@cluster0.h2gtxpa.mongodb.net/studentdb?retryWrites=true&w=majority}
server.port=${PORT:8080}
```

Run container with dynamic environment overrides:
```bash
docker run -d --name student-api \
  --network student-network \
  -e PORT=8080 \
  -e MONGO_URI=mongodb://mongodb:27017/studentdb \
  -p 8080:8080 student-api:v1
```

### Step 9 – Data Persistence with Docker Volumes
Create a Docker volume and mount it to MongoDB's data directory `/data/db`:
```bash
docker volume create student-mongo-data

docker run -d --name mongodb \
  --network student-network \
  -v student-mongo-data:/data/db \
  -p 27017:27017 mongo:latest
```

**Persistence Verification Steps:**
1. Insert a student record via `POST /students`.
2. Stop and remove the MongoDB container (`docker stop mongodb && docker rm mongodb`).
3. Re-create the MongoDB container using the exact same `student-mongo-data` volume.
4. Call `GET /students` and verify that the data persists intact.

### Step 10 & 11 – Orchestration with Docker Compose
Created `compose.yaml` (and `docker-compose.yml`):

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: student-api
    ports:
      - "8080:8080"
    environment:
      PORT: 8080
      MONGO_URI: mongodb://mongodb:27017/studentdb
    depends_on:
      - mongodb
    networks:
      - student-network

  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - student-mongo-data:/data/db
    networks:
      - student-network

networks:
  student-network:
    driver: bridge

volumes:
  student-mongo-data:
```

**Compose Execution Commands:**
```bash
# Start full application stack in background
docker compose up -d

# Check service status
docker compose ps

# View live service logs
docker compose logs

# Stop and cleanup containers and network (preserves volume)
docker compose down
```

---

## 4. Basic Docker Commands Reference

| Command | Purpose |
| :--- | :--- |
| `docker --version` | Display installed Docker client & engine version |
| `docker images` | List all local Docker images |
| `docker ps` | List active running containers |
| `docker ps -a` | List all containers (running and stopped) |
| `docker stop <container>` | Gracefully stop a running container |
| `docker start <container>` | Start a stopped container |
| `docker restart <container>` | Restart a container |
| `docker logs <container>` | Display output logs of a container |
| `docker network ls` | List Docker networks |
| `docker volume ls` | List Docker persistent volumes |
| `docker compose up` | Build and start Compose services |
| `docker compose up -d` | Start Compose services in detached mode |
| `docker compose ps` | View status of Compose services |
| `docker compose logs` | Display logs for Compose services |
| `docker compose down` | Stop and remove Compose resources |

---

## 5. Troubleshooting & Solutions Encountered

1. **Docker Desktop Service Inactive:**  
   * *Symptom:* `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`.  
   * *Solution:* Launched Docker Desktop application on Windows host to initialize WSL2 background daemon.

2. **MongoDB Connection Failure from Container:**  
   * *Symptom:* `student-api` failed connecting when using `localhost:27017`.  
   * *Solution:* In containerized networks, `localhost` refers to the container itself. Updated connection string via `MONGO_URI=mongodb://mongodb:27017/studentdb` to use container name DNS resolution on `student-network`.

3. **Port Conflicts:**  
   * *Symptom:* Port 8080 or 27017 already bound on host.  
   * *Solution:* Stopped local standalone MongoDB service and existing server processes before running `docker compose up`.

---

## 6. Submission Evidence Checklist

- [x] **22. Docker installation/version:** `docker --version` and `docker run hello-world` verified.
- [x] **23. Lab 4 Student REST API running:** Verified Maven Spring Boot API build.
- [x] **24. Dockerfile:** Created multi-stage build Dockerfile for Java 17 Spring Boot API.
- [x] **25. Successful image build:** Built `student-api:v1` image.
- [x] **26. docker images output:** Confirmed image list.
- [x] **27. Running Student API container:** Verified container via `docker ps`.
- [x] **28. Postman testing of containerized API:** Verified CRUD operations on `/students`.
- [x] **29. MongoDB container running:** Verified MongoDB container.
- [x] **30. Docker network:** Created `student-network` connecting `student-api` & `mongodb`.
- [x] **31. Container hostname config:** Configured `MONGO_URI=mongodb://mongodb:27017/studentdb`.
- [x] **32. Environment variable configuration:** Configured `PORT` & `MONGO_URI` in Spring Boot `application.properties`.
- [x] **33. MongoDB volume creation:** Created named volume `student-mongo-data`.
- [x] **34. Data persistence test:** Verified data persistence across container recreation.
- [x] **35. Compose configuration:** Created `compose.yaml` and `docker-compose.yml`.
- [x] **36. Successful docker compose up:** Launched full multi-container stack.
- [x] **37. docker compose ps output:** Inspected status of compose services.
- [x] **38. Postman testing of Compose app:** Verified end-to-end flow.
- [x] **39. Docker/Compose logs:** Captured logs via `docker compose logs`.
