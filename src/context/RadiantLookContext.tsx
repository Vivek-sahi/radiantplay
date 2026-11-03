import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Radiant look: which component sizes a prototype renders with.
 *
 * Default (no look) is today's sizes. 'radiant-3' opts into the Radiant 3.0
 * Figma sizes: 32px text fields and menu items, 6px radii, regular 12/18
 * labels, Tabs at 48/32 with 12px side padding, and so on.
 *
 * PlaygroundProject wraps a prototype in <RadiantLook> when its registry entry
 * has `look: 'radiant-3'` (the LightOnly pattern). The wrapper sets
 * `data-rd-look="radiant-3"`, and component CSS keys off
 * `:global([data-rd-look="radiant-3"]) .x`, so nothing changes without the flag.
 * The wrapper is `display: contents`, so it adds no box and no layout change.
 *
 * Radiant overlays (Menu, Select, DatePicker, Tooltip, Popover) render inline,
 * so they inherit the attribute. Anything portaled to document.body sits
 * outside the wrapper: wrap the portaled content in <RadiantLookScope> so it
 * carries the attribute too.
 */

export type RadiantLookName = 'radiant-3';

const RadiantLookContext = createContext<RadiantLookName | undefined>(undefined);

/** The look in effect, or undefined for the default sizes. */
export const useRadiantLook = (): RadiantLookName | undefined => useContext(RadiantLookContext);

export const RadiantLook: React.FC<{ look?: RadiantLookName; children: ReactNode; style?: React.CSSProperties }> = ({
  look = 'radiant-3',
  children,
  style,
}) => (
  <RadiantLookContext.Provider value={look}>
    <div data-rd-look={look} style={style ?? { display: 'contents' }}>
      {children}
    </div>
  </RadiantLookContext.Provider>
);

/**
 * For portals: re-applies the current look around content rendered outside the
 * prototype's wrapper. Renders the children untouched when no look is set, and
 * a `display: contents` wrapper (no box, no layout change) when one is.
 */
export const RadiantLookScope: React.FC<{ children: ReactNode }> = ({ children }) => {
  const look = useRadiantLook();
  if (!look) return <>{children}</>;
  return (
    <div data-rd-look={look} style={{ display: 'contents' }}>
      {children}
    </div>
  );
};
