# Pulse + Monitoring Integration System

**Goal**: Create a seamless, real-time system where the Overview Pulse pane (top 3-5 urgent opportunities) and the Monitoring tab (comprehensive health view) stay perfectly in sync, with the agent orchestrating priority across both surfaces.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Health Engine (Background)                    │
│  • Runs periodic health checks on all models                    │
│  • Detects issues: sync failures, semantic gaps, cache misses   │
│  • Calculates impact scores and urgency                         │
│  • Emits events when health state changes                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─────────────────┬─────────────────┐
                 ▼                 ▼                 ▼
        ┌────────────────┐ ┌────────────┐ ┌─────────────────┐
        │ Priority Queue │ │ Model View │ │ Agent Context   │
        │ (Pulse Pane)   │ │ Monitoring │ │ (Runs flows)    │
        └────────────────┘ └────────────┘ └─────────────────┘
```

### Core Components

1. **Health Engine** — Background service that continuously monitors all models
2. **Issue Registry** — Single source of truth for all detected issues
3. **Priority Scorer** — Ranks issues by urgency, impact, and user context
4. **State Synchronizer** — Keeps Pulse pane and Monitoring tab in sync
5. **Agent Orchestrator** — Manages resolution workflows and updates

---

## 2. Data Flow: Detection → Display → Resolution

### Phase 1: Issue Detection

```typescript
// Health Engine runs checks every 5 minutes
interface HealthCheck {
  modelId: string;
  timestamp: number;
  checks: {
    syncHealth: SyncHealthResult;
    spotterQuality: SpotterQualityResult;
    dataQuality: DataQualityResult;
    performance: PerformanceResult;
  };
}

interface SyncHealthResult {
  status: 'healthy' | 'degraded' | 'critical';
  issues: Array<{
    type: 'sync_failure' | 'schema_change' | 'query_error';
    severity: number;  // 0-100
    metadata: Record<string, any>;
  }>;
}

// Similar for SpotterQualityResult, DataQualityResult, PerformanceResult
```

**Detection triggers:**
- **Scheduled**: Every 5 minutes, run health checks on all active models
- **Event-driven**: When dbt sync completes, when user queries fail, when Spotter logs errors
- **User-initiated**: When user clicks "Run health check" in Monitoring tab

### Phase 2: Issue Registration

```typescript
// Central Issue Registry
interface Issue {
  id: string;              // 'ins-o3-m1-semantic-gaps'
  modelId: string;
  type: 'diagnostic' | 'optimization';
  category: 'semantic_gaps' | 'cache_miss' | 'slow_query' | 'sync_failure' | 'null_rate' | ...;
  
  // Display metadata
  title: string;           // "4 columns need descriptions"
  subtitle: string;        // "Semantic gaps causing Spotter failures"
  icon: string;
  
  // Scoring
  impactScore: number;     // 0-100: how much this affects users
  urgencyScore: number;    // 0-100: how time-sensitive
  priorityScore: number;   // computed: impactScore * urgencyScore * contextMultiplier
  
  // Status tracking
  status: 'detected' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  detectedAt: number;
  resolvedAt?: number;
  
  // Resolution
  flowId?: string;         // 'semantic_gaps_detect' — which SCRIPT to run
  resolutionType: 'automated' | 'assisted' | 'manual';
  
  // Monitoring pillar connection
  pillar: 'sync-health' | 'spotter-quality' | 'data-quality' | 'performance';
}
```

**Issue registration flow:**
1. Health Engine detects problem
2. Calculate impact score (how many users/queries affected, how severe)
3. Calculate urgency score (how fast is this degrading, how critical is the pillar)
4. Create Issue object and add to registry
5. Emit `issue:detected` event

### Phase 3: Priority Scoring

```typescript
interface PriorityScorer {
  calculatePriority(issue: Issue, context: UserContext): number;
}

interface UserContext {
  currentModel?: string;        // User is viewing this model
  recentQueries: string[];      // What they've asked recently
  role: 'owner' | 'editor' | 'viewer';
  preferences: {
    autoFix: boolean;
    notificationThreshold: number;
  };
}

// Priority formula
function calculatePriority(issue: Issue, context: UserContext): number {
  let score = issue.impactScore * 0.6 + issue.urgencyScore * 0.4;
  
  // Context multipliers
  if (context.currentModel === issue.modelId) {
    score *= 1.5;  // Boost issues for model they're viewing
  }
  
  if (issue.type === 'diagnostic' && issue.status === 'detected') {
    score *= 1.3;  // Boost newly detected diagnostics
  }
  
  if (issue.resolutionType === 'automated') {
    score *= 1.2;  // Boost auto-fixable issues
  }
  
  return Math.min(score, 100);
}
```

**Priority tiers:**
- **90-100**: Critical — Show immediately in Pulse, push notification
- **70-89**: High — Show in Pulse if top 5, always show in Monitoring
- **50-69**: Medium — Show in Monitoring, may appear in Pulse if nothing more urgent
- **0-49**: Low — Show in Monitoring only

### Phase 4: Display Logic

```typescript
// Pulse Pane (Overview page)
function getPulseIssues(registry: Issue[], context: UserContext): Issue[] {
  return registry
    .filter(i => i.status === 'detected' || i.status === 'in_progress')
    .map(i => ({ ...i, priority: calculatePriority(i, context) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);  // Top 5 only
}

// Monitoring Tab (Model View)
function getMonitoringIssues(modelId: string, registry: Issue[]): PillarData[] {
  const modelIssues = registry.filter(i => i.modelId === modelId);
  
  // Group by pillar
  const byPillar = groupBy(modelIssues, 'pillar');
  
  return PILLARS.map(pillarId => {
    const issues = byPillar[pillarId] || [];
    const status = calculatePillarStatus(issues);
    
    return {
      id: pillarId,
      status,
      headline: generateHeadline(pillarId, issues),
      stats: generateStats(pillarId, modelId),
      issues: issues.slice(0, 5),  // Top 5 per pillar
      ctaLabel: getCTA(pillarId, issues),
    };
  });
}
```

**Display rules:**

| Location | Shows | Filters | Sort |
|----------|-------|---------|------|
| **Pulse Pane** | Top 5 urgent opportunities across all models | `status === 'detected' OR 'in_progress'` | Priority score DESC |
| **Monitoring Tab** | All issues for one model, grouped by pillar | `modelId === current` | Impact score DESC within each pillar |

---

## 3. State Synchronization

### The State Sync Problem

**Scenario**: User clicks "Generate descriptions" in Pulse pane. This:
1. Starts `semantic_gaps_generate` flow in AgentPanel
2. Agent generates descriptions
3. Descriptions are applied to model
4. Issue should be marked resolved in registry
5. Pulse pane should remove the card
6. Monitoring tab should update "Spotter quality" pillar to healthy

**Solution**: Reactive state management with event bus

```typescript
// Event Bus
type EventType = 
  | 'issue:detected'
  | 'issue:acknowledged'
  | 'issue:in_progress'
  | 'issue:resolved'
  | 'issue:dismissed'
  | 'health:model_updated'
  | 'agent:flow_started'
  | 'agent:flow_completed';

interface Event {
  type: EventType;
  timestamp: number;
  payload: any;
}

class EventBus {
  private listeners = new Map<EventType, Set<(e: Event) => void>>();
  
  emit(type: EventType, payload: any) {
    const event: Event = { type, timestamp: Date.now(), payload };
    this.listeners.get(type)?.forEach(fn => fn(event));
  }
  
  on(type: EventType, callback: (e: Event) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
  }
}

// Global singleton
export const eventBus = new EventBus();
```

### State Update Flow

```typescript
// 1. User clicks "Generate descriptions" in Pulse card
function handlePulseAction(issueId: string, action: string) {
  const issue = issueRegistry.get(issueId);
  
  // Update issue status
  issueRegistry.update(issueId, { status: 'in_progress' });
  
  // Emit event
  eventBus.emit('issue:in_progress', { issueId, action });
  
  // Start agent flow
  if (issue.flowId) {
    runAgentFlow(issue.flowId, { issueId });
  }
}

// 2. Agent completes flow
function onAgentFlowComplete(flowId: string, result: any) {
  eventBus.emit('agent:flow_completed', { flowId, result });
  
  // Find issues resolved by this flow
  const resolvedIssues = issueRegistry.findByFlow(flowId);
  
  resolvedIssues.forEach(issue => {
    issueRegistry.update(issue.id, { 
      status: 'resolved',
      resolvedAt: Date.now(),
    });
    
    eventBus.emit('issue:resolved', { issueId: issue.id });
  });
  
  // Trigger health check to confirm
  healthEngine.checkModel(result.modelId);
}

// 3. Pulse pane listens for resolution
useEffect(() => {
  const handler = (e: Event) => {
    // Remove resolved issue from display
    setPulseIssues(prev => prev.filter(i => i.id !== e.payload.issueId));
  };
  
  eventBus.on('issue:resolved', handler);
  return () => eventBus.off('issue:resolved', handler);
}, []);

// 4. Monitoring tab listens for updates
useEffect(() => {
  const handler = (e: Event) => {
    // Re-calculate pillar health
    const pillars = getMonitoringIssues(modelId, issueRegistry.getAll());
    setPillars(pillars);
  };
  
  eventBus.on('issue:resolved', handler);
  eventBus.on('issue:detected', handler);
  eventBus.on('health:model_updated', handler);
  
  return () => {
    eventBus.off('issue:resolved', handler);
    eventBus.off('issue:detected', handler);
    eventBus.off('health:model_updated', handler);
  };
}, [modelId]);
```

---

## 4. Navigation Patterns

### From Pulse to Monitoring

**User story**: User sees "Cache miss hot spot" in Pulse. Wants more context before taking action.

```typescript
// Pulse card includes "View details" link
<PulseCard issue={issue}>
  <button onClick={() => navigateToMonitoring(issue)}>
    View details →
  </button>
</PulseCard>

function navigateToMonitoring(issue: Issue) {
  // Open model view
  openModelView(issue.modelId);
  
  // Switch to Monitoring tab
  setActiveTab('monitoring');
  
  // Scroll to relevant pillar
  scrollToPillar(issue.pillar);
  
  // Highlight the specific issue
  highlightIssue(issue.id);
}
```

**Implementation:**
1. Update `index.tsx` route to accept `?tab=monitoring&highlight=ins-o3`
2. ModelView reads URL params and sets initial tab
3. MonitoringTab scrolls to pillar and adds highlight animation

### From Monitoring to Agent Flow

**User story**: User is in Monitoring tab, sees "4 semantic gaps" in Spotter Quality pillar. Clicks "Fix gaps" button.

```typescript
// PillarCard includes CTA button
<PillarCard pillar={pillar}>
  {pillar.ctaLabel && (
    <Button onClick={() => startFlowFromMonitoring(pillar)}>
      {pillar.ctaLabel}
    </Button>
  )}
</PillarCard>

function startFlowFromMonitoring(pillar: PillarData) {
  // Find highest-priority issue in this pillar
  const issue = issueRegistry
    .getForPillar(pillar.id, modelId)
    .sort((a, b) => b.priorityScore - a.priorityScore)[0];
  
  if (!issue || !issue.flowId) return;
  
  // Open full chat view
  openFullChatView();
  
  // Start agent flow
  runAgentFlow(issue.flowId, { issueId: issue.id });
}
```

---

## 5. Agent Orchestration

### The Agent as Priority Manager

The agent should **proactively suggest** the next most important thing to fix, not wait for the user to click.

```typescript
// Agent checks priority queue every time it's idle
function onAgentIdle() {
  const topIssue = issueRegistry
    .getAll()
    .filter(i => i.status === 'detected')
    .map(i => ({ ...i, priority: calculatePriority(i, currentContext) }))
    .sort((a, b) => b.priority - a.priority)[0];
  
  if (!topIssue) return;
  
  // Agent suggests fix
  if (topIssue.priority >= 90) {
    // Critical — ask immediately
    sendAgentMessage(`I found a critical issue: ${topIssue.title}. Should I fix this now?`);
  } else if (topIssue.priority >= 70 && shouldPromptUser()) {
    // High — gentle nudge
    sendAgentMessage(`I noticed: ${topIssue.title}. Want me to take a look?`);
  }
}
```

**Agent initiative levels:**
- **90-100 priority**: Ask immediately, default to "Yes"
- **70-89 priority**: Ask once per session
- **50-69 priority**: Show in Pulse, don't interrupt
- **0-49 priority**: Show in Monitoring only

### Multi-Issue Workflows

**User story**: User has 3 semantic gap issues across 3 different models. Agent should batch-fix all of them.

```typescript
function batchFixIssues(issueIds: string[]) {
  const issues = issueIds.map(id => issueRegistry.get(id));
  
  // Group by flow type
  const byFlow = groupBy(issues, 'flowId');
  
  // Run flows in sequence
  for (const [flowId, flowIssues] of Object.entries(byFlow)) {
    runAgentFlow(flowId, { 
      issueIds: flowIssues.map(i => i.id),
      batch: true,
    });
  }
}

// Batch UI in Pulse pane
<div className="pulse-batch-actions">
  <span>{selectedIssues.length} issues selected</span>
  <Button onClick={() => batchFixIssues(selectedIssues)}>
    Fix all with agent →
  </Button>
</div>
```

---

## 6. Notification Strategy

### Push vs Pull

**Pull model (current)**: User must open Overview or Monitoring tab to see issues.

**Push model (proposed)**: System notifies user when critical issues are detected.

```typescript
interface NotificationConfig {
  channels: ('toast' | 'email' | 'slack')[];
  threshold: number;  // Only notify if priority >= this
  quietHours: { start: number; end: number };
  groupingWindow: number;  // Group notifications within 5min
}

function maybeNotify(issue: Issue) {
  const config = getUserNotificationConfig();
  
  if (issue.priorityScore < config.threshold) return;
  
  if (isInQuietHours(config.quietHours)) {
    // Queue for later
    notificationQueue.add(issue);
    return;
  }
  
  // Group recent notifications
  const recent = notificationQueue.getRecent(config.groupingWindow);
  
  if (recent.length > 0) {
    // Batch notification
    sendNotification({
      title: `${recent.length + 1} issues detected`,
      body: `Including: ${issue.title}`,
      action: 'View all in Pulse',
    });
  } else {
    // Individual notification
    sendNotification({
      title: issue.title,
      body: issue.subtitle,
      action: 'Fix now',
    });
  }
}
```

**Notification rules:**
- **Critical (90-100)**: Always notify immediately
- **High (70-89)**: Notify if user hasn't been active in 10min
- **Medium (50-69)**: Batch into daily digest
- **Low (0-49)**: Never notify

### In-App Indicators

```typescript
// Header badge showing unresolved issue count
<OverviewHeader>
  <PulseIndicator count={unresolvedCount} severity="critical" />
</OverviewHeader>

// Model card badges
<ModelCard>
  <HealthBadge status="degraded" count={2} />
</ModelCard>
```

---

## 7. Implementation Phases

### Phase 1: Unified Issue Registry (Week 1)
- [ ] Create `IssueRegistry` class
- [ ] Define `Issue` interface
- [ ] Build priority scoring logic
- [ ] Wire up event bus

### Phase 2: State Synchronization (Week 2)
- [ ] Connect Pulse pane to registry
- [ ] Connect Monitoring tab to registry
- [ ] Implement event listeners for sync
- [ ] Test resolution flow updates both surfaces

### Phase 3: Navigation & Highlights (Week 3)
- [ ] Add "View details" links in Pulse cards
- [ ] Implement deep linking with URL params
- [ ] Add scroll-to-pillar and highlight animation
- [ ] Add "Fix this" CTAs in Monitoring tab

### Phase 4: Agent Orchestration (Week 4)
- [ ] Agent checks priority queue on idle
- [ ] Implement proactive suggestions
- [ ] Add batch-fix workflows
- [ ] Test multi-issue resolution

### Phase 5: Notifications (Week 5)
- [ ] Build notification config UI
- [ ] Implement push notifications (toast, email, Slack)
- [ ] Add quiet hours and grouping
- [ ] Add in-app badges and indicators

---

## 8. Example User Journeys

### Journey 1: Critical Issue Auto-Fix

1. **Detection**: Health Engine detects sync failure on "Sales Performance" model
2. **Scoring**: Impact = 95 (blocks 50 users), Urgency = 90 (happened 5min ago) → Priority = 93
3. **Pulse**: Issue appears at top of Pulse pane: "Sales Performance sync failed"
4. **Monitoring**: "Sync Health" pillar in Monitoring tab turns red with error details
5. **Agent**: Agent proactively asks: "The Sales Performance sync just failed. Should I retry now?" [Yes] [View details] [Dismiss]
6. **User**: Clicks "Yes"
7. **Resolution**: Agent runs `sync_failure_retry` flow, fixes issue
8. **Sync**: Pulse card disappears, Monitoring pillar turns green, toast notification confirms success

### Journey 2: Optimization Discovery

1. **Detection**: Health Engine finds cache miss hot spot on "Marketing Attribution" model
2. **Scoring**: Impact = 70 (saves 374s/week), Urgency = 40 (not blocking anyone) → Priority = 58
3. **Pulse**: Issue appears in Pulse pane: "Cache miss hot spot — ~374s wasted this week"
4. **Monitoring**: "Performance" pillar shows yellow with cache opportunity listed
5. **User**: Sees Pulse card, curious but not urgent
6. **User**: Clicks "View details" → Opens ModelView, Monitoring tab, scrolls to Performance pillar
7. **User**: Sees full context: query pattern, users affected, savings estimate
8. **User**: Clicks "Enable caching" CTA
9. **Resolution**: Agent runs `cache_miss_configure` flow
10. **Sync**: Pulse card disappears, Performance pillar updates with "Caching enabled" success state

### Journey 3: Batch Fix Multiple Models

1. **Detection**: Health Engine finds semantic gaps in 3 models
2. **Scoring**: All 3 have Priority 75-80
3. **Pulse**: All 3 appear in Pulse pane
4. **User**: Selects all 3 using checkboxes
5. **User**: Clicks "Fix all with agent"
6. **Resolution**: Agent runs `semantic_gaps_generate` for each model in sequence
7. **Sync**: Pulse cards disappear one by one, all 3 Monitoring tabs update

---

## 9. Key Design Principles

1. **Single Source of Truth**: Issue Registry is the only place issue state lives. Pulse and Monitoring are views.
2. **Event-Driven**: All state changes emit events. Components listen and react.
3. **Context-Aware Priority**: Same issue has different priority for different users.
4. **Proactive Agent**: Agent suggests fixes, doesn't wait for user to discover problems.
5. **Seamless Navigation**: User can move from Pulse → Monitoring → Agent flow without losing context.
6. **Real-Time Sync**: Fixing an issue in one place updates everywhere immediately.
7. **Graceful Degradation**: If Health Engine is down, show cached state. If event bus fails, fall back to polling.

---

## 10. Technical Stack

```typescript
// Core libraries
import { EventEmitter } from 'events';           // Event bus
import { PriorityQueue } from '@datastructures-js/priority-queue';  // Issue queue
import { useQuery, useMutation } from 'react-query';  // Data fetching
import { useWebSocket } from 'react-use-websocket';  // Real-time updates

// State management
import { atom, useAtom } from 'jotai';  // Global state for issue registry

// URL state
import { useSearchParams } from 'react-router-dom';  // Deep linking
```

---

## Summary

This system creates a **living, breathing health dashboard** where:

- **Health Engine** continuously monitors all models
- **Issue Registry** is the single source of truth
- **Priority Scorer** ranks issues by impact, urgency, and user context
- **Pulse Pane** shows top 5 urgent opportunities across all models
- **Monitoring Tab** shows comprehensive health for one model, grouped by pillar
- **Agent** orchestrates resolution workflows and keeps priority queue moving
- **Event Bus** keeps all surfaces in perfect sync
- **Navigation** is seamless — user can jump from Pulse → Monitoring → Agent flow with full context

The key insight: **Pulse and Monitoring are two views of the same underlying health state**. They stay in sync because they both read from the Issue Registry and react to the same events. The agent acts as the conductor, managing the priority queue and proactively suggesting fixes.
