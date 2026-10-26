/**
 * Gallery write-back, dev server only.
 *
 * The playground gallery posts here when a designer moves a prototype to a
 * group, renames a group or archives a prototype while running `npm run dev`, so the change lands in
 * src/prototypes/registry-mine.ts without a prompt to copy. Vite then reloads
 * the registry. Deployed sites have no dev server, so the gallery falls back to
 * a Claude prompt there.
 *
 * It also captures missing gallery thumbnails when the designer clicks Capture in
 * the gallery: it posts their prototypes that have none, and this runs scripts/thumbnails/capture.mjs
 * against this dev server in the background, then wires each image into the
 * prototype's entry. That needs the screenshot tools from
 * `npm run thumbnails:setup`; without them the gallery shows placeholders.
 *
 * Only registry-mine.ts is ever written: registry-core.ts belongs to upstream,
 * and editing it in a fork would conflict on the next sync.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

export const REGISTRY_WRITE_PATH = '/__radiantplay/registry';
export const THUMBNAILS_PATH = '/__radiantplay/thumbnails';
const REGISTRY_FILE = path.join('src', 'prototypes', 'registry-mine.ts');

/** One entry's change, or a group rename across every entry in that group */
type RegistryChange =
  | { id: string; group?: string | null; section?: 'archived' | 'mine' }
  | { renameGroup: { from: string; to: string } };

const quote = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * Same-length copies of the source for searching. `code` blanks comments, so a
 * commented-out example entry is never matched. `shape` also blanks string
 * contents, so braces inside a description don't throw off brace matching.
 * Positions line up with the original, which is the text that gets edited.
 */
function masks(src: string): { code: string; shape: string } {
  const code = src.split('');
  const shape = src.split('');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) {
      const end = src[i + 1] === '/' ? src.indexOf('\n', i) : src.indexOf('*/', i + 2) + 2;
      const stop = end <= 1 ? src.length : end;
      for (let j = i; j < stop; j++) if (src[j] !== '\n') { code[j] = ' '; shape[j] = ' '; }
      i = stop - 1;
    } else if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      for (; j < src.length && src[j] !== c; j++) {
        if (src[j] === '\\') { shape[j] = ' '; j++; }
        if (src[j] !== '\n') shape[j] = ' ';
      }
      i = j;
    }
  }
  return { code: code.join(''), shape: shape.join('') };
}

/** Start and end (inclusive) of the entry object around position `at`. */
function entryBounds(shape: string, at: number): [number, number] | null {
  let depth = 0;
  let open = -1;
  for (let i = at; i >= 0; i--) {
    if (shape[i] === '}') depth++;
    else if (shape[i] === '{') {
      if (depth === 0) { open = i; break; }
      depth--;
    }
  }
  if (open < 0) return null;
  depth = 0;
  for (let i = open; i < shape.length; i++) {
    if (shape[i] === '{') depth++;
    else if (shape[i] === '}' && --depth === 0) return [open, i];
  }
  return null;
}

const idPattern = (id: string) => new RegExp(`\\bid:\\s*['"]${id.replace(/[-]/g, '\\-')}['"]`);

/** Set, replace or (with null) remove one property line in an entry's text. */
function setProp(entry: string, key: string, value: string | null, indent: string): string {
  const { code } = masks(entry);
  // The value is a quoted string or an array, possibly over several lines, plus an optional trailing comment
  const existing = new RegExp(`\\n[ \\t]*${key}:\\s*(\\[[\\s\\S]*?\\]|'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")\\s*,?[^\\n]*`).exec(code);
  if (existing) {
    // Match on the comment-free copy, so a commented-out line is left alone; edit the original
    const replacement = value === null ? '' : `\n${indent}${key}: ${value},`;
    return entry.slice(0, existing.index) + replacement + entry.slice(existing.index + existing[0].length);
  }
  if (value === null) return entry;
  // Append before the closing brace, making sure the previous property ends with a comma
  const close = entry.lastIndexOf('}');
  let head = entry.slice(0, close).replace(/\s*$/, '');
  // The comma goes before a trailing `// comment`, not inside it
  const lastLine = head.slice(head.lastIndexOf('\n') + 1);
  const comment = /\s+\/\/[^'"]*$/.exec(lastLine);
  const code2 = comment ? head.slice(0, head.length - comment[0].length) : head;
  if (!/[,{]$/.test(code2)) head = `${code2},${comment ? comment[0] : ''}`;
  return `${head}\n${indent}${key}: ${value},\n${entry.slice(close).replace(/^\s*/, indent.slice(2))}`;
}

type EntryChange = { group?: string | null; section?: 'archived' | 'mine' };

/** Apply a change to one entry, found by its id. Null when the id isn't in the file. */
export function applyEntryChange(src: string, id: string, change: EntryChange): string | null {
  const { code, shape } = masks(src);
  const idMatch = idPattern(id).exec(code);
  if (!idMatch) return null;
  const bounds = entryBounds(shape, idMatch.index);
  if (!bounds) return null;
  const [open, close] = bounds;

  const lineStart = src.lastIndexOf('\n', idMatch.index) + 1;
  const indent = src.slice(lineStart, idMatch.index).match(/^[ \t]*/)?.[0] ?? '    ';
  let entry = src.slice(open, close + 1);

  if (change.group !== undefined) {
    entry = setProp(entry, 'group', change.group ? quote(change.group) : null, indent);
  }
  if (change.section !== undefined) {
    entry = setProp(entry, 'section', quote(change.section), indent);
  }
  return src.slice(0, open) + entry + src.slice(close + 1);
}

/** Entry ids in the file whose group matches `group`, ignoring case. Comments are skipped. */
function idsInGroup(src: string, group: string): string[] {
  const { code, shape } = masks(src);
  const ids: string[] = [];
  for (const m of code.matchAll(/\bid:\s*['"]([\w-]+)['"]/g)) {
    const bounds = entryBounds(shape, m.index);
    if (!bounds) continue;
    const entry = code.slice(bounds[0], bounds[1] + 1);
    const g = /\bgroup:\s*'((?:[^'\\]|\\.)*)'/.exec(entry)?.[1]?.replace(/\\(.)/g, '$1');
    if (g && g.trim().toLowerCase() === group.trim().toLowerCase()) ids.push(m[1]);
  }
  return ids;
}

export function applyRegistryChange(src: string, change: RegistryChange): string | null {
  if ('renameGroup' in change) {
    const ids = idsInGroup(src, change.renameGroup.from);
    if (ids.length === 0) return null;
    let next = src;
    for (const id of ids) next = applyEntryChange(next, id, { group: change.renameGroup.to }) ?? next;
    return next;
  }
  const { id, ...rest } = change;
  return applyEntryChange(src, id, rest);
}

/** The entry's text for `id`, comments blanked, or null when it isn't in the file. */
function entryCode(src: string, id: string): string | null {
  const { code, shape } = masks(src);
  const m = idPattern(id).exec(code);
  const bounds = m && entryBounds(shape, m.index);
  return bounds ? code.slice(bounds[0], bounds[1] + 1) : null;
}

/** Point an entry at its captured thumbnails: two imports plus a `thumbnail` property. */
export function wireThumbnail(src: string, id: string, lightOnly: boolean): string {
  const entry = entryCode(src, id);
  if (entry === null || /\bthumbnail\s*:/.test(entry)) return src;
  // Reuse an import of the same file if there is one; otherwise pick a name not yet taken
  const srcCode = masks(src).code;
  const base = /^[A-Za-z]/.test(id) ? id.replace(/[^A-Za-z0-9]/g, '') : `P${id.replace(/[^A-Za-z0-9]/g, '')}`;
  const imports: string[] = [];
  const nameFor = (theme: 'light' | 'dark', suffix: string) => {
    const file = `./${id}/thumbnail.${theme}.jpg`;
    const existing = new RegExp(`^import\\s+(\\w+)\\s+from\\s+['"]${file.replace(/[.]/g, '\\.')}['"]`, 'm').exec(srcCode);
    if (existing) return existing[1];
    let name = `${base}${suffix}`;
    for (let n = 2; new RegExp(`\\b${name}\\b`).test(srcCode); n++) name = `${base}${suffix}${n}`;
    imports.push(`import ${name} from '${file}';`);
    return name;
  };
  const light = nameFor('light', 'ThumbLight');
  const value = lightOnly ? `{ light: ${light} }` : `{ light: ${light}, dark: ${nameFor('dark', 'ThumbDark')} }`;

  // The property first, then the imports after the last import line (positions shift)
  const { code, shape } = masks(src);
  const m = idPattern(id).exec(code)!;
  const [open, close] = entryBounds(shape, m.index)!;
  const lineStart = src.lastIndexOf('\n', m.index) + 1;
  const indent = src.slice(lineStart, m.index).match(/^[ \t]*/)?.[0] ?? '    ';
  let next = src.slice(0, open) + setProp(src.slice(open, close + 1), 'thumbnail', value, indent) + src.slice(close + 1);

  const nextCode = masks(next).code;
  const lastImport = [...nextCode.matchAll(/^import [^\n]*;[ \t]*$/gm)].pop();
  const at = lastImport ? lastImport.index + lastImport[0].length : 0;
  if (imports.length) next = `${next.slice(0, at)}\n${imports.join('\n')}${next.slice(at)}`;
  return next;
}

const isGroupName = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 60;

function isChange(body: unknown): body is RegistryChange {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if ('renameGroup' in b) {
    const r = b.renameGroup as Record<string, unknown> | null;
    return Boolean(r) && isGroupName(r!.from) && isGroupName(r!.to);
  }
  if (typeof b.id !== 'string' || !/^[\w-]+$/.test(b.id)) return false;
  if (b.group !== undefined && b.group !== null && !isGroupName(b.group)) return false;
  if (b.section !== undefined && b.section !== 'archived' && b.section !== 'mine') return false;
  return b.group !== undefined || b.section !== undefined;
}

// Same-origin JSON posts only: a page on another site open in the same browser could
// otherwise post here. Browsers always send Origin on such posts.
function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin ?? '';
  const host = req.headers.host ?? '';
  return origin === `http://${host}` || origin === `https://${host}`;
}

const VISUAL_DEPS = process.env.VISUAL_DEPS || path.join(os.homedir(), '.radiantplay-visual');

export function registryWritePlugin(): Plugin {
  // One capture runs at a time; ids asked for while it runs wait for the next one
  const thumbs = {
    running: false,
    queue: new Set<string>(),
    current: [] as string[],
    done: [] as string[],
    failed: [] as string[],
    attempted: new Set<string>(),
  };

  return {
    name: 'radiantplay-registry-write',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      const registryPath = path.join(root, REGISTRY_FILE);

      const runCaptures = () => {
        if (thumbs.running || thumbs.queue.size === 0) return;
        const port = (server.httpServer?.address() as AddressInfo | null)?.port;
        if (!port) return;
        thumbs.running = true;
        thumbs.current = [...thumbs.queue];
        thumbs.queue.clear();
        const child = spawn(process.execPath, [
          path.join(root, 'scripts/thumbnails/capture.mjs'), ...thumbs.current, '--base', `http://localhost:${port}`, '--json',
        ], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
        let out = '';
        child.stdout.on('data', (d: Buffer) => { out += d.toString(); });
        child.on('close', () => {
          // The JSON summary is the last thing the script prints
          let rows: Array<{ name: string; error?: string; lightOnly?: boolean }> = [];
          try { rows = JSON.parse(out.slice(out.lastIndexOf('{\n  "captured"'))).captured ?? []; } catch { /* no summary */ }
          let src = fs.readFileSync(registryPath, 'utf8');
          const before = src;
          for (const id of thumbs.current) {
            const row = rows.find((r) => r.name === id);
            const light = path.join(root, 'src/prototypes', id, 'thumbnail.light.jpg');
            if (row && !row.error && fs.existsSync(light)) {
              src = wireThumbnail(src, id, Boolean(row.lightOnly));
              thumbs.done.push(id);
            } else {
              thumbs.failed.push(id);
            }
          }
          if (src !== before) fs.writeFileSync(registryPath, src);
          thumbs.current = [];
          thumbs.running = false;
          runCaptures();
        });
      };

      server.middlewares.use(THUMBNAILS_PATH, (req: IncomingMessage, res: ServerResponse) => {
        const reply = (status: number, body: object) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        // Designer prototypes with a folder of their own and no thumbnail, not tried yet this session
        const missing = () => {
          const src = fs.readFileSync(registryPath, 'utf8');
          return [...masks(src).code.matchAll(/\bid:\s*['"]([\w-]+)['"]/g)].map((m) => m[1]).filter((id) =>
            !thumbs.attempted.has(id)
            && !/\bthumbnail\s*:/.test(entryCode(src, id) ?? 'thumbnail:')
            && fs.existsSync(path.join(root, 'src/prototypes', id)));
        };
        const state = () => ({
          capturing: [...thumbs.current, ...thumbs.queue],
          done: thumbs.done,
          failed: thumbs.failed,
          missing: missing(),
        });
        // ready, or the screenshot tools aren't installed (setup-needed), or the designer said no (declined)
        const setup = () => fs.existsSync(path.join(VISUAL_DEPS, 'node_modules', 'playwright'))
          ? 'ready'
          : fs.existsSync(path.join(VISUAL_DEPS, '.thumbnails-declined')) ? 'declined' : 'setup-needed';
        if (req.method === 'GET') return reply(200, { status: thumbs.running ? 'running' : 'idle', setup: setup(), ...state() });
        if (req.method !== 'POST') return reply(405, { error: 'GET or POST only' });
        if (!sameOrigin(req)) return reply(403, { error: 'Not allowed' });
        if (setup() !== 'ready') return reply(200, { status: 'idle', setup: setup(), ...state() });
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const ids: unknown[] = Array.isArray(body?.ids) ? body.ids.slice(0, 100) : [];
            const src = fs.readFileSync(registryPath, 'utf8');
            for (const id of ids) {
              if (typeof id !== 'string' || !/^[\w-]+$/.test(id) || thumbs.attempted.has(id)) continue;
              const entry = entryCode(src, id);
              // Only designer prototypes with a folder of their own and no thumbnail yet
              if (entry === null || /\bthumbnail\s*:/.test(entry)) continue;
              if (!fs.existsSync(path.join(root, 'src/prototypes', id))) continue;
              thumbs.attempted.add(id);
              thumbs.queue.add(id);
            }
            runCaptures();
            reply(200, { status: thumbs.running ? 'running' : 'idle', setup: 'ready', ...state() });
          } catch (e) {
            reply(500, { error: e instanceof Error ? e.message : String(e) });
          }
        });
      });

      server.middlewares.use(REGISTRY_WRITE_PATH, (req: IncomingMessage, res: ServerResponse) => {
        const reply = (status: number, body: object) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return reply(405, { error: 'POST only' });
        // Only the gallery on this dev server may write
        if (!sameOrigin(req)) return reply(403, { error: 'Not allowed' });
        if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) {
          return reply(415, { error: 'JSON only' });
        }
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            if (!isChange(body)) return reply(400, { error: 'Invalid change' });
            const change: RegistryChange = 'renameGroup' in body
              ? { renameGroup: { from: body.renameGroup.from.trim(), to: body.renameGroup.to.trim() } }
              : { id: body.id, group: typeof body.group === 'string' ? body.group.trim() : body.group, section: body.section };
            const file = path.join(server.config.root, REGISTRY_FILE);
            const src = fs.readFileSync(file, 'utf8');
            const next = applyRegistryChange(src, change);
            if (next === null) return reply(404, { error: 'Not found in registry-mine.ts' });
            if (next !== src) fs.writeFileSync(file, next);
            reply(200, { ok: true, file: REGISTRY_FILE });
          } catch (e) {
            reply(500, { error: e instanceof Error ? e.message : String(e) });
          }
        });
      });
    },
  };
}
