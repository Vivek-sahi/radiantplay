---
description: Count every prototype across all forks (slow — fetches all forks). Caches results for /project-canvas to display.
---

This is the SLOW, explicit-only census. It auto-discovers every fork from the galaxy API (falling back to `internal/scripts/forks.txt` if the API is unreachable), git-fetches each plus the maintainer repo, counts prototypes (folders + registry entries by section, per creator, archived included), and writes a cache that `/project-canvas` displays cheaply.

Run it:

```bash
bash internal/scripts/prototype-census.sh
```

After it runs, tell the user the headline totals it printed and that `/project-canvas` will now show the census (last-run timestamp + refresh hint). Do not re-run it as part of `/project-canvas` — it is intentionally opt-in because it fetches every fork.

Fork discovery is automatic, so the list stays current on its own. Only edit `internal/scripts/forks.txt` if the API misses a fork or is unreachable.
