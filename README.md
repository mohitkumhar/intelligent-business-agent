add the benchmarking feature and slack integration and github issue integration and dashboard 


### AI Business Helper Chatbot for Business Owners

- Problem Statement [[Click Here](/PS.md)]

---
Note: Make sure to have a `.env` in `./agent_code` folder which container the db url
```bash
DATABASE_URL=postgresql://admin:root@postgres_db:5432/test_db
```

---
DOCKER COMPOSE ENDPOINTS
- postgres  
   - POSTGRES USER: `admin`  
   - POSTGRES PASSWORD: `root`  
   - POSTGRES DEFAULT DB: `test_db`  
   - POSTGRES PORT: `5432`  

- pg-admin(for db-UI)  
   - PGADMIN DEFAULT EMAIL: `mohitmolela@gmail.com`  
   - PGADMIN DEFAULT PASSWORD: `root`  
   - PORTS: `5050`  

- landing-page(frontend)  
   - PORT: `5173`  
   - VITE_API_URL=`http://localhost:8000`  
   - DATABASE_URL=`postgresql://admin:root@db:5432/test_db`  
   - ENCRYPTION_SECRET=`12345678901234567890123456789012`  
   - NEXTAUTH_URL=`http://localhost:5173`  
   - NEXT_PUBLIC_VIEWER_URL=`http://localhost:5173`  

- Flask Agent  
   - PORT: `8000`  

- loki  
   - PORT: `3100`  

- grafana  
   - PORT: `3000`  
---

# AI Business Helper Chatbot – Database Setup Instructions

<!-- # Database Setup Instructions -->

## Step 1: Start PostgreSQL Container

Run the following command to start your Docker services:

```bash
docker compose up -d
```

This starts the PostgreSQL container in detached mode.

verify that it is running:

```bash
docker ps
```

Ensure PostgreSQL is running and mapped to port **5432**.

---

## Step 2: Verify PostgreSQL Is Ready

(Optional but recommended)

Check container logs:

```bash
docker logs <postgres-container-name>
```

You should see a message like:

```
database system is ready to accept connections
```

---

## Step 3: Access the PostgreSQL Container

First, list all containers:

```bash
docker ps -a
```

Then access the PostgreSQL container:

```bash
docker exec -it <container-name-or-id> /bin/bash
```

---

## Step 4: Create the Database

Before applying the schema, ensure the database exists.

Inside the container:

```bash
psql -U <user>
```

Create the database:

```sql
CREATE DATABASE <database-name>;
```

Exit:

```bash
\q
```

---

## Step 5: Copy Schema File into the Container

From your host machine:

```bash
docker cp path/to/host/machine/company_db_schema.sql <container-name>:/company_db_schema.sql
```

---

## Step 6: Copy Data File into the Container

```bash
docker cp path/to/host/machine/inserts.sql <container-name>:/inserts.sql
```

---

## Step 7: Apply the Schema

Inside the container:

```bash
psql -U <user> -d <database-name> -f ./company_db_schema.sql
```

This creates all tables and database structures.

---

## Step 8: Insert Initial Data

```bash
psql -U <user> -d <database-name> -f ./inserts.sql
```

This populates the tables with initial records.

---

## Step 9: Connect to the Database

To manually access the database:

```bash
psql -U <user> -d <database-name>
```

---

## Step 10: Verify Setup

Inside PostgreSQL CLI:

List tables:

```bash
\dt
```

List databases:

```bash
\l
```

Describe a table:

```bash
\d <table-name>
```

# Setup Flow Summary

1. Start Docker container
2. Verify PostgreSQL is running
3. Create database
4. Copy schema and data files
5. Execute schema
6. Insert data
7. Verify tables

---

Your PostgreSQL database should now be fully set up and ready for use.
