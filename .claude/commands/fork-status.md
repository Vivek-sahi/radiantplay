Report on all downstream designer forks of the primary Radiant Play repo on Galaxy. Shows which forks are up to date, which are behind, and flags actionable items.

## Instructions

Follow these steps in order.

---

### 1. Authenticate and identify the primary repo

Run `gh auth status --hostname galaxy.corp.thoughtspot.com` to confirm authentication.

The primary (upstream) repo is: `mohammed-faris/radiantplay` on `galaxy.corp.thoughtspot.com`.

---

### 2. Discover all forks

**Step A — API scan:** List all forks from the Galaxy API:

```
gh api repos/mohammed-faris/radiantplay/forks --hostname galaxy.corp.thoughtspot.com --jq '.[].full_name'
```

**Step B — Known list:** Also check these known forks in case the API paginates or misses any:

```
umesh-indoriya/radiantplay
vivek-sahi/radiantplay
jason-knight/radiantplay
irene-ren/radiantplay
jayant-mishra/radiantplay
simran-pandit/radiantplay
aditya-wadher/radiantplay
devanshi-behera/radiantplay
akshay-mohankar/radiantplay
komal-bains/radiantplay_komal
abhinav-gupta/radiantplay
yash-chauhan/radiantplay
tarun-bhandari/radiantplay
kshipra-sharma/radiantplay
```

Merge both lists (deduplicate). If any new forks appear from the API that aren't in the known list, flag them as "New fork detected".

---

### 3. Get upstream HEAD info

Get the latest commit on upstream main for reference:

```
gh api repos/mohammed-faris/radiantplay/commits/main --hostname galaxy.corp.thoughtspot.com --jq '{sha: .sha[:7], message: .commit.message | split("\n")[0], date: .commit.committer.date}'
```

---

### 4. Check each fork's status

For **each fork**, run these API calls in parallel where possible:

**a) Compare fork to upstream:**

```
gh api repos/mohammed-faris/radiantplay/compare/main...<owner>:main --hostname galaxy.corp.thoughtspot.com --jq '{status: .status, ahead_by: .ahead_by, behind_by: .behind_by}'
```

If this fails (e.g., fork has no `main` branch), try the fork's default branch:

```
gh api repos/<owner>/<repo> --hostname galaxy.corp.thoughtspot.com --jq '.default_branch'
```

Then retry the compare with that branch.

**b) Get fork's latest commit:**

```
gh api repos/<owner>/<repo>/commits/<branch> --hostname galaxy.corp.thoughtspot.com --jq '{sha: .sha[:7], message: .commit.message | split("\n")[0], date: .commit.committer.date, author: .commit.author.name}'
```

**c) Check for prototype work (commits ahead of upstream):**

If `ahead_by > 0`, list the unique commits:

```
gh api repos/mohammed-faris/radiantplay/compare/main...<owner>:<branch> --hostname galaxy.corp.thoughtspot.com --jq '.commits[] | {sha: .sha[:7], message: .commit.message | split("\n")[0], date: .commit.committer.date}'
```

Scan commit messages and changed files for prototype names (look for `src/prototypes/` paths or `registry.ts` changes).

**d) Check fork activity:**

```
gh api repos/<owner>/<repo> --hostname galaxy.corp.thoughtspot.com --jq '{pushed_at: .pushed_at, updated_at: .updated_at}'
```

---

### 5. Classify each fork

Based on the data, assign each fork a status:

| Status | Condition |
|--------|-----------|
| Up to date | behind_by = 0, ahead_by = 0 |
| Up to date + active | behind_by = 0, ahead_by > 0 |
| Behind | behind_by > 0, ahead_by > 0 (has own work but hasn't synced) |
| Stale | behind_by > 0, ahead_by = 0, last push > 14 days ago |
| Dormant | behind_by > 0, ahead_by = 0, last push > 30 days ago |

---

### 6. Output the report

Print in this exact format:

```
Fork Status Report — <today's date>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPSTREAM (mohammed-faris/radiantplay)
  Latest: <sha> — <message> (<date>)

──────────────────────────────────────────────────────────────────────────────────
FORK SUMMARY
──────────────────────────────────────────────────────────────────────────────────

  Fork                              Status          Behind   Ahead   Last push
  ─────────────────────────────────────────────────────────────────────────────
  jason-knight/radiantplay          Behind             12       3   2d ago
  irene-ren/radiantplay             Up to date          0       0   5d ago
  ...

──────────────────────────────────────────────────────────────────────────────────
ACTION ITEMS
──────────────────────────────────────────────────────────────────────────────────

  Needs sync (behind upstream):
    ! jason-knight/radiantplay — 12 commits behind, has 3 own commits
      Last synced: ~<estimated date>
      Their work: <prototype names or summary of ahead commits>

    ! simran-pandit/radiantplay — 47 commits behind, no own work
      Recommendation: nudge to run /sync-upstream

  Dormant forks (no activity > 30 days):
    ? komal-bains/radiantplay_komal — last push 45 days ago
      May be abandoned. Consider reaching out.

  New forks detected:
    + <owner>/<repo> — not in known list, forked <date>

──────────────────────────────────────────────────────────────────────────────────
PROTOTYPE ACTIVITY
──────────────────────────────────────────────────────────────────────────────────

  Active prototypes across forks:
    jason-knight — working on: <prototype names from commit scan>
    jayant-mishra — working on: <prototype names>

  No prototype activity detected:
    irene-ren, simran-pandit, ...
```

---

### 7. Error handling

- If a fork API call fails (404, timeout), mark that fork as "Unreachable" in the table and continue with the rest.
- If Galaxy authentication fails, print a clear message: "Not authenticated to Galaxy. Run: gh auth login --hostname galaxy.corp.thoughtspot.com"
- If the primary repo API fails, stop and report the error — no point checking forks if upstream is unreachable.

---

### 8. Update known forks list

If any new forks were detected from the API that aren't in the known list in this skill file, suggest updating the known list (but don't auto-edit this file).
