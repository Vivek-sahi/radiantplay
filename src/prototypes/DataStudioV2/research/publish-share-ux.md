# Publish vs. Share — UX Research & Decision

_Researched 2026-04-22. Applies to Data Studio prototype._

---

## Decision (tl;dr)

**Keep both Publish and Share. They are not siblings — they answer different questions.**

| Action | Question it answers | Antonym |
|--------|---------------------|---------|
| **Publish** | Is this version the live, authoritative definition? | Draft |
| **Share** | Who is allowed to use this? | Restricted |

These are orthogonal. Independent of each other. Do not collapse them.

---

## UI placement

| Action | Where | When active | Form |
|--------|-------|-------------|------|
| **Publish** | Workspace header | Edit mode only; enabled only when unpublished changes exist | Primary button |
| **Share** | Workspace header + Model View | Always visible, both edit and view modes | Icon button (persistent) |
| **Share nudge** | Post-publish toast | Immediately after a successful publish | "Published v2 · Share →" inline in toast |

No Share step inside the Publish modal. No two equal-weight buttons side by side. Publish is contextual and conditional; Share is ambient.

---

## Draft label

Show the `Draft` badge **only when the working copy diverges from published.** Remove it (or replace with version `v2`) once published and in sync. Never show it in Model View (consumers always see the published version).

| State | Label |
|-------|-------|
| Has unpublished changes | `Draft` — visible, meaningful |
| Just published, no new edits | Remove or show `v2` quietly |
| Model View (consumer mode) | Never shown |

---

## Lifecycle model

```
[Draft] ──Publish──► [Published v1]
                            │
                     User edits ──► [Draft] ← auto-saved
                                         │
                                    ──Publish──► [Published v2]
```

Published version is frozen and live. Edits accumulate in draft. Nothing rolls out until explicit Publish. Every publish creates a version snapshot (v1, v2, …). Rollback is a consequence of this model.

---

## What the research found (by tool)

### Sigma
Two separate top-level CTAs in the header simultaneously. Publish is the primary button (conditional — active only with unpublished changes). Share is a persistent icon button in both edit and view modes. No post-publish share nudge. Hex documents the same pattern with an explicit warning: "Publishing does not grant access — you must share separately."

### Figma
Single Share button in the top-right, always visible. Community publishing is nested *inside* the Share modal as a secondary option — not a competing button. Library publishing is a separate path via the Assets panel sidebar. Key insight: Figma keeps one top-level Share CTA as the stable anchor and routes less-common publishing variants through it.

### Notion / Coda
Single Share button; Publish is a tab inside the Share modal. Works for web publishing (rare action). Does **not** work for our use case — Publish in Data Studio is a recurrent, consequential version promotion, not a public web toggle. Burying it inside Share creates the wrong mental model.

### Power BI
Most extreme separation: Publish lives in Power BI Desktop (authoring app), Share lives in Power BI Service (viewing layer). Different environments entirely. Share appears in view mode as the primary action. Publish does not exist in the Service viewer.

### ThoughtSpot (today)
Share = Publish. Sharing with "Can View" IS publishing. No draft state, no version history. Creates a binary: invisible or live for everyone. Fine for current ThoughtSpot; a regression for Data Studio which is positioning as the serious AI-ready modeling workspace.

### dbt / Looker / Cube
Git-based: deploy = merge to production branch. Share = access grant at the database/API level. No UI "Publish" or "Share" button pair — the pattern is for engineering orgs using CLI/PR workflows. Not applicable to a GUI-first product.

---

## Why not collapse Share + Publish into one button?

Tools that do this (ThoughtSpot, basic Tableau) force authors into a binary: invisible or live. No room for "Sara is reviewing the draft before it goes to the BI team." For a workspace positioning itself as serious about AI-ready data quality, that binary erodes model quality over time — authors will publish prematurely to collaborate.

---

## The sequencing problem

"Do I share first or publish first?" — this confusion is real and documented (Hex wrote help text warning about it). The fix:

1. Make Publish **conditional** — disabled when nothing to publish. Eliminates the choice.
2. Post-publish toast includes a Share nudge — guides sequence without coercing it.
3. Share is always available — authors can grant edit access to a collaborator *before* publishing. That's a feature, not a bug.
