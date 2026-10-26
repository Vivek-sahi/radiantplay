/**
 * Group suggestions for the gallery: prototypes without a group that look like
 * one project. Three signals, strongest first:
 *
 *   1. The same name prefix before a colon: "Apps in ThoughtSpot: Native" and
 *      "Apps in ThoughtSpot: Hybrid". The group takes the prefix and the names
 *      drop it ("Native", "Hybrid").
 *   2. The same folder prefix before an underscore: AppsInTS_hybrid, AppsInTS_edgeCases.
 *   3. One folder name starting with another: MuzeTemplates, MuzeTemplatesAI.
 *
 * Names only change under signal 1. A suggestion that matches a group already in
 * use joins it, so a single newcomer is enough; otherwise it takes two or more.
 * (Which prototype imports from which would be a good fourth signal, but only the
 * dark scan script knows that, and the browser can't run it.)
 */
import type { ProjectMeta } from '../prototypes/registry';

export interface GroupSuggestion {
  /** Stable for the same group and members, so a dismissal sticks */
  key: string;
  group: string;
  /** True when the group already exists and these prototypes would join it */
  joins: boolean;
  members: Array<{ id: string; name: string; newName?: string }>;
}

const COLON = /^(.{2,40}?)\s*:\s+(.+)$/;

/** "AppsInTS" → "Apps in TS"; acronyms stay together */
const humanize = (id: string) => {
  const words = id.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').trim().split(/\s+/);
  return words.map((w, i) => (i === 0 || /^[A-Z0-9]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ');
};

/** The words every name starts with, as the first name spells them */
const sharedLeadingWords = (names: string[]) => {
  const split = names.map((n) => n.trim().split(/\s+/));
  const out: string[] = [];
  for (let i = 0; i < split[0].length; i++) {
    const w = split[0][i];
    if (!split.every((s) => s[i]?.toLowerCase() === w.toLowerCase())) break;
    out.push(w);
  }
  const text = out.join(' ').replace(/[\s:,(-]+$/, '');
  return text.length >= 4 ? text : '';
};

export function suggestGroups(projects: ProjectMeta[]): GroupSuggestion[] {
  const existing = new Map<string, string>();
  for (const p of projects) {
    const g = p.group?.trim();
    if (g && !existing.has(g.toLowerCase())) existing.set(g.toLowerCase(), g);
  }

  const loose = projects.filter((p) => !p.group?.trim());
  const taken = new Set<string>();
  const clusters: Array<{ group: string; members: GroupSuggestion['members'] }> = [];

  // 1. Name prefix before a colon
  const byPrefix = new Map<string, Array<{ p: ProjectMeta; rest: string; prefix: string }>>();
  for (const p of loose) {
    const m = COLON.exec(p.name.trim());
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (!byPrefix.has(key)) byPrefix.set(key, []);
    byPrefix.get(key)!.push({ p, rest: m[2], prefix: m[1] });
  }
  for (const [key, items] of byPrefix) {
    if (items.length < 2 && !existing.has(key)) continue;
    clusters.push({
      group: existing.get(key) ?? items[0].prefix,
      members: items.map(({ p, rest }) => ({ id: p.id, name: p.name, newName: rest })),
    });
    items.forEach(({ p }) => taken.add(p.id));
  }

  // 2. Folder prefix before an underscore, and 3. one folder name starting with another
  const left = loose.filter((p) => !taken.has(p.id));
  const byStem = new Map<string, ProjectMeta[]>();
  for (const p of left) {
    const stem = p.id.includes('_') ? p.id.slice(0, p.id.indexOf('_')).toLowerCase() : '';
    if (stem.length < 3) continue;
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem)!.push(p);
  }
  for (const p of left) {
    if (p.id.includes('_') || p.id.length < 5) continue;
    const stem = p.id.toLowerCase();
    const longer = left.filter((q) => q !== p && q.id.toLowerCase().startsWith(stem));
    if (!longer.length) continue;
    byStem.set(stem, [...new Set([p, ...(byStem.get(stem) ?? []), ...longer])]);
  }
  for (const [stem, items] of byStem) {
    const fresh = items.filter((p) => !taken.has(p.id));
    if (fresh.length < 2) continue;
    const named = sharedLeadingWords(fresh.map((p) => p.name));
    const original = fresh.find((p) => p.id.toLowerCase().startsWith(stem))?.id.slice(0, stem.length) ?? stem;
    const group = named || humanize(original);
    clusters.push({
      group: existing.get(group.toLowerCase()) ?? group,
      members: fresh.map((p) => ({ id: p.id, name: p.name })),
    });
    fresh.forEach((p) => taken.add(p.id));
  }

  return clusters.map(({ group, members }) => ({
    key: `${group.toLowerCase()}|${members.map((m) => m.id).sort().join(',')}`,
    group,
    joins: existing.has(group.toLowerCase()),
    members,
  }));
}

/** For a deployed site, where the gallery can't save: the same change as a request to Claude */
export function suggestionPrompt(s: GroupSuggestion): string {
  const lines = s.members.map((m) =>
    m.newName ? `- '${m.id}': group '${s.group}', name '${m.newName}'` : `- '${m.id}': group '${s.group}'`);
  return `In src/prototypes/registry-mine.ts, set these entries:\n${lines.join('\n')}`;
}
