# Lab 6 - Docker & Microservices: Decomposing and Running the Backend as Independent Services

**Course:** Web Services & SOA Laboratory  
**Lab:** Lab 6 - Microservices  

---

## 1. Project Overview & Relationship to Previous Work

In **Lab 4**, a RESTful API (CampusConnect Student API) was constructed alongside a frontend client and persistence mechanism.  
In **Lab 5**, the backend monolithic application and database were containerized using Docker and Docker Compose.  

In **Lab 6**, the monolithic backend architecture is decomposed into three independently runnable REST microservices:
1. **User Service** (`:3001`): Manages user accounts and credentials.
2. **Product Service** (`:3002`): Manages application catalog items/products.
3. **Order Service** (`:3003`): Orchestrates order placement, validating user and product existence by querying User Service and Product Service via inter-service REST calls over a shared Docker network.

---

## 2. Architecture Diagram

```mermaid
graph TD
    Client["Client / Postman"]
    
    subgraph DockerNetwork["Shared Docker Network: campus-network"]
        US["User Service<br>(Port 3001)<br>Container: user-service"]
        PS["Product Service<br>(Port 3002)<br>Container: product-service"]
        OS["Order Service<br>(Port 3003)<br>Container: order-service"]
        
        UDB[("User Data Store<br>(Isolated)")]
        PDB[("Product Data Store<br>(Isolated)")]
        ODB[("Order Data Store<br>(Isolated)")]
        
        US --- UDB
        PS --- PDB
        OS --- ODB
    end
    
    Client -->|HTTP GET/POST :3001| US
    Client -->|HTTP GET/POST :3002| PS
    Client -->|HTTP GET/POST :3003| OS
    
    OS -->|GET http://user-service:3001/users/{id}| US
    OS -->|GET http://product-service:3002/products/{id}| PS
```

---

## 3. Service Responsibilities & Service Boundaries

| Service | Port | Primary Responsibility | Owned Resources |
| :--- | :--- | :--- | :--- |
| **User Service** | `3001` | Create, retrieve, update, and delete User records. | Users (`id`, `name`, `email`, `role`) |
| **Product Service** | `3002` | Create, retrieve, update, and delete Product catalog items. | Products (`id`, `name`, `price`, `category`, `stock`) |
| **Order Service** | `3003` | Create and retrieve Orders; validate referenced User and Product via REST APIs. | Orders (`id`, `userId`, `productId`, `quantity`, `totalPrice`, `status`) |

---

## 4. Endpoint Mapping

### User Service (`:3001`)
- `GET /users`: List all users.
- `GET /users/:id`: Get user details by ID.
- `POST /users`: Register a new user.
- `PUT /users/:id`: Update user information.
- `DELETE /users/:id`: Remove user.

### Product Service (`:3002`)
- `GET /products`: List all catalog products.
- `GET /products/:id`: Get product details by ID.
- `POST /products`: Add a new product.
- `PUT /products/:id`: Update product information.
- `DELETE /products/:id`: Remove product.

### Order Service (`:3003`)
- `GET /orders`: List all confirmed orders.
- `GET /orders/:id`: Get order details by ID.
- `POST /orders`: Place an order (`{ "userId": "101", "productId": "501", "quantity": 2 }`).

---

## 5. Database-per-Service (Data Ownership)

Following microservice architectural patterns, **each service strictly owns its domain data**.
- Order Service **never** queries the User database or Product database directly.
- All cross-domain data verification is achieved via HTTP REST APIs over the Docker network.

---

## 6. How Service-to-Service Communication Works

When `POST /orders` is invoked on Order Service:
1. Order Service extracts `userId` and `productId` from the request body.
2. Order Service performs an asynchronous HTTP `GET` request to `${USER_SERVICE_URL}/users/${userId}` (`http://user-service:3001/users/101`).
3. Order Service performs an asynchronous HTTP `GET` request to `${PRODUCT_SERVICE_URL}/products/${productId}` (`http://product-service:3002/products/501`).
4. If both services return `200 OK`, Order Service calculates total price, generates an order confirmation, and stores the order.

---

## 7. Inter-Service Error Handling Behavior

- **Invalid Resource ID (404)**: If `userId` or `productId` does not exist in the target service, Order Service returns `404 Not Found` with a detailed error payload.
- **Dependency Failure (503 Service Unavailable)**: If User Service or Product Service container is stopped or unreachable, Order Service catches the connection error and returns a controlled `503 Service Unavailable` response rather than hanging or failing silently.

---

## 8. Dockerfile Explanations

Each service directory contains its own dedicated `Dockerfile`:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE <PORT>
CMD ["node", "server.js"]
```
- **Base Image**: `node:22-alpine` provides a minimal, secure Node.js execution environment.
- **Dependency Caching**: `package*.json` is copied first so `npm install` layer is cached unless dependencies change.
- **Port Exposure**: Exposes service ports (`3001`, `3002`, `3003`).

---

## 9. Environment Variables Configuration

Service URLs and ports are never hard-coded; they are configured via environment variables in `compose.yaml`:
```yaml
USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
```

---

## 10. Docker & Docker Compose Commands

### Build Individual Docker Images
```bash
docker build -t user-service:v1 ./user-service
docker build -t product-service:v1 ./product-service
docker build -t order-service:v1 ./order-service
```

### Run with Docker Compose
```bash
# Build and start all 3 microservices in detached mode
docker compose up -d --build

# View running containers and mapped ports
docker compose ps

# View container logs
docker compose logs -f

# Stop and remove containers and network
docker compose down
```

---

## 11. How to Run Each Service Independently (Without Docker)

Each service can be executed independently on host machine:
```bash
# User Service
cd user-service
npm install
npm start

# Product Service
cd product-service
npm install
npm start

# Order Service
cd order-service
npm install
USER_SERVICE_URL=http://localhost:3001 PRODUCT_SERVICE_URL=http://localhost:3002 npm start
```

---

## 12. Postman Testing Guide & Expected Responses

Import `Microservices_Lab6.postman_collection.json` into Postman.

| Test Case | Method | Endpoint | Expected Status |
| :--- | :--- | :--- | :--- |
| **Get Users** | `GET` | `http://localhost:3001/users` | `200 OK` |
| **Get Products** | `GET` | `http://localhost:3002/products` | `200 OK` |
| **Create Order (Success)** | `POST` | `http://localhost:3003/orders` | `201 Created` |
| **Invalid User ID** | `POST` | `http://localhost:3003/orders` (`userId: "999"`) | `404 Not Found` |
| **Stopped Dependency** | `POST` | `http://localhost:3003/orders` (after `docker stop user-service`) | `503 Service Unavailable` |
| **Dependency Recovery** | `POST` | `http://localhost:3003/orders` (after `docker compose start user-service`) | `201 Created` |

---

## 13. Troubleshooting & Resolutions

1. **Error: `ECONNREFUSED` during inter-service call**
   - *Cause*: Host `localhost` was used inside container instead of Docker service name.
   - *Resolution*: Set `USER_SERVICE_URL=http://user-service:3001` using Docker network service DNS names.
2. **Port collision on host machine**
   - *Cause*: Another process was using ports 3001, 3002, or 3003.
   - *Resolution*: Verify port usage with `netstat -ano` or change host port mapping in `compose.yaml`.
