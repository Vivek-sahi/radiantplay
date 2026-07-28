# Platform Ideas
_Running list of features worth building in a future session._

---

## Stakeholder feedback loop

**Status:** Idea — not started  
**Priority:** High

Enable stakeholders to annotate the deployed prototype directly, with feedback flowing into a queue I process at the next session start.

### How it would work
1. Stakeholder opens `radiantplay-nine.vercel.app/playground/SpotterPrep2?annotate`
2. Same click-to-annotate widget as the local edit loop, but behind a query param
3. Annotations POST to a Vercel serverless function (`/api/feedback`) instead of `localhost:3737`
4. Function creates a GitHub Issue in the radiantplay repo with: element selector, comment, screenshot, prototype name
5. At session start I read open issues tagged `feedback`, apply changes, close the issue

### Separation from local edit loop
- **Local** — real-time, changes land in seconds, posts to `localhost:3737`, writes to `inbox.jsonl`
- **Stakeholder** — async, reviewed at session start, posts to `/api/feedback`, lands in GitHub Issues
- Same annotation UI widget, different backends depending on URL context
- Do NOT merge the two pipelines — intent is different

### Why GitHub Issues over Slack
- Slack has org-level app approval constraints
- GitHub Issues give a proper paper trail — feedback is trackable, closeable, linkable to the prototype
- Feedback history is preserved even after it's processed

### Build plan (when ready)
1. Move annotation widget to work on deployed URL (behind `?annotate` param)
2. Add `/api/feedback` Vercel serverless function — accepts POST, creates GitHub Issue
3. Update widget to detect localhost vs deployed URL and route accordingly
4. Add session-start step: read open `feedback` issues → process → close

---

## Multiplayer collaborative comments

**Status:** Idea — not started  
**Priority:** Medium (foundational — unlocks RadiantPlay as org-level tooling)

A persistent, real-time comment layer on top of every prototype. Stakeholders annotate elements, designers reply, threads resolve — per prototype, scoped to that prototype's elements. Essentially Figma's comment system on a live interactive prototype.

### Vision
RadiantPlay evolves from a personal prototyping playground into an org-level design review tool. Multiplayer comments + auth makes it a proper collaborative surface — not just a place to share links, but a place to have conversations anchored to the live prototype.

### Phased plan

**Phase 1 — Async feedback** *(covered in Stakeholder feedback loop above)*
Stakeholder annotates → GitHub Issue → designer processes at session start. One-way, no real-time.

**Phase 2 — Comments panel**
- Right panel in the prototype shell showing all annotations for that prototype
- Comments anchored to specific elements (by selector)
- Designer can reply inline, threads, open/resolved status
- Still async — no real-time sync needed yet
- Namespaced by `prototypeId` so SpotterPrep2 and DataStudioV2 comments are completely separate

**Phase 3 — Real-time multiplayer**
- Multiple people in the prototype simultaneously
- Live cursors, comments appear in real-time, replies visible instantly
- SDK candidates: Liveblocks, PartyKit (note: `CordIcon` exists in Radiant — team may have used Cord before)

**Phase 4 — Auth**
- Org-level deployment with ThoughtSpot SSO or email-based auth
- Comments attributed to real identities, not anonymous
- Access control per prototype (who can view, who can comment, who can edit)

### Key architectural insight
The comments panel belongs in the **PlaygroundProject wrapper** — not inside individual prototypes. Every prototype is already wrapped by `PlaygroundProject` in the component chain. Build it once there and every prototype inherits it automatically.

### What makes this powerful
Most prototype tools are static (Figma, Maze). A live clickable prototype with a real-time comment layer is closer to a proper design review tool — stakeholders comment on something they can actually interact with, not a screenshot.

---

## Pre-commit design system check

**Status:** Partially available — `/radiant-check` slash command exists in upstream  
**Priority:** Medium  
**Depends on:** Upstream sync (`feat/sync-upstream`)

Automated gate that prevents design system violations from entering git history.

### Two layers
- **Pre-commit hook** (automatic, lightweight) — fast grep for obvious violations: hardcoded hex, raw `<button>`/`<input>`, magic pixel values. Blocks the commit. Fix and recommit.
- **`/radiant-check SpotterPrep2`** (on-demand, deep) — full compliance report with scores across components, tokens, content guidelines, layout.

### Notes
- Scoped to `src/prototypes/SpotterPrep2/` and `src/prototypes/DataStudioV2/` only — avoids false alarms on platform code
- `/radiant-check` command comes for free with the upstream sync
- Pre-commit hook script needs to be written (~30 lines of grep)
- Do this in the same session as the upstream sync
