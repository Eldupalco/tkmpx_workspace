# Docker & PostgreSQL Beginner's Guide (NestJS + Prisma)

This guide documents the setup, common errors, troubleshooting remedies, and essential command cheatsheets for running PostgreSQL in Docker for NestJS and Prisma.

---

## 1. Quick Start Configuration

### 1.1 `docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:17
    container_name: nestjs_prisma_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "@2020"
      POSTGRES_DB: tkpex
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U postgres -d tkpex" ]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

### 1.2 `.env` Connection String
```env
DATABASE_URL="postgresql://postgres:%402020@localhost:5432/tkpex?schema=public"
```

---

## 2. Common Problems & Remedies

### Problem 1: `docket : The term 'docket' is not recognized`
- **Cause**: Simple typing error (`docket` instead of `docker`).
- **Remedy**:
  ```powershell
  docker compose up -d
  ```

---

### Problem 2: `FATAL: role "<username>" does not exist`
- **Symptom**:
  ```text
  docker exec -it nestjs_prisma_postgres psql -U nestjs -d tkpex
  psql: error: connection failed: FATAL: role "nestjs" does not exist
  ```
- **Cause**:
  In PostgreSQL, a **role** is a user account. When the container initialized, it created the user defined in `POSTGRES_USER: postgres`. The user `nestjs` was never created.
- **Remedy**:
  Always use the username defined in your `POSTGRES_USER`:
  ```powershell
  docker exec -it nestjs_prisma_postgres psql -U postgres -d tkpex
  ```

---

### Problem 3: Healthcheck Always Fails / Reports "Unhealthy"
- **Symptom**: Container runs, but `docker compose ps` shows `(unhealthy)`.
- **Cause**:
  The `pg_isready` healthcheck command uses default or copy-pasted usernames/databases that do not match the environment variables:
  ```yaml
  # ❌ INCORRECT (Mismatched credentials)
  environment:
    POSTGRES_USER: postgres
    POSTGRES_DB: tkpex
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U nestjs -d nestjs_db"]
  ```
- **Remedy**:
  Ensure `-U` and `-d` in `pg_isready` match `POSTGRES_USER` and `POSTGRES_DB`:
  ```yaml
  # ✅ CORRECT
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres -d tkpex"]
  ```

---

### Problem 4: Password with Special Characters (`@`)
- **Cause**:
  1. In YAML, unquoted symbols like `@` can trigger parsing warnings or syntax errors.
  2. In database connection URLs (`DATABASE_URL`), `@` is the reserved separator between credentials and hostname:
     `postgresql://<user>:<password>@<host>:<port>/<db>`
     If your password is `@2020`, the raw URL becomes:
     `postgresql://postgres:@2020@localhost:5432/tkpex`  *(Confuses URL parsers)*.
- **Remedy**:
  1. **In `docker-compose.yml`**: Quote the password:
     ```yaml
     POSTGRES_PASSWORD: "@2020"
     ```
  2. **In `.env`**: Percent-encode the `@` symbol as `%40`:
     ```env
     DATABASE_URL="postgresql://postgres:%402020@localhost:5432/tkpex?schema=public"
     ```

---

## 3. Essential Docker Compose Cheatsheet

| Task | Command | Description |
| :--- | :--- | :--- |
| **Start database** | `docker compose up -d` | Starts PostgreSQL in the background. |
| **Check container health** | `docker compose ps` | Shows if the container is running and healthy. |
| **View database logs** | `docker compose logs -f postgres` | Streams live logs from PostgreSQL. |
| **Stop database** | `docker compose down` | Stops the container without losing your data. |
| **Reset everything** | `docker compose down -v` | **Warning**: Deletes the volume and wipes all data clean for a fresh start. |

---

## 4. PostgreSQL CLI (`psql`) Beginner Cheatsheet

To open an interactive SQL session inside your container:
```powershell
docker exec -it nestjs_prisma_postgres psql -U postgres -d tkpex
```

Once inside the `tkpex=#` prompt, use these shortcut commands:

| Command | Action |
| :--- | :--- |
| `\l` | List all databases |
| `\c <dbname>` | Connect / switch to another database |
| `\dt` | List all tables in current database |
| `\d <tablename>` | Describe table schema, columns, and indexes |
| `\du` | List all database users (roles) and their permissions |
| `SELECT version();` | Check PostgreSQL version |
| `\q` | Exit `psql` back to Windows PowerShell |

---

## 5. Integrating with Prisma in NestJS

### 5.1 Using an Existing Live Database (Database-First: `prisma db pull`)

If your database already contains tables (e.g. created previously or via SQL dumps), you do not need to write Prisma models manually:

1. **Pull the schema from the live database**:
   ```powershell
   pnpm exec prisma db pull
   ```
   *Prisma connects to PostgreSQL, inspects the existing tables, relations, and constraints, and automatically writes the models into `prisma/schema.prisma`.*

2. **Your Introspected Models (`prisma/schema.prisma`)**:
   ```prisma
   model users {
     id          String        @id
     name        String
     email       String        @unique
     password    String
     role        String        @default("user")
     createdAt   DateTime      @default(now())
     updatedAt   DateTime
     attendances attendances[]
     schedules   schedules[]
   }

   model schedules {
     id          String        @id
     userId      String
     dayOfWeek   Int
     startTime   String
     endTime     String
     shiftName   String?
     isActive    Boolean       @default(true)
     createdAt   DateTime      @default(now())
     updatedAt   DateTime
     attendances attendances[]
     users       users         @relation(fields: [userId], references: [id], onDelete: Cascade)
   }

   model attendances {
     id           String     @id
     userId       String
     date         String
     checkInTime  DateTime   @default(now())
     checkOutTime DateTime?
     status       String     @default("present")
     notes        String?
     createdAt    DateTime   @default(now())
     updatedAt    DateTime
     scheduleId   String?
     schedules    schedules? @relation(fields: [scheduleId], references: [id])
     users        users      @relation(fields: [userId], references: [id], onDelete: Cascade)
   }
   ```

3. **Generate the Prisma Client**:
   ```powershell
   pnpm exec prisma generate
   ```
   *Generates strongly-typed client code in `src/generated/prisma`.*

---

### 5.2 Starting Fresh (Schema-First: `prisma migrate dev`)

If you are defining a new schema from scratch and want Prisma to create the tables:

1. Write your models in `prisma/schema.prisma`.
2. Run migrations to create tables in PostgreSQL:
   ```powershell
   pnpm exec prisma migrate dev --name init
   ```

---

### 5.3 Core Prisma Commands Lifecycle (How, When & Where)

Understanding the exact sequence, purpose, and execution context of the core Prisma commands:

```mermaid
graph TD
    A["1. Edit prisma/schema.prisma"] --> B["2. pnpm exec prisma format"]
    B --> C["3. pnpm exec prisma validate"]
    C --> D{"Prototyping or Production Migrations?"}
    D -- "Need SQL Migration History" --> E["4a. pnpm exec prisma migrate dev --name <name>"]
    D -- "Quick Prototype / No History" --> F["4b. pnpm exec prisma db push"]
    E --> G["(Auto-runs prisma generate)"]
    F --> H["5. pnpm exec prisma generate"]
    H --> I["6. Ready for NestJS Service Queries!"]
```

---

#### 1. `pnpm exec prisma format`
* **What & How it works**:
  * Formats and prettifies your `prisma/schema.prisma` file.
  * Automatically aligns columns, cleans up indentation, and fills in missing inverse relation fields (e.g., adding `attendances attendances[]` if you only typed `@relation` on one side).
* **Where to run**: In the root directory of your project (in your PowerShell/terminal).
* **When to use**:
  * Right after writing or editing any model in `schema.prisma`.
  * Before saving or running migrations to ensure clean diffs in git.

---

#### 2. `pnpm exec prisma validate`
* **What & How it works**:
  * Validates the syntax and semantic integrity of your `schema.prisma`.
  * Verifies field types, primary keys (`@id`), foreign key relations, unique attributes, and database provider configs.
  * Does **not** touch or alter your live database.
* **Where to run**: In the root directory of your project.
* **When to use**:
  * Before running migrations to catch errors (e.g. mismatched relation types, missing IDs, misspelled attributes).
  * In CI/CD pipelines to ensure pull requests don't break the database schema.

---

#### 3. `pnpm exec prisma migrate dev --name <migration_name>`
* **What & How it works**:
  1. Compares your `schema.prisma` against your local `prisma/migrations/` history.
  2. Generates a new, human-readable SQL migration file (e.g., `prisma/migrations/<timestamp>_init/migration.sql`).
  3. Executes that SQL migration against your PostgreSQL database in Docker.
  4. Records the migration in the `_prisma_migrations` system table in PostgreSQL.
  5. Automatically triggers `prisma generate` at the end so TypeScript types are immediately updated.
* **Where to run**: In your root terminal against your local development database.
* **When to use**:
  * When you make schema changes (add/remove tables, rename fields, add indexes) and want to keep a version-controlled SQL history.
  * When preparing schema changes that need to be deployed reliably to staging or production.
* **What if Drift is Detected?** (e.g., database has tables but local `migrations/` folder is missing):
  * **Option A**: If in local development and data can be wiped, run:
    ```powershell
    pnpm exec prisma migrate reset
    ```
    *(Drops all tables, recreates schema cleanly, and applies migrations)*.
  * **Option B**: If you want to bypass migrations and push schema directly without SQL files, run:
    ```powershell
    pnpm exec prisma db push
    ```

---

#### 4. `pnpm exec prisma generate`
* **What & How it works**:
  * Reads `prisma/schema.prisma` and compiles custom TypeScript models, classes, and query builder methods into your output folder (`src/generated/prisma` or `node_modules/@prisma/client`).
  * Provides IntelliSense autocomplete in your IDE for database models (e.g., `prisma.users.findMany()`).
* **Where to run**: In your root terminal.
* **When to use**:
  * After running `pnpm exec prisma db pull` (reverse engineering a database).
  * After running `pnpm exec prisma db push`.
  * After cloning the repo or running `pnpm install` on a fresh machine (since generated files are usually git-ignored).
  * Whenever your TypeScript IDE complains that a table or column does not exist on your Prisma client.

---

### 5.4 Quick Reference Cheatsheet

| Command | Purpose | When to run | Modifies Database? |
| :--- | :--- | :--- | :--- |
| `pnpm exec prisma format` | Prettifies schema & auto-aligns relations | Immediately after editing `schema.prisma` | ❌ No |
| `pnpm exec prisma validate` | Checks schema syntax and relations | Before migrating / in CI/CD checks | ❌ No |
| `pnpm exec prisma migrate dev --name <name>` | Creates SQL migration file & applies to DB | Whenever schema structure changes in development | ✅ Yes |
| `pnpm exec prisma db push` | Pushes schema directly to DB without SQL files | Quick prototyping or syncing without migration logs | ✅ Yes |
| `pnpm exec prisma db pull` | Reads existing DB tables and writes `schema.prisma` | Connecting to a pre-existing live database | ❌ No (modifies schema file) |
| `pnpm exec prisma generate` | Compiles TypeScript types into `src/generated/prisma` | After schema changes, pull, push, or fresh install | ❌ No (modifies TS code) |
| `pnpm exec prisma migrate reset` | Drops DB, cleans state, and reruns all migrations | When DB drift occurs or for a fresh clean restart | ⚠️ Yes (wipes all data) |
| `pnpm exec prisma studio` | Opens visual web GUI at `http://localhost:5555` | Anytime you want to view/edit database records | ❌ View / Optional edits |

---

## 6. Scaffolding NestJS Features & Connecting to Prisma

Prisma manages your database models, while Nest CLI (`nest g ...`) scaffolds the HTTP and business logic layers inside `src/`.

```mermaid
graph LR
    subgraph Database Layer [Prisma / PostgreSQL]
        A["schema.prisma (attendances model)"]
        B["src/generated/prisma (TypeScript types)"]
    end
    subgraph Application Layer [NestJS]
        C["AttendancesController (HTTP Endpoints)"]
        D["AttendancesService (Business Logic)"]
        E["PrismaService (Database Access)"]
    end
    A -->|prisma generate| B
    B -->|Imported by| E
    E -->|Injected into| D
    D -->|Injected into| C
```

### 6.1 Nest CLI Generation Commands

To generate a new feature (e.g. `attendances` or `users`), run these 3 commands:

```powershell
# 1. Module (Dependency container & auto-registered in app.module.ts)
pnpm exec nest g module attendances

# 2. Controller (Handles HTTP routes: GET, POST, PATCH)
pnpm exec nest g controller attendances --no-spec

# 3. Service (Handles database queries via PrismaService)
pnpm exec nest g service attendances --no-spec
```

> [!NOTE]
> * `--no-spec` tells Nest CLI to skip generating `.spec.ts` test files if you don't need unit test boilerplate right away.
> * Always include `nest` before `g` (running `pnpm exec g` fails because `g` is a sub-command of `nest`).

---

### 6.2 Step 1: Set Up Global `PrismaService`

Before feature services can query the database, connect `PrismaClient` through NestJS:

1. **`src/prisma/prisma.service.ts`**:
   ```typescript
   import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
   import { PrismaClient } from '../generated/prisma/client.js';

   @Injectable()
   export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
     async onModuleInit() {
       await this.$connect();
     }

     async onModuleDestroy() {
       await this.$disconnect();
     }
   }
   ```

2. **`src/prisma/prisma.module.ts`**:
   ```typescript
   import { Global, Module } from '@nestjs/common';
   import { PrismaService } from './prisma.service.js';

   @Global() // Makes PrismaService available across all modules without re-importing
   @Module({
     providers: [PrismaService],
     exports: [PrismaService],
   })
   export class PrismaModule {}
   ```

---

### 6.3 Step 2: Implement Business Logic (`attendances.service.ts`)

Inject `PrismaService` into `AttendancesService` to run queries against the `attendances` table:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  // Check-in (Create new attendance)
  async checkIn(userId: string, scheduleId?: string, notes?: string) {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    return this.prisma.attendances.create({
      data: {
        id: randomUUID(),
        userId,
        date: today,
        checkInTime: new Date(),
        status: 'present',
        notes,
        scheduleId,
        updatedAt: new Date(),
      },
      include: {
        users: { select: { id: true, name: true, email: true } },
        schedules: true,
      },
    });
  }

  // Check-out (Update existing attendance)
  async checkOut(attendanceId: string) {
    return this.prisma.attendances.update({
      where: { id: attendanceId },
      data: {
        checkOutTime: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Get user history
  async findByUser(userId: string) {
    return this.prisma.attendances.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { schedules: true },
    });
  }
}
```

---

### 6.4 Step 3: Expose HTTP Routes (`attendances.controller.ts`)

Connect incoming client requests to your service methods:

```typescript
import { Controller, Post, Patch, Get, Body, Param } from '@nestjs/common';
import { AttendancesService } from './attendances.service.js';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  // POST /attendances/check-in
  @Post('check-in')
  checkIn(
    @Body('userId') userId: string,
    @Body('scheduleId') scheduleId?: string,
    @Body('notes') notes?: string,
  ) {
    return this.attendancesService.checkIn(userId, scheduleId, notes);
  }

  // PATCH /attendances/:id/check-out
  @Patch(':id/check-out')
  checkOut(@Param('id') id: string) {
    return this.attendancesService.checkOut(id);
  }

  // GET /attendances/user/:userId
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.attendancesService.findByUser(userId);
  }
}
```

---

> [!TIP]
> For advanced MVC architectures, subfolder generators (`dto/`, `services/`, `controllers/`, `views/`), and the all-in-one resource generator, see the [NestJS Architecture Guide](nestjs-architecture-guide.md).




