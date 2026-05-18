# Data Studio

## Start here

| Read this | Why |
|-----------|-----|
| `product.md` | What the product is, the vision, key decisions |
| `CONTEXT.md` | What's currently built and what's deferred |
| `CLAUDE.md` | Session rules, hard rules, git rules — read before touching anything |

## Don't touch without reading first

- **Routing pipeline** (`index.tsx`) — load-bearing, tuned over 100+ sessions. See `reference.md` before changing it.
- **`data/mockData.ts`** — never invent data. All table and column names must come from here.
- **`src/components/`** — prototype components go in `components/` inside this folder, not in the shared design system.

## Where things live

| What | Where |
|------|-------|
| All agent scripts + test mode | `components/AgentPanel.tsx` |
| Model canvas | `components/Workspace.tsx` + `components/CenterPanel.tsx` |
| Pulse debug chat | `components/FullChatView.tsx` |
| Mock data | `data/mockData.ts` |
| Research decisions | `research/` |
| Domain knowledge | `knowledge/` |
| Session history | `SESSION_LOG.md` |
