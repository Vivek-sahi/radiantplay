// @ts-nocheck
export function initDME() {
  const welcomeVariant = window.__DME_CONFIG__?.welcomeVariant ?? 'blank';

  const TAB_ORDER = ['tables','columns','formulas','filters','parameters','settings'];
  let activeTab = 'tables';

  const _listenerAbort = new AbortController();
  const { signal } = _listenerAbort;
  const _placeholderHandles = new Map();

  function switchTab(newTab) {
    if (newTab === activeTab) return;

    const goingRight = TAB_ORDER.indexOf(newTab) > TAB_ORDER.indexOf(activeTab);
    const enterClass = goingRight ? 'slide-from-right' : 'slide-from-left';

    document.querySelectorAll('.tab-pill').forEach(p => p.classList.remove('active'));
    document.querySelector(`[data-tab="${newTab}"]`).classList.add('active');

    const leftPane = document.getElementById('left-pane');
    if (newTab === 'tables' || newTab === 'columns') {
      const hasTables = window._modelState.addedTables.length > 0;
      if (newTab === 'columns' && !hasTables) {
        leftPane.classList.add('pane-hidden');
      } else {
        leftPane.classList.remove('pane-hidden');
      }
      document.getElementById('pane-tables-section').style.display = newTab === 'tables' ? 'flex' : 'none';
      document.getElementById('pane-columns-section').style.display = (newTab === 'columns' && hasTables) ? 'flex' : 'none';
      if (newTab === 'columns') { rebuildColumnPane(); rebuildColumnsContent(); }
    } else if (newTab === 'formulas') {
      leftPane.classList.add('pane-hidden');
      rebuildFormulasContent();
    } else {
      leftPane.classList.add('pane-hidden');
    }

    document.getElementById('actions-tables').style.display = newTab === 'tables' ? 'flex' : 'none';

    document.querySelectorAll('.tab-content').forEach(c => {
      c.style.display = 'none';
      c.classList.remove('slide-from-right', 'slide-from-left');
    });

    const incoming = document.getElementById('content-' + newTab);
    if (incoming) {
      incoming.style.display = 'flex';
      incoming.getBoundingClientRect();
      incoming.classList.add(enterClass);
      incoming.addEventListener('animationend', () => {
        incoming.classList.remove(enterClass);
      }, { once: true });
    }

    const toolbar = document.getElementById('formulas-toolbar');
    toolbar.classList.remove('fade-in');
    if (newTab === 'formulas') {
      toolbar.style.display = 'block';
      toolbar.getBoundingClientRect();
      toolbar.classList.add('fade-in');
    } else {
      toolbar.style.display = 'none';
    }

    activeTab = newTab;
  }

  document.querySelectorAll('.tab-pill').forEach(pill => {
    pill.addEventListener('click', () => switchTab(pill.dataset.tab), { signal });
  });

  const spotterModelEnabled = (window.__DME_CONFIG__?.spotterModel ?? true) !== false;

  // Auto-focus on load — target depends on variant
  if (spotterModelEnabled) {
    const focusId = welcomeVariant === 'blank' ? 'welcome-textarea' : 'chat-textarea';
    document.getElementById(focusId)?.focus();
  }

  // ── Datasource schema ─────────────────────────────
  const DATASOURCE_TABLES = [
    { name: 'fact_customer', columns: ['customer_id', 'first_name', 'last_name', 'email', 'phone', 'region', 'segment', 'acquisition_date', 'lifetime_value'] },
    { name: 'fact_new_retail_sales', columns: ['sale_id', 'customer_id', 'product_id', 'store_id', 'sale_date', 'quantity', 'unit_price', 'discount', 'net_amount'] },
    { name: 'fact_sales', columns: ['sale_id', 'customer_id', 'product_id', 'sale_date', 'amount', 'quantity_sold', 'salesperson_id', 'channel'] },
    { name: 'dim_store', columns: ['store_id', 'store_name', 'city', 'state', 'region_id', 'open_date', 'sq_footage', 'manager_id'] },
    { name: 'dim_product', columns: ['product_id', 'product_name', 'category', 'sub_category', 'brand', 'unit_price', 'cost', 'sku'] },
    { name: 'fact_region', columns: ['region_id', 'region_name', 'country', 'zone', 'timezone', 'manager_id'] },
    { name: 'fact_inventory', columns: ['inventory_id', 'product_id', 'store_id', 'quantity_on_hand', 'reorder_level', 'last_updated', 'unit_cost'] },
    { name: 'dim_shipping_method', columns: ['shipping_id', 'method_name', 'carrier', 'avg_days', 'cost_per_unit', 'tracking_available'] },
    { name: 'dim_feedback', columns: ['feedback_id', 'customer_id', 'rating', 'comment', 'feedback_date', 'product_id', 'channel'] },
    { name: 'dim_date', columns: ['date_id', 'full_date', 'day', 'month', 'quarter', 'year', 'week_of_year', 'is_weekend', 'is_holiday'] },
    { name: 'fact_sales_pipeline', columns: ['opportunity_id', 'customer_id', 'stage', 'deal_value', 'close_date', 'salesperson_id', 'win_probability'] },
    { name: 'fact_customer_satisfaction', columns: ['csat_id', 'customer_id', 'score', 'survey_date', 'channel', 'product_id', 'nps_score'] },
  ];

  function rebuildColumnPane() {
    const state = window._modelState;
    window._setColumnTreeData?.({
      tables: state.model.tables,
      dataSourceTables: DATASOURCE_TABLES,
      modelColumns: state.model.columns,
    });
  }

  // ── Tables canvas ─────────────────────────────────
  const MORE_SVG = `<svg width="14" height="4" viewBox="0 0 14 4" fill="none"><circle cx="2" cy="2" r="1.5" fill="#1D232F"/><circle cx="7" cy="2" r="1.5" fill="#1D232F"/><circle cx="12" cy="2" r="1.5" fill="#1D232F"/></svg>`;

  function orderTablesForDisplay(tables, joins) {
    if (!tables.length) return [];
    const connected = new Set();
    joins.forEach(j => {
      if (j.leftTable && j.rightTable) {
        connected.add(`${j.leftTable}|${j.rightTable}`);
        connected.add(`${j.rightTable}|${j.leftTable}`);
      }
    });
    const scoreOrder = (order) => {
      let s = 0;
      for (let i = 0; i < order.length - 1; i++)
        if (connected.has(`${order[i].name}|${order[i+1].name}`)) s++;
      return s;
    };
    if (tables.length <= 7) {
      let best = tables, bestScore = scoreOrder(tables);
      const permute = (arr, cur) => {
        if (cur.length === arr.length) {
          const s = scoreOrder(cur);
          if (s > bestScore) { bestScore = s; best = [...cur]; }
          return;
        }
        for (let i = 0; i < arr.length; i++)
          if (!cur.includes(arr[i])) permute(arr, [...cur, arr[i]]);
      };
      permute(tables, []);
      return best;
    }
    const adj = {};
    tables.forEach(t => { adj[t.name] = []; });
    joins.forEach(j => {
      if (adj[j.leftTable] && !adj[j.leftTable].includes(j.rightTable)) adj[j.leftTable].push(j.rightTable);
      if (adj[j.rightTable] && !adj[j.rightTable].includes(j.leftTable)) adj[j.rightTable].push(j.leftTable);
    });
    const degrees = Object.keys(adj).map(n => ({ n, d: adj[n].length }));
    const endNode = degrees.find(x => x.d === 1);
    let current = endNode ? endNode.n : tables[0].name;
    const visited = new Set(); const path = [];
    while (current && !visited.has(current)) {
      visited.add(current); path.push(current);
      current = (adj[current] || []).find(n => !visited.has(n));
    }
    tables.forEach(t => { if (!visited.has(t.name)) path.push(t.name); });
    return path.map(name => tables.find(t => t.name === name)).filter(Boolean);
  }

  function makeDraggable(card, canvasEl) {
    let dragging = false, startX, startY, startLeft, startTop;
    card.addEventListener('mousedown', e => {
      if (e.target.closest('.mvp-card-menu')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      startLeft = parseInt(card.style.left) || 0;
      startTop = parseInt(card.style.top) || 0;
      card.classList.add('dragging');
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      card.style.left = (startLeft + e.clientX - startX) + 'px';
      card.style.top = (startTop + e.clientY - startY) + 'px';
      drawJoinLines(canvasEl, window._modelState.model.joins);
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('dragging');
      const tableName = card.dataset.table;
      if (tableName) {
        window._modelState.tablePositions[tableName] = {
          x: parseInt(card.style.left) || 0,
          y: parseInt(card.style.top)  || 0,
        };
      }
    });
  }

  function drawJoinLines(canvasEl, joins) {
    canvasEl.querySelectorAll('.join-lines-svg, .join-badge-overlay').forEach(el => el.remove());
    if (!joins || !joins.length) return;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('join-lines-svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:0;';

    function cardEdges(card) {
      const l = card.offsetLeft, t = card.offsetTop;
      const w = card.offsetWidth, h = card.offsetHeight;
      return {
        left:   { x: l,         y: t + h / 2 },
        right:  { x: l + w,     y: t + h / 2 },
        top:    { x: l + w / 2, y: t         },
        bottom: { x: l + w / 2, y: t + h     },
      };
    }

    function pickEdges(cardA, cardB) {
      const la = cardA.offsetLeft, ra = la + cardA.offsetWidth;
      const lb = cardB.offsetLeft, rb = lb + cardB.offsetWidth;
      const ta = cardA.offsetTop,  ba = ta + cardA.offsetHeight;
      const tb = cardB.offsetTop,  bb = tb + cardB.offsetHeight;
      if (lb >= ra - 8) return { edgeA: 'right',  edgeB: 'left'   };
      if (la >= rb - 8) return { edgeA: 'left',   edgeB: 'right'  };
      if (tb >= ba - 8) return { edgeA: 'bottom', edgeB: 'top'    };
      if (ta >= bb - 8) return { edgeA: 'top',    edgeB: 'bottom' };
      const dx = (lb + cardB.offsetWidth  / 2) - (la + cardA.offsetWidth  / 2);
      const dy = (tb + cardB.offsetHeight / 2) - (ta + cardA.offsetHeight / 2);
      if (Math.abs(dx) >= Math.abs(dy))
        return dx >= 0 ? { edgeA: 'right', edgeB: 'left'  } : { edgeA: 'left',  edgeB: 'right'  };
      return dy >= 0   ? { edgeA: 'bottom', edgeB: 'top' } : { edgeA: 'top',   edgeB: 'bottom' };
    }

    function elbowPath(p1, edge1, offset1, p2, edge2, offset2) {
      const isHoriz1 = edge1 === 'left' || edge1 === 'right';
      const isHoriz2 = edge2 === 'left' || edge2 === 'right';
      const sx = p1.x + (isHoriz1 ? 0 : offset1);
      const sy = p1.y + (isHoriz1 ? offset1 : 0);
      const ex = p2.x + (isHoriz2 ? 0 : offset2);
      const ey = p2.y + (isHoriz2 ? offset2 : 0);

      const isHoriz = isHoriz1;
      let d, seg1, seg2, seg3, midX, midY;
      if (isHoriz) {
        const bx = (sx + ex) / 2;
        seg1 = Math.abs(bx - sx);
        seg2 = Math.abs(ey - sy);
        seg3 = Math.abs(ex - bx);
        d = `M ${sx} ${sy} L ${bx} ${sy} L ${bx} ${ey} L ${ex} ${ey}`;
        const half = (seg1 + seg2 + seg3) / 2;
        if (half <= seg1) {
          midX = sx + (seg1 ? (half / seg1) * (bx - sx) : 0); midY = sy;
        } else if (half <= seg1 + seg2) {
          const t = (half - seg1) / (seg2 || 1);
          midX = bx; midY = sy + t * (ey - sy);
        } else {
          const t = (half - seg1 - seg2) / (seg3 || 1);
          midX = bx + t * (ex - bx); midY = ey;
        }
      } else {
        const by = (sy + ey) / 2;
        seg1 = Math.abs(by - sy);
        seg2 = Math.abs(ex - sx);
        seg3 = Math.abs(ey - by);
        d = `M ${sx} ${sy} L ${sx} ${by} L ${ex} ${by} L ${ex} ${ey}`;
        const half = (seg1 + seg2 + seg3) / 2;
        if (half <= seg1) {
          midX = sx; midY = sy + (seg1 ? (half / seg1) * (by - sy) : 0);
        } else if (half <= seg1 + seg2) {
          const t = (half - seg1) / (seg2 || 1);
          midX = sx + t * (ex - sx); midY = by;
        } else {
          const t = (half - seg1 - seg2) / (seg3 || 1);
          midX = ex; midY = by + t * (ey - by);
        }
      }
      return { d, midX, midY };
    }

    const resolved = [];
    joins.forEach(j => {
      if (!j.leftTable || !j.rightTable) return;
      const cardA = canvasEl.querySelector(`[data-table="${CSS.escape(j.leftTable)}"]`);
      const cardB = canvasEl.querySelector(`[data-table="${CSS.escape(j.rightTable)}"]`);
      if (!cardA || !cardB) return;
      const { edgeA, edgeB } = pickEdges(cardA, cardB);
      resolved.push({ j, cardA, cardB, edgeA, edgeB });
    });

    const edgeSlots = new Map();
    resolved.forEach(entry => {
      const keyA = `${entry.j.leftTable}:${entry.edgeA}`;
      if (!edgeSlots.has(keyA)) edgeSlots.set(keyA, []);
      edgeSlots.get(keyA).push(entry);

      const keyB = `${entry.j.rightTable}:${entry.edgeB}`;
      if (!edgeSlots.has(keyB)) edgeSlots.set(keyB, []);
      edgeSlots.get(keyB).push(entry);
    });

    const OFFSET_STEP = 12;
    const badgeData = [];

    resolved.forEach(({ j, cardA, cardB, edgeA, edgeB }) => {
      const edgesA = cardEdges(cardA), edgesB = cardEdges(cardB);

      const slotA  = edgeSlots.get(`${j.leftTable}:${edgeA}`)  || [];
      const idxA   = slotA.findIndex(e => e.j === j);
      const offset1 = (idxA - (slotA.length - 1) / 2) * OFFSET_STEP;

      const slotB  = edgeSlots.get(`${j.rightTable}:${edgeB}`) || [];
      const idxB   = slotB.findIndex(e => e.j === j);
      const offset2 = (idxB - (slotB.length - 1) / 2) * OFFSET_STEP;

      const { d, midX, midY } = elbowPath(edgesA[edgeA], edgeA, offset1, edgesB[edgeB], edgeB, offset2);

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', '#1D232F');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
      badgeData.push({ badgeX: Math.round(midX - 16), badgeY: Math.round(midY - 7) });
    });

    canvasEl.appendChild(svg);
    badgeData.forEach(({ badgeX, badgeY }) => {
      const badge = document.createElement('div');
      badge.className = 'join-badge-overlay';
      badge.style.cssText = `position:absolute;left:${badgeX}px;top:${badgeY}px;z-index:1;pointer-events:none;`;
      badge.innerHTML = `<img src="/spotter-assets/Join UI.svg" width="32" height="14" alt="join"/>`;
      canvasEl.appendChild(badge);
    });
  }

  const CARD_W        = 220;
  const CARD_H        = 100;
  const CARD_COL_GAP  = 280;
  const CARD_ROW_GAP  = 180;
  const CARD_ORIGIN_X = 40;
  const CARD_ORIGIN_Y = 40;

  function findEmptySlot(tablePositions) {
    const PADDING = 16;
    const saved = Object.values(tablePositions);
    for (let row = 0; row < 100; row++) {
      for (let col = 0; col < 2; col++) {
        const cx = col * CARD_COL_GAP + CARD_ORIGIN_X;
        const cy = row * CARD_ROW_GAP + CARD_ORIGIN_Y;
        const overlaps = saved.some(p =>
          Math.abs(p.x - cx) < (CARD_W + PADDING) &&
          Math.abs(p.y - cy) < (CARD_H + PADDING)
        );
        if (!overlaps) return { x: cx, y: cy };
      }
    }
    const maxY = saved.reduce((m, p) => Math.max(m, p.y), 0);
    return { x: CARD_ORIGIN_X, y: maxY + CARD_ROW_GAP };
  }

  function rebuildTablesCanvas() {
    const state = window._modelState;
    const tables = state.model.tables;
    if (!tables.length) {
      window._setTableCanvasData?.({ tables: [], joins: [] });
      return;
    }
    const orderedTables = orderTablesForDisplay(tables, state.model.joins);
    const tableData = orderedTables.map(t => {
      const saved = state.tablePositions[t.name];
      let x, y;
      if (saved) {
        x = saved.x; y = saved.y;
      } else {
        const slot = findEmptySlot(state.tablePositions);
        x = slot.x; y = slot.y;
        state.tablePositions[t.name] = { x, y };
      }
      const ds = DATASOURCE_TABLES.find(d => d.name.toLowerCase() === t.name.toLowerCase());
      const total = ds ? ds.columns.length : 0;
      const addedGroup = state.model.columns.find(g => g.table === t.name);
      const added = addedGroup ? addedGroup.columns.length : 0;
      return { name: t.name, x, y, totalColumns: total, addedColumns: added };
    });
    window._setTableCanvasData?.({ tables: tableData, joins: state.model.joins });
  }

  window._handleTableDrag = function(name, x, y) {
    window._modelState.tablePositions[name] = { x, y };
  };

  // ── Columns tab ───────────────────────────────────
  function rebuildColumnsContent() {
    const state = window._modelState;
    const emptyEl = document.getElementById('columns-empty-state');
    const contentEl = document.getElementById('content-columns');
    if (!emptyEl) return;
    const addedColumnGroups = state.model.columns;
    const hasColumns = addedColumnGroups.some(g => g.columns && g.columns.length > 0);
    if (!hasColumns) {
      emptyEl.style.display = '';
      if (contentEl) { contentEl.style.alignItems = ''; contentEl.style.justifyContent = ''; }
      window._setColumnRows?.([]);
      const hasTables = state.addedTables.length > 0;
      const colsTabActive = document.querySelector('[data-tab="columns"]')?.classList.contains('active');
      if (colsTabActive) {
        const leftPane = document.getElementById('left-pane');
        if (leftPane) {
          if (hasTables) {
            leftPane.classList.remove('pane-hidden');
            const colSection = document.getElementById('pane-columns-section');
            if (colSection) colSection.style.display = 'flex';
          } else {
            leftPane.classList.add('pane-hidden');
          }
        }
      }
      if (hasTables) {
        emptyEl.innerHTML = `
          <img src="/spotter-assets/empty states/empty state icon when tables are added.svg" width="32" height="32" alt="columns icon"/>
          <div class="empty-body">
            <div class="empty-title">Identify the right columns</div>
            <div class="empty-desc">Let SpotterModel suggest the most relevant columns for your data model</div>
          </div>
          <div class="suggestion-row">
            <a class="suggestion-link" href="#" onclick="startChat('Add columns'); event.preventDefault();">
              <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon"/>
              Get column suggestions
            </a>
            <img class="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow"/>
          </div>
          <hr class="empty-divider"/>
          <div class="empty-secondary">Or drag and drop from the left pane</div>`;
      } else {
        emptyEl.innerHTML = `
          <img src="/spotter-assets/Table=l.svg" width="32" height="32" alt="table icon"/>
          <div class="empty-body">
            <div class="empty-title">Build your foundation first</div>
            <div class="empty-desc">Add tables so SpotterModel can recommend the right columns for you</div>
          </div>
          <div class="suggestion-row">
            <a class="suggestion-link" href="#" onclick="startChat('Suggest tables'); event.preventDefault();">
              <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon"/>
              Get table suggestions
            </a>
            <img class="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow"/>
          </div>`;
      }
      return;
    }
    emptyEl.style.display = 'none';
    if (contentEl) { contentEl.style.alignItems = 'stretch'; contentEl.style.justifyContent = 'flex-start'; }

    const rows = [];
    addedColumnGroups.forEach(g => {
      (g.columns || []).forEach(c => {
        rows.push({ col: c, table: g.table, desc: getColDesc(c, g.table), aiCtx: getColAIContext(c, g.table) });
      });
    });
    window._setColumnRows?.(rows);
  }

  // ── Formulas tab — edit's version is superset (handles toolbar) ──
  function rebuildFormulasContent() {
    const state = window._modelState;
    const emptyEl = document.getElementById('formulas-empty-state');
    const contentEl = document.getElementById('content-formulas');
    const toolbar = document.getElementById('formulas-toolbar');
    if (!emptyEl) return;
    const formulas = state.model.formulas;
    if (!formulas.length) {
      emptyEl.style.display = '';
      window._setFormulaRows?.([]);
      if (contentEl) { contentEl.style.alignItems = ''; contentEl.style.justifyContent = ''; }
      if (toolbar) { toolbar.innerHTML = '<button class="formula-add-btn" style="pointer-events:none;opacity:0.45;">Add formula</button>'; }
      const hasTables = state.addedTables.length > 0;
      const hasColumns = state.model.columns.some(g => g.columns && g.columns.length > 0);
      if (hasTables && hasColumns) {
        emptyEl.innerHTML = `
          <img src="/spotter-assets/empty states/empty state icon when tables and columns are added.svg" width="32" height="32" alt="formula icon"/>
          <div class="empty-body">
            <div class="empty-title">Logic over syntax</div>
            <div class="empty-desc">Tell SpotterModel what you need and it will build the formulas for you</div>
          </div>
          <div class="suggestion-row">
            <a class="suggestion-link" href="#" onclick="startChat('Generate formulas'); event.preventDefault();">
              <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon"/>
              Describe your formula
            </a>
            <img class="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow"/>
          </div>
          <hr class="empty-divider"/>
          <div class="empty-secondary">Or add formulas manually</div>`;
      } else if (hasTables) {
        emptyEl.innerHTML = `
          <img src="/spotter-assets/empty states/empty state icon when tables are added.svg" width="32" height="32" alt="columns icon"/>
          <div class="empty-body">
            <div class="empty-title">Select your columns first</div>
            <div class="empty-desc">SpotterModel needs columns to define the logic for your formulas</div>
          </div>
          <div class="suggestion-row">
            <a class="suggestion-link" href="#" onclick="startChat('Add columns'); event.preventDefault();">
              <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon"/>
              Get column suggestions
            </a>
            <img class="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow"/>
          </div>`;
      } else {
        emptyEl.innerHTML = `
          <img src="/spotter-assets/Table=l.svg" width="32" height="32" alt="table icon"/>
          <div class="empty-body">
            <div class="empty-title">Start with a data source</div>
            <div class="empty-desc">Tables and columns are required before SpotterModel can help you build formulas</div>
          </div>
          <div class="suggestion-row">
            <a class="suggestion-link" href="#" onclick="startChat('Suggest tables'); event.preventDefault();">
              <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon"/>
              Get table suggestions
            </a>
            <img class="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow"/>
          </div>`;
      }
      return;
    }
    emptyEl.style.display = 'none';
    if (contentEl) { contentEl.style.alignItems = 'stretch'; contentEl.style.justifyContent = 'flex-start'; }
    if (toolbar) {
      toolbar.innerHTML = '<button class="formula-add-btn" style="pointer-events:none;cursor:default;">Add formula</button>';
    }
    window._setFormulaRows?.(formulas.map(f => ({ name: f.name, type: 'DOUBLE' })));
  }

  // ── Formula 3-dot dropdown ────────────────────────
  let _fgMenuEl = null;
  window.showFgMenu = function(e, formulaName) {
    e.stopPropagation();
    if (_fgMenuEl) { _fgMenuEl.remove(); _fgMenuEl = null; }
    const menu = document.createElement('div');
    menu.className = 'fg-menu-dropdown';
    menu.innerHTML = `
      <div class="fg-menu-item">Edit formula</div>
      <div class="fg-menu-item danger">Delete formula</div>`;
    document.body.appendChild(menu);
    _fgMenuEl = menu;
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    menu.style.left = Math.max(0, rect.right - menu.offsetWidth) + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';
    const close = (ev) => {
      if (!menu.contains(ev.target)) {
        menu.remove(); _fgMenuEl = null;
        document.removeEventListener('click', close, true);
      }
    };
    setTimeout(() => document.addEventListener('click', close, true), 0);
  };

  function getColDesc(col, table) {
    const keyFull = (table ? table + '.' : '') + col;
    if (window._colDescOverrides && window._colDescOverrides[keyFull.toLowerCase()]) return window._colDescOverrides[keyFull.toLowerCase()];
    if (window._colDescOverrides && window._colDescOverrides[col.toLowerCase()]) return window._colDescOverrides[col.toLowerCase()];
    return '';
  }

  function getColAIContext(col, table) {
    const keyFull = (table ? table + '.' : '') + col;
    if (window._colAIContext && window._colAIContext[keyFull.toLowerCase()]) return window._colAIContext[keyFull.toLowerCase()];
    if (window._colAIContext && window._colAIContext[col.toLowerCase()]) return window._colAIContext[col.toLowerCase()];
    return '';
  }

  // ── Chat helpers ──────────────────────────────────
  function addUserBubble(text) {
    const msgId = 'user-' + Date.now();
    window._appendMsg?.({ kind: 'user', id: msgId, text });
    requestAnimationFrame(() => requestAnimationFrame(() => window._scrollMsgs?.()));
  }

  const TC_ICON_STACK = `
    <div class="tc-icon-stack">
      <svg class="tc-ts-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.8795 5H5V6.82982H14.8795V5Z" fill="#1D232F"/>
        <path d="M14.8795 7.43975H11.1257V9.26957H14.8795V7.43975Z" fill="#1D232F"/>
        <path d="M7.39834 7.43975H5V9.26957H7.39834C8.29442 9.26957 9.02484 9.99999 9.02484 10.8961V14.8795H10.8547V10.8961C10.8547 8.99095 9.30346 7.43975 7.39834 7.43975Z" fill="#1D232F"/>
        <path d="M13.0045 11.9277C12.1574 11.9277 11.4684 12.6167 11.4684 13.4639C11.4684 14.311 12.1574 15 13.0045 15C13.8516 15 14.5406 14.311 14.5406 13.4639C14.5406 12.6167 13.8516 11.9277 13.0045 11.9277Z" fill="#1D232F"/>
      </svg>
      <svg class="tc-spinner-svg" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.8889 9.99997C18.8889 14.9092 14.9092 18.8889 9.99998 18.8889C5.09078 18.8889 1.11109 14.9092 1.11109 9.99997C1.11109 5.09077 5.09077 1.11108 9.99997 1.11108" stroke="#2770EF" stroke-width="2.22222" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`;

  function toolcallHTML(id, title, input, output) {
    return `
      <div class="toolcall-card toolcall-loading" id="${id}" onclick="toggleToolcall('${id}')">
        <div class="toolcall-header">
          <div class="toolcall-title-row">
            <div class="toolcall-icon">${TC_ICON_STACK}</div>
            <span class="toolcall-title-text" id="${id}-title">${title}</span>
          </div>
          <svg class="toolcall-expand-btn" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="toolcall-body" id="${id}-body">
          <div class="toolcall-section">
            <span class="toolcall-label">INPUT</span>
            <span class="toolcall-value">${input}</span>
          </div>
          <div class="toolcall-section">
            <span class="toolcall-label">OUTPUT</span>
            <div class="toolcall-output-skeleton"></div>
            <span class="toolcall-output-real toolcall-value">${output}</span>
          </div>
        </div>
      </div>`;
  }

  function toggleToolcall(id) {
    const card = document.getElementById(id);
    if (!card) return;
    card.classList.toggle('expanded');
  }

  function setToolcallDone(id) {
    const card = document.getElementById(id);
    if (!card) return;
    card.classList.remove('toolcall-loading');
    card.classList.add('toolcall-done');
  }

  function setToolcallError(id, errorTitle) {
    const card = document.getElementById(id);
    if (!card) return;
    card.classList.remove('toolcall-loading');
    card.classList.add('toolcall-error');
    if (errorTitle) {
      const titleEl = document.getElementById(id + '-title');
      if (titleEl) titleEl.textContent = errorTitle;
    }
  }

  function stepHTML(dotId, name, text, toolcallId, toolcallTitle, toolcallInput, toolcallOutput) {
    const tc = toolcallId ? toolcallHTML(toolcallId, toolcallTitle, toolcallInput, toolcallOutput) : '';
    return `
      <div class="r-step">
        <div class="r-step-title">
          <span class="step-dot" id="${dotId}"></span>
          <span class="r-step-name">${name}</span>
        </div>
        <div class="r-step-body">
          <div class="r-step-vline"></div>
          <div class="r-step-content">
            <p class="r-step-text">${text}</p>
            ${tc}
          </div>
        </div>
      </div>`;
  }

  let _rbUid = 0;

  // ── Model state — branch on welcomeVariant ────────
  if (welcomeVariant === 'existing') {
    window._modelState = {
      addedTables: ['fact_sales', 'fact_customer', 'dim_product', 'dim_store'],
      addedJoins: ['fact_sales-fact_customer', 'fact_sales-dim_product', 'fact_sales-dim_store'],
      addedColumns: [
        'fact_sales.sale_id','fact_sales.customer_id','fact_sales.product_id',
        'fact_sales.amount','fact_sales.channel','fact_sales.sale_date',
        'fact_customer.customer_id','fact_customer.email','fact_customer.segment','fact_customer.lifetime_value',
        'dim_product.product_id','dim_product.product_name','dim_product.category','dim_product.unit_price',
        'dim_store.store_id','dim_store.store_name','dim_store.region_id',
      ],
      initialContext: 'Retail Sales Analytics model to enable natural language queries on sales, customer, and product data via Spotter AI.',
      hasAskedClarify: false,
      clarifyCount: 0,
      model: {
        tables: [
          { name: 'fact_sales',    desc: 'All sales transactions' },
          { name: 'fact_customer', desc: 'Registered customer accounts' },
          { name: 'dim_product',   desc: 'Product catalog with pricing and category info' },
          { name: 'dim_store',     desc: 'Store locations and regional metadata' },
        ],
        joins: [
          { name: 'Join 1', desc: 'Links sales to customer profiles', leftTable: 'fact_sales', leftCol: 'customer_id', cardinality: 'Many : 1', rightTable: 'fact_customer', rightCol: 'customer_id' },
          { name: 'Join 2', desc: 'Associates sales with product details', leftTable: 'fact_sales', leftCol: 'product_id', cardinality: 'Many : 1', rightTable: 'dim_product', rightCol: 'product_id' },
          { name: 'Join 3', desc: 'Connects sales transactions to store data', leftTable: 'fact_sales', leftCol: 'store_id', cardinality: 'Many : 1', rightTable: 'dim_store', rightCol: 'store_id' },
        ],
        columns: [
          { table: 'fact_sales',    columns: ['sale_id','customer_id','product_id','amount','channel','sale_date'] },
          { table: 'fact_customer', columns: ['customer_id','email','segment','lifetime_value'] },
          { table: 'dim_product',   columns: ['product_id','product_name','category','unit_price'] },
          { table: 'dim_store',     columns: ['store_id','store_name','region_id'] },
        ],
        formulas: [
          { name: 'Total Revenue',       code: 'SUM(fact_sales.amount)' },
          { name: 'Average Order Value', code: 'SUM(fact_sales.amount) / COUNT(DISTINCT fact_sales.sale_id)' },
          { name: 'Unique Customers',    code: 'COUNT(DISTINCT fact_sales.customer_id)' },
        ],
      },
      changeLog: [],
      tablePositions: {},
    };
  } else {
    window._modelState = {
      addedTables: [],
      addedJoins: [],
      addedColumns: [],
      initialContext: '',
      hasAskedClarify: false,
      clarifyCount: 0,
      model: {
        tables: [],
        joins: [],
        columns: [],
        formulas: [],
      },
      changeLog: [],
      tablePositions: {},
    };
  }

  window._colDescOverrides = {};
  window._colAIContext    = {};
  window._pendingModelRebuild = false;

  function showModelLoading(text) {
    window._setModelLoading?.(true, text || 'Updating your model...');
  }

  function hideModelLoading() {
    window._setModelLoading?.(false);
  }

  function flushModelRebuild() {
    if (!window._pendingModelRebuild) return;
    window._pendingModelRebuild = false;
    rebuildTablesCanvas();
    rebuildColumnPane();
    rebuildColumnsContent();
    rebuildFormulasContent();
  }

  window._conversationHistory = [];

  function typewriter(el, text, chunkSize = 3, interval = 150, onComplete) {
    el.textContent = '';
    const words = text.split(' ');
    let i = 0;
    const id = setInterval(() => {
      const end = Math.min(i + chunkSize, words.length);
      el.textContent = words.slice(0, end).join(' ');
      i = end;
      if (i >= words.length) {
        clearInterval(id);
        if (onComplete) onComplete();
      }
    }, interval);
    return id;
  }

  function addReasoningBlock(type = 'tables') {
    const uid = ++_rbUid;
    const tcId = `tc-${uid}`;
    const rbId = `rb-${uid}`;

    const d = window._pendingData;
    const steps = (d && d.reasoningSteps && d.reasoningSteps.length === 3)
      ? d.reasoningSteps
      : [
          { name: 'Understanding requirements',    text: 'Analysing the request to map it to the underlying data structures and identify the core entities needed.' },
          { name: 'Searching schema',              text: 'Scanning the data warehouse schema to locate matching tables and relationships relevant to this request.' },
          { name: 'Evaluating and validating',     text: 'Checking granularity and alignment across the identified objects to ensure they support the required queries.' },
        ];

    const tcTitles = { tables: 'Table search', joins: 'Relationship scan', columns: 'Column discovery', formulas: 'Formula generation', clarify: 'Context analysis', confirmation: 'Model update' };
    const tcTitle = tcTitles[type] || 'Schema scan';

    window._appendMsg?.({
      kind: 'agent', id: rbId, response: null,
      reasoning: {
        header: 'Understanding data requirements',
        isDone: false,
        inlineText: '',
        steps: [{ n: 1, name: steps[0].name, text: steps[0].text, dotState: 'current' }],
      },
    });
    window._scrollMsgs?.();
    setTimeout(() => window._updateReasoning?.(rbId, {
      header: 'Understanding data requirements',
      isDone: false,
      inlineText: steps[0].text,
      steps: [{ n: 1, name: steps[0].name, text: steps[0].text, dotState: 'current' }],
    }), 450);

    setTimeout(() => {
      window._updateReasoning?.(rbId, {
        header: steps[1].name,
        isDone: false,
        inlineText: steps[1].text,
        steps: [
          { n: 1, name: steps[0].name, text: steps[0].text, dotState: 'done' },
          { n: 2, name: steps[1].name, text: steps[1].text, dotState: 'current',
            toolcall: { id: tcId, title: tcTitle, input: 'Scanning connected data sources…', output: steps[1].text.slice(0, 80) + '…', status: 'loading', isVisible: false } },
        ],
      });
      window._scrollMsgs?.();
    }, 1500);

    setTimeout(() => {
      window._updateReasoning?.(rbId, {
        header: steps[1].name,
        isDone: false,
        inlineText: steps[1].text,
        steps: [
          { n: 1, name: steps[0].name, text: steps[0].text, dotState: 'done' },
          { n: 2, name: steps[1].name, text: steps[1].text, dotState: 'current',
            toolcall: { id: tcId, title: tcTitle, input: 'Scanning connected data sources…', output: steps[1].text.slice(0, 80) + '…', status: 'loading', isVisible: true } },
        ],
      });
      window._scrollMsgs?.();
    }, 2800);

    setTimeout(() => {
      window._updateReasoning?.(rbId, {
        header: steps[2].name,
        isDone: false,
        inlineText: steps[2].text,
        steps: [
          { n: 1, name: steps[0].name, text: steps[0].text, dotState: 'done' },
          { n: 2, name: steps[1].name, text: steps[1].text, dotState: 'done',
            toolcall: { id: tcId, title: tcTitle, input: 'Scanning connected data sources…', output: steps[1].text.slice(0, 80) + '…', status: 'done', isVisible: true } },
          { n: 3, name: steps[2].name, text: steps[2].text, dotState: 'current' },
        ],
      });
      window._scrollMsgs?.();
    }, 4000);

    setTimeout(() => {
      window._updateReasoning?.(rbId, {
        header: 'Work done',
        isDone: true,
        inlineText: steps[2].text,
        steps: [
          { n: 1, name: steps[0].name, text: steps[0].text, dotState: 'done' },
          { n: 2, name: steps[1].name, text: steps[1].text, dotState: 'done',
            toolcall: { id: tcId, title: tcTitle, input: 'Scanning connected data sources…', output: steps[1].text.slice(0, 80) + '…', status: 'done', isVisible: true } },
          { n: 3, name: steps[2].name, text: steps[2].text, dotState: 'done' },
        ],
      });
      setTimeout(() => {
        const response = buildResponseData(type);
        window._updateMsg?.(rbId, { response });
        window._scrollMsgs?.();
      }, 600);
    }, 6000);
  }

  // ── Response data builder ─────────────────────────
  function buildResponseData(type) {
    const d = window._pendingData;
    const state = window._modelState;

    if (type === 'clarify') {
      state.hasAskedClarify = true;
      state.clarifyCount++;
      const questions = (d && d.questions && d.questions.length) ? d.questions
        : ['What is the primary business domain this model is for?', 'What are the main business questions you want to answer?'];
      window._pendingData = null;
      return {
        text: (d && d.message) || "Before I suggest tables, I'd like to understand your use case better.",
        isVisible: true,
        suggType: 'clarify',
        clarifyQuestions: questions,
      };
    }

    if (type === 'formula_req') {
      window._pendingData = null;
      return {
        text: (d && d.message) || "What calculations or KPIs do you need? Describe the metrics you want to track — for example, profit margin, year-over-year growth, or customer lifetime value.",
        isVisible: true,
        suggType: 'formula_req',
      };
    }

    if (type === 'confirmation') {
      flushModelRebuild();
      hideModelLoading();
      const hasColumns = state.model.columns && state.model.columns.some(g => g.columns && g.columns.length > 0);
      const tableCount = state.model.tables ? state.model.tables.length : 0;
      let chipTexts = (d && d.chips && d.chips.length) ? d.chips.slice(0, 3).filter(c => {
        if (typeof c !== 'string' || !c.trim()) return false;
        const cl = c.toLowerCase();
        if ((cl.includes('formula') || cl.includes('metric') || cl.includes('calculat')) && !hasColumns) return false;
        if ((cl.includes('join') || cl.includes('relationship')) && tableCount < 2) return false;
        return true;
      }) : [];
      const hasColsForChips = state.addedColumns.length > 0;
      if (hasColsForChips) {
        chipTexts = chipTexts.filter(c => c !== 'Enrich for AI search');
        chipTexts.unshift('Enrich for AI search');
      } else {
        chipTexts = chipTexts.filter(c => c !== 'Enrich for AI search' && c !== 'Enable Spotter for this model');
      }
      const chips = chipTexts.map(c => ({
        text: c,
        variant: (c === 'Enrich for AI search' || c === 'Enable Spotter for this model') ? 'enrich' : 'default',
      }));

      let versionCard = null;
      if (window._pendingVersionSave) {
        versionCard = saveVersion(window._pendingVersionSave);
        window._pendingVersionSave = null;
      }
      window._pendingData = null;
      return {
        text: (d && d.message) || "I've added those to your model. Here are some suggested next steps:",
        isVisible: true,
        suggType: 'confirmation',
        chips: chips.length ? chips : undefined,
        versionCard: versionCard || undefined,
      };
    }

    if (type === 'enrich') {
      flushModelRebuild();
      hideModelLoading();
      window._pendingData = null;
      return {
        text: (d && d.message) || "Here are the improvements I recommend to make your model AI-searchable:\n\n1. Set AI context for ambiguous columns to clarify their business meaning.\n2. Review formula names so they clearly express what each metric measures.\n3. Set AI context for columns with unclear naming conventions.\n\nWould you like me to apply all of these, or only specific ones? If only some, just tell me the numbers.",
        isVisible: true,
        suggType: 'enrich',
      };
    }

    if (type === 'spotter_enable') {
      flushModelRebuild();
      hideModelLoading();
      window._pendingData = null;
      return {
        text: (d && d.message) || "Spotter search has been enabled on this model. You can now run natural language queries directly against it — just ask questions in plain English and Spotter will interpret them using your model's structure and context.",
        isVisible: true,
        suggType: 'spotter_enable',
      };
    }

    if (type === 'joins') {
      const joins = (d && d.suggestions && d.suggestions.length) ? d.suggestions.slice(0, 5) : [];
      window._pendingData = null;
      return {
        text: (d && d.message) || "I've identified the following joins that connect your core tables based on shared keys.",
        isVisible: true,
        suggType: 'joins',
        joins: joins.map((j, i) => ({
          id: 'join-' + i,
          name: j.name, desc: j.desc,
          leftTable: j.leftTable, leftCol: j.leftCol,
          cardinality: j.cardinality,
          rightTable: j.rightTable, rightCol: j.rightCol,
          checked: true,
        })),
      };
    }

    if (type === 'columns') {
      const columnGroups = (d && d.suggestions && d.suggestions.length) ? d.suggestions : [];
      window._pendingData = null;
      return {
        text: (d && d.message) || "Here are the recommended columns from your core tables.",
        isVisible: true,
        suggType: 'columns',
        columnGroups,
      };
    }

    if (type === 'formulas') {
      const formulas = (d && d.suggestions && d.suggestions.length) ? d.suggestions.slice(0, 5) : [];
      window._pendingData = null;
      return {
        text: (d && d.message) || "Based on your data model structure, here are the calculated measures I recommend adding.",
        isVisible: true,
        suggType: 'formulas',
        formulas: formulas.map(f => ({ id: f.name, name: f.name, code: f.code })),
      };
    }

    const tables = (d && d.suggestions && d.suggestions.length) ? d.suggestions.slice(0, 5) : [];
    window._pendingData = null;
    return {
      text: (d && d.message) || "I've analysed your requirements and found the following foundational tables for your data model.",
      isVisible: true,
      suggType: 'tables',
      tables: tables.map((t, i) => ({ id: 'table-' + i, name: t.name, desc: t.desc, pct: t.pct, checked: true })),
    };
  }

  // ── Model artifact context builder ────────────────
  function buildModelContext(state) {
    const m = state.model;
    const lines = [];

    lines.push('Available source tables in the connected database (use these exact table and column names in suggestions):');
    DATASOURCE_TABLES.forEach(t => {
      lines.push(`  ${t.name}: ${t.columns.join(', ')}`);
    });
    lines.push('');

    if (m.tables.length) {
      lines.push(`Tables in model (${m.tables.length}): ${m.tables.map(t => t.name).join(', ')}`);
    } else {
      lines.push('Tables in model: none added yet');
    }

    if (m.joins.length) {
      lines.push(`Joins (${m.joins.length}): ${m.joins.map(j =>
        `${j.leftTable}.${j.leftCol} ↔ ${j.rightTable}.${j.rightCol} [${j.cardinality}]`).join('; ')}`);
    }

    if (m.columns.length) {
      lines.push(`Columns added: ${m.columns.map(g => `${g.table}(${g.columns.join(',')})`).join('; ')}`);
    }

    if (m.formulas.length) {
      lines.push(`Formulas (${m.formulas.length}): ${m.formulas.map(f => f.name).join(', ')}`);
    }

    if (state.changeLog.length) {
      const recent = state.changeLog.slice(-8);
      lines.push(`Model change history: ${recent.map((c, i) =>
        `${i + 1}. ${c.action} ${c.type} [${c.at}]: ${c.items.join(', ')}`).join('; ')}`);
    }

    return lines.join('\n');
  }

  // ── Handle "Add to model" ─────────────────────────
  window._handleAddToModel = function(msgId, type, items) {
    const state = window._modelState;
    let displayItems = [];
    let fullItems = [];

    if (type === 'tables') {
      fullItems = items;
      displayItems = items.map(t => t.name);
    } else if (type === 'joins') {
      fullItems = items;
      displayItems = items.map(j => j.name);
    } else if (type === 'columns') {
      fullItems = items;
      displayItems = items.flatMap(g => g.columns);
    } else if (type === 'formulas') {
      fullItems = items;
      displayItems = items.map(f => f.name);
    }

    if (!displayItems.length) return;

    if (type === 'tables') state.addedTables.push(...displayItems);
    else if (type === 'joins') state.addedJoins.push(...displayItems);
    else if (type === 'columns') state.addedColumns.push(...displayItems);

    if (type === 'tables') state.model.tables.push(...fullItems);
    else if (type === 'joins') state.model.joins.push(...fullItems);
    else if (type === 'columns') state.model.columns.push(...fullItems);
    else if (type === 'formulas') state.model.formulas.push(...fullItems);

    const at = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    state.changeLog.push({ action: 'added', type, items: [...displayItems], at });

    window._pendingModelRebuild = true;
    window._pendingVersionSave = 'Agent updates applied';

    const loadingText = type === 'tables' ? 'Adding tables to your model...'
      : type === 'joins' ? 'Wiring up joins...'
      : type === 'columns' ? 'Mapping columns to model...'
      : 'Building your formula set...';
    showModelLoading(loadingText);

    const genericPrompt = type === 'tables' ? 'Add selected tables to my model'
      : type === 'joins' ? 'Add selected joins to my model'
      : type === 'columns' ? 'Add selected columns to my model'
      : 'Add selected formulas to my model';
    startChat(genericPrompt, true, 'Adding to model...');
  };

  // ── Apply model modifications ─────────────────────
  function applyModifications(mods) {
    if (!mods || !Array.isArray(mods) || !mods.length) return;
    const state = window._modelState;
    let changed = false;

    mods.forEach(mod => {
      if (mod.action === 'remove') {
        if (mod.type === 'table') {
          const removeName = (mod.name || '').toLowerCase();
          const before = state.model.tables.length;
          state.model.tables = state.model.tables.filter(t => t.name.toLowerCase() !== removeName);
          state.addedTables = state.addedTables.filter(n => n.toLowerCase() !== removeName);
          const posKey = Object.keys(state.tablePositions).find(k => k.toLowerCase() === removeName);
          if (posKey) delete state.tablePositions[posKey];
          if (state.model.tables.length !== before) changed = true;
        } else if (mod.type === 'join') {
          const before = state.model.joins.length;
          state.model.joins = state.model.joins.filter(j => j.name.toLowerCase() !== (mod.name || '').toLowerCase());
          state.addedJoins = state.addedJoins.filter(n => n.toLowerCase() !== (mod.name || '').toLowerCase());
          if (state.model.joins.length !== before) changed = true;
        } else if (mod.type === 'column') {
          const colName = (mod.name || '').toLowerCase();
          const tableName = (mod.table || '').toLowerCase();
          state.model.columns = state.model.columns.map(g => {
            if (tableName && g.table.toLowerCase() !== tableName) return g;
            return { ...g, columns: g.columns.filter(c => c.toLowerCase() !== colName) };
          }).filter(g => g.columns.length > 0);
          state.addedColumns = state.addedColumns.filter(c => c.toLowerCase() !== colName);
          changed = true;
        } else if (mod.type === 'formula') {
          const before = state.model.formulas.length;
          state.model.formulas = state.model.formulas.filter(f => f.name.toLowerCase() !== (mod.name || '').toLowerCase());
          if (state.model.formulas.length !== before) changed = true;
        }
      } else if (mod.action === 'edit') {
        if (mod.type === 'column' && mod.column && mod.changes) {
          const key = (mod.table ? mod.table + '.' : '') + mod.column;
          if (mod.changes.desc) {
            window._colDescOverrides[key.toLowerCase()] = mod.changes.desc;
            window._colDescOverrides[mod.column.toLowerCase()] = mod.changes.desc;
            changed = true;
          }
          if (mod.changes.aiContext) {
            window._colAIContext[key.toLowerCase()] = mod.changes.aiContext;
            window._colAIContext[mod.column.toLowerCase()] = mod.changes.aiContext;
            changed = true;
          }
        } else if (mod.type === 'table' && mod.name && mod.changes && mod.changes.desc) {
          const t = state.model.tables.find(t => t.name.toLowerCase() === mod.name.toLowerCase());
          if (t) { t.desc = mod.changes.desc; changed = true; }
        } else if (mod.type === 'formula' && mod.name && mod.changes) {
          const f = state.model.formulas.find(f => f.name.toLowerCase() === mod.name.toLowerCase());
          if (f) {
            if (mod.changes.name) f.name = mod.changes.name;
            if (mod.changes.code) f.code = mod.changes.code;
            changed = true;
          }
        }
      }
    });

    if (changed) {
      window._pendingModelRebuild = true;
    }
  }

  window._handleChipClick = function(text) { startChat(text); };
  window._handleSuggestionRefine = function(type) {
    const prompts = { tables: 'Refine table suggestions', joins: 'Refine join suggestions', columns: 'Refine column suggestions', formulas: 'Refine formula suggestions' };
    startChat(prompts[type] || 'Refine suggestions');
  };
  window._restoreVersion = restoreVersion;

  function showAgentTyping(label = 'Analyzing...') {
    removeAgentTyping();
    window._appendMsg?.({ kind: 'typing', id: 'agent-typing-indicator', label });
    window._scrollMsgs?.();
  }

  function removeAgentTyping() {
    window._removeMsg?.('agent-typing-indicator');
  }

  window.toggleFormulaCode = function(btn) {
    const respBlock = btn.closest('.agent-response-block');
    const idx = parseInt(btn.dataset.idx);
    const formula = respBlock._suggestions && respBlock._suggestions[idx];
    if (!formula) return;
    const codeEl = btn.previousElementSibling;
    const isExpanded = btn.dataset.expanded === 'true';
    if (isExpanded) {
      const short = formula.code.length > 80 ? formula.code.slice(0, 80) + '...' : formula.code;
      codeEl.textContent = short;
      btn.textContent = 'Show more';
      btn.dataset.expanded = 'false';
    } else {
      codeEl.textContent = formula.code;
      btn.textContent = 'Show less';
      btn.dataset.expanded = 'true';
    }
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Claude API ────────────────────────────────────
  async function askClaude() {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: window.__DME_CONFIG__?.model || 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: `You are an AI assistant inside SpotterModel, a data modelling tool. Respond with valid JSON only — no markdown, no extra text.

Schema:
{
  "type": "clarify" | "tables" | "joins" | "columns" | "formulas" | "formula_req" | "confirmation" | "enrich" | "spotter_enable",
  "message": "warm 1-2 sentence response, 30-50 words, specific to context",
  "context": null | "structured summary string (only when substantial new context is known)",
  "reasoningSteps": [
    {"name": "3-5 word step title", "text": "1-2 sentences, 20-35 words"},
    {"name": "3-5 word step title", "text": "1-2 sentences, 20-35 words"},
    {"name": "3-5 word step title", "text": "1-2 sentences, 20-35 words"}
  ],
  "suggestions": [],
  "questions": [],
  "chips": [],
  "modifications": [],
  "loadingMessage": null
}
loadingMessage: For type "confirmation" only — short phrase (4-8 words) shown on the model area while reasoning runs. E.g. "Enriching columns for AI search...", "Removing table from model...", "Applying your edits...". Set to null for all other types.

Modifications field: Only populate for type "confirmation" when the user asks to REMOVE or EDIT something already in the model.
- Remove a table: {"action":"remove","type":"table","name":"table_name"}
- Remove a join: {"action":"remove","type":"join","name":"join_name"}
- Remove a column: {"action":"remove","type":"column","name":"col_name","table":"table_name"}
- Remove a formula: {"action":"remove","type":"formula","name":"formula_name"}
- Edit a column description: {"action":"edit","type":"column","table":"table_name","column":"col_name","changes":{"desc":"new description"}}
- Edit a column AI context: {"action":"edit","type":"column","table":"table_name","column":"col_name","changes":{"aiContext":"plain-language meaning for AI queries"}}
- Edit both at once: {"action":"edit","type":"column","table":"table_name","column":"col_name","changes":{"desc":"...","aiContext":"..."}}
- Edit a table description: {"action":"edit","type":"table","name":"table_name","changes":{"desc":"new description"}}
- Edit a formula: {"action":"edit","type":"formula","name":"formula_name","changes":{"code":"new DAX expression"}}
Leave "modifications" as an empty array [] if there is nothing to remove or edit.

Suggestion shapes:
- tables → up to 5: {"name":"snake_case","desc":"one sentence","pct":50-99} (pct = relevance %)
- joins → up to 5: {"name":"Join N","desc":"...","leftTable":"...","leftCol":"...","cardinality":"Many : 1"|"1 : Many"|"1 : 1","rightTable":"...","rightCol":"..."} — IMPORTANT: only suggest joins between tables that are consecutive/adjacent in the model's table list (i.e. table[i] joins table[i+1]). Never suggest a join between two tables that have other tables between them in the list. NEVER use cardinality "Many : Many" — this is not supported. Only use "Many : 1", "1 : Many", or "1 : 1". Only suggest joins between tables that are already in the model. NEVER suggest a join where leftTable and rightTable are the same table.
- columns → groups: [{"table":"Name","columns":["col1","col2",...]}] — 2-4 tables, 4-8 cols each. ONLY suggest columns for tables that are already in the model. Never reference a table not present in the model state.
- formulas → up to 5: {"name":"Formula Name (ABBR)","code":"DAX expression"}

Systemic rules (HARD CONSTRAINTS — never break these):
- Joins can only be suggested if 2+ tables are in the model.
- Columns can only be suggested if 1+ table is in the model.
- Formulas can only be suggested if BOTH tables AND columns are in the model.

Type rules:
- If model context says no tables added AND the prompt is NOT a confirmation: return type "clarify". Set questions to exactly 2 short, specific questions to understand what tables are needed. Leave suggestions empty.
- If the prompt is a command to add items (e.g. "Add these tables to my model: ..."): YOU are the one adding those items to the model. Return type "confirmation". In "message", confirm as the agent: say "I've added [items] to your model." then describe what the model now contains (e.g. "Your model now has 3 tables and 2 joins."). Set chips to 2-3 generic next-action phrases — NO specific table, column, or formula names in chip text. Chip text must be short and generic like "Suggest joins", "Add columns", "Add more tables", "Generate formulas". STRICTLY enforce systemic rules for chips — these are ABSOLUTE HARD RULES: (a) NEVER include any formula or metric chip ("Generate formulas", "Add metrics", etc.) unless the model state explicitly shows BOTH tables AND columns already added. (b) NEVER include any join chip ("Suggest joins", "Add joins", etc.) unless 2+ tables are in the model. (c) When in doubt, omit the chip rather than include it. Do NOT suggest actions outside the data model. Leave suggestions empty.
- If the user asks for an action that violates a systemic rule (e.g. asking for formulas when no columns exist, asking for joins with only 1 table): return the type for the MISSING prerequisite (e.g. "columns" if tables exist but no columns, "tables" if no tables). In "message", briefly explain what's needed first: "To generate formulas, I need to add columns to your model first. Here are the columns I recommend." Do NOT return "formulas" or "joins" if the prerequisite isn't met.
- For tables/joins/columns/formulas: populate suggestions. Leave questions and chips empty.
- If the prompt is "Enable Spotter for this model" or similar: return type "spotter_enable". In "message", confirm that Spotter search has been enabled on this model and briefly explain what it means (natural language queries are now possible on this model). Keep it to 1-2 warm sentences. Set suggestions, questions, chips, modifications to empty.
- If the user's prompt is "Generate formulas" or similar (generic formula request with no specific requirements stated yet in this turn): return type "formula_req". In "message", ask ONE specific question: what metrics, calculations, or KPIs they want to compute (e.g. "What calculations or KPIs do you need? Describe the metrics you want to track — for example, profit margin, year-over-year growth, or customer lifetime value."). Set suggestions, questions, chips to empty. Do NOT return formulas yet. ONLY apply this rule when the prompt is a bare generic trigger — if the user has already described specific requirements in their message, return type "formulas" directly.
- If the prompt is "Enrich for AI search" or similar (improve model for AI queries): return type "enrich". In "message", write a plain-text numbered list of 4-7 specific, actionable improvements based on the ACTUAL model state — focus ONLY on: missing or vague column descriptions (where the column name alone doesn't communicate business meaning), missing AI context on ambiguous columns (e.g. columns with names like 'amount', 'channel', 'status', 'score', 'type'), and formula names that don't clearly express business meaning. Reference actual column and formula names from the model. At the END of the message, always add a blank line then: "Would you like me to apply all of these, or only specific ones? If only some, just tell me the numbers." When the user says to apply some/all (e.g. "apply all", "apply 1 and 3"), return type "confirmation" with modifications[] to set desc and/or aiContext on the relevant columns, and set chips to ["Enable Spotter for this model"]. Set suggestions and questions to empty for enrich type.
- reasoningSteps must feel like genuine AI reasoning specific to the type and context.
- All content must directly reflect what the user asked and the model state provided.
- Remember and use context from the full conversation history when generating suggestions and responses.
Context field rules: After the user has shared meaningful information about their goals, domain, personas, or business rules, populate the "context" field with a structured plain-text summary. Format it exactly like this example (use the actual conversation content):
"Project Scope:\\n[short project title]\\n\\nStrategic Objective\\n[1-2 sentence description]\\nPrimary Persona: [role]\\nKey Question: \\"[question]\\"\\n\\nSemantic Logic & Business Rules\\n[Rule name]: [definition]\\n[Rule name]: [definition]"
Only include the context field when there is genuinely meaningful content from the conversation. Set it to null if the user has only sent generic commands (like "add to model") with no domain context. Update it cumulatively — include all context captured so far, not just from the latest message.`,
        messages: window._conversationHistory,
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const raw = data.content[0].text;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response: ' + raw);
    return JSON.parse(match[0]);
  }

  // ── Status toast ──────────────────────────────────
  function showToast(msg, isError = false) {
    let toast = document.getElementById('claude-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'claude-toast';
      toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        padding:8px 16px;border-radius:8px;font-size:12px;font-family:'Plain',sans-serif;
        z-index:9999;transition:opacity 0.4s ease;pointer-events:none;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.15);`;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = isError ? '#FDECEA' : '#E0F8EF';
    toast.style.color   = isError ? '#C0392B' : '#1A8A4A';
    toast.style.opacity = '1';
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }

  // ── Version-restore toast ─────────────────────────
  function showVersionRestoreToast() {
    const existing = document.getElementById('version-restore-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'version-restore-toast';
    toast.style.cssText = `
      position:fixed;bottom:96px;left:50%;
      transform:translateX(-50%) translateY(10px);
      width:311px;
      background:#32394A;border-radius:6px;
      padding:16px;
      display:flex;align-items:center;justify-content:space-between;gap:12px;
      opacity:0;
      transition:opacity 0.22s ease,transform 0.22s ease;
      z-index:9999;box-sizing:border-box;
      box-shadow:0 4px 16px rgba(0,0,0,0.28);
    `;
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
        <img src="/spotter-assets/checkmark.svg" width="18" height="18" alt="" style="flex-shrink:0;"/>
        <span style="font-size:14px;font-weight:300;color:#FFFFFF;
          font-family:'Plain','Helvetica Neue',Arial,sans-serif;line-height:20px;white-space:nowrap;">
          Version restored successfully!
        </span>
      </div>
      <button id="vrt-dismiss" style="
        width:24px;height:24px;border-radius:50%;background:#EAEDF2;
        border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
        flex-shrink:0;padding:0;
      ">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.70016 2.60022L2.60022 3.70016L5.90005 7L2.60022 10.2998L3.70016 11.3998L6.99999 8.09994L10.2998 11.3998L11.3998 10.2998L8.09994 7L11.3998 3.70016L10.2998 2.60022L6.99999 5.90005L3.70016 2.60022Z" fill="#1D232F"/>
        </svg>
      </button>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }));

    const tid = setTimeout(dismiss, 5000);

    function dismiss() {
      clearTimeout(tid);
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 250);
    }

    document.getElementById('vrt-dismiss').addEventListener('click', dismiss);
  }

  // ── Context panel ─────────────────────────────────
  if (welcomeVariant === 'existing') {
    window._contextData = `Project Scope:\nRetail Sales Analytics\n\nStrategic Objective\nEnable business users to query sales, customer, and product performance using natural language via Spotter AI.\nPrimary Persona: Business Analyst\nKey Question: "What are our top-performing products and customer segments?"\n\nSemantic Logic & Business Rules\nRevenue: Total monetary value from fact_sales.amount\nAOV: Average Order Value — total revenue divided by distinct sale count\nChannel: Acquisition or sales channel (e.g. online, in-store, partner)\nActive Customer: Any customer with at least one sale in the past 90 days`;
  } else {
    window._contextData = null;
  }
  window._prevContextData = null;
  window._ctxBannerDismissed = false;
  let _ctxModalIsOpen = false;

  function updateContextButton() {
    const chip = document.getElementById('context-chip-btn');
    if (!chip) return;
    if (window._contextData === 'loading') {
      chip.classList.add('ctx-loading');
    } else {
      chip.classList.remove('ctx-loading');
      if (_ctxModalIsOpen) openContextModal();
    }
  }

  function openContextModal() {
    const state = window._contextData;
    const banner = !window._ctxBannerDismissed ? `<div class="ctx-banner">
      <div class="ctx-banner-icon"><img src="/spotter-assets/exclamation.svg" width="18" height="18" alt="info"/></div>
      <span class="ctx-banner-text">SpotterModel automatically updates context as you keep interacting with it.</span>
      <button class="ctx-banner-dismiss" onclick="window._ctxBannerDismissed=true;this.closest('.ctx-banner').remove();">
        <img src="/spotter-assets/cross-s.svg" width="14" height="14" alt="dismiss"/>
      </button>
    </div>` : '';

    let content;
    if (state === 'loading') {
      content = `<div class="ctx-loading-state">
        <div class="ctx-dots"><div class="ctx-dot"></div><div class="ctx-dot"></div><div class="ctx-dot"></div></div>
        <span class="ctx-loading-label">Updating context</span>
      </div>`;
    } else if (!state) {
      content = `<div class="ctx-empty-state">
        <div class="ctx-empty-icon"><img src="/spotter-assets/empty search illustration.svg" width="32" height="32" alt="no context"/></div>
        <div class="ctx-empty-text">
          <span class="ctx-empty-title">No context identified yet</span>
          <span class="ctx-empty-desc">As you clarify goals and business logic in the chat, the model's context will appear here.</span>
        </div>
      </div>`;
    } else {
      content = `<div class="ctx-body-text">${formatContextText(state)}</div>`;
    }

    _ctxModalIsOpen = true;
    window._openCtxModal?.(banner + content);
  }

  function closeContextModal() {
    _ctxModalIsOpen = false;
    window._closeCtxModal?.();
  }
  window._onCtxModalClose = closeContextModal;

  function formatContextText(raw) {
    const lines = raw.split('\n');
    let html = '';
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        html += '<div class="ctx-spacer"></div>';
        return;
      }
      const isHeader = trimmed.length < 60 && !line.startsWith(' ') && !trimmed.startsWith('-')
        && (trimmed.endsWith(':') || /^[A-Z][A-Za-z &\/]+$/.test(trimmed));
      if (isHeader) {
        html += `<div class="ctx-section-head">${escapeHtml(trimmed)}</div>`;
        return;
      }
      const kvMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9 ]{1,30}):\s+(.+)$/);
      if (kvMatch) {
        html += `<div class="ctx-kv-row"><span class="ctx-kv-key">${escapeHtml(kvMatch[1])}:</span> <span class="ctx-kv-val">${escapeHtml(kvMatch[2])}</span></div>`;
        return;
      }
      html += `<div class="ctx-body-line">${escapeHtml(trimmed)}</div>`;
    });
    return html;
  }

  if (spotterModelEnabled) document.getElementById('context-chip-btn').addEventListener('click', openContextModal, { signal });

  // ── Fallback keyword detection ────────────────────
  function getResponseType(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('enable spotter') || p.includes('spotter for this model')) return 'spotter_enable';
    if (p.includes('enrich') || p.includes('ai search') || p.includes('ai-ready') || p.includes('ai ready') || p.includes('check for ai') || p.includes('ai readiness')) return 'enrich';
    if (p.includes('join') || p.includes('relationship') || p.includes('connect')) return 'joins';
    if (p.includes('column') || p.includes('field') || p.includes('attribute')) return 'columns';
    if (p.includes('formula') || p.includes('measure') || p.includes('metric') || p.includes('calculat')) return 'formulas';
    return 'tables';
  }

  async function startChat(prompt, isAutoPrompt = false, spinnerLabel = null) {
    if (!prompt || !prompt.trim()) return;

    if (window._onChatStart) { window._onChatStart(); window._onChatStart = null; }
    document.getElementById('welcome-view').style.display = 'none';
    const chatView = document.getElementById('chat-view');
    chatView.classList.add('active');
    if (window._fireChatPlaceholder) window._fireChatPlaceholder();
    if (!isAutoPrompt) requestAnimationFrame(() => document.getElementById('chat-textarea')?.focus());
    window._freezeConversation?.();
    addUserBubble(prompt.trim());

    if (window._pendingManualChanges && !isAutoPrompt) {
      await saveManualChanges();
    }

    showAgentTyping(spinnerLabel || (isAutoPrompt ? 'Adding to model...' : 'Analyzing...'));

    const state = window._modelState;

    if (!isAutoPrompt && !state.initialContext && state.addedTables.length === 0) {
      state.initialContext = prompt.trim();
    }

    const modelCtx = buildModelContext(state);

    const shouldForceTables = state.clarifyCount >= 2 && state.addedTables.length === 0 && !isAutoPrompt;
    const forceInstruction = shouldForceTables
      ? '\n\n[INSTRUCTION: Enough context has been gathered from the conversation. Return type "tables" with relevant table suggestions and a warm response message. Do NOT ask more clarifying questions.]'
      : '';

    const userMsgContent = prompt.trim() + `\n\n[CURRENT MODEL STATE — authoritative, supersedes all prior messages. Only suggest joins, columns, and formulas using tables that are listed under "Tables in model" below.]\n${modelCtx}` + forceInstruction;

    window._conversationHistory.push({ role: 'user', content: userMsgContent });

    const shouldTrackCtx = state.hasAskedClarify || state.addedTables.length > 0;
    if (shouldTrackCtx && !isAutoPrompt) {
      window._prevContextData = window._contextData;
      window._contextData = 'loading';
      updateContextButton();
    }

    let type = getResponseType(prompt);
    window._pendingData = null;

    try {
      const result = await askClaude();

      type = result.type;

      if (type !== 'enrich' && type !== 'formula_req' && type !== 'confirmation' && type !== 'spotter_enable') {
        if (!state.hasAskedClarify && !isAutoPrompt && state.addedTables.length === 0 && type !== 'clarify') {
          type = 'clarify';
        }

        if (type === 'clarify' && state.clarifyCount >= 2 && state.addedTables.length === 0) {
          type = 'tables';
          result.message = '';
          result.suggestions = [];
        }

        if (type === 'joins' && state.addedTables.length < 2) type = 'tables';
        if (type === 'columns' && state.addedTables.length < 1) type = 'tables';
        if (type === 'formulas' && state.addedTables.length < 1) type = 'tables';
        if (type === 'formulas' && state.addedColumns.length < 1) type = 'columns';
      }
      result.type = type;

      window._pendingData = result;

      if (result.modifications && result.modifications.length) {
        applyModifications(result.modifications);
        if (window._pendingModelRebuild) {
          const hasRemove = result.modifications.some(m => m.action === 'remove');
          const hasEdit   = result.modifications.some(m => m.action === 'edit');
          const loadingMsg = result.loadingMessage
            || (hasRemove ? 'Removing from your model...'
              : hasEdit   ? 'Applying updates to your model...'
              : 'Updating your model...');
          showModelLoading(loadingMsg);
        }
        if (!window._pendingVersionSave) {
          const removeItems = result.modifications.filter(m => m.action === 'remove');
          const editItems   = result.modifications.filter(m => m.action === 'edit');
          if (removeItems.length || editItems.length) {
            window._pendingVersionSave = 'Agent updates applied';
          }
        }
      }

      if (result.context && typeof result.context === 'string' && result.context.trim()) {
        window._contextData = result.context.trim();
      } else if (window._contextData === 'loading') {
        window._contextData = window._prevContextData;
      }
      updateContextButton();

      const assistantSummary = result.message || '';
      window._conversationHistory.push({ role: 'assistant', content: assistantSummary });

    } catch (e) {
      console.error('Claude error:', e);
      window._conversationHistory.pop();
      window._contextData = window._prevContextData;
      updateContextButton();
      showToast('Claude error: ' + e.message, true);
    }

    removeAgentTyping();
    setTimeout(() => addReasoningBlock(type), 200);
  }

  window.startChat = startChat;

  // Welcome send button — blank variant only
  if (spotterModelEnabled && welcomeVariant === 'blank') {
    document.getElementById('welcome-send').addEventListener('click', () => {
      const text = document.getElementById('welcome-textarea').value;
      startChat(text);
    }, { signal });
    document.getElementById('welcome-textarea').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = document.getElementById('welcome-textarea').value;
        startChat(text);
      }
    }, { signal });
  }

  // Suggestion links
  document.querySelectorAll('.suggestion-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      startChat('I want you to suggest tables for this model.');
    }, { signal });
  });

  // Chat send button — delegated so it works whether the element is always-present or conditionally rendered
  if (spotterModelEnabled) {
    document.getElementById('agent-panel').addEventListener('click', (e) => {
      if (!e.target.closest('#chat-send-btn')) return;
      const textarea = document.getElementById('chat-textarea');
      const text = textarea?.value.trim();
      if (!text) return;
      textarea.value = '';
      startChat(text);
    }, { signal });
    document.getElementById('agent-panel').addEventListener('keydown', (e) => {
      if (e.target.id !== 'chat-textarea' || e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault();
      document.getElementById('chat-send-btn')?.click();
    }, { signal });
  }

  // Save changes button — only present in existing variant DOM
  const saveChangesBtn = document.getElementById('save-changes-btn');
  if (saveChangesBtn) {
    saveChangesBtn.addEventListener('click', () => showToast('Changes saved'));
  }

  // ── Version history ───────────────────────────────
  window._versionHistory = [];
  window._pendingVersionSave = null;
  window._pendingManualChanges = false;
  let _versionNum = 0;

  function deepCloneModel(model) {
    return JSON.parse(JSON.stringify(model));
  }

  function saveVersion(label) {
    _versionNum++;
    const num = _versionNum;
    const at = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const snapshot = deepCloneModel(window._modelState.model);
    const colAIContext = JSON.parse(JSON.stringify(window._colAIContext || {}));
    const colDescOverrides = JSON.parse(JSON.stringify(window._colDescOverrides || {}));
    window._versionHistory.push({ num, label, snapshot, colAIContext, colDescOverrides, at });
    window._demoteVersionCards?.();
    return { versionNum: num, label, isLatest: true, isDisabled: false };
  }

  function restoreVersion(num) {
    const entry = window._versionHistory.find(v => v.num === num);
    if (!entry) return;
    if (_versionNum - num > 25) return;

    window._scrollMsgs?.();
    showModelLoading('Restoring previous version...');

    const restoreId = 'restore-' + num + '-' + Date.now();
    window._appendMsg?.({
      kind: 'agent', id: restoreId, response: null,
      reasoning: {
        header: 'Restoring Version ' + num + '…',
        isDone: false,
        inlineText: 'Reverting model state — applying the snapshot from Version ' + num + '.',
        steps: [],
      },
    });
    window._scrollMsgs?.();

    setTimeout(() => {
      window._updateReasoning?.(restoreId, {
        header: 'Version ' + num + ' restored',
        isDone: true,
        inlineText: '',
        steps: [],
      });

      window._modelState.model = deepCloneModel(entry.snapshot);
      window._modelState.addedTables    = entry.snapshot.tables.map(t => t.name);
      window._modelState.addedJoins     = entry.snapshot.joins.map(j => j.name);
      window._modelState.addedColumns   = entry.snapshot.columns.flatMap(g => g.columns);
      window._modelState.tablePositions = {};
      window._colAIContext     = JSON.parse(JSON.stringify(entry.colAIContext     || {}));
      window._colDescOverrides = JSON.parse(JSON.stringify(entry.colDescOverrides || {}));

      rebuildTablesCanvas();
      rebuildColumnPane();
      rebuildColumnsContent();
      rebuildFormulasContent();
      hideModelLoading();

      const vCard = saveVersion('Restored to Version ' + num);
      window._updateMsg?.(restoreId, {
        response: {
          text: "I've restored your model to Version " + num + ". All changes made after that version have been rolled back.",
          isVisible: true,
          versionCard: vCard,
        },
      });
      window._scrollMsgs?.();
      showVersionRestoreToast();
    }, 2200);
  }

  // ── Agent panel resize ────────────────────────────
  const agentPanel = document.getElementById('agent-panel');
  const resizeHandle = document.getElementById('panel-resize-handle');
  let isResizing = false;
  let startX, startWidth;

  resizeHandle?.addEventListener('mousedown', e => {
    isResizing = true;
    startX = e.clientX;
    startWidth = agentPanel.offsetWidth;
    resizeHandle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, { signal });

  const _mouseMoveHandler = e => {
    if (!isResizing) return;
    const delta = startX - e.clientX;
    const newWidth = Math.min(560, Math.max(260, startWidth + delta));
    agentPanel.style.width = newWidth + 'px';
  };

  const _mouseUpHandler = () => {
    if (!isResizing) return;
    isResizing = false;
    resizeHandle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  document.addEventListener('mousemove', _mouseMoveHandler);
  document.addEventListener('mouseup', _mouseUpHandler);

  // ── Drag & drop ───────────────────────────────────
  function addTableManually(tableName) {
    const state = window._modelState;
    if (state.addedTables.some(n => n.toLowerCase() === tableName.toLowerCase())) return;
    const ds = DATASOURCE_TABLES.find(d => d.name.toLowerCase() === tableName.toLowerCase());
    if (!ds) return;
    state.addedTables.push(tableName);
    state.model.tables.push({ name: tableName, desc: '' });
    window._pendingManualChanges = true;
    rebuildTablesCanvas();
    rebuildColumnPane();
  }

  function saveManualChanges() {
    return new Promise(resolve => {
      const manualId = 'manual-save-' + Date.now();
      window._appendMsg?.({
        kind: 'agent', id: manualId, response: null,
        reasoning: { header: 'Saving your manual edits first', isDone: false, inlineText: '', steps: [] },
      });
      window._scrollMsgs?.();

      setTimeout(() => {
        const vCard = saveVersion('Manual changes saved');
        window._updateReasoning?.(manualId, { header: 'Saved your manual edits first', isDone: true, inlineText: '', steps: [] });
        window._updateMsg?.(manualId, { response: { text: '', isVisible: true, versionCard: vCard } });
        window._scrollMsgs?.();
        window._pendingManualChanges = false;
        setTimeout(resolve, 500);
      }, 1400);
    });
  }

  function addColumnManually(tableName, colName) {
    const state = window._modelState;
    let group = state.model.columns.find(g => g.table === tableName);
    if (group) {
      if (group.columns.includes(colName)) return;
      group.columns.push(colName);
    } else {
      state.model.columns.push({ table: tableName, columns: [colName] });
    }
    if (!state.addedColumns.includes(colName)) state.addedColumns.push(colName);
    window._pendingManualChanges = true;
    rebuildColumnPane();
    rebuildColumnsContent();
  }

  function setupColumnDrag() {
    document.querySelectorAll('.col-tree-col-item.col-draggable[draggable="true"]').forEach(item => {
      item.addEventListener('dragstart', e => {
        const payload = JSON.stringify({ tableName: item.dataset.table, colName: item.dataset.col });
        e.dataTransfer.setData('application/x-spotter-column', payload);
        e.dataTransfer.effectAllowed = 'copy';
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
    });
  }

  function setupColumnDropZone() {
    const contentEl = document.getElementById('content-columns');
    if (!contentEl) return;
    contentEl.addEventListener('dragover', e => {
      if (!e.dataTransfer.types.includes('application/x-spotter-column')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      contentEl.classList.add('col-drag-over');
    });
    contentEl.addEventListener('dragleave', e => {
      if (!contentEl.contains(e.relatedTarget)) contentEl.classList.remove('col-drag-over');
    });
    contentEl.addEventListener('drop', e => {
      contentEl.classList.remove('col-drag-over');
      const raw = e.dataTransfer.getData('application/x-spotter-column');
      if (!raw) return;
      e.preventDefault();
      try {
        const { tableName, colName } = JSON.parse(raw);
        if (tableName && colName) addColumnManually(tableName, colName);
      } catch (_) {}
    });
  }

  function setupTableDrag() {
    document.querySelectorAll('#pane-tables-section .table-item').forEach(item => {
      const name = item.querySelector('.table-chip')?.textContent?.trim();
      if (!name) return;
      item.draggable = true;
      item.dataset.tableName = name;
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', name);
        e.dataTransfer.effectAllowed = 'copy';
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
    });
  }

  function setupTableDropZone() {
    const contentEl = document.getElementById('content-tables');
    if (!contentEl) return;
    contentEl.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      contentEl.classList.add('drag-over');
    });
    contentEl.addEventListener('dragleave', e => {
      if (!contentEl.contains(e.relatedTarget)) contentEl.classList.remove('drag-over');
    });
    contentEl.addEventListener('drop', e => {
      e.preventDefault();
      contentEl.classList.remove('drag-over');
      const name = e.dataTransfer.getData('text/plain');
      if (!name) return;
      const canvasEl = document.getElementById('tables-canvas');
      const rect = contentEl.getBoundingClientRect();
      const scrollLeft = canvasEl ? canvasEl.scrollLeft : 0;
      const scrollTop  = canvasEl ? canvasEl.scrollTop  : 0;
      const dropX = Math.max(0, e.clientX - rect.left + scrollLeft - CARD_W / 2);
      const dropY = Math.max(0, e.clientY - rect.top  + scrollTop  - CARD_H / 2);
      window._modelState.tablePositions[name] = { x: Math.round(dropX), y: Math.round(dropY) };
      addTableManually(name);
    });
  }

  setupTableDrag();
  setupTableDropZone();
  setupColumnDropZone();

  // ── Headline sweep — variant-driven ──────────────
  if (welcomeVariant === 'blank') {
    (function() {
      var hl = document.querySelector('.agent-headline');
      if (!hl) return;
      hl.classList.add('sweeping');
      setTimeout(function() { hl.classList.remove('sweeping'); }, 1600);
    })();
  } else {
    (function() {
      var hl = document.querySelector('.edit-intro-headline');
      if (!hl) return;
      hl.classList.add('sweeping');
      setTimeout(function() {
        hl.classList.remove('sweeping');
        hl.style.opacity = '1';
      }, 1700);
    })();
  }

  // ── Typewriter placeholder ────────────────────────
  function typePlaceholder(el, text, delayMs, speed) {
    speed = speed || 28;
    el.placeholder = '';
    const prev = _placeholderHandles.get(el);
    if (prev) { clearTimeout(prev.to); clearInterval(prev.iv); }
    const h = { to: null, iv: null };
    h.to = setTimeout(function() {
      var i = 0;
      h.iv = setInterval(function() {
        if (i < text.length) { el.placeholder += text[i++]; }
        else { clearInterval(h.iv); _placeholderHandles.delete(el); }
      }, speed);
    }, delayMs);
    _placeholderHandles.set(el, h);
  }

  if (welcomeVariant === 'blank') {
    if (spotterModelEnabled) typePlaceholder(document.getElementById('welcome-textarea'), 'What is this model\'s use case?', 1050);

    // Chat placeholder — typed the first time a conversation starts
    var _chatPlaceholderTyped = false;
    window._fireChatPlaceholder = function() {
      if (_chatPlaceholderTyped) return;
      _chatPlaceholderTyped = true;
      requestAnimationFrame(() => {
        var el = document.getElementById('chat-textarea');
        if (el) typePlaceholder(el, 'Let me help you build a model', 560);
      });
    };
  } else {
    if (spotterModelEnabled) typePlaceholder(document.getElementById('chat-textarea'), 'Edit columns, formulas, tables or joins', 750);
  }

  // ── Pre-built model: paint canvas on load — existing variant only ──
  if (welcomeVariant === 'existing') {
    window._pendingModelRebuild = true;
    flushModelRebuild();
    const _initLeftPane = document.getElementById('left-pane');
    if (_initLeftPane) _initLeftPane.classList.remove('pane-hidden');
    document.getElementById('pane-tables-section').style.display = 'flex';
    updateContextButton();
  }

  // Toggle click handler
  document.querySelectorAll('.toggle').forEach(function(t) {
    t.addEventListener('click', function() { t.classList.toggle('on'); });
  });

  // Cleanup function
  return function cleanup() {
    _listenerAbort.abort();
    _placeholderHandles.forEach(h => { clearTimeout(h.to); clearInterval(h.iv); });
    _placeholderHandles.clear();
    document.removeEventListener('mousemove', _mouseMoveHandler);
    document.removeEventListener('mouseup', _mouseUpHandler);
    delete window._modelState;
    delete window._conversationHistory;
    delete window._contextData;
    delete window._prevContextData;
    delete window._pendingData;
    delete window._pendingModelRebuild;
    delete window._pendingVersionSave;
    delete window._pendingManualChanges;
    delete window._versionHistory;
    delete window._colDescOverrides;
    delete window._colAIContext;
    delete window._ctxBannerDismissed;
    delete window._fireChatPlaceholder;
    delete window.toggleColTree;
    delete window.showFgMenu;
    delete window.toggleFormulaCode;
    delete window.startChat;
    delete window._handleAddToModel;
    delete window._handleChipClick;
    delete window._handleSuggestionRefine;
    delete window._restoreVersion;
    delete window._onCtxModalClose;
    const toast = document.getElementById('claude-toast');
    if (toast) toast.remove();
    const vrt = document.getElementById('version-restore-toast');
    if (vrt) vrt.remove();
  };
}
