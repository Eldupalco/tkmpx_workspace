# Git & GitHub Commands Guide: Full Setup to Push

Complete log of every command executed from initial setup to pushing, merging branches, and untracking private directories while keeping local files.

---

## 1. Environment & Remote Configuration

### Check status and remotes
```powershell
# Check current repository status
git status -s

# Check existing remote URLs
git remote -v
```

### Add GitHub remote origin
```powershell
git remote add origin https://github.com/Eldupalco/tkmpx_workspace.git
```

### Set Git identity (if not configured)
```powershell
git config --local user.name "Eldupalco"
git config --local user.email "marcelodupalco@gmai.com"
```

### Fetch remote branches
```powershell
git fetch origin
```

---

## 2. Commit and Push Feature Branch

### Stage and commit code changes
```powershell
# Stage application feature code and tests
git add .env.example package.json src/ test/ web/
git commit -m "feat(attendance): refine punch rules, attendance views, and UI helpers"

# Stage ignore rules
git add .gitignore .grtignore
git commit -m "chore: clean up .gitignore and add .grtignore"
```

### Push feature branch to GitHub
```powershell
git push -u origin feat/dtr-punches-and-security-fixes
```

---

## 3. Merge into Main & Reconcile Remote History

### Switch to main branch and merge feature
```powershell
git checkout main
git merge feat/dtr-punches-and-security-fixes
```

### Resolve unrelated remote initial commit
When GitHub initializes a repository with an independent `README.md`, merge it keeping local repository version:
```powershell
git merge origin/main --allow-unrelated-histories -X ours -m "merge origin/main into main"
```

### Push main branch to origin
```powershell
git push -u origin main
```

---

## 4. Remove Files from GitHub (Keep Local Copies)

To remove tracked folders from GitHub without deleting them locally on your disk:

### Untrack `docs/` folder & update README
```powershell
# Untrack docs folder from git index (leaves physical files on disk)
git rm -r --cached docs

# Stage updated README.md
git add README.md

# Commit and push
git commit -m "docs: remove project documentation guides from repo"
git push origin main
```

### Untrack agent & IDE directories
```powershell
# Untrack .agents, .claude, and .windsurf directories
git rm -r --cached .agents .claude .windsurf

# Commit and push
git commit -m "chore: remove agent and IDE skills directories from repo"
git push origin main
```

---

## 5. Ongoing Quick Commands Cheatsheet

```powershell
# 1. Check what changed
git status

# 2. Stage changes
git add <file-or-folder>
# or stage everything:
git add .

# 3. Commit
git commit -m "type(scope): description"

# 4. Push to main
git push origin main
```

