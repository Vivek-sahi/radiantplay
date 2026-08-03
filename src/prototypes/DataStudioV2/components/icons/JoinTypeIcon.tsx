/**
 * Join type, drawn rather than colour-coded.
 *
 * Two overlapping circles is already the figure everyone recognises for a join, and the
 * convention fills the regions that survive it: inner keeps only the overlap, left outer
 * keeps the whole left side, and so on. That reads at 16px with no legend, because it's a
 * difference in shape rather than in hue.
 *
 * The canvas badge used to carry this as a tint — the same two circles every time, with the
 * left one blue for inner, cyan for left outer, purple for full outer, amber for right
 * outer. Four hues on one small circle, no legend anywhere, and the words only in a hover
 * tooltip. It also put a whole category on colour alone, which is the one channel some
 * people can't read.
 *
 * Shared deliberately: the agent proposes a join in the thread and the canvas draws it a
 * moment later, and those two have to be visibly the same thing.
 */
import React from 'react';

export type JoinTypeKey = 'inner' | 'left_outer' | 'right_outer' | 'full_outer';

export const JOIN_TYPE_LABEL: Record<JoinTypeKey, string> = {
  inner:       'Inner',
  left_outer:  'Left outer',
  right_outer: 'Right outer',
  full_outer:  'Full outer',
};

const LEFT  = { cx: 8.6, cy: 11, r: 5 };
const RIGHT = { cx: 13.4, cy: 11, r: 5 };

export interface JoinTypeIconProps {
  type: JoinTypeKey;
  size?: number;
  /** Outline colour. The fill is a flat tint of the same family. */
  color?: string;
  fill?: string;
}

export const JoinTypeIcon: React.FC<JoinTypeIconProps> = ({
  type, size = 16, color = '#2770EF', fill = '#BBD2F8',
}) => {
  // useId keeps the clip path unique — several of these render at once in the
  // proposal card, and a shared id would clip every one of them to the first.
  const clipId = `jt-${React.useId().replace(/:/g, '')}`;
  const fillLeft  = type === 'left_outer'  || type === 'full_outer';
  const fillRight = type === 'right_outer' || type === 'full_outer';

  return (
    <svg
      width={size} height={size} viewBox="0 0 22 22" fill="none"
      aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={RIGHT.cx} cy={RIGHT.cy} r={RIGHT.r} />
        </clipPath>
      </defs>

      {/* Inner is the only one that fills a region neither circle owns outright, so it's
          the only one that needs clipping — the left disc cropped to the right one. */}
      {type === 'inner' && (
        <g clipPath={`url(#${clipId})`}>
          <circle cx={LEFT.cx} cy={LEFT.cy} r={LEFT.r} fill={fill} />
        </g>
      )}
      {/* Flat fill, not an alpha tint: full outer paints both discs, and anything
          translucent would darken the overlap into a third value that means nothing. */}
      {fillLeft  && <circle cx={LEFT.cx}  cy={LEFT.cy}  r={LEFT.r}  fill={fill} />}
      {fillRight && <circle cx={RIGHT.cx} cy={RIGHT.cy} r={RIGHT.r} fill={fill} />}

      <circle cx={LEFT.cx}  cy={LEFT.cy}  r={LEFT.r}  stroke={color} strokeWidth="1.2" />
      <circle cx={RIGHT.cx} cy={RIGHT.cy} r={RIGHT.r} stroke={color} strokeWidth="1.2" />
    </svg>
  );
};
