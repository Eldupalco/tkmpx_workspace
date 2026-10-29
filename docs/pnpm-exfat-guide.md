# PNPM Configuration Guide for exFAT Drives, Prisma & NestJS (TypeScript)

This document details the root causes and remedies for issues encountered when using **pnpm (v11+)** on Windows with secondary exFAT drives (e.g., drive `D:`), managing native package build scripts (Prisma), and configuring TypeScript for NestJS.

---

## 1. Issue: `[ERR_PNPM_EISDIR]` Symlink Failure

### 1.1 Symptoms & Error Log
```text
[ERR_PNPM_EISDIR] [symlinkAllModules] EISDIR: illegal operation on a directory, symlink
The "D:" drive is exFAT, which does not support symlinks. This will cause installation to fail.
```

### 1.2 Root Cause
- **Filesystem limitation**: Drive `D:` is formatted as **exFAT** (frequently used for external drives, portable SSDs, and cross-platform partitions). 
- **No symlink support**: The exFAT filesystem does not support POSIX-style symbolic links (symlinks).
- **pnpm default layout**: By default, pnpm uses an `isolated` virtual store (`node_modules/.pnpm`) and maps dependencies into `node_modules` using symlinks.
- **Cross-volume hard link limitation**: The global pnpm package store is located on `C:` (NTFS). Hard links cannot cross physical or logical drive boundaries between `C:` and `D:`.

### 1.3 The Remedy
Configure pnpm to use a **hoisted** (flat) dependency layout and force package copying instead of linking:

In `pnpm-workspace.yaml`:
```yaml
nodeLinker: hoisted
packageImportMethod: copy
```

- **`nodeLinker: hoisted`**: Changes `node_modules` to a flat layout (identical to classic npm or Yarn), eliminating all symlink creation.
- **`packageImportMethod: copy`**: Copies files directly from the central store on drive `C:` to drive `D:`, avoiding cross-volume hard link failures.

---

## 2. Issue: `[ERR_PNPM_IGNORED_BUILDS]` Lifecycle Scripts Blocked

### 2.1 Symptoms & Error Log
```text
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @prisma/engines@7.10.1, @scarf/scarf@1.4.0, prisma@7.10.1
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### 2.2 What are `@prisma/engines` and `prisma` doing?
Prisma is not purely JavaScript/TypeScript—database operations are driven by a high-performance **Rust-based query engine** (`query-engine.exe`, `schema-engine.exe`).

Because binaries vary by operating system and architecture (Windows x64 vs. macOS ARM vs. Linux), Prisma does not bundle every binary in the initial package download:
1. During installation, `@prisma/engines` triggers:
   ```json
   "postinstall": "node scripts/postinstall.js"
   ```
2. This script detects your OS (`Windows x64`) and downloads the exact compiled binary engine into your local environment.

### 2.3 Why does pnpm block them?
- **Security sandbox**: Modern pnpm versions block `preinstall` and `postinstall` scripts by default to protect against supply-chain attacks (untrusted packages executing arbitrary malicious scripts upon installation).
- **Consequence of blocking**: If blocked, the query engine binary will be missing. Running `prisma generate` or launching NestJS will fail with:
  > *"Prisma Client could not locate the Query Engine for runtime windows."*

### 2.4 The Remedy
Explicitly allow trusted packages to execute their build scripts in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  '@prisma/engines': true
  '@scarf/scarf': true
  prisma: true
```

*(Alternatively, run `pnpm approve-builds --all` in the terminal to automatically register them).*

---

## 3. TypeScript Configuration (`tsconfig.json`)

NestJS projects using modern ESM and Prisma require specific compiler settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictPropertyInitialization": false,
    "types": ["vitest/globals", "node"]
  }
}
```

### Why these compiler settings matter:

| Setting | Purpose |
| :--- | :--- |
| `"module": "nodenext"` & `"moduleResolution": "nodenext"` | Uses modern Node.js native ECMAScript module (ESM) resolution with `"type": "module"` in `package.json`. |
| `"emitDecoratorMetadata": true` & `"experimentalDecorators": true` | **Mandatory for NestJS**: Enables reflection and dependency injection metadata (`@Injectable()`, `@Controller()`, `@Body()`). |
| `"strictPropertyInitialization": false` | Allows class properties without initializers in constructors—essential for NestJS DTOs (`class-validator`) and Prisma model representations. |
| `"skipLibCheck": true` | Skips type-checking of all declaration files (`.d.ts`) in `node_modules`, preventing duplicate type definition conflicts in hoisted mode. |
| `"types": ["vitest/globals", "node"]` | Supplies global types for both Node.js APIs and the Vitest test runner. |

---

## 4. Complete Configuration Reference

### `pnpm-workspace.yaml` (Project Root)
```yaml
# 1. Resolve exFAT symlink & cross-drive hardlink limitations
nodeLinker: hoisted
packageImportMethod: copy

# 2. Allow necessary Prisma build/postinstall scripts
allowBuilds:
  '@prisma/engines': true
  '@scarf/scarf': true
  prisma: true
```

### Quick Recovery Steps (Clean Reinstall)
```powershell
Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml
pnpm install
pnpm build
```
