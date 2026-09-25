# Lab 7 - API Gateway, Configuration-Based Service Discovery & Cloud Deployment

**Course:** Web Services & SOA Laboratory  
**Lab:** Lab 7 - API Gateway, Service Discovery & Cloud  

---

## 1. Project Overview & Relationship to Previous Work

In **Lab 4**, a RESTful API was constructed alongside a frontend client.  
In **Lab 5**, the backend monolithic application and database were containerized using Docker.  
In **Lab 6**, the monolith was decomposed into three microservices (`User Service`, `Product Service`, `Order Service`) communicating over a shared Docker network.  

In **Lab 7**, we elevate the microservice system to production standards by introducing:
1. **API Gateway (`api-gateway`)**: A single entry point (port `3000`) that routes client requests, logs traffic, standardizes error responses, and isolates internal microservice endpoints.
2. **Configuration-Based Service Discovery**: Service locations are externalized into environment variables (`USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`), allowing routing to adapt dynamically without touching application code.
3. **Docker Network Isolation**: Only the API Gateway port (`3000:3000`) is exposed publicly. The underlying microservices (`3001`, `3002`, `3003`) are accessible strictly inside the internal Docker bridge network (`campus-network`).
4. **Cloud Deployment Readiness**: Configured for deployment on cloud container platforms (such as Render, Railway, or Fly.io) with public gateway endpoints.

---

## 2. Architecture Diagram

```mermaid
graph TD
    Client["Client / Postman<br>(Internet)"]
    
    subgraph CloudVPC["Docker Container Environment / Cloud VPC"]
        GW["API Gateway<br>(Port 3000 - Public)<br>Container: api-gateway"]
        
        subgraph DockerNetwork["Isolated Internal Network: campus-network"]
            US["User Service<br>(Port 3001 - Internal)<br>Container: user-service"]
            PS["Product Service<br>(Port 3002 - Internal)<br>Container: product-service"]
            OS["Order Service<br>(Port 3003 - Internal)<br>Container: order-service"]
        end
        
        DB[("MongoDB Atlas<br>(Cloud Persistence)")]
    end
    
    Client -->|HTTP GET/POST :3000| GW
    
    GW -->|/users/* -> USER_SERVICE_URL| US
    GW -->|/products/* -> PRODUCT_SERVICE_URL| PS
    GW -->|/orders/* -> ORDER_SERVICE_URL| OS
    
    OS -->|GET http://user-service:3001/users/{id}| US
    OS -->|GET http://product-service:3002/products/{id}| PS
    
    US -.->|MongoDB Connection| DB
    PS -.->|MongoDB Connection| DB
    OS -.->|MongoDB Connection| DB
```

---

## 3. Architecture & Service Boundaries

| Service | Expose Mode | External Port | Internal Address | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | **Public** | `3000` | `http://api-gateway:3000` | Single entry point, routing, logging, centralized `502/503` error handling. |
| **User Service** | **Private** | *None* | `http://user-service:3001` | Manages user accounts and credentials. |
| **Product Service** | **Private** | *None* | `http://product-service:3002` | Manages catalog products and inventory. |
| **Order Service** | **Private** | *None* | `http://order-service:3003` | Manages order creation, validating user & product references via inter-service calls. |

---

## 4. Discussion Answers

### Discussion Question 1: Why introduce an API Gateway instead of letting clients call each service directly?
In a microservices architecture without an API Gateway, clients must keep track of multiple service endpoints, deal with different domain names/ports, and manage complex cross-cutting concerns independently. Introducing an API Gateway offers significant architectural benefits:
- **Single Entry Point**: Clients interact with a single unified base URL (`http://localhost:3000`), hiding internal microservice complexity and backend refactoring.
- **Enhanced Security & Network Isolation**: Only the gateway port is publicly exposed. The microservices remain inside a private Docker bridge network, protected from unauthorized direct access.
- **Centralized Cross-Cutting Concerns**: Request logging, rate-limiting, SSL termination, authorization, and error handling are handled uniformly at the entry point rather than duplicated across each service.
- **Simplified Client Logic**: Clients avoid executing multiple round-trips to disparate microservices, reducing payload size and network round-trip overhead.

---

### Discussion Question 2: Static / Config-Based Discovery vs. Dynamic Service Discovery
In this lab, we implemented **configuration-based (static) service discovery**, where service addresses are defined in environment variables (`USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`) and read by the gateway at startup.

#### Comparison Table:

| Feature | Static / Config-Based (Lab 7) | Dynamic Service Discovery (Consul / Eureka / K8s DNS) |
| :--- | :--- | :--- |
| **Location Source** | Environment variables or `.env` / YAML files. | Centralized Service Registry (Consul, Eureka, ZooKeeper, K8s DNS). |
| **Updates** | Requires service restart when IP/port changes. | Real-time automatic discovery without server restarts. |
| **Health Checking** | Relies on gateway reverse-proxy error catching (`502/503`). | Automated active heartbeats and health checks by registry. |
| **Load Balancing** | Static single-target or hardcoded list. | Client-side or server-side dynamic load balancing across auto-scaled instances. |
| **Complexity** | Extremely lightweight, easy to maintain for fixed deployments. | Requires additional infrastructure containers and daemon processes. |

**What a dynamic registry adds**: A dynamic service registry allows instances to dynamically auto-register and deregister as they scale up or down (e.g. in autoscaling groups or Kubernetes pods). It actively monitors instance health, automatically removing unhealthy containers from the routing pool without requiring manual configuration updates or service restarts.

---

## 5. Gateway Endpoints & Routing Table

| Request Method | Gateway Path | Routed Service | Internal Target Endpoint |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Gateway (Self) | *N/A (Returns Gateway Status)* |
| `GET`, `POST` | `/users` | User Service | `http://user-service:3001/users` |
| `GET`, `PUT`, `DELETE` | `/users/:id` | User Service | `http://user-service:3001/users/:id` |
| `GET`, `POST` | `/products` | Product Service | `http://product-service:3002/products` |
| `GET`, `PUT`, `DELETE` | `/products/:id` | Product Service | `http://product-service:3002/products/:id` |
| `GET`, `POST` | `/orders` | Order Service | `http://order-service:3003/orders` |
| `GET` | `/orders/:id` | Order Service | `http://order-service:3003/orders/:id` |

---

## 6. How to Build & Run locally

### Build and Start Containers
```bash
docker compose up -d --build
```

### Verify Running Containers
```bash
docker compose ps
```
*Notice that only `api-gateway` exposes `0.0.0.0:3000->3000/tcp`. Microservices are bound to `3001`, `3002`, `3003` inside the container network only.*

### View Gateway Logs
```bash
docker compose logs -f api-gateway
```

### Stop Containers
```bash
docker compose down
```

---

## 7. Testing & Verification Guide (Postman)

Import `Microservices_Lab7.postman_collection.json` into Postman.

### Test Matrix:
1. **Health Check**: `GET http://localhost:3000/health` $\rightarrow$ `200 OK`
2. **Get Users**: `GET http://localhost:3000/users` $\rightarrow$ `200 OK`
3. **Get Products**: `GET http://localhost:3000/products` $\rightarrow$ `200 OK`
4. **Create Order (Success)**: `POST http://localhost:3000/orders` with body `{"userId": "101", "productId": "501", "quantity": 2}` $\rightarrow$ `201 Created`
5. **Unreachable Service Test (502 Bad Gateway)**:
   - Run: `docker stop user-service`
   - Send: `POST http://localhost:3000/orders`
   - Expected Output: `502 Bad Gateway` JSON response from gateway:
     ```json
     {
       "error": "Bad Gateway",
       "message": "Failed to communicate with Order Service at http://order-service:3003. Service may be offline or unreachable.",
       "targetService": "Order Service",
       "targetUrl": "http://order-service:3003",
       "statusCode": 502
     }
     ```
   - Restart service: `docker compose start user-service`

---

## 8. Cloud Deployment Guide

1. **Select Platform**: Render, Railway, or Fly.io.
2. **Deploy Microservices & Gateway**:
   - Deploy `user-service`, `product-service`, `order-service` as private web services.
   - Deploy `api-gateway` as a public web service exposing port `3000`.
3. **Configure Environment Variables in Cloud Dashboard**:
   - `USER_SERVICE_URL`: `http://user-service-cloud-host:3001` (or public internal URL)
   - `PRODUCT_SERVICE_URL`: `http://product-service-cloud-host:3002`
   - `ORDER_SERVICE_URL`: `http://order-service-cloud-host:3003`
4. **Public Gateway URL Verification**:
   - Access `https://<your-gateway-app>.onrender.com/health`
   - Re-run Postman collection using `CLOUD_GATEWAY_URL`.

---

## 9. Written Reflection

Comparing Lab 7 with Lab 6, the introduction of an API Gateway and cloud-oriented architecture fundamentally transforms how the system is operated and consumed. In Lab 6, clients directly targeted individual microservices across exposed ports, creating tight coupling and exposing backend infrastructure. By routing all requests through a central gateway in Lab 7, we decoupled client applications from individual service locations and established strict network isolation where services reside safely in a private Docker network. Furthermore, externalizing service URLs into environment variables allowed seamless environment switching between local Docker containers and cloud deployments without altering application source code. Finally, centralizing request logging and 502/503 error handling at the gateway layer vastly improved system observability and fault tolerance across the entire multi-service ecosystem.
