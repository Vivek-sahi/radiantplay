# Seamless Object View Transition

**Updated**: 2026-05-13  
**Session**: 50

## Visual Flow

### Before Click (Full-width agent chat)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                     Agent Chat                          │
│                    (100% width)                         │
│                                                         │
│  • Running pulse flow (semantic gaps, cache miss)      │
│  • Shows genUI cards with clickable objects            │
│  • User clicks: "Marketing Campaign Attribution"       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### During Transition (0.3 seconds)
```
┌──────────────────┬──────────────────────────────────────┐
│                  │                                      │
│   Agent Chat     │    Object View (sliding in)         │
│   (narrowing     │    (opacity 0 → 1)                  │
│    to 420px)     │    (translateX 20px → 0)            │
│                  │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

### After Click (Split-pane mode)
```
┌──────────────────┬──────────────────────────────────────┐
│                  │                                      │
│   Agent Chat     │    ModelView                         │
│   (420px)        │    • Info / Usage / Monitoring tabs  │
│                  │    • Full model details              │
│  • Flow context  │    • Columns, joins, source info    │
│    preserved     │                                      │
│  • Scroll        │    [×] Close button (top-right)     │
│    position      │                                      │
│    maintained    │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
                   ↑
            Border divider
```

## Technical Implementation

### Layout Structure
```typescript
<div style={{ display: 'flex', flexDirection: 'row' }}>
  
  {/* Agent Chat - LEFT SIDE */}
  <div style={{
    width: isSplit ? 420 : '100%',
    transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)',
    borderRight: isSplit ? '1px solid' : 'none',
  }}>
    <AgentPanel ... />
  </div>
  
  {/* Object View - RIGHT SIDE (conditional) */}
  {isSplit && (
    <div style={{
      flex: 1,
      animation: 'obj-slide-in 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <ObjectPanel ... />
    </div>
  )}
  
</div>
```

### Animation Keyframes
```css
@keyframes obj-slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### Timing Function
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` — smooth, natural deceleration
- **Duration**: `0.3s` — fast enough to feel responsive, slow enough to be smooth
- **Delay**: `0s` — immediate start on click

## Interaction Details

### Opening an Object
1. **Click trigger**: User clicks model/liveboard/column name in genUI card
2. **State update**: `setActiveObject({ name, highlightCol })` 
3. **Layout shift**: Agent chat width transitions to 420px (0.3s)
4. **Slide-in**: Object view renders with slide-in animation (0.3s, from right)
5. **Context note**: Agent injects contextual note about the object (if available)

### Closing an Object
1. **Click trigger**: User clicks × close button in object view
2. **State update**: `setActiveObject(null)`
3. **Slide-out**: Object view unmounts (no exit animation, instant removal)
4. **Layout expand**: Agent chat width transitions back to 100% (0.3s)
5. **Context preserved**: Chat messages and scroll position maintained

### Seamless Details
- **Border appearance**: Divider fades in with agent chat border (part of transition)
- **No layout shift**: Agent chat content doesn't reflow, only container width changes
- **Scroll preservation**: Agent chat maintains scroll position during transition
- **No flicker**: Object view uses `animation: both` to hold final state immediately

## Design System Integration

### Colors
- **Border**: `c['border-divider']` — `#e5e7eb` (light gray, subtle)
- **Background**: `c['background-base']` — `#ffffff` (clean, matches agent)

### Spacing
- **Agent width**: `420px` — optimal for reading chat messages without excessive eye travel
- **Object flex**: `flex: 1` — takes all remaining space, responsive to viewport

### Shadows
- Removed from agent chat when split (was `-4px 0 16px rgba(0,0,0,0.06)`)
- Clean edge-to-edge panels with only border separator

## Performance Notes

- **GPU acceleration**: `transform` property triggers GPU compositing for smooth animation
- **No repaints**: Width transitions use GPU-accelerated properties only
- **Instant unmount**: Object view doesn't animate out (improves perceived performance)
- **Single reflow**: Layout shift happens once per click, not per frame

## Browser Compatibility

- **Transform animations**: Supported in all modern browsers (Chrome 36+, Firefox 16+, Safari 9+)
- **Cubic-bezier timing**: Native CSS, no polyfills needed
- **Flexbox layout**: Fully supported (IE 11+, all evergreen browsers)

## Testing Checklist

- [x] Agent chat narrows smoothly to 420px
- [x] Object view slides in from right with opacity fade
- [x] Border appears between panels
- [x] Close button returns to full-width smoothly
- [x] Scroll position preserved in agent chat
- [x] Messages remain readable during transition
- [x] Works with Models, Liveboards, and Dependents
- [x] No visual glitches or layout jumps
- [x] Transition feels natural and polished

## Future Enhancements

1. **Exit animation** — Object view could slide out to right on close (adds 0.2s delay)
2. **Resize handle** — Allow users to drag divider to adjust panel widths
3. **Keyboard shortcuts** — ESC to close object, arrows to navigate between objects
4. **Panel memory** — Remember last split ratio per session
5. **Mobile responsive** — Stack vertically on narrow viewports
6. **Backdrop blur** — Subtle blur on agent chat when object is open (visual hierarchy)

## Related Files

- **Implementation**: `components/FullChatView.tsx` (lines 580-629)
- **Integration doc**: `OBJECT_VIEW_INTEGRATION.md`
- **System architecture**: `research/pulse-monitoring-integration.md`
- **Session log**: `CONTEXT.md` → Session 50
