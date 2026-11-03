import React, { useMemo } from 'react';
import { fontFamily } from '@tokens/typography';
import {
  BASELINE,
  BG_TOKENS,
  COLOR_VARMAP,
  columnFloor,
  MARKER_GLYPHS,
  TOKEN_VARS,
  VARMAP,
  type FormattingState,
} from './formattingConfig';
import styles from './Markdown.module.css';

export interface SpotterMarkdownProps {
  /**
   * The response body, as HTML.
   *
   * Agent responses arrive as authored HTML rather than raw markdown — this
   * component styles tags, it does not parse. Anything reaching it has already
   * been through the response pipeline, so it is not a sanitisation boundary.
   */
  html: string;
  /**
   * Overrides on the frozen spec, for the playground that tunes it. Ship
   * surfaces should not pass this — the whole point of the freeze is that every
   * response looks the same.
   */
  overrides?: Partial<FormattingState>;
  className?: string;
}

/**
 * The Spotter response body.
 *
 * Every tag an agent can emit, styled to the spec frozen in
 * `formattingConfig.BASELINE` — including the table, which settled on grid with
 * vertical rules and row hover. The variants that lost (lines, cells, zebra)
 * are still implemented in the stylesheet and reachable through `overrides`,
 * because the playground compares against them.
 */
export const SpotterMarkdown: React.FC<SpotterMarkdownProps> = ({
  html,
  overrides,
  className,
}) => {
  const state = useMemo(
    () => ({ ...BASELINE, ...overrides }) as FormattingState,
    [overrides]
  );

  // The spec is expressed as CSS custom properties so one stylesheet can serve
  // both the frozen values and the playground's live edits.
  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    for (const key in VARMAP) {
      const [name, unit] = VARMAP[key];
      vars[name] = `${state[key]}${unit}`;
    }
    for (const key in COLOR_VARMAP) {
      vars[COLOR_VARMAP[key]] = `var(${TOKEN_VARS[String(state[key])]})`;
    }
    vars['--marker-glyph'] = MARKER_GLYPHS[String(state.markerStyle)];
    vars['--code-bg'] = BG_TOKENS[String(state.codeBgColor)] ?? 'transparent';
    vars['--codeblock-bg'] = BG_TOKENS[String(state.codeBlockBg)] ?? 'transparent';
    vars['--mono-font'] = fontFamily.mono;
    return vars as React.CSSProperties;
  }, [state]);

  // Prepares each <table> before render, doing two things:
  //
  //  1. Wraps it in a block element — a <table> ignores overflow, so the rounded
  //     clip and the horizontal scroll both have to live on a wrapper.
  //  2. Gives every column a content-aware min-width floor, so a column of long
  //     values does not collapse to its longest word.
  //
  // Done as a transform on the HTML rather than a DOM mutation in an effect:
  // dangerouslySetInnerHTML re-applies innerHTML whenever its prop object
  // changes, which would wipe anything added afterwards.
  const htmlProp = useMemo(() => {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    doc.querySelectorAll('table').forEach((tbl) => {
      const rows = Array.from(tbl.rows);
      const colCount = rows.reduce((n, r) => Math.max(n, r.cells.length), 0);

      // The column minimum in auto table layout is the max across its cells, so
      // setting the floor on the header cell governs the whole column.
      for (let i = 0; i < colCount; i++) {
        const longest = rows.reduce((n, r) => {
          const cell = r.cells[i];
          return cell ? Math.max(n, (cell.textContent ?? '').trim().length) : n;
        }, 0);
        const th = tbl.tHead?.rows[0]?.cells[i];
        if (th) th.style.minWidth = `${columnFloor(longest)}px`;
      }

      const wrap = doc.createElement('div');
      wrap.className = styles.tableWrap;
      wrap.setAttribute('data-table-wrap', 'true');
      tbl.replaceWith(wrap);
      wrap.appendChild(tbl);
    });

    return { __html: doc.body.innerHTML };
  }, [html]);

  return (
    <div
      className={[
        styles.md,
        styles.engineGap,
        state.bqItalic ? styles.bqItalic : '',
        state.bqBorder ? styles.bqBorder : '',
        state.bqFill ? styles.bqFill : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-table-variant={String(state.tableVariant)}
      data-table-vlines={state.tableVerticalLines ? 'true' : undefined}
      data-row-hover={state.rowHover ? 'true' : undefined}
      data-zebra-vlines={state.zebraVerticalLines ? 'true' : undefined}
      data-zebra-hlines={state.zebraHorizontalLines ? 'true' : undefined}
      data-zebra-header={String(state.zebraHeader)}
      style={cssVars}
      dangerouslySetInnerHTML={htmlProp}
    />
  );
};

SpotterMarkdown.displayName = 'SpotterMarkdown';

export default SpotterMarkdown;
