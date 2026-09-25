# Lab 6 - Microservices API and Communication Exercise

## 1. Service Decomposition Design Table

| Item | User Service | Product Service | Order Service |
| :--- | :--- | :--- | :--- |
| **Responsibility** | Create, retrieve, update, and delete User resources. | Manage Product resources used by the application. | Create and retrieve Orders; validate referenced User and Product data via REST APIs. |
| **Port** | `:3001` | `:3002` | `:3003` |
| **Main Resources** | Users | Products | Orders |
| **Key Endpoints** | `GET /users`<br>`GET /users/{id}`<br>`POST /users`<br>`PUT /users/{id}`<br>`DELETE /users/{id}` | `GET /products`<br>`GET /products/{id}`<br>`POST /products`<br>`PUT /products/{id}`<br>`DELETE /products/{id}` | `POST /orders`<br>`GET /orders`<br>`GET /orders/{id}` |
| **Data / Database** | User-owned isolated data store | Product-owned isolated data store | Order-owned isolated data store |

---

## 2. Service-to-Service Call Specification

| Field | Implementation Design |
| :--- | :--- |
| **Calling Service** | Order Service (`:3003`) |
| **Target Service(s)** | User Service (`:3001`) & Product Service (`:3002`) |
| **HTTP Method** | `GET` |
| **Endpoint(s)** | `http://user-service:3001/users/{id}`<br>`http://product-service:3002/products/{id}` |
| **Request Data** | `userId` (e.g. `"101"`), `productId` (e.g. `"501"`) |
| **Expected Response (Success)** | `200 OK` + requested resource data (e.g., User object or Product object). Order Service completes order creation with status `201 Created`. |
| **Failure Response (Resource Missing)** | `404 Not Found` - if User or Product does not exist. |
| **Failure Response (Dependency Down)** | `503 Service Unavailable` - controlled response when User Service or Product Service container is unreachable or stopped. |
