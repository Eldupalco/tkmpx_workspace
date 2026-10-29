# NestJS Architecture & MVC Folder Structure Guide (with Prisma)

A comprehensive guide on structuring NestJS applications, implementing the MVC pattern, auto-generating subfolders (`dto`, `services`, `controllers`, `views`), and connecting them with Prisma ORM.

---

## 1. MVC in NestJS & Prisma

In a modern TypeScript backend, the **Model-View-Controller (MVC)** pattern maps directly to NestJS and Prisma components:

```mermaid
graph LR
    subgraph Client [Client / Frontend]
        REQ["HTTP Request"]
        RES["HTTP Response"]
    end

    subgraph ControllerLayer [Controller (C)]
        CTRL["attendances.controller.ts<br/>- Handles routes (GET, POST, PATCH)<br/>- Validates DTOs"]
    end

    subgraph ViewLayer [View (V)]
        DTO["dto/ & views/<br/>- Input validation (DTO)<br/>- Output serialization (JSON/Templates)"]
    end

    subgraph ModelLayer [Model & Service (M)]
        SRV["services/attendances.service.ts<br/>- Business logic<br/>- Queries Prisma"]
        PRISMA["Prisma Client & PostgreSQL<br/>- Schema, relations, database tables"]
    end

    REQ --> CTRL
    CTRL --> DTO
    CTRL --> SRV
    SRV --> PRISMA
    PRISMA --> SRV
    SRV --> CTRL
    CTRL --> RES
```

* **Model (M)**: Database models in `prisma/schema.prisma` + business logic in `services/attendances.service.ts`.
* **View (V)**: Data Transfer Objects (`dto/`), output responses, or server-rendered templates (`views/`).
* **Controller (C)**: Routing and request handling in `controllers/attendances.controller.ts`.

---

## 2. Choosing Your Folder Structure

### Option A: Modular MVC (NestJS Recommended)

Each business feature (e.g. `attendances`, `users`, `schedules`) is a self-contained mini-MVC module:

```text
src/
├── attendances/
│   ├── controllers/
│   │   └── attendances.controller.ts   <-- [C] Controller
│   ├── dto/
│   │   ├── create-attendance.dto.ts    <-- [V] Input validation
│   │   └── update-attendance.dto.ts
│   ├── services/
│   │   └── attendances.service.ts      <-- [M] Model / Business logic
│   ├── views/
│   │   └── attendance-response.dto.ts  <-- [V] Output view / serialization
│   └── attendances.module.ts           <-- Feature dependency container
├── users/
│   ├── controllers/
│   ├── dto/
│   ├── services/
│   └── users.module.ts
├── prisma/
│   ├── prisma.module.ts                <-- Global Prisma connection
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

> **Why this is recommended**:
> * Everything related to `attendances` lives in one folder.
> * If you ever need to delete, refactor, or extract a feature into a microservice, you only touch that one folder.

---

### Option B: Layer-Based MVC (Traditional Express / Laravel Style)

All controllers are grouped together, all services together, and all DTOs/views together:

```text
src/
├── controllers/
│   ├── attendances.controller.ts
│   └── users.controller.ts
├── services/
│   ├── attendances.service.ts
│   └── users.service.ts
├── dto/
│   ├── attendances/
│   └── users/
├── views/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

---

## 3. How to Auto-Generate Subfolders with Nest CLI

You can generate any custom nested folder structure directly from the terminal without creating files manually.

### 3.1 Generating Modular MVC Subfolders (`dto`, `services`, `controllers`, `views`)

Run these commands in PowerShell from the project root:

```powershell
# 1. Feature Module (Root of attendances)
pnpm exec nest g module attendances

# 2. Controller inside 'controllers/' subfolder
pnpm exec nest g controller attendances/controllers/attendances --no-spec

# 3. Service inside 'services/' subfolder
pnpm exec nest g service attendances/services/attendances --no-spec

# 4. DTOs inside 'dto/' subfolder
pnpm exec nest g class attendances/dto/create-attendance.dto --no-spec
pnpm exec nest g class attendances/dto/update-attendance.dto --no-spec

# 5. Output View / Entity inside 'views/' subfolder
pnpm exec nest g class attendances/views/attendance.view --no-spec
```

#### What Nest CLI does automatically:
1. Creates the nested folders (`controllers/`, `services/`, `dto/`, `views/`).
2. Generates the TypeScript classes.
3. Automatically updates `attendances.module.ts` with correct relative import paths:
   ```typescript
   import { Module } from '@nestjs/common';
   import { AttendancesController } from './controllers/attendances.controller.js';
   import { AttendancesService } from './services/attendances.service.js';

   @Module({
     controllers: [AttendancesController],
     providers: [AttendancesService],
     exports: [AttendancesService],
   })
   export class AttendancesModule {}
   ```
4. Automatically registers `AttendancesModule` in `app.module.ts`.

---

### 3.2 All-In-One Generator: `nest g resource`

If you want Nest CLI to generate a full CRUD feature with DTOs and entities in **one single command**:

```powershell
pnpm exec nest g resource attendances --no-spec
```

When prompted:
1. *What transport layer do you use?* $\rightarrow$ Select **REST API**
2. *Would you like to generate CRUD entry points?* $\rightarrow$ Select **Y**

This creates:
```text
src/attendances/
├── dto/
│   ├── create-attendance.dto.ts
│   └── update-attendance.dto.ts
├── entities/
│   └── attendance.entity.ts
├── attendances.controller.ts
├── attendances.service.ts
└── attendances.module.ts
```

---

## 4. Complete Code Implementation Example

### 4.1 Input DTO with Validation (`dto/create-attendance.dto.ts`)

```typescript
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsOptional()
  scheduleId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
```

---

### 4.2 Service with Prisma Query (`services/attendances.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAttendanceDto } from '../dto/create-attendance.dto.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(dto: CreateAttendanceDto) {
    const today = new Date().toISOString().split('T')[0];

    return this.prisma.attendances.create({
      data: {
        id: randomUUID(),
        userId: dto.userId,
        date: today,
        checkInTime: new Date(),
        status: 'present',
        notes: dto.notes,
        scheduleId: dto.scheduleId,
        updatedAt: new Date(),
      },
      include: {
        users: { select: { id: true, name: true, email: true } },
        schedules: true,
      },
    });
  }

  async checkOut(id: string) {
    return this.prisma.attendances.update({
      where: { id },
      data: {
        checkOutTime: new Date(),
        updatedAt: new Date(),
      },
    });
  }

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

### 4.3 Controller (`controllers/attendances.controller.ts`)

```typescript
import { Controller, Post, Patch, Get, Body, Param } from '@nestjs/common';
import { AttendancesService } from '../services/attendances.service.js';
import { CreateAttendanceDto } from '../dto/create-attendance.dto.js';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('check-in')
  checkIn(@Body() dto: CreateAttendanceDto) {
    return this.attendancesService.checkIn(dto);
  }

  @Patch(':id/check-out')
  checkOut(@Param('id') id: string) {
    return this.attendancesService.checkOut(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.attendancesService.findByUser(userId);
  }
}
```

---

## 5. Nest CLI Generation Cheatsheet

| To Generate | CLI Command | Output Path Example |
| :--- | :--- | :--- |
| **Module** | `pnpm exec nest g module <path>` | `src/attendances/attendances.module.ts` |
| **Controller** | `pnpm exec nest g controller <path> --no-spec` | `src/attendances/controllers/attendances.controller.ts` |
| **Service** | `pnpm exec nest g service <path> --no-spec` | `src/attendances/services/attendances.service.ts` |
| **DTO / Class** | `pnpm exec nest g class <path> --no-spec` | `src/attendances/dto/create-attendance.dto.ts` |
| **View / Entity** | `pnpm exec nest g class <path> --no-spec` | `src/attendances/views/attendance.view.ts` |
| **Interface** | `pnpm exec nest g interface <path>` | `src/attendances/interfaces/attendance.interface.ts` |
| **Filter** | `pnpm exec nest g filter <path> --no-spec` | `src/common/filters/http-exception.filter.ts` |
| **Guard** | `pnpm exec nest g guard <path> --no-spec` | `src/common/guards/auth.guard.ts` |
| **All-in-One Resource** | `pnpm exec nest g resource <name> --no-spec` | Complete feature folder with CRUD |

---

## 6. One-Command Custom Generator (`pnpm run gen:module`)

For this project, you can generate the entire MVC structure (`controllers`, `services`, `dto`, `views`) and auto-register it in `app.module.ts` using:

```powershell
pnpm run gen:module <name>
```

For the complete guide on customizing templates, script implementation, and deleting modules, see the [Module Generator Guide](module-generator-guide.md).

