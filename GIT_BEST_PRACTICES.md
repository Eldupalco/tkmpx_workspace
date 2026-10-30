# Git Best Practices & Critical Considerations

Essential rules, safety guidelines, and conventions to follow when working with Git and GitHub.

---

## 1. Secrets & Security (Never Commit to Git)

| Item | Why It Must Be Ignored | Proper Approach |
|------|------------------------|-----------------|
| `.env` & `.env.*.local` | Contains DB passwords, JWT secrets, API tokens | Commit `.env.example` with dummy values only |
| Private keys & certificates (`*.pem`, `*.key`) | Exposes servers and credentials | Store in secure key managers or CI/CD secrets |
| Service account tokens / credentials JSON | Can grant full administrative cloud access | Pass via environment variables or secret vaults |

> [!CAUTION]
> If a secret is committed and pushed to GitHub, treat it as compromised immediately: **rotate/revoke the key** right away. Git history retains old commits unless rewritten with tools like `git-filter-repo` or BFG.

---

## 2. What Must Be in `.gitignore`

Always ensure your [.gitignore](.gitignore) excludes:
1. **Dependencies**: `node_modules/`, `vendor/` (downloaded by package managers).
2. **Build Outputs**: `dist/`, `build/`, `.next/`, `.turbo/` (reproduced during build).
3. **Build Caches**: `*.tsbuildinfo`, `.eslintcache`.
4. **Logs**: `*.log`, `npm-debug.log*`, `pnpm-debug.log*`.
5. **Operating System Artifacts**: `.DS_Store` (macOS), `Thumbs.db`, `desktop.ini` (Windows).
6. **AI Agents & Editor Caches**: `.agents/`, `.claude/`, `.windsurf/`, `.cursor/`, `.idea/`.

---

## 3. Untracking Files vs. Deleting Files

A common mistake is adding an existing file to `.gitignore` and expecting Git to stop tracking it. 

- **Rule**: If Git already tracks a file, adding it to `.gitignore` does **nothing** to existing commits.
- **Fix**: Remove from the Git index while keeping the physical file on your disk:
  ```powershell
  # Untrack a single file
  git rm --cached .env

  # Untrack an entire folder
  git rm -r --cached docs/
  ```

---

## 4. Commit Hygiene & Message Standards

### Commit Size (Atomic Commits)
- Make **atomic commits**: each commit should represent one logical change.
- Never bundle an unrelated bug fix, a refactor, and a new feature into a single massive commit.

### Conventional Commits Format
Follow standard commit prefixes:
- `feat:` New user-facing feature or API capability
- `fix:` Bug fix
- `refactor:` Code restructuring without behavior changes
- `chore:` Build scripts, ignore rules, dependencies, config
- `docs:` Documentation-only changes
- `test:` Adding or updating tests
- `style:` Formatting, whitespace, semicolon fixes

*Example:*
```powershell
git commit -m "feat(attendance): add grace period check for tardiness"
git commit -m "fix(auth): validate reset password token expiration"
```

---

## 5. Branching & Workflow Strategy

1. **Protect `main`**:
   - `main` should always be stable, buildable, and pass all tests.
   - Develop new features and fixes on dedicated branches:
     ```powershell
     git checkout -b feat/attendance-filters
     ```
2. **Sync Frequently**:
   - Pull from remote often to avoid major merge conflicts:
     ```powershell
     git fetch origin
     git rebase origin/main
     ```
3. **Test Before Push**:
   - Always verify tests pass before creating a commit or push:
     ```powershell
     pnpm test
     pnpm run build
     ```

---

## 6. Dangerous Commands (Use With Caution)

| Command | Risk | Safe Alternative |
|---------|------|------------------|
| `git push --force` | Overwrites remote commits and can delete teammates' work | `git push --force-with-lease` (only on personal branches) |
| `git reset --hard` | Permanently deletes uncommitted working directory changes | `git stash` to save changes temporarily |
| `git clean -fd` | Deletes all untracked files and folders permanently | Run `git clean -nd` first for a dry run preview |

---

## 7. Handling Large Files & Binaries

- Git is designed for text source code, not large binary files.
- Never commit large databases (`*.sql`, `*.dump`), media files (`*.mp4`, `*.zip`), or compiled binaries.
- If large assets must be versioned, use **Git LFS** (Large File Storage).

---

## 8. Summary Checklist Before Pushing

- [ ] Run `git status` to inspect modified and untracked files.
- [ ] Ensure no `.env`, passwords, or secret keys are staged.
- [ ] Verify test suite passes (`pnpm test`).
- [ ] Write a descriptive commit message.
- [ ] Push to the intended branch on the remote.

