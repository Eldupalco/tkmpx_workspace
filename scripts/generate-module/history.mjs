import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const BACKUP_DIR = '.gen-backup';
const MANIFEST = 'manifest.json';

const toPosix = (p) => p.split(path.sep).join('/');

// Content fingerprint of a file or folder tree, used to detect edits made after a run
function snapshot(target) {
  if (!fs.existsSync(target)) return null;
  const hash = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
  if (fs.statSync(target).isFile()) return { '.': hash(target) };
  const files = fs
    .readdirSync(target, { recursive: true })
    .map(String)
    .filter((f) => fs.statSync(path.join(target, f)).isFile())
    .sort();
  return Object.fromEntries(files.map((f) => [toPosix(f), hash(path.join(target, f))]));
}

const sameSnapshot = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Records every path a generator run touches: existing paths are copied to the backup
// folder first, new paths are remembered so --undo can delete them again.
export class RunRecorder {
  constructor(root, argv) {
    this.root = root;
    this.id = new Date().toISOString().replace(/[:.]/g, '-');
    this.dir = path.join(root, BACKUP_DIR, this.id);
    this.argv = argv;
    this.entries = [];
  }

  // Call before a path is created, overwritten or deleted. Returns the backup path, if any.
  track(target) {
    const rel = toPosix(path.relative(this.root, target));
    if (this.entries.some((e) => rel === e.path || rel.startsWith(`${e.path}/`))) return null;

    if (!fs.existsSync(target)) {
      this.entries.push({ path: rel, existed: false });
      return null;
    }
    const dest = path.join(this.dir, 'files', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(target, dest, { recursive: true });
    this.entries.push({ path: rel, existed: true });
    return toPosix(path.relative(this.root, dest));
  }

  // Call after all writes (and formatting) so the "after" state can be checked on undo
  finish() {
    if (this.entries.length === 0) return null;
    for (const entry of this.entries) entry.after = snapshot(path.join(this.root, entry.path));
    fs.mkdirSync(this.dir, { recursive: true });
    const manifest = { id: this.id, command: this.argv.join(' '), createdAt: new Date().toISOString(), entries: this.entries };
    fs.writeFileSync(path.join(this.dir, MANIFEST), JSON.stringify(manifest, null, 2));
    return toPosix(path.relative(this.root, this.dir));
  }
}

function readManifest(root, id) {
  const file = path.join(root, BACKUP_DIR, id, MANIFEST);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

// All runs, oldest first; folders without a manifest come from versions without undo support
export function listRuns(root) {
  const base = path.join(root, BACKUP_DIR);
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map((id) => ({ id, manifest: readManifest(root, id) }));
}

// Reverts one run. Refuses when a touched path changed after the run, unless force is set.
export function undoRun(root, id, { force = false, dryRun = false } = {}) {
  const runs = listRuns(root).filter((r) => r.manifest);
  const run = id ? runs.find((r) => r.id === id) : runs.filter((r) => !r.manifest.undoneAt).at(-1);
  if (!run) throw new Error(id ? `No run "${id}" with undo information in ${BACKUP_DIR}/.` : 'Nothing to undo.');
  if (run.manifest.undoneAt) throw new Error(`Run ${run.id} was already undone at ${run.manifest.undoneAt}.`);

  const changed = run.manifest.entries.filter((e) => !sameSnapshot(snapshot(path.join(root, e.path)), e.after));
  if (changed.length > 0 && !force) {
    throw new Error(
      `Changed since run ${run.id}: ${changed.map((e) => e.path).join(', ')}. ` +
        'Undo later runs first, or pass --force to discard those changes.',
    );
  }

  const actions = [];
  for (const entry of [...run.manifest.entries].reverse()) {
    const target = path.join(root, entry.path);
    if (entry.existed) {
      actions.push(`restore ${entry.path}`);
      if (dryRun) continue;
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      fs.cpSync(path.join(root, BACKUP_DIR, run.id, 'files', entry.path), target, { recursive: true });
    } else {
      actions.push(`delete ${entry.path}`);
      if (!dryRun) fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }

  if (!dryRun) {
    run.manifest.undoneAt = new Date().toISOString();
    fs.writeFileSync(path.join(root, BACKUP_DIR, run.id, MANIFEST), JSON.stringify(run.manifest, null, 2));
  }
  return { run: run.manifest, actions };
}
