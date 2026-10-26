"""Score guidance-test runs: which rule files each session read, and whether it
asked the gate questions. Usage: python3 score.py <runs dir>. Exits 1 when a
check passes in fewer than half of its runs."""
import collections, glob, json, os, re, sys

def has(text, *patterns):
    return all(re.search(p, text, re.I) for p in patterns)

# One check per prompt id in prompts.tsv: (what passes, test(files read, plan + reply text))
CHECKS = {
    'p01': ('Tier 0: no rule files beyond the orchestrator', lambda f, t: not (f - {'_orchestration.md'})),
    'p02': ('Button icon: plan sets iconPosition', lambda f, t: has(t, 'iconPosition')),
    'p03': ('3-dot menu: uses ActionMenu', lambda f, t: has(t, 'ActionMenu')),
    'p04': ('Delete confirmation: uses ConfirmDialog', lambda f, t: has(t, 'ConfirmDialog')),
    'p05': ('Content audit: reads content-guidelines.md', lambda f, t: 'content-guidelines.md' in f),
    'p06': ('Tier 2: reads orchestrator + prototype-generation', lambda f, t: {'_orchestration.md', 'prototype-generation.md'} <= f),
    'p07': ('Liveboard gate asked, no canvas files yet', lambda f, t: has(t, r'view[- ]only|edit mode', 'tile') and not any(x.startswith('liveboard-canvas') for x in f)),
    'p08': ('Spotter gate asked', lambda f, t: has(t, 'welcome', 'mode')),
    'p09': ('DME gate asked, no old model ids', lambda f, t: has(t, r'spottermodel|AI agent|agent panel', r'blank|starting|pre-?loaded') and not has(t, r'claude-(sonnet-4-6|opus-4-7)')),
    'p10': ('Tier 3: reads design-system.md', lambda f, t: 'design-system.md' in f),
}

def parse(path):
    files, text, cost, error = set(), [], 0.0, False
    for line in open(path, errors='ignore'):
        try:
            e = json.loads(line)
        except ValueError:
            continue
        if e.get('type') == 'assistant':
            for c in e['message'].get('content', []):
                if c.get('type') != 'tool_use':
                    continue
                inp = c.get('input', {})
                if c['name'] in ('Read', 'Bash', 'Grep', 'Glob'):
                    files |= set(re.findall(r'\.cursor/rules/([\w.\-]+\.md)', json.dumps(inp)))
                if c['name'] in ('Write', 'Edit', 'ExitPlanMode'):
                    text.append(inp.get('content') or inp.get('new_string') or inp.get('plan') or '')
        if e.get('type') == 'result':
            text.append(e.get('result') or '')
            cost = e.get('total_cost_usd') or 0
            error = bool(e.get('is_error'))
    return files, '\n'.join(text), cost, error

def main(runs_dir):
    results = collections.defaultdict(list)
    files_read = collections.defaultdict(list)
    total = 0.0
    for path in sorted(glob.glob(os.path.join(runs_dir, '*.jsonl'))):
        pid = os.path.basename(path).split('-r')[0]
        if pid not in CHECKS:
            continue
        files, text, cost, error = parse(path)
        total += cost
        results[pid].append(None if error else CHECKS[pid][1](files, text))
        files_read[pid].append(len(files))
    failing = 0
    print(f"{'id':4} {'check':52} {'passed':8} rule files read")
    for pid, (label, _) in CHECKS.items():
        runs = [r for r in results[pid] if r is not None]
        passed = sum(1 for r in runs if r)
        errors = results[pid].count(None)
        mark = '' if runs and passed * 2 >= len(runs) else '  <- failing'
        if mark:
            failing += 1
        note = f' ({errors} errored)' if errors else ''
        print(f"{pid:4} {label:52} {passed}/{len(runs)}{note:12} {files_read[pid]}{mark}")
    print(f"\ncost ${total:.2f}")
    return 1 if failing else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
