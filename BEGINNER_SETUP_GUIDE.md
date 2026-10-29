# 🚀 End-to-End Installation & Setup Guide for Beginners

A complete, step-by-step walkthrough for setting up the entire **TKPEX Workforce & Attendance Management System** from scratch.

---

## 📑 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [What Files to Configure First (Order of Operations)](#2-what-files-to-configure-first-order-of-operations)
3. [Step 1: Start the PostgreSQL Database](#step-1-start-the-postgresql-database)
4. [Step 2: Configure the Backend (.env)](#step-2-configure-the-backend-env)
5. [Step 3: Install Backend Dependencies & Run Database Seeds](#step-3-install-backend-dependencies--run-database-seeds)
6. [Step 4: Launch the NestJS Backend](#step-4-launch-the-nestjs-backend)
7. [Step 5: Configure & Launch the Web Frontend](#step-5-configure--launch-the-web-frontend)
8. [Step 6: First Login & Verification](#step-6-first-login--verification)
9. [Troubleshooting & Common Beginner Gotchas](#troubleshooting--common-beginner-gotchas)

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:

| Tool | Recommended Version | Why It Is Needed | Download Link |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.x` or `v22.x` (LTS) | Runs both NestJS and Next.js | [nodejs.org](https://nodejs.org) |
| **Docker Desktop** | Latest | Runs the PostgreSQL database container with 1 command | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **pnpm** (or npm) | `v9.x`+ | Fast package manager for installing project dependencies | `npm install -g pnpm` |

> [!NOTE]
> If you already have PostgreSQL installed locally as a Windows service (without Docker), you can use it directly by adjusting the database password and port in `.env`.

---

## 2. What Files to Configure First (Order of Operations)

When setting up this project, **do not start by running the web frontend first**. The web frontend depends on the NestJS API, which in turn depends on the PostgreSQL database.

Follow this exact order:

```mermaid
flowchart TD
    A["1. Database\n(docker-compose.yml)"] -->|Starts PostgreSQL on port 5432| B["2. Backend Config\n(.env file)"]
    B -->|Provides DB URL & JWT Secret| C["3. Prisma Migration & Seed\n(prisma/seed.mjs)"]
    C -->|Creates tables & demo accounts| D["4. NestJS Server\n(http://localhost:3000)"]
    D -->|Serves REST endpoints| E["5. Web Frontend Config\n(web/.env.local)"]
    E -->|Points to port 3000| F["6. Next.js App\n(http://localhost:3001)"]
```

---

## Step 1: Start the PostgreSQL Database

The project includes a ready-to-run [docker-compose.yml](file:///d:/Dev/T001KMPEX/nestjs-prisma-api/docker-compose.yml) in the root directory.

### 1. Inspect `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:17
    container_name: nestjs_prisma_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "@2020"       # 👈 Database password
      POSTGRES_DB: tkpex              # 👈 Database name
    ports:
      - "5432:5432"                   # 👈 PostgreSQL port
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### 2. Start the database container:
Open your terminal in the project root and run:
```bash
docker compose up -d
```

> **Verification:** Run `docker ps` to verify that the container `nestjs_prisma_postgres` is running with status `healthy` or `Up`.

---

## Step 2: Configure the Backend (`.env`)

In the project root, copy the provided `.env.example` to `.env`:

```bash
# Windows PowerShell
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

### Key Variables in `.env`:
```ini
# 1. Database Connection URL
# postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?schema=public
DATABASE_URL="postgresql://postgres:%402020@localhost:5432/tkpex?schema=public"

# 2. Server Port
PORT=3000
NODE_ENV=development

# 3. JWT Token Secret
JWT_SECRET=supersecretjwtkeyforworkforceapp
```

> [!IMPORTANT]
> **Notice the `%40` in the password!**
> The Docker container password is `@2020`. In a database connection URI, the `@` symbol is reserved to separate the credentials from the host. Therefore, `@` **must be URL-encoded as `%40`**.
> If you write `@2020` directly in the connection string without `%40`, the connection will fail.

---

## Step 3: Install Backend Dependencies & Run Database Seeds

In the project root:

### 1. Install root dependencies:
```bash
pnpm install
```

### 2. Generate Prisma ORM Client & Apply Schema:
```bash
npx prisma db push
```
*This command creates the `users`, `attendances`, and `schedules` tables inside your PostgreSQL database based on `prisma/schema.prisma`.*

### 3. Seed the database with demo users:
```bash
pnpm seed
```
You will see output confirming created accounts:
```text
🌱 Starting database seeding...
🧹 Cleaning existing records...
👤 Seeding users with Argon2 hash...
   ✅ Created Admin: admin@tkpex.com (Password: password!!!)
   ✅ Created Employee: john.doe@tkpex.com (Password: password!!!)
📅 Seeding weekly shift schedules...
⏱️  Seeding attendance records...
✨ Seeding successfully completed!
```

---

## Step 4: Launch the NestJS Backend

Start the backend server in development mode:

```bash
pnpm start:dev
```

You should see:
```text
[NestApplication] Nest application successfully started
🚀 Application running on: http://localhost:3000
📚 Swagger documentation at: http://localhost:3000/api/docs
```

> **Verification:** Open your browser and navigate to [http://localhost:3000/api/docs](http://localhost:3000/api/docs) to view the live interactive Swagger API documentation.

---

## Step 5: Configure & Launch the Web Frontend

Open a **new terminal tab or window** (keep the backend running in the first window).

### 1. Navigate to the `web` folder:
```bash
cd web
```

### 2. Create `web/.env.local`:
Copy `web/.env.example` to `web/.env.local`:
```bash
# Windows PowerShell
copy .env.example .env.local

# Mac / Linux
cp .env.example .env.local
```

Inside `web/.env.local`, ensure the API URL points to port `3000`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Install frontend dependencies:
```bash
pnpm install
```

### 4. Start the Next.js development server:
```bash
pnpm dev
```

The frontend will start on port `3001`:
```text
▲ Next.js 14.2.15
- Local: http://localhost:3001
✓ Ready in 2.5s
```

> [!NOTE]
> Why Port `3001`?
> Next.js is configured with `-p 3001` so that it never clashes with the NestJS API running on port `3000`.

---

## Step 6: First Login & Verification

Open your web browser and go to:
👉 **[http://localhost:3001/login](http://localhost:3001/login)**

### Test Demo Credentials:

| Role | Email Address | Password | Redirects To |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@tkpex.com` | `password!!!` | `/admin/dashboard` (Company Roster, Metrics, Shift Management) |
| **Staff Employee**| `john.doe@tkpex.com` | `password!!!` | `/dashboard` (Punch Clock, Personal History, Timesheets) |

---

## 7. Configuration Quick Reference

| File | Location | When to Edit | What It Controls |
| :--- | :--- | :--- | :--- |
| **`docker-compose.yml`** | Project root | Step 1 | Sets up the PostgreSQL database container image, ports, and credentials. |
| **`.env`** | Project root | Step 2 | Backend configuration: `DATABASE_URL`, `PORT=3000`, `JWT_SECRET`. |
| **`prisma/schema.prisma`**| `prisma/` | Optional | Database models for User, Attendance, Schedule. |
| **`web/.env.local`** | `web/` | Step 5 | Tells the Next.js frontend where the NestJS API is located. |
| **`web/next.config.mjs`** | `web/` | Already configured | Next.js server configuration (exFAT & Windows friendly). |

---

## 8. Troubleshooting & Common Beginner Gotchas

### 1. `DATABASE_URL` Authentication Error (`P1000: Authentication failed`)
* **Problem**: Special characters like `@`, `#`, or `$` in your password break URI parsing.
* **Fix**: Encode special characters (e.g. `@` becomes `%40`, `#` becomes `%23`). Use:
  ```ini
  DATABASE_URL="postgresql://postgres:%402020@localhost:5432/tkpex?schema=public"
  ```

### 2. "API Connection Notice: NestJS backend is unreachable"
* **Problem**: You opened the frontend on `localhost:3001`, but forgot to start the backend server on `localhost:3000`.
* **Fix**: Run `pnpm start:dev` in the project root so the API is listening on port `3000`.

### 3. Port `5432` Already in Use
* **Problem**: You already have a native PostgreSQL service running on your computer.
* **Fix**: Either stop the existing local PostgreSQL service (`net stop postgresql-x64-16` on Windows), or change the external port in `docker-compose.yml` to `"5433:5432"` and update `localhost:5433` in `.env`.

### 4. Running on an exFAT External Drive (Windows)
* **Problem**: exFAT file systems do not support symlinks, causing `pnpm` errors.
* **Fix**: The repository already includes an `.npmrc` file with:
  ```ini
  node-linker=hoisted
  symlink=false
  ```
  This ensures pnpm installs flat packages safely on any Windows or exFAT drive.

---

## 📚 Related Documentation

- 🌐 [Web API Architecture & Integration Guide](WEB_API_ARCHITECTURE_GUIDE.md)
- ⚡ [NestJS Backend Architecture Guide](NESTJS_ARCHITECTURE_GUIDE.md)
- 🐳 [Docker PostgreSQL Detailed Guide](DOCKER_POSTGRES_GUIDE.md)
- 💾 [pnpm & exFAT Compatibility Guide](PNPM_EXFAT_GUIDE.md)

