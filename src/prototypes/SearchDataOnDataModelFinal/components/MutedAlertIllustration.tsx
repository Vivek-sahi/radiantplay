import React from 'react';

// Moved here unchanged from SearchDataOnDataModelFinal.tsx (2026-09-30) so the
// Query tab's empty states can share it (Komal: "use the empty state component
// strictly from radiant. Use the muted alert for illustration"). Its motion
// classes (empty-state-illo, illo2-*) live in dme.css.

// Radiant's "Muted alert illustration" pattern (Figma Radiant 3.0, "Muted
// Alert" page, node 25122:178936) — every instance is the same 140×118
// canvas, a corner-to-corner clip, and a centerpiece with the family's slow
// bob/twinkle motion; only the centerpiece's own content (and where its own
// accents sit) differs per instance. First used for Tables' own empty state
// (2026-09-25, Komal: "use this illustration for the empty state of
// tables"), extracted here into a shared, accent-agnostic frame so Formula/
// Filters/Parameters (2026-09-25, Komal: "use the same format, illustration
// style... instead of data, use relevant illustrations") can reuse the exact
// canvas/clip/motion plumbing while supplying their own accent layout inside
// `centerpiece` — see DATA_CENTERPIECE vs. ROUND_CENTERPIECE below, which are
// two different Muted Alert templates in the same Figma family (traced disc
// stack vs. a plain muted circle with the icon knocked out in white, e.g.
// "Pinboard", node 25122:178958).
export const MutedAlertIllustration: React.FC<{ centerpiece: React.ReactNode; paused?: boolean; clipId: string }> = ({ centerpiece, paused, clipId }) => (
  <svg
    className={`empty-state-illo${paused ? ' empty-state-illo-paused' : ''}`}
    width="96"
    height="81"
    viewBox="0 0 140 118"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath={`url(#${clipId})`}>
      {centerpiece}
    </g>
    <defs>
      <clipPath id={clipId}>
        <rect width="140" height="118" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Tables' own centerpiece — the traced disc-stack template, unchanged from
// its original inline markup (corner dot-grid bottom-right, diagonal-stripe
// square top-left, the stack itself), just lifted out so it can be passed
// into the shared frame above.
export const DATA_CENTERPIECE = (
  <>
    <g className="illo2-accent-dots" fill="#777E8B">
      {[
        { x0: 127.877, y0: 60.7886 },
        { x0: 98.78, y0: 60.7886 },
        { x0: 98.7799, y0: 92.0922 },
        { x0: 127.877, y0: 91.9998 },
      ].map((block, bi) => (
        Array.from({ length: 5 }).map((_, col) => (
          Array.from({ length: 5 }).map((_, row) => (
            <circle key={`${bi}-${col}-${row}`} cx={block.x0 - col * 6.005} cy={block.y0 + row * 6.005} r={1.38868} />
          ))
        ))
      ))}
    </g>
    <g className="illo2-accent-stripe">
      <mask id="illo-data-stripe-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="11" y="-1" width="60" height="60">
        <path d="M67.4535 58.9996L63.0659 59L11.9994 26.129L11.9994 23.3049L67.4535 58.9996ZM70.9995 56.0324L70.9995 58.8575L11.9993 20.8805L11.9994 18.0564L70.9995 56.0324ZM59.2997 58.9996L54.9112 59L11.9994 31.3775L11.9996 28.5544L59.2997 58.9996ZM51.1441 58.9997L46.7565 58.9991L11.9996 36.627L11.9997 33.8029L51.1441 58.9997ZM42.9904 58.9996L38.6018 58.9991L11.9997 41.8755L11.9998 39.0514L42.9904 58.9996ZM34.8347 58.9997L30.4471 58.9991L11.9988 47.125L11.9989 44.3009L34.8347 58.9997ZM26.6801 58.9997L22.2934 58.9991L11.9989 52.3735L11.999 49.5494L26.6801 58.9997ZM18.5264 58.9997L14.1378 58.9992L12 57.6229L11.9991 54.7979L18.5264 58.9997ZM70.9994 50.7839L70.9993 53.608L11.9992 15.632L11.9992 12.8069L70.9994 50.7839ZM70.9993 45.5344L70.9992 48.3585L11.999 10.3825L11.9991 7.55841L70.9993 45.5344ZM70.9992 40.2849L70.9991 43.11L11.9998 5.13201L12 2.30889L70.9992 40.2849ZM16.5655 -0.000182211L70.9991 35.0364L70.999 37.8615L12.4079 0.147334L12.4622 -0.000219907L16.5655 -0.000182211ZM24.7201 -0.0001991L70.999 29.7879L70.9989 32.612L20.3335 -0.000796976L24.7201 -0.0001991ZM32.8758 -0.000251076L70.9998 24.5384L70.9997 27.3625L28.4892 -0.000848952L32.8758 -0.000251076ZM41.0305 -0.000267966L70.9997 19.2899L70.9996 22.114L36.6429 -0.000830755L41.0305 -0.000267966ZM49.1852 -0.000284855L70.9996 14.0414L70.9995 16.8655L44.7966 -0.000812558L49.1852 -0.000284855ZM57.3398 -0.000301745L70.9995 8.79195L70.9994 11.616L52.9522 -0.000864534L57.3398 -0.000301745ZM65.4945 -0.000318634L70.9994 3.54344L70.9993 6.36754L61.1069 9.4509e-05L65.4945 -0.000318634ZM71 0.000118459L70.9992 1.11806L69.2616 7.76195e-05L71 0.000118459Z" fill="black" />
      </mask>
      <g mask="url(#illo-data-stripe-mask)">
        <rect x="12.0793" y="0.551514" width="58.8495" height="58.8495" fill="#777E8B" />
      </g>
    </g>
    <g className="illo2-stack">
      <g>
        <ellipse cx="72.4003" cy="88.9367" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
        <path d="M38.5619 81.2461V89.4493H106.239V81.2461H38.5619Z" fill="#C0C6CF" />
        <ellipse cx="72.4003" cy="80.7335" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
      </g>
      <g>
        <ellipse cx="72.4003" cy="70.0676" rx="33.8384" ry="8.71596" fill="#EAEDF2" />
        <path d="M38.5619 62.3773V70.5806H106.239V62.3773H38.5619Z" fill="#EAEDF2" />
        <ellipse cx="72.4003" cy="61.8644" rx="33.8384" ry="8.71596" fill="white" />
      </g>
      <g>
        <ellipse cx="72.4003" cy="58.1743" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
        <ellipse cx="72.4003" cy="66.3771" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
        <path d="M38.5619 58.6868V66.89H106.239V58.6868H38.5619Z" fill="#C0C6CF" />
      </g>
      <g>
        <ellipse cx="72.4003" cy="47.7559" rx="33.8384" ry="8.71596" fill="#EAEDF2" />
        <path d="M38.5619 40.0654V48.2686H106.239V40.0654H38.5619Z" fill="#EAEDF2" />
        <ellipse cx="72.4003" cy="39.5527" rx="33.8384" ry="8.71596" fill="white" />
      </g>
      <g>
        <ellipse cx="72.4004" cy="43.8189" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
        <ellipse cx="72.4003" cy="35.6152" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
      </g>
      {/* Diagonal-stripe sheen on the top disc — same motif as the corner
          accent, reused as a mask so the highlight only shows through its
          stripes. */}
      <path d="M38.5619 36.1276V44.3308H106.239V36.1276H38.5619Z" fill="#C0C6CF" />
      <mask id="illo2-mask1" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="12" y="0" width="59" height="60">
        <mask id="illo2-mask2" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="11" y="-1" width="60" height="61">
          <path d="M67.4535 58.9997L63.0659 59.0001L11.9994 26.129L11.9994 23.305L67.4535 58.9997ZM70.9995 56.0325L70.9995 58.8575L11.9993 20.8805L11.9994 18.0565L70.9995 56.0325ZM59.2997 58.9997L54.9112 59.0001L11.9995 31.3785L11.9996 28.5544L59.2997 58.9997ZM51.1441 58.9997L46.7565 58.9992L11.9996 36.627L11.9997 33.8029L51.1441 58.9997ZM42.9904 58.9997L38.6018 58.9992L11.9997 41.8755L11.9998 39.0514L42.9904 58.9997ZM34.8347 58.9997L30.4461 58.9992L11.9988 47.125L11.9989 44.3009L34.8347 58.9997ZM26.6801 58.9998L22.2915 58.9992L11.999 52.3745L11.999 49.5495L26.6801 58.9998ZM18.5254 58.9998L14.1378 58.9992L12 57.623L11.9991 54.7989L18.5254 58.9998ZM70.9994 50.784L70.9993 53.6081L11.9992 15.632L11.9993 12.8079L70.9994 50.784ZM70.9993 45.5345L70.9992 48.3586L11.999 10.3826L11.9991 7.55847L70.9993 45.5345ZM70.9992 40.286L70.9991 43.1101L11.9999 5.13305L12 2.30896L70.9992 40.286ZM16.5655 -0.000121176L70.9991 35.0365L70.999 37.8616L12.4079 0.147395L12.4622 -0.000158872L16.5655 -0.000121176ZM24.7211 -0.000173152L70.999 29.788L70.9989 32.6121L20.3335 -0.000735941L24.7211 -0.000173152ZM32.8758 -0.000190041L70.9999 24.5395L70.9998 27.3636L28.4882 -0.00075283L32.8758 -0.000190041ZM41.0305 -0.000206931L70.9997 19.29L70.9997 22.1151L36.6429 -0.000769719L41.0305 -0.000206931ZM49.1842 -0.000188734L70.9996 14.0415L70.9995 16.8656L44.7966 -0.000751522L49.1842 -0.000188734ZM57.3398 -0.000240709L70.9995 8.79201L70.9994 11.6161L52.9522 -0.000803498L57.3398 -0.000240709ZM65.4945 -0.000257599L70.9994 3.54351L70.9993 6.3676L61.1069 -0.000820388L65.4945 -0.000257599ZM71 0.000179494L70.9992 1.11812L69.2616 0.000138655L71 0.000179494Z" fill="black" />
        </mask>
        <g mask="url(#illo2-mask2)">
          <rect x="12.0793" y="0.551514" width="58.8495" height="58.8495" fill="#777E8B" />
        </g>
      </mask>
      <g mask="url(#illo2-mask1)">
        <path d="M106.239 43.8184C106.239 48.6321 91.0888 52.5344 72.4004 52.5344C53.7119 52.5344 38.5619 48.6321 38.5619 43.8184C38.5619 39.0047 38.5619 35.8604 38.5619 35.8604C57.2503 35.8604 106.239 39.0047 106.239 43.8184Z" fill="white" />
        <ellipse cx="72.4003" cy="35.6153" rx="33.8384" ry="8.71596" fill="white" />
      </g>
    </g>
  </>
);

// Formula/Filters/Parameters' own centerpiece — Radiant's OTHER Muted Alert
// template, e.g. "Pinboard" (figma.com/design/1QlRveXx4wppvDXyPVWUTK, node
// 25122:178958): a plain muted circle with the icon knocked out in white
// (here: drawn in white over the circle — same result, since the page behind
// it is white too), a striped-circle accent tucked behind its top edge, and
// the same dot-grid accent as Tables' own illustration, mirrored to the
// opposite corner. 2026-09-25, Komal: "i dont like bottom oval that you have
// added. Simply add the symbol in a round like this" — replaces the earlier
// ground-ellipse-plus-bare-icon attempt. Formula and Filters reuse the exact
// icons already doing this job elsewhere in this prototype — Icon
// 'formula'/'funnel', the same two the spreadsheet toolbar's own Add
// formula/Filter buttons use. Parameters has no registry equivalent, so it
// wears Icon 'tag' from the registry — the same glyph its section
// header shows, so the two read as one thing.
// Geometry below is traced 1:1 from the node's own exported vectors, not
// eyeballed: disc = the "Subtract" layer (81.7803 box at 29.56/18.3, so
// r 40.8896 centred on 70.4496/59.1896); ring = the "Subtract" stripe layer
// (49.8311x49.9551 box at 79.17/0.33, i.e. r 24.97755 centred on
// 104.0856/25.3076, with 3-unit bands on a 7-unit pitch starting at
// y -0.94441); the white bands over the disc are the node's own "Mask Group"
// (same bands, masked to the disc); dots are its four "Group 5" blocks at
// 12.66/35.86 x 74.79/97.6, each a 5x5 grid of r-1.07139 circles.
const RING_BANDS = [-0.94441, 6.05559, 13.05559, 20.05559, 27.05559, 34.05559, 41.05559, 48.05559];
const DOT_COLS = [1.07176, 5.70436, 10.3374, 14.9704, 19.6034];
const DOT_ROWS = [1.07213, 5.70412, 10.3375, 14.9702, 19.2171];
const DOT_BLOCKS = [
  { x: 12.66, y: 74.79 }, { x: 12.66, y: 97.6 },
  { x: 35.86, y: 74.79 }, { x: 35.86, y: 97.6 },
];
export const ROUND_CENTERPIECE = (icon: React.ReactNode, id: string) => (
  <>
    <defs>
      {/* The disc, minus the icon — the node ships this as one flattened
          "Subtract" path; punching the icon out with a luminance mask is the
          same result while leaving the glyph swappable, which is the whole
          point here. */}
      <mask id={`${id}-knockout`} maskUnits="userSpaceOnUse" x="29.56" y="18.3" width="81.7803" height="81.7803">
        <circle cx="70.4496" cy="59.1896" r="40.8896" fill="#fff" />
        <g style={{ color: '#000' }} transform="translate(70.4496 59.1896) scale(2.4) translate(-9 -9)">
          {icon}
        </g>
      </mask>
      <clipPath id={`${id}-ring`}>
        <circle cx="104.0856" cy="25.3076" r="24.97755" />
      </clipPath>
      <clipPath id={`${id}-disc`}>
        <circle cx="70.4496" cy="59.1896" r="40.8896" />
      </clipPath>
    </defs>
    {/* Disc, ring and the ring's white run across the disc bob as one piece:
        they interlock (the white bands have to stay registered with both the
        grey ones above them and the disc edge below), so moving any one of
        them on its own would tear the overlap. */}
    <g className="illo2-stack">
      <circle cx="70.4496" cy="59.1896" r="40.8896" fill="#C0C6CF" mask={`url(#${id}-knockout)`} />
      <g clipPath={`url(#${id}-ring)`}>
        {RING_BANDS.map(y => <rect key={y} x="79" y={y} width="51" height="3" fill="#777E8B" />)}
      </g>
      <g clipPath={`url(#${id}-disc)`}>
        <g clipPath={`url(#${id}-ring)`}>
          {RING_BANDS.map(y => <rect key={y} x="79" y={y} width="51" height="3" fill="#fff" />)}
        </g>
      </g>
    </g>
    <g className="illo2-accent-dots" fill="#777E8B">
      {DOT_BLOCKS.map((block, bi) => (
        DOT_COLS.map((cx, ci) => (
          DOT_ROWS.map((cy, ri) => (
            <circle key={`${bi}-${ci}-${ri}`} cx={block.x + cx} cy={block.y + cy} r={1.07139} />
          ))
        ))
      ))}
    </g>
  </>
);
