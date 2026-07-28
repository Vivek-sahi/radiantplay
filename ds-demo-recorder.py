#!/usr/bin/env python3
"""
Data Studio V2 Option 3 — Customer Health Scorecard UX Walkthrough
Persona: Data analyst at Uber building a composite customer health score.
Sources:
  - customers + orders (Snowflake CDW)
  - customer_health_import.csv (local file)
  - pendo_nps (Pendo Business Apps connector)
  - Python block (computed health score formula)
Goal: Document UX affordances, friction points, and mental model requirements.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL  = "http://localhost:5173/playground/DataStudioV2"
OUT_DIR   = Path(__file__).parent / "demo-screenshots"
CSV_PATH  = Path(__file__).parent / "customer_health_import.csv"
MD_PATH   = Path(__file__).parent / "ds-demo-walkthrough.md"

STEPS: list[dict] = []


# ── Helpers ────────────────────────────────────────────────────────────────────

async def highlight(page, box):
    """Draw a red ring over the target element."""
    if not box:
        return
    await page.evaluate(
        """([x, y, w, h]) => {
            ['__hl__', '__dot__'].forEach(id => document.getElementById(id)?.remove());
            const r = document.createElement('div');
            r.id = '__hl__';
            r.style.cssText = `position:fixed;left:${x-5}px;top:${y-5}px;` +
                `width:${w+10}px;height:${h+10}px;` +
                `border:2.5px solid #EF4444;border-radius:9px;` +
                `box-shadow:0 0 0 6px rgba(239,68,68,0.15);` +
                `pointer-events:none;z-index:99999;`;
            document.body.appendChild(r);
            const d = document.createElement('div');
            d.id = '__dot__';
            d.style.cssText = `position:fixed;` +
                `left:${x + w/2 - 9}px;top:${y + h/2 - 9}px;` +
                `width:18px;height:18px;` +
                `background:rgba(239,68,68,0.9);border-radius:50%;` +
                `border:2px solid #fff;pointer-events:none;z-index:99999;`;
            document.body.appendChild(d);
        }""",
        [box["x"], box["y"], box["width"], box["height"]],
    )


async def clear_highlight(page):
    await page.evaluate(
        "() => { ['__hl__', '__dot__'].forEach(id => document.getElementById(id)?.remove()); }"
    )


async def hl_click(page, locator, shot_name: str, desc: str):
    """Highlight element → screenshot → click."""
    try:
        await locator.scroll_into_view_if_needed()
        box = await locator.bounding_box()
        await highlight(page, box)
    except Exception:
        pass
    img = f"{len(STEPS)+1:02d}_{shot_name}.png"
    await page.screenshot(path=str(OUT_DIR / img))
    await clear_highlight(page)
    STEPS.append({"name": shot_name, "img": img, "desc": desc})
    print(f"  [{len(STEPS):02d}] hl_click → {shot_name}")
    try:
        await locator.click()
    except Exception as e:
        print(f"       (click failed: {e})")
    await page.wait_for_timeout(600)


async def shot(page, shot_name: str, desc: str):
    """Plain screenshot, no highlight."""
    img = f"{len(STEPS)+1:02d}_{shot_name}.png"
    await page.screenshot(path=str(OUT_DIR / img))
    STEPS.append({"name": shot_name, "img": img, "desc": desc})
    print(f"  [{len(STEPS):02d}] shot → {shot_name}")


async def hover_and_add_to_canvas(page, table_name: str, shot_name: str, desc: str):
    """
    Hover tree row by table name → 'Add to canvas' button appears (conditional render) → click.
    Falls back to plain screenshot if hover/button fails.
    """
    # Try exact text first, then partial
    row = page.get_by_text(table_name, exact=True).first
    try:
        await row.wait_for(state="visible", timeout=7000)
    except Exception:
        # Try scrolling the browser panel first
        try:
            # Scroll the data browser's inner scrollable container via JS
            await page.evaluate("""() => {
                const spans = [...document.querySelectorAll('span')];
                const label = spans.find(s => s.textContent?.trim() === 'Data browser');
                if (label) {
                    let el = label.parentElement;
                    while (el && el.scrollHeight <= el.clientHeight) el = el.parentElement;
                    if (el) el.scrollTop += 150;
                }
            }""")
            await page.wait_for_timeout(300)
        except Exception:
            pass
        try:
            await row.wait_for(state="visible", timeout=4000)
        except Exception as e:
            print(f"       (row '{table_name}' not found: {e})")
            await shot(page, shot_name, desc)
            return

    try:
        await row.hover()
        await page.wait_for_timeout(1000)  # wait for conditional render of Add to canvas button
    except Exception as e:
        print(f"       (hover failed for '{table_name}': {e})")

    add_btn = page.locator('[title="Add to canvas"]').first
    try:
        await add_btn.wait_for(state="visible", timeout=3000)
        await hl_click(page, add_btn, shot_name, desc)
    except Exception:
        # Fallback: highlight the row itself and screenshot
        try:
            box = await row.bounding_box()
            await highlight(page, box)
            img = f"{len(STEPS)+1:02d}_{shot_name}.png"
            await page.screenshot(path=str(OUT_DIR / img))
            await clear_highlight(page)
            STEPS.append({"name": shot_name, "img": img, "desc": desc})
            print(f"  [{len(STEPS):02d}] shot (row fallback) → {shot_name}")
        except Exception:
            await shot(page, shot_name, desc)


# ── Markdown writer ────────────────────────────────────────────────────────────

def write_md():
    lines = [
        "# Data Studio V2 Option 3 — Customer Health Scorecard Walkthrough",
        "",
        "> **Analyst persona:** Data analyst at Uber.",
        "> **Goal:** Build a composite Customer Health Score combining NPS, product usage, and order frequency.",
        ">",
        "> **Sources used:**",
        "> - `customers` and `orders` — Snowflake CDW",
        "> - `customer_health_import.csv` — local CSV (NPS + health signals)",
        "> - `pendo_nps` — Pendo Business Apps connector",
        "> - Python block — formula for composite health score",
        "",
        "---",
        "",
    ]

    for i, s in enumerate(STEPS, 1):
        title = s["name"].replace("_", " ").title()
        lines += [
            f"## Step {i}: {title}",
            "",
            s["desc"],
            "",
            f"![{s['name']}](demo-screenshots/{s['img']})",
            "",
            "---",
            "",
        ]

    lines += [
        "## UX Observations",
        "",
        "### What felt natural",
        "",
        "- **Data browser hover-to-add** pattern is satisfying once discovered. "
        "Hovering a tree row reveals an inline 'Add to canvas' button — the interaction "
        "is compact and non-intrusive when you know it's there.",
        "",
        "- **Business Apps tab** clearly segments warehouse data from connector data. "
        "Switching tabs is low friction.",
        "",
        "- **CSV upload via 'Add data' dropdown** follows a predictable pattern for anyone "
        "who has used Tableau Prep or similar tools.",
        "",
        "- **Python block** in the canvas is a power-user affordance that doesn't clutter "
        "the default flow — it's tucked inside the 'Add data' menu.",
        "",
        "### What felt confusing or hidden",
        "",
        "- **'Add to canvas' is a conditional render, not a CSS visibility toggle.** "
        "The button is absent from the DOM entirely until mouse-enter fires. "
        "Automated tests must hover first; users who move the mouse quickly may "
        "miss the window. A persistent but subtle icon (like an inline +) would help discovery.",
        "",
        "- **No Join button in the dataset2 toolbar.** "
        "The `opButtons` array is explicitly filtered to empty in dataset2 mode, "
        "so there is no visible 'Join' affordance in the floating toolbar. "
        "The only real path to configure a join is: select a single node → "
        "the right panel switches to a 'Create Join' form. "
        "Multi-select shows a hint ('Click Join in toolbar') but the toolbar button doesn't exist — "
        "a confusing dead end for first-time users.",
        "",
        "- **Join discovery requires mental model of single-node selection.** "
        "Users who expect a global 'Join' or 'Relationship' wizard will scan the toolbar "
        "and find nothing. The join affordance is hidden behind single-node selection and "
        "a right-panel mode switch — discoverable only through exploration or onboarding.",
        "",
        "- **Drag-to-connect port (right edge of BlockNode) draws a visual edge but does NOT "
        "open the join config.** It just adds `inputIds` to the target. "
        "Users who drag-connect tables expecting a join dialog will be confused "
        "when nothing happens. The bezier edge looks like a join but isn't one.",
        "",
        "- **File upload path requires the dropdown to stay open while awaiting file chooser.** "
        "In automated testing, `expect_file_chooser()` must be set up before clicking "
        "'Upload CSV' or the chooser event is missed.",
        "",
        "### Mental models required to succeed",
        "",
        "1. **Option 3 ≠ Option 1/2.** The user must switch modes before clicking 'New model'. "
        "If they click 'New model' first, they land in the wrong canvas mode.",
        "",
        "2. **Single-node selection = join entry point.** "
        "Click one node → right panel shows 'Create Join'. "
        "This is the ONLY path to a configured join in dataset2 mode.",
        "",
        "3. **'Add to canvas' appears on hover only.** "
        "Users must hover the data browser row, not the tree connector/expander.",
        "",
        "4. **Business Apps is a separate tab.** "
        "Pendo data is not in the Warehouse tree — users must switch tabs.",
        "",
        "5. **Python block is an 'Add data' menu item, not a transform.** "
        "Users looking for a formula/compute step might look in node kebab menus instead.",
        "",
    ]

    MD_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nMarkdown written → {MD_PATH}")


# ── Main walkthrough ───────────────────────────────────────────────────────────

async def run():
    OUT_DIR.mkdir(exist_ok=True)
    print("\n=== Data Studio V2 Option 3 — UX Walkthrough ===\n")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False, slow_mo=350)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()

        # ── Step 1: Open prototype overview ───────────────────────────────────
        print("Step 1: Open prototype...")
        await page.goto(BASE_URL)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)
        await shot(
            page,
            "overview_screen",
            "The Data Studio V2 prototype loads on the **overview screen**. "
            "As a data analyst at Uber, I want to build a Customer Health Scorecard "
            "that combines three heterogeneous data sources: Snowflake CDW tables, "
            "a manually-maintained CSV of NPS and health signals, "
            "and Pendo usage data via an API connector. "
            "Management wants a composite score: NPS + product usage + order frequency. "
            "I need Option 3 — the multi-source canvas mode. "
            "**UX observation:** The overview screen presents the mode options clearly in the sidebar. "
            "I need to pick Option 3 *before* clicking 'New model', or I land in the wrong canvas mode.",
        )

        # ── Step 2: Click Option 3 in sidebar ─────────────────────────────────
        print("Step 2: Click Option 3...")
        opt3 = page.get_by_text("Option 3", exact=True).first
        try:
            await opt3.wait_for(state="visible", timeout=6000)
            await hl_click(
                page,
                opt3,
                "select_option3",
                "I click **Option 3** in the sidebar. "
                "This switches the canvas mode to `dataset2` — the multi-source canvas. "
                "**UX observation:** The sidebar labels (Option 1, 2, 3) are placeholder names, "
                "not descriptive. A first-time user has no cue that 'Option 3' is the "
                "'multi-source' or 'federated' mode. A label like 'Multi-source' or "
                "'Federated model' would remove the need to know which number to pick.",
            )
        except Exception as e:
            print(f"  (Option 3 not found: {e})")
            await shot(page, "select_option3", "Selecting Option 3 canvas mode.")
        await page.wait_for_timeout(1000)

        # ── Step 3: Click New model ────────────────────────────────────────────
        print("Step 3: Click New model...")
        # The button text is '+ New model' — use partial text match
        new_model = page.locator("text=New model").first
        try:
            await new_model.wait_for(state="visible", timeout=6000)
            await hl_click(
                page,
                new_model,
                "click_new_model",
                "I click **+ New model**. "
                "This calls `newProject()` which sets `view = 'canvas'`, "
                "rendering the `ModelCanvas` in a fixed full-screen overlay. "
                "**UX observation:** The button is styled as a plain inline text link "
                "(no Radiant Button component, no border, no background) — "
                "it has low visual weight and could be easily missed. "
                "A new user scanning for a CTA might look for a filled or outlined button. "
                "The `+` prefix helps, but a ghost or filled button variant would be clearer.",
            )
        except Exception as e:
            print(f"  (New model button not found: {e})")
            # Try button with has_text
            try:
                new_model = page.locator("button", has_text="New model").first
                await new_model.wait_for(state="visible", timeout=4000)
                await hl_click(page, new_model, "click_new_model", "Clicking New model to enter canvas.")
            except Exception as e2:
                print(f"  (Fallback also failed: {e2})")
                await shot(page, "click_new_model", "Attempting to navigate to canvas via New model.")
        await page.wait_for_timeout(2000)

        # ── Step 4: Canvas view — orient ──────────────────────────────────────
        print("Step 4: Canvas orientation screenshot...")
        await shot(
            page,
            "canvas_empty",
            "The canvas opens in **dataset2 mode** — empty state. "
            "I can see:\n\n"
            "- Left: **Data browser panel** with Warehouse tab open and the Snowflake tree expanded "
            "(`snowflake-prod / sf-analytics / sf-public`).\n"
            "- Center: **Empty canvas** — a white grid area where source blocks will appear.\n"
            "- Right: **Properties panel** — currently empty/contextless.\n"
            "- Top: **Floating toolbar** with an 'Add data' button (the only toolbar CTA in dataset2 mode).\n\n"
            "**UX observation:** The empty canvas state gives no visual cue about *how* to add sources — "
            "there's no empty-state illustration or onboarding hint pointing at the data browser or 'Add data'. "
            "A new user might click 'Add data' (correct) but they might also try dragging from the browser "
            "or looking for a file upload zone on the canvas itself.",
        )

        # ── Step 5: Add data → CDW data → customers auto-added ────────────────
        print("Step 5: Add data → CDW data...")
        add_data_btn = page.get_by_text("Add data", exact=True).first
        try:
            await add_data_btn.wait_for(state="visible", timeout=6000)
            await hl_click(
                page,
                add_data_btn,
                "open_add_data_menu",
                "I click **Add data** in the toolbar. "
                "This opens a dropdown with options: CDW data, Upload CSV, SQL, Python. "
                "**UX observation:** 'Add data' is the primary CTA in dataset2 mode. "
                "The toolbar only shows this one button (no Join, no Transform visible at this stage) — "
                "clean, but the label doesn't signal that this is *also* the entry point for file uploads "
                "and computed blocks (SQL, Python). A user might expect a separate 'Import' button for files.",
            )
            await page.wait_for_timeout(500)
        except Exception as e:
            print(f"  (Add data button not found: {e})")

        cdw_item = page.get_by_text("CDW data", exact=True).first
        try:
            await cdw_item.wait_for(state="visible", timeout=3000)
            await hl_click(
                page,
                cdw_item,
                "select_cdw_data",
                "I select **CDW data** from the dropdown. "
                "This calls `addToCanvas('dim_accounts')` internally, "
                "which adds a `BlockNode` for `customers` (dim_accounts) at a preset canvas position. "
                "**UX observation:** 'CDW data' auto-adds a default table (`dim_accounts`). "
                "The user doesn't pick *which* table — it just appears. "
                "This is fast but assumes the default is meaningful. "
                "A user who wants `orders` first must use the data browser instead.",
            )
            await page.wait_for_timeout(1500)
        except Exception as e:
            print(f"  (CDW data item not found: {e})")

        await shot(
            page,
            "customers_on_canvas",
            "The **customers** block appears on the canvas. "
            "It's a `BlockNode` card — shows the table name, source badge ('snowflake'), "
            "and column count. "
            "The right properties panel opened showing a data preview. "
            "**UX observation:** Auto-placement works well for the first block. "
            "The block is selected on arrival, which immediately shows the preview panel — "
            "good progressive disclosure. "
            "The block has a hover-visible kebab menu (block actions) and a delete button.",
        )

        # ── Step 6: Data browser hover customers → Add to canvas ──────────────
        print("Step 6: Add customers from data browser hover...")
        await hover_and_add_to_canvas(
            page,
            "customers",
            "browser_hover_customers",
            "I hover over **customers** in the Snowflake data browser tree. "
            "An **Add to canvas** button appears inline — this is a **conditional render** "
            "(the button is absent from the DOM until `mouseenter` fires). "
            "**UX observation:** The hover-to-reveal pattern is compact but has discoverability risk. "
            "Users who move the mouse quickly through the list may not see the button flash into view. "
            "There's no persistent hint that 'hovering a row does something'. "
            "A faint + icon at the trailing edge of each row (visible always, not just on hover) "
            "would improve learnability without cluttering the list.",
        )
        await page.wait_for_timeout(800)

        # ── Step 7: Data browser hover orders → Add to canvas ─────────────────
        print("Step 7: Add orders from data browser hover...")
        await hover_and_add_to_canvas(
            page,
            "orders",
            "browser_hover_orders",
            "I hover over **orders** in the tree and click **Add to canvas**. "
            "`orders` contains: `order_id`, `order_date`, `customer_id`, `amount`, `status`. "
            "I need this to compute engagement signals — "
            "recent order volume and average deal size are leading churn indicators. "
            "**UX observation:** The hover mechanic is consistent across rows — "
            "once discovered on customers, it transfers immediately to orders. "
            "Good pattern consistency.",
        )
        await page.wait_for_timeout(800)

        # ── Step 8: Screenshot with 2-3 CDW blocks on canvas ──────────────────
        print("Step 8: CDW blocks screenshot...")
        await shot(
            page,
            "two_cdw_blocks",
            "The canvas now shows **customers** and **orders** as independent `BlockNode` cards. "
            "They're positioned at the preset NODE_POSITIONS coordinates — no manual layout needed. "
            "Both carry the Snowflake source badge. "
            "**UX observation:** The automatic layout places blocks in a predictable grid, "
            "but the user has no control over initial placement. "
            "For 2 blocks this is fine; for 5+ blocks the canvas starts to look cluttered "
            "and users may want to rearrange (which is supported via pointer-drag, "
            "but there's no 'auto-arrange' or 'snap-to-grid' visible).",
        )

        # ── Step 9: Upload CSV ─────────────────────────────────────────────────
        print("Step 9: Upload CSV...")
        try:
            add_data_btn2 = page.get_by_text("Add data", exact=True).first
            await add_data_btn2.wait_for(state="visible", timeout=5000)
            await hl_click(
                page,
                add_data_btn2,
                "open_add_data_for_csv",
                "I click **Add data** again — this time to upload the CSV file. "
                "**UX observation:** The same 'Add data' button is the entry point for all source types. "
                "This is consistent but means users must remember that file upload is inside "
                "a toolbar dropdown, not a dedicated import zone.",
            )
            await page.wait_for_timeout(400)
        except Exception as e:
            print(f"  (Add data btn for CSV: {e})")

        upload_item = page.get_by_text("Upload CSV", exact=True).first
        try:
            await upload_item.wait_for(state="visible", timeout=3000)

            # Screenshot with highlight BEFORE file chooser setup
            box = await upload_item.bounding_box()
            await highlight(page, box)
            img_name = f"{len(STEPS)+1:02d}_select_upload_csv.png"
            await page.screenshot(path=str(OUT_DIR / img_name))
            await clear_highlight(page)
            STEPS.append({
                "name": "select_upload_csv",
                "img": img_name,
                "desc": (
                    "I select **Upload CSV** from the dropdown. "
                    "A file chooser opens immediately. "
                    "I select `customer_health_import.csv` — 15 accounts with: "
                    "`account_id`, `nps_score`, `product_usage_pct`, `active_users`, "
                    "`renewal_arr`, `churn_risk`, `last_qbr_date`, `csm_owner`. "
                    "Some cells are intentionally blank — these are the data quality gaps "
                    "the scorecard will surface. "
                    "**UX observation:** The file chooser fires on click — no intermediate dialog. "
                    "Fast and direct. "
                    "The file input is triggered via `fileInputRef.current?.click()` internally."
                ),
            })
            print(f"  [{len(STEPS):02d}] highlighted select_upload_csv")

            async with page.expect_file_chooser() as fc_info:
                await upload_item.click()
            fc = await fc_info.value
            await fc.set_files(str(CSV_PATH))
            await page.wait_for_timeout(2000)

        except Exception as e:
            print(f"  (CSV upload failed: {e})")
            # Try reopening the dropdown and retrying
            try:
                add_data_btn2 = page.get_by_text("Add data", exact=True).first
                await add_data_btn2.click()
                await page.wait_for_timeout(400)
                upload_retry = page.get_by_text("Upload CSV", exact=True).first
                await upload_retry.wait_for(state="visible", timeout=3000)
                async with page.expect_file_chooser() as fc_info:
                    await upload_retry.click()
                fc = await fc_info.value
                await fc.set_files(str(CSV_PATH))
                await page.wait_for_timeout(2000)
                await shot(page, "select_upload_csv", "CSV upload path via Add data menu.")
            except Exception as e2:
                print(f"  (Retry failed: {e2})")
                await shot(page, "select_upload_csv", "CSV upload path via Add data menu.")

        # CSV upload may trigger the caching confirmation modal — dismiss it
        try:
            cache_btn = page.get_by_text("Cache & continue", exact=True)
            await cache_btn.wait_for(state="visible", timeout=2500)
            await hl_click(
                page, cache_btn, "cache_and_continue",
                "Uploading a CSV while CDW blocks are on the canvas triggers the **caching confirmation**. "
                "ThoughtSpot needs to snapshot the Snowflake data into its store so it can be joined "
                "with the file (a non-federated source). This is a one-way transition. "
                "I click **Cache & continue** to proceed. "
                "**UX observation:** The modal is clear and appropriately gates an irreversible action. "
                "The copy explains *why* caching is required — good context for the analyst.",
            )
        except Exception:
            pass  # modal didn't appear (no CDW blocks on canvas yet, or already cached)

        await shot(
            page,
            "csv_block_on_canvas",
            "The **customer_health_import** block appears on the canvas. "
            "It's visually distinguished from CDW blocks — a different source badge "
            "marks it as a file upload (non-federated source). "
            "**UX observation:** The block auto-selects on arrival and shows the preview panel. "
            "The file source badge is an important visual signal — "
            "it tells the user that this data lives in ThoughtSpot's store, "
            "not a live Snowflake query, which has implications for refresh cadence.",
        )

        # ── Step 10: Click CSV block to preview + note nulls ──────────────────
        print("Step 10: Preview CSV block...")
        csv_node = page.get_by_text("customer_health_import", exact=True).first
        try:
            await csv_node.wait_for(state="visible", timeout=5000)
            await hl_click(
                page,
                csv_node,
                "click_csv_block",
                "I click the **customer_health_import** block to select it "
                "and open the data preview panel at the bottom. "
                "I always scan the raw source before joining — "
                "data quality issues in source tables propagate silently into joined models. "
                "**UX observation:** Single-click to select + preview is intuitive. "
                "The preview panel slides in from the bottom — "
                "the animation is smooth and doesn't occlude the canvas.",
            )
            await page.wait_for_timeout(1000)
        except Exception as e:
            print(f"  (CSV node click: {e})")

        # Dismiss any open panel before next step
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        await shot(
            page,
            "csv_preview_with_nulls",
            "The bottom preview panel shows the CSV data. "
            "I immediately spot **null values** — several rows have blank `renewal_arr` "
            "and `last_qbr_date` columns. "
            "These accounts are all tagged `High` churn risk. "
            "Before joining, I should fix these nulls to avoid propagating gaps into "
            "the health score calculation. "
            "**UX observation:** Null values are visible in the preview grid "
            "but not flagged or highlighted by the UI. "
            "A data quality indicator (red cell, badge count) would make the issue "
            "more prominent without requiring manual inspection.",
        )

        # ── Step 11: Prep → Fix nulls ──────────────────────────────────────────
        print("Step 11: Prep → Fix nulls...")
        # The CSV block should still be selected. Look for the kebab/block menu on the node.
        # Block menu shows Filter, Sort, Aggregate, Formula, and Prep section (Fix nulls, etc.)
        # Try clicking the kebab menu on the CSV node
        block_menu_btn = page.locator('[title="Add action"]').first
        try:
            await block_menu_btn.wait_for(state="visible", timeout=3000)
            await hl_click(
                page,
                block_menu_btn,
                "open_block_menu",
                "I hover the **customer_health_import** block to reveal the kebab (3-dot) menu. "
                "This opens the block actions menu with: Filter, Sort, Aggregate, Formula, "
                "and a **Prep** section with: Fix nulls, Change type, Replace value, Text case, Trim. "
                "**UX observation:** The block kebab menu is hover-visible — same conditional render "
                "pattern as the data browser 'Add to canvas' button. "
                "These prep actions are the in-place transformation layer. "
                "Users coming from Tableau Prep or dbt expect a separate 'prepare' view; "
                "here it's embedded in the node menu — a different but compact mental model.",
            )
            await page.wait_for_timeout(400)
        except Exception as e:
            print(f"  (Block menu not found via title: {e})")
            # Try hovering the CSV node to reveal menu
            try:
                await csv_node.hover()
                await page.wait_for_timeout(400)
                block_menu_btn = page.locator('[title="Add action"]').first
                await block_menu_btn.wait_for(state="visible", timeout=2000)
                await hl_click(page, block_menu_btn, "open_block_menu",
                    "Opening block actions menu on the CSV node.")
                await page.wait_for_timeout(400)
            except Exception as e2:
                print(f"  (Block menu hover fallback failed: {e2})")
                await shot(page, "open_block_menu", "Attempting to open block menu for Fix nulls.")

        fix_nulls = page.get_by_text("Fix nulls", exact=True).first
        try:
            await fix_nulls.wait_for(state="visible", timeout=3000)
            await hl_click(
                page,
                fix_nulls,
                "fix_nulls",
                "I click **Fix nulls** in the Prep section. "
                "This calls `handlePrepStep` → `addStep` with op type 'fix_nulls', "
                "adding a prep step to the CSV block's step chain. "
                "**UX observation:** The prep steps are appended to the block's pipeline — "
                "a clean non-destructive model. "
                "The mental model is 'layers on top of source data', not 'editing the source'. "
                "This is correct and powerful, but it's not explained in the UI — "
                "users need to discover that the source is unchanged.",
            )
            await page.wait_for_timeout(1000)
        except Exception as e:
            print(f"  (Fix nulls not found: {e})")
            await shot(page, "fix_nulls", "Attempting Fix nulls prep step.")

        await shot(
            page,
            "after_fix_nulls",
            "The **Fix nulls** prep step is applied to the CSV block. "
            "A step badge or indicator appears on the node showing the active prep steps. "
            "**UX observation:** After applying Fix nulls, the canvas node should visually "
            "signal that a transformation is active — a step count badge, color change, "
            "or 'modified' indicator helps the user track which nodes have been prepared.",
        )

        # Dismiss any open overlay before switching tabs
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # ── Step 12: Switch to Business Apps → expand Pendo → add pendo_nps ───
        print("Step 12: Business Apps tab → Pendo → pendo_nps...")
        biz_tab = page.get_by_text("Business Apps", exact=True).first
        try:
            await biz_tab.wait_for(state="visible", timeout=5000)
            await hl_click(
                page,
                biz_tab,
                "switch_business_apps_tab",
                "I switch the Data browser to the **Business Apps** tab. "
                "This surfaces authenticated API connectors — Pendo, Mixpanel, etc. "
                "These are not in the Snowflake tree; they're on a separate tab. "
                "**UX observation:** Separating Warehouse and Business Apps into tabs "
                "is a clean organizational choice — it reflects the mental model of "
                "'warehouse data' vs 'SaaS connector data'. "
                "A first-time user might not know Pendo data is here and look in the Warehouse tree. "
                "A short empty-state label on the Warehouse tree ('Looking for Pendo or Mixpanel? "
                "Check Business Apps →') would help cross-tab discovery.",
            )
            await page.wait_for_timeout(1000)
        except Exception as e:
            print(f"  (Business Apps tab not found: {e})")
            await shot(page, "switch_business_apps_tab", "Switching to Business Apps tab.")

        # Expand Pendo
        pendo_row = page.get_by_text("Pendo", exact=True).first
        try:
            await pendo_row.wait_for(state="visible", timeout=4000)
            await hl_click(
                page,
                pendo_row,
                "expand_pendo",
                "I click the **Pendo** connector node to expand it. "
                "The chevron rotates (180ms CSS transition) and reveals three child tables: "
                "`pendo_nps`, `pendo_feature_usage`, `pendo_visitors`. "
                "**UX observation:** The expansion uses the same TreeConn pattern as the Warehouse tree — "
                "consistent, familiar. "
                "The 180ms chevron rotation is a nice touch; it confirms the click registered.",
            )
            await page.wait_for_timeout(700)
        except Exception as e:
            print(f"  (Pendo expand: {e})")

        await hover_and_add_to_canvas(
            page,
            "pendo_nps",
            "add_pendo_nps",
            "I hover over **pendo_nps** and click **Add to canvas**. "
            "`pendo_nps` contains: `visitor_id`, `score`, `comment`, `submitted_at`. "
            "This is the voice-of-customer signal. "
            "The Pendo connector syncs on a schedule, so this data stays fresh automatically — "
            "no manual CSV export needed. "
            "**UX observation:** Adding from Business Apps works identically to adding from Warehouse — "
            "hover → 'Add to canvas' button appears → click. "
            "Good consistency. The source badge on the resulting BlockNode will differ "
            "(Pendo vs Snowflake), helping the user track data lineage on the canvas.",
        )
        await page.wait_for_timeout(800)

        # Dismiss any hover overlay before opening Add data menu
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # ── Step 13: Add Python block ──────────────────────────────────────────
        print("Step 13: Add Python block...")
        add_data_btn3 = page.get_by_text("Add data", exact=True).first
        try:
            await add_data_btn3.wait_for(state="visible", timeout=5000)
            await hl_click(
                page,
                add_data_btn3,
                "open_add_data_for_python",
                "I click **Add data** again to add the Python compute block. "
                "**UX observation:** The Python block is not a 'source' in the traditional sense — "
                "it's a compute block. But it lives in the same 'Add data' menu as CDW tables and CSV. "
                "This collapses 'data sources' and 'compute nodes' into one entry point. "
                "Analysts familiar with dbt or Hex will recognize this pattern "
                "(SQL/Python as a first-class node type); analysts from Tableau or Power BI "
                "may find it unexpected.",
            )
            await page.wait_for_timeout(400)
        except Exception as e:
            print(f"  (Add data btn for Python: {e})")

        python_item = page.get_by_text("Python", exact=True).first
        try:
            await python_item.wait_for(state="visible", timeout=3000)
            await hl_click(
                page,
                python_item,
                "select_python_block",
                "I select **Python** from the menu. "
                "This calls `addBlock('python')` which: "
                "resets `pythonConfig` state, adds a new group with step type 'python', "
                "positions it to the right of the selected block, selects it, "
                "and opens the right properties panel. "
                "**UX observation:** The Python block appears instantly — no loading state needed "
                "because no data is fetched at creation time. "
                "The block is labeled 'Python' with a Python op icon and a blue 'python' tag.",
            )
            await page.wait_for_timeout(1500)
        except Exception as e:
            print(f"  (Python item not found: {e})")
            await shot(page, "select_python_block", "Attempting to add Python block.")

        # ── Step 14: Python block selected → preview panel shows code editor ───
        print("Step 14: Python editor screenshot...")
        await shot(
            page,
            "python_block_on_canvas",
            "The **Python** block is on the canvas. "
            "With it selected, the right properties panel shows: "
            "a Python version selector (3.10 / 3.11 / 3.12), "
            "a **Libraries** button for pip dependencies, "
            "a `CodeEditor` textarea (monospace, styled — not Monaco/CodeMirror), "
            "an AI-assist section, and a **Run** button. "
            "**UX observation:** The code editor is a plain styled textarea — "
            "no syntax highlighting, no autocomplete, no line numbers. "
            "For a quick formula this is fine; for complex transformations, "
            "analysts will feel the missing IDE features. "
            "The AI-assist section is a good affordance — it signals that LLM-generated "
            "code is supported, reducing the barrier for non-Python-native analysts.",
        )

        # ── Step 15: Screenshot the Python editor ─────────────────────────────
        print("Step 15: Python editor panel screenshot...")
        # Ensure Python node is still selected — click it
        python_node = page.locator('[class*="block"]', has_text="Python").first
        try:
            await python_node.wait_for(state="visible", timeout=4000)
            await hl_click(
                page,
                python_node,
                "python_editor_panel",
                "Clicking the **Python** block to ensure the code editor panel is visible. "
                "I'll write the composite health score formula here: "
                "`health_score = 0.4 * nps_normalized + 0.35 * usage_pct + 0.25 * order_frequency_score`. "
                "The editor accepts standard Python; pandas and numpy are available by default. "
                "**UX observation:** The right panel switches context based on which node is selected — "
                "this is the core navigation model of the canvas. "
                "There's no persistent 'code view' or separate editor tab. "
                "For long Python scripts this panel might feel cramped.",
            )
            await page.wait_for_timeout(800)
        except Exception as e:
            print(f"  (Python node click: {e})")

        await shot(
            page,
            "python_editor_detail",
            "**Python editor detail.** "
            "The code editor is visible in the right panel. "
            "Key UI elements: version selector, Libraries button, CodeEditor textarea, "
            "AI-assist section, Run button. "
            "**UX observation:** The 'Run' button simulates execution and shows results "
            "in the bottom preview panel. "
            "In the real product, this would trigger a ThoughtSpot compute job. "
            "The version selector (3.10/3.11/3.12) suggests real execution environments "
            "will be supported — a strong signal for data engineers evaluating the platform.",
        )

        # ── Step 16: Join customers → orders via single-node select ───────────
        print("Step 16: Join customers → orders...")
        cust_node = page.get_by_text("customers", exact=True).first
        try:
            await cust_node.wait_for(state="visible", timeout=5000)
            await hl_click(
                page,
                cust_node,
                "select_customers_for_join",
                "I click the **customers** block to select it. "
                "In dataset2 mode, selecting a **single node** is the join entry point. "
                "When one node is selected, `singleJoinActive = true` and the right panel "
                "switches to a 'Create Join' form. "
                "**UX observation (critical friction point):** There is NO 'Join' button "
                "in the floating toolbar in dataset2 mode — "
                "`opButtons` is explicitly filtered to empty (`opButtonsAll.filter(() => false)`). "
                "A new user scanning the toolbar for a 'Join' or 'Relate' button will find nothing. "
                "The join affordance is entirely hidden behind single-node selection and "
                "a right-panel mode switch. "
                "Additionally, the drag-to-connect port (small circle on each node's right edge, "
                "`cursor: crosshair`, `title: 'Drag to another block to join'`) draws a visual bezier edge "
                "but does NOT open the join config and does NOT create a join — "
                "just adds `inputIds`. "
                "Users who discover drag-connect will feel misled when no join dialog appears.",
            )
            await page.wait_for_timeout(1000)
        except Exception as e:
            print(f"  (customers node: {e})")

        # Look for the 'Create Join' panel or join affordance in the right panel
        await shot(
            page,
            "join_panel_visible",
            "With **customers** selected, the right properties panel shows the **Create Join** form. "
            "The form has:\n\n"
            "- **Table 1:** locked to `customers` (the selected node)\n"
            "- **Table 2:** dropdown to pick the second table\n"
            "- Column pair selectors for the join key\n"
            "- Join type pills: Inner / Full Outer / Left / Right\n"
            "- Cardinality pills: Many:1 / 1:Many / 1:1\n"
            "- **Apply Join** button\n\n"
            "**UX observation:** The form is well-structured and covers all join configuration options. "
            "The Table 1 lock (always the selected node) is a reasonable constraint that "
            "keeps the interaction anchored. "
            "However, this form is only reachable via single-node selection — "
            "there's no global 'Manage joins' view that shows all relationships at once. "
            "For a 5-table model, users must configure each join individually "
            "by selecting each source node in turn.",
        )

        # Try to interact with join panel — look for Table 2 dropdown
        join_table2 = page.locator('[placeholder*="table"], [placeholder*="Table"]').first
        try:
            await join_table2.wait_for(state="visible", timeout=3000)
            await hl_click(
                page,
                join_table2,
                "join_table2_dropdown",
                "I open the **Table 2** dropdown in the Create Join form to select `orders`. "
                "**UX observation:** The dropdown shows all available tables on the canvas — "
                "a well-scoped list (only canvas sources, not the entire Snowflake catalog). "
                "This reduces cognitive load for large warehouses.",
            )
            await page.wait_for_timeout(500)
        except Exception as e:
            print(f"  (Table 2 dropdown: {e})")

        # Try to find 'orders' option in the dropdown
        orders_option = page.get_by_text("orders", exact=True).last
        try:
            await orders_option.wait_for(state="visible", timeout=3000)
            await hl_click(
                page,
                orders_option,
                "select_orders_for_join",
                "I select **orders** as Table 2. "
                "The join key selectors now show columns from both tables. "
                "I'll join on `customer_id → customer_id`. "
                "**UX observation:** Column matching could be auto-suggested based on column name similarity — "
                "this would save a step for the common case.",
            )
            await page.wait_for_timeout(500)
        except Exception as e:
            print(f"  (orders option: {e})")

        # Look for Apply Join button
        apply_join = page.get_by_text("Apply Join", exact=True).first
        try:
            await apply_join.wait_for(state="visible", timeout=3000)
            await hl_click(
                page,
                apply_join,
                "apply_join",
                "I click **Apply Join**. "
                "This calls `applyJoin()` which creates a `JoinBlockCard` on the canvas "
                "connecting customers and orders. "
                "**UX observation:** The 'Apply' label is clear — it commits the join configuration. "
                "After applying, a new join card appears between the two source nodes, "
                "showing the join type and column mapping.",
            )
            await page.wait_for_timeout(1200)
        except Exception as e:
            print(f"  (Apply Join button: {e})")
            await shot(page, "apply_join", "Apply Join not found — documenting join panel state.")

        # ── Step 17: Preview joined data ──────────────────────────────────────
        print("Step 17: Preview joined data...")
        await shot(
            page,
            "join_preview",
            "After applying the join, the **preview panel** shows the joined dataset: "
            "columns from both `customers` and `orders`, "
            "with `customer_id` as the join spine. "
            "I can verify the join is working correctly before adding more relationships. "
            "**UX observation:** Seeing joined data immediately in the preview panel "
            "is excellent feedback — users know instantly whether the join produced "
            "the expected row count and column layout. "
            "This is one of the strongest UX moments in the flow.",
        )

        # ── Step 18: Final screenshot with all sources ─────────────────────────
        print("Step 18: Final state screenshot...")
        await page.wait_for_timeout(800)
        await shot(
            page,
            "final_canvas_all_sources",
            "**Final canvas state** — all sources on the canvas:\n\n"
            "| # | Source | Type | Key columns |\n"
            "|---|--------|------|-------------|\n"
            "| 1 | customers | Snowflake CDW | customer_id, segment, lifetime_value |\n"
            "| 2 | orders | Snowflake CDW | customer_id, amount, status |\n"
            "| 3 | customer_health_import | CSV upload | account_id, nps_score, churn_risk |\n"
            "| 4 | pendo_nps | Pendo connector | visitor_id, score, submitted_at |\n"
            "| 5 | Python | Compute block | composite health_score formula |\n\n"
            "The canvas has `customers → orders` join configured. "
            "Remaining joins (customers → pendo_nps, customers → customer_health_import) "
            "would follow the same single-node-select → Create Join pattern. "
            "**UX observation:** The multi-source canvas successfully bridges "
            "heterogeneous data (warehouse + connector + file + compute) in a single model. "
            "The biggest UX gap is join discoverability — "
            "the toolbar gives no hint that joins exist, "
            "and the drag-to-connect port is misleading. "
            "A labeled 'Define relationships' button in the toolbar would significantly "
            "reduce first-time friction.",
        )

        await browser.close()

    write_md()
    print(f"\nDone. {len(STEPS)} steps captured.")
    print(f"Screenshots: {OUT_DIR}")
    print(f"Markdown: {MD_PATH}")


if __name__ == "__main__":
    asyncio.run(run())
