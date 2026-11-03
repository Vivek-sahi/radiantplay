# Vendored: Agentic DS (read-only copy)

Simran Pandit's shared branch `feat/agentic-ds` (galaxy simran-pandit/radiantplay, git remote `simran`),
folder `src/spotter`, commit cdb15a0, copied 3 Nov 2026 for the Workbook agent flow.

A copy inside this prototype (Vivek, 3 Nov) so the shared `src/spotter` and every other prototype stay
untouched. Don't edit these files; to update, re-copy the folder from the branch:
`git fetch simran feat/agentic-ds && git archive simran/feat/agentic-ds src/spotter | tar -x -C <tmp>`
Live docs: https://radiantplay-simran.design.coolify.thoughtspot.com/radiant/spotter

Local changes (import paths only, so the copy resolves from this folder): icons.tsx and tokens.ts point at
`@tokens/*`; chat/blocks/VizBlock.tsx points at `src/prototypes/_shared/tiles` by its new relative path.
