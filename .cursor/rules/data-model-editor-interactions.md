---
description: Core interaction behaviours for Data Model Editor prototypes — canvas drag, column tree, agent panel flow, version history, and SpotterModel disabled mode. Load when building or modifying DME interactions.
alwaysApply: false
---

# Data Model Editor — Interaction Behaviours

> For IA tree and window bridge API, see `data-model-editor-ia.md`.
> For component props and import paths, see `data-model-editor-components.md`.

---

## 1. Tab Switching

Controlled by `switchTab(newTab)` in init.js. React reflects the active tab via `SegmentedControl` (`value={activeTab}` + `onChange={handleTabChange}`).

**Flow:**
1. User clicks a tab pill (hidden native pills) or the SegmentedControl triggers `handleTabChange`
2. `handleTabChange` clicks the corresponding `.tab-pill[data-tab]` element
3. `switchTab()` runs: slides out current `.tab-content` panel, slides in new one
4. Left pane visibility: shown for Tables + Columns tabs (when tables exist); hidden for Formulas and all others
5. Formulas toolbar: fades in independently (no slide) when Formulas tab active

**Key rule:** Left pane hides on Columns tab when `window._modelState.addedTables.length === 0`.

---

## 2. Canvas — TableCard Drag

**Drag mechanism (React + imperative document listeners):**

```
onMouseDown on .table-card
  → skip if target is [data-menu] (3-dot menu)
  → set isDragging = true
  → capture startX/Y (clientX/Y) + startLeft/Top (current x/y)
  → store in currentPos ref (not state — avoids re-render lag)
  → document.addEventListener('mousemove', onMove)
  → document.addEventListener('mouseup', onUp)

onMove
  → nx = startLeft + (ev.clientX - startX)
  → ny = startTop + (ev.clientY - startY)
  → currentPos.current = { x: nx, y: ny }
  → calls onDrag(nx, ny)   ← lifted to TableCanvas

onUp
  → setIsDragging(false)
  → calls onDragEnd(currentPos.current.x, currentPos.current.y)
  → removeEventListeners
```

**TableCanvas positions state:**
- Owns `positions: Record<string, { x, y }>` state
- `onDrag(name, nx, ny)` → `setPositions(prev => ({ ...prev, [name]: { x: nx, y: ny } }))` — live update every frame
- `onDragEnd(name, x, y)` → same update + calls `window._handleTableDrag?.(name, x, y)` (init.js persists to `window._modelState.tablePositions`)
- `cardRects` computed via `useMemo` from `positions` — drives JoinConnector on every frame

**Join lines update live during drag** because `cardRects` (the input to JoinConnector) is derived from `positions` state. No extra wiring needed.

---

## 3. Canvas — JoinConnector

Pure SVG renderer. No state of its own. Re-renders whenever `cardRects` prop changes.

**Algorithm (3 passes):**
1. **Resolve** — filter joins where both `leftTable` and `rightTable` exist in `cardRects`; compute `pickEdges()` (which side of each card to connect)
2. **Slot** — group joins by `card+edge` key; assign per-slot offset so multiple lines from the same edge spread apart
3. **Path** — `elbowPath()` computes the 3-segment orthogonal path; returns `d`, `midX`, `midY`

**Output:** `<svg>` with `<path>` elements + absolutely-positioned badge `<div>` elements (join icon overlaid at path midpoint).

**Do not use** SVG foreignObject or react-grid-layout. The connector must be a direct child of the `.model-canvas` container div so `position: absolute` coordinates match.

---

## 4. Column Tree

**Expand/collapse:**
- `expandedTables: Set<string>` state managed in `<ColumnTree>`
- Toggle via `onClick` on table row → functional Set update (spread + add/delete)
- Chevron rotates 90° via `.chevronExpanded img { transform: rotate(90deg); }`

**Column drag (to canvas):**
- Only unadded columns are draggable (`draggable={!isAdded}`)
- `onDragStart`: `e.dataTransfer.setData('application/x-spotter-column', JSON.stringify({ tableName, colName }))`
- Drop zone handling stays in init.js `setupColumnDropZone` — do not duplicate
- `onDragEnd`: remove `.colDragging` class

**Added vs unadded styling:** Column chips in `.addedCol` class get a distinct visual treatment (check icon + muted opacity for unadded).

---

## 5. Agent Panel Flow

### Welcome → Chat transition

```
User types in #welcome-textarea and presses Enter (or clicks send)
  → init.js calls startChat(prompt)
  → window._onChatStart() fires → React sets chatStarted = true
  → welcome view hidden (#welcome-view display: none)
  → chat view shown (#chat-view classList.add('active'))
  → window._fireChatPlaceholder?.() (placeholder animation)
  → addUserBubble(prompt) → window._appendMsg({ kind: 'user', id, text })
```

### Chat turn sequence

```
startChat(prompt)
  → window._freezeConversation() — removes chips from prior messages
  → window._appendMsg({ kind: 'typing', ... }) — shows TypingIndicator
  → askClaude() — POST /api/chat with window._conversationHistory
  → removeAgentTyping() — window._removeMsg(typingId)
  → addReasoningBlock(type) — window._appendMsg({ kind: 'agent', id, response: { ... } })
     with ReasoningBlock building up (window._updateReasoning calls per step)
  → After reasoning: response card / suggestion card / chips set on same message
  → window._scrollMsgs() after each update
```

### Reasoning block build-up

```
window._updateReasoning(id, { steps: [...steps, newStep], isDone: false })
  → each call adds a step, block remains "in progress" (expanded)

window._updateReasoning(id, { isDone: true })
  → block collapses to summary state
```

### Suggestion card → model update

```
User clicks "Add to model" on SuggestionCard
  → window._handleAddToModel(msgId, suggType, checkedItems)
  → applyModelUpdate() in init.js
      → updates window._modelState
      → window._setTableCanvasData({ tables, joins })
      → window._setColumnTreeData({ tables, dataSourceTables, modelColumns })
      → window._setModelLoading(true, label)  ← dots overlay
      → setTimeout → window._setModelLoading(false)
      → window._appendMsg(versionCard message)
      → window._demoteVersionCards() — marks prior versions as not-latest

User clicks "Refine suggestions"
  → window._handleSuggestionRefine(suggType)
  → startChat(refinementPrompt)  ← new Claude turn
```

### Version card restore

```
User clicks restore on VersionCard
  → window._restoreVersion(num)
  → init.js rolls back window._modelState to version N
  → fires _setTableCanvasData + _setColumnTreeData
  → fires _setModelLoading(true) → _setModelLoading(false)
```

---

## 6. Context Chip

The context chip (inline in agent panel header) reflects `window._contextData`:

| State | Display |
|-------|---------|
| `null` / `undefined` | Hidden |
| `'loading'` | Spinning animation |
| string (context text) | Clickable, shows context count |

Click → `window._openCtxModal(html)` → React sets `ctxHtml + ctxOpen = true` → `<RdModal>` renders.

---

## 7. Model Loading Overlay

`<OverlayLoading variant="dots" isVisible={modelLoading.visible} label={modelLoading.label} />`

Positioned absolutely over `.content-row`. Shown during:
- Table/join/column add from suggestion card
- Agent-triggered model modifications (remove/edit)
- Version restore

Driven entirely by `window._setModelLoading(visible, label?)`.

---

## 8. SpotterModel Disabled Mode

When `window.__DME_CONFIG__?.spotterModel === false`:

- The `.agent-panel` is **not rendered** (conditional in JSX: `{spotterModelEnabled && <div className="agent-panel">...`})
- The `.left-and-main` column takes full width (CSS: no agent panel column)
- init.js still runs and sets up all canvas + tab interactions normally
- `startChat()` and `askClaude()` are never called because the welcome textarea and chat prompt are not in the DOM
- `window._conversationHistory` is still initialised (empty) but never used
- All `_setTableCanvasData`, `_setColumnTreeData`, `_setModelLoading` callbacks still fire (canvas still updates)

**Edit mode + SpotterModel Off:** The pre-populated model renders in the canvas. User can drag tables, expand the column tree, view formulas — but cannot interact with the AI agent.

---

## 9. Error State (API failure)

```
askClaude() throws
  → window._conversationHistory.pop()  (undo user message push)
  → showToast('Claude error: ' + e.message, true)  ← red toast, bottom-center
  → removeAgentTyping()
  → addReasoningBlock('tables')  ← falls back to offline reasoning block
```

The user sees a toast with the error message. The conversation remains usable — they can send another message. The most common error is `"ANTHROPIC_API_KEY not set in .env.local"`.

---

## 10. Edit Mode Specifics

`init-edit.js` differs from `init-create.js` in one way: it pre-loads a model into `window._modelState` before returning. This means:

- `_setTableCanvasData` fires on init with the pre-existing tables
- `_setColumnTreeData` fires on init with the pre-existing columns
- The agent panel starts in chat view (not welcome view) — `chatStarted` defaults to `true` in `SpotterModelEdit.tsx`
- A "Check for AI readiness" CTA chip may fire `startChat()` automatically via `window._handleChipClick`
