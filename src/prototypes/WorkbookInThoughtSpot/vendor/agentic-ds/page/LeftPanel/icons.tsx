import React from 'react';
import { iconSize } from '@tokens/icons';
import type { IconSize } from '@tokens/icons';

interface LocalIconProps {
  size?: IconSize;
  color?: string;
}

/**
 * Panel toggle. Vector traced from `SpotterRefresh/assets/Panel.svg`.
 *
 * The source files ship with `fill="#777E8B"` baked in; that is swapped for
 * `currentColor` so the panel's own tokens drive the tone — secondary while
 * open, primary in the collapsed rail.
 */
export const PanelToggleIcon: React.FC<LocalIconProps> = ({
  size = 'm',
  color = 'currentColor',
}) => (
  <svg
    width={iconSize[size]}
    height={iconSize[size]}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M13.9265 2.29395L14.0164 2.29883C14.459 2.34383 14.8044 2.71736 14.8044 3.17188V12.9385C14.8044 13.3929 14.459 13.7665 14.0164 13.8115L13.9265 13.8164H2.07495C1.59023 13.8163 1.19708 13.4232 1.19702 12.9385V3.17188C1.19702 2.68709 1.59019 2.29406 2.07495 2.29395H13.9265ZM2.97437 4.07129V12.0391H5.11206V4.07129H2.97437ZM6.8894 4.07129V12.0391H13.0271V4.07129H6.8894Z"
      fill={color}
    />
  </svg>
);

/**
 * External link — marks settings rows that leave the panel for another surface.
 */
export const ExternalLinkIcon: React.FC<LocalIconProps> = ({
  size = 'm',
  color = 'currentColor',
}) => (
  <svg
    width={iconSize[size]}
    height={iconSize[size]}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M12.75 9.25v3a1.5 1.5 0 0 1-1.5 1.5h-7.5a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5h3"
      stroke={color}
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <path d="M9.75 2.25h4v4" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.25 2.75 7.5 8.5" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

/**
 * Compose — the "New chat" glyph. Vector traced from
 * `SpotterRefresh/assets/new chat.svg`, recoloured to `currentColor` as above.
 */
export const ComposeIcon: React.FC<LocalIconProps> = ({
  size = 'm',
  color = 'currentColor',
}) => (
  <svg
    width={iconSize[size]}
    height={iconSize[size]}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M0.888916 12.8885V3.11074C0.888916 1.88344 1.88384 0.888517 3.11114 0.888517H8.00003V2.66629H3.11114C2.86568 2.66629 2.66669 2.86528 2.66669 3.11074V12.8885C2.66669 13.134 2.86568 13.333 3.11114 13.333H12.8889C13.1344 13.333 13.3334 13.134 13.3334 12.8885V7.99963H15.1111V12.8885C15.1111 14.1158 14.1162 15.1107 12.8889 15.1107H3.11114C1.88384 15.1107 0.888916 14.1158 0.888916 12.8885Z"
      fill={color}
    />
    <path
      d="M8.50996 8.74927L14.1289 3.13032L12.8718 1.87324L7.18383 7.56125C7.1218 7.62329 7.0795 7.70233 7.06229 7.78836L6.77979 9.20058L8.29098 8.86912C8.3739 8.85091 8.44993 8.80931 8.50996 8.74927ZM9.76704 10.0064C9.46682 10.3066 9.08685 10.5145 8.67216 10.6056L5.9648 11.1999C5.27564 11.3512 4.65804 10.7449 4.79642 10.053L5.31908 7.43971C5.40511 7.00953 5.61654 6.61439 5.92675 6.30417L11.7719 0.45903C12.3794 -0.148453 13.3643 -0.148453 13.9718 0.45903L15.5431 2.03038C16.1506 2.63786 16.1506 3.62278 15.5431 4.23027L9.76704 10.0064Z"
      fill={color}
    />
  </svg>
);

/**
 * Spotter mark — the circular agent avatar. Traced from
 * `SpotterRefresh/assets/spotter.svg`.
 *
 * Unlike the two glyphs above this is brand artwork, not a monochrome icon: the
 * white / black / green fills are the mark itself, so they stay literal rather
 * than becoming `currentColor`. It follows that the mark does not tint with the
 * row — the active Spotter row recolours its label, not this avatar.
 *
 * The clipping mask needs an id that is unique per instance, or a second render
 * on the page would point both masks at the same node.
 */
export const SpotterMark: React.FC<{ pixelSize?: number }> = ({ pixelSize = 16 }) => {
  const maskId = `spotter-mark-${React.useId().replace(/:/g, '')}`;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <mask
        id={maskId}
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="16"
        height="16"
      >
        <path
          d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z"
          fill="black"
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M-28.598 38.6107C-28.598 38.6107 -27.8593 33.3778 -22.6835 30.058C-22.1718 29.7296 -21.7475 29.2821 -21.4563 28.7488C-20.5289 27.0503 -18.1861 23.3126 -15.5365 23.3342C-12.1088 23.3622 -6.8543 27.5766 -1.48767 26.1159L3.13486 22.0908C4.22728 21.1397 4.77996 19.7183 4.64085 18.2765C4.52492 17.0752 4.56697 15.6355 5.19945 14.6801C6.12256 13.2852 7.67491 11.1855 8.44543 10.1546C8.73497 9.7669 9.19059 9.53828 9.67479 9.53828H11.5097C12.0138 9.53828 12.4905 9.30805 12.8038 8.91281L14.375 6.93234C14.6484 6.5878 14.4348 6.07664 13.997 6.02973L11.4089 5.7515C10.8632 5.69273 10.3542 5.44901 9.96596 5.06079L9.04123 4.13607C8.79428 3.88911 8.4589 3.75 8.1095 3.75H5.34504C4.91907 3.75 4.52007 3.95813 4.27689 4.30753L0.321336 9.98582C-0.255066 10.8129 -1.05146 11.4627 -1.97726 11.8606L-7.35953 14.1738L-17.2775 14.9356C-21.5399 15.2629 -24.7756 18.9101 -24.5934 23.1805L-24.527 24.7383L-25.6507 29.0373L-28.8536 32.6618L-30.5078 38.6102H-28.5974L-28.598 38.6107Z"
          fill="white"
          stroke="black"
          strokeWidth="0.431358"
          strokeMiterlimit="10"
        />
        <path
          d="M7.70259 9.36304V3.75H5.34576C4.9241 3.75 4.52887 3.95436 4.28516 4.29782V7.12645C4.28516 7.52923 4.47442 7.90829 4.79578 8.15093L6.92237 9.75288C7.24373 9.99498 7.70313 9.76583 7.70313 9.36358L7.70259 9.36304Z"
          fill="black"
          stroke="black"
          strokeWidth="0.431358"
          strokeMiterlimit="10"
        />
        <path
          d="M13.997 6.03146L13.0156 5.92578L13.1871 6.54101C13.2124 6.63213 13.2658 6.71247 13.3391 6.77178L14.0503 7.34279L14.3749 6.93408C14.6483 6.58953 14.4348 6.07837 13.997 6.03146Z"
          fill="black"
          stroke="black"
          strokeWidth="0.431358"
          strokeMiterlimit="10"
        />
        <path
          d="M-0.363604 9.65602L-1.45312 11.2266L5.13473 15.7967L6.22425 14.2262L-0.363604 9.65602Z"
          fill="#00FF7C"
          stroke="black"
          strokeWidth="0.485278"
          strokeMiterlimit="10"
        />
        <path
          d="M8 0.25C12.2802 0.25 15.75 3.71979 15.75 8C15.75 12.2802 12.2802 15.75 8 15.75C3.71979 15.75 0.25 12.2802 0.25 8C0.25 3.71979 3.71979 0.250001 8 0.25Z"
          stroke="black"
          strokeWidth="0.5"
          strokeMiterlimit="10"
        />
      </g>
    </svg>
  );
};
