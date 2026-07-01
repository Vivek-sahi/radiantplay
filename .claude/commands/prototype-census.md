---
description: Count every prototype across all forks (slow — fetches all forks). Caches results for /project-status to display.
---

This is the SLOW, explicit-only census. It git-fetches every fork in `internal/scripts/forks.txt` plus the maintainer repo, counts prototypes (folders + registry entries by section, per creator, archived included), and writes a cache that `/project-status` displays cheaply.

Run it:

```bash
bash internal/scripts/prototype-census.sh
```

After it runs, tell the user the headline totals it printed and that `/project-status` will now show the census (last-run timestamp + refresh hint). Do not re-run it as part of `/project-status` — it is intentionally opt-in because it fetches every fork.

To add a newly discovered fork, append its `owner/repo` to `internal/scripts/forks.txt` and re-run.
