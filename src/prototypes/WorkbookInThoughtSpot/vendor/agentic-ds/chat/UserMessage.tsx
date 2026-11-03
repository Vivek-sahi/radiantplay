import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { spacing } from '@tokens/spacing';
import { fontSize, fontWeight, lineHeight } from '@tokens/typography';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';
import { useSquirclePath } from '../chat/useSquirclePath';
import styles from './UserMessage.module.css';

export type UserMessageState = 'default' | 'hover' | 'edit';

export interface UserMessageFile {
  name: string;
  type: 'csv' | 'xlsx' | 'pdf' | 'png' | 'txt' | 'json';
  size?: string;
}

export interface UserMessageProps {
  message: string;
  highlightedText?: string;
  files?: UserMessageFile[];
  state?: UserMessageState;
  timestamp?: string;
  avatarInitials?: string;
  /**
   * Overrides for the bubble's fill, merged over the default
   * `background-on-base`. A host exploring how the bubble separates from the
   * surface behind it can pass a translucent colour, a gradient, a shadow, or
   * a backdrop filter through here without forking the component.
   */
  bubbleStyle?: React.CSSProperties;
  /**
   * The colour the truncation gradient fades into. Defaults to the bubble's
   * own fill; a translucent bubble needs this told to it, because a gradient
   * cannot resolve what is behind the element it sits in.
   */
  fadeTo?: string;
}

const FILE_CONFIG: Record<UserMessageFile['type'], { icon: string; bg: string; color: string; label: string }> = {
  csv:  { icon: 'excel',         bg: 'var(--rd-sys-color-background-success)',                label: 'CSV',  color: 'var(--rd-sys-color-content-success)' },
  xlsx: { icon: 'excel',         bg: 'var(--rd-sys-color-background-success)',                label: 'XLSX', color: 'var(--rd-sys-color-content-success)' },
  pdf:  { icon: 'pdf',           bg: 'var(--rd-sys-color-background-failure)',                label: 'PDF',  color: 'var(--rd-sys-color-content-failure)' },
  png:  { icon: 'documentation', bg: 'var(--rd-sys-color-background-accent-purple-subtle)',   label: 'PNG',  color: 'var(--rd-sys-color-background-accent-purple-bold)' },
  txt:  { icon: 'text',          bg: 'var(--rd-sys-color-background-subtle)',                 label: 'TXT',  color: 'var(--rd-sys-color-content-secondary)' },
  json: { icon: 'database',      bg: 'var(--rd-sys-color-background-information)',            label: 'JSON', color: 'var(--rd-sys-color-content-information)' },
};


// The collapsed content area never exceeds this in any composition — text
// only, with a highlighted reference, and/or files. (Same as the edit
// textarea's 7-line max.) With files, the text is first guaranteed its line
// count (4, or 3 alongside a highlighted reference); whole file rows then fill
// whatever budget is left, and a partial trailing row hides behind Show more.
// With no files the whole block clips at this height and fades.
const CONTENT_MAX_HEIGHT = 168;
const FILE_ROW_H = 46;

// File card is a fixed width — three sit side by side at the bubble's max width
// (3 × 202.67 + 2 × 8px gap = 624px content). The visible column count is capped
// to whatever fits the available width so cards wrap instead of clipping.
const FILE_CARD_W = 202.67;

// ── FileCard ──────────────────────────────────────────────────────────────────

export const FileCard: React.FC<{ file: UserMessageFile; onRemove?: () => void }> = ({ file, onRemove }) => {
  const cfg = FILE_CONFIG[file.type];
  const displayName = file.name.replace(/\.[^/.]+$/, '');

  const { ref: cardRef, clipPath: cardClip } = useSquirclePath({ cornerRadius: 10, cornerSmoothing: 0.6 });
  const { ref: illRef, clipPath: illClip } = useSquirclePath({ cornerRadius: 6, cornerSmoothing: 0.6 });

  // Strip 'path("...")' wrapper to get raw SVG path data for the stroke overlay
  const cardPathData = cardClip !== 'none' ? cardClip.slice(6, -2) : null;

  return (
    <div className={onRemove ? styles.fileCardWrap : undefined} style={{ position: 'relative', height: 46 }}>
      <div ref={cardRef} style={{ ...s.fileCard, clipPath: cardClip }}>
        <div ref={illRef} style={{ ...s.fileIllustration, clipPath: illClip, backgroundColor: cfg.bg }}>
          <div className={styles.fileIconSvg}>
            <Icon name={cfg.icon as any} size="l" color={cfg.color} />
          </div>
        </div>
        <div style={s.fileText}>
          <span style={s.fileCardName}>{displayName}</span>
          <span style={s.fileCardMeta}>{cfg.label}{file.size ? ` · ${file.size}` : ''}</span>
        </div>
      </div>
      {cardPathData && (
        <svg style={s.squircleBorderSvg} xmlns="http://www.w3.org/2000/svg">
          <path
            className={onRemove ? styles.fileBorderPath : undefined}
            d={cardPathData}
            fill="none"
            stroke="var(--rd-sys-color-border-subtle)"
            strokeWidth="1"
          />
        </svg>
      )}
      {/* Hover-to-remove cross — extends 6px beyond the top-right corner. */}
      {onRemove && (
        <button
          className={styles.fileRemoveBtn}
          onClick={onRemove}
          aria-label={`Remove ${displayName}`}
        >
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden="true">
            <path
              d="M1 1l4 4M5 1L1 5"
              stroke="var(--rd-sys-color-content-primary-inverse)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export const UserMessage: React.FC<UserMessageProps> = ({
  message,
  highlightedText,
  files = [],
  state = 'default',
  timestamp = '10:24 AM',
  bubbleStyle,
  fadeTo,
}) => {
  // Hover — internal state driven by mouse events; state prop can force it
  const [isHoveredInternal, setIsHoveredInternal] = useState(false);
  const isHovered = (state === 'hover' || isHoveredInternal);

  // displayMessage is what the bubble shows — updated when Send is clicked
  const [displayMessage, setDisplayMessage] = useState(message);
  useEffect(() => { setDisplayMessage(message); }, [message]);

  // Edit state — driven by the Edit button or by state prop
  const [isEditingInternal, setIsEditingInternal] = useState(false);
  const [editText, setEditText] = useState(message);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditing = state === 'edit' || isEditingInternal;

  // paddingTop lives inside the textarea (scrollable), not on the container,
  // so text can scroll up to the squircle border instead of stopping at the 12px line.
  // Max height = 7 visible lines + paddingTop so the content area is exactly 7 lines.
  const TEXTAREA_MAX_HEIGHT = 7 * lineHeight.lg + spacing.C; // 168 + 12 = 180px
  useLayoutEffect(() => {
    if (!isEditing || !textareaRef.current) return;
    const ta = textareaRef.current;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, TEXTAREA_MAX_HEIGHT) + 'px';
    if (ta.scrollHeight > TEXTAREA_MAX_HEIGHT) {
      ta.scrollTop = ta.scrollHeight;
    }
  }, [editText, isEditing]);

  // Squircle for edit container (16px all corners, 60% smoothing)
  const { ref: editOuterRef, clipPath: editClip } = useSquirclePath({ cornerRadius: 16, cornerSmoothing: 0.6 });
  const editPathData = editClip !== 'none' ? editClip.slice(6, -2) : null;

  // Responsive left padding: 128px at ≥464px container width, scales to 16px at 356px.
  // Also derive how many fixed-width file cards fit a row at the bubble's max width,
  // so the bubble grows to seat up to 3 cards before wrapping (rather than wrapping
  // early when the message text is short).
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [paddingLeft, setPaddingLeft] = useState(128);
  const [fileColMax, setFileColMax] = useState(3);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      const pl = Math.max(16, Math.min(128, w - 340));
      setPaddingLeft(pl);
      // Available content width for the file row: bubble max (656) capped by the
      // canvas, minus the row's right gutter (16) and the bubble's padding (32).
      const availContent = Math.min(624, w - pl - 16 - 32);
      const cols = Math.max(1, Math.floor((availContent + spacing.B + 1) / (FILE_CARD_W + spacing.B)));
      setFileColMax(Math.min(3, cols));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Truncation (files-aware). Text and files are measured independently, then
  // combined so the text keeps its guaranteed line count and only whole file
  // rows peek through. The visible text is clamped with a native -webkit-line-clamp
  // (inline ellipsis after the last word); a hidden, unclamped twin reports the
  // true natural height so the measurement stays reliable when collapsed.
  const hasFiles = files.length > 0;
  const lineClamp = highlightedText ? 3 : 4;
  const textClampHeight = lineClamp * lineHeight.lg;
  const highlightedHeight = highlightedText ? lineHeight.md + 6 : 0;

  const measureRef = useRef<HTMLParagraphElement>(null);
  const [textNaturalHeight, setTextNaturalHeight] = useState(0);
  const fileGridRef = useRef<HTMLDivElement>(null);
  const [fileGridHeight, setFileGridHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  // The line-clamp ellipsis can't animate, so it's applied only when the collapse
  // has settled — during the open/close animation the text rides its max-height.
  const [clampOn, setClampOn] = useState(true);
  const [showMoreHovered, setShowMoreHovered] = useState(false);

  // Gate the transition off until after first paint so the initial collapse
  // on mount is instant, not an animation.
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useLayoutEffect(() => {
    if (isEditing) return;
    const el = measureRef.current;
    if (!el) return;
    const measure = () => setTextNaturalHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isEditing, displayMessage]);

  useLayoutEffect(() => {
    if (isEditing) return;
    const el = fileGridRef.current;
    if (!el) { setFileGridHeight(0); return; }
    const measure = () => setFileGridHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isEditing, files.length]);

  useEffect(() => {
    setIsExpanded(false);
    setClampOn(true);
  }, [displayMessage]);

  // Derive collapsed / expanded heights from the two measurements.
  let isTruncated: boolean;
  let collapsedHeight: number;
  let expandedHeight: number;
  let textIsClamped: boolean;

  if (hasFiles) {
    const collapsedTextHeight = Math.min(textNaturalHeight, textClampHeight);
    textIsClamped = textNaturalHeight > textClampHeight;
    const textSectionHeight = highlightedHeight + collapsedTextHeight;
    // Whole file rows that fit in what's left after guaranteeing the text its lines.
    const availableForFiles = Math.max(0, CONTENT_MAX_HEIGHT - textSectionHeight - spacing.C);
    const totalFileRows = Math.ceil(files.length / fileColMax);
    const maxRowsThatFit = Math.max(0, Math.floor((availableForFiles + spacing.B) / (FILE_ROW_H + spacing.B)));
    const visibleFileRows = Math.min(totalFileRows, maxRowsThatFit);
    const visibleFilesHeight = visibleFileRows > 0 ? visibleFileRows * FILE_ROW_H + (visibleFileRows - 1) * spacing.B : 0;
    isTruncated = textIsClamped || visibleFileRows < totalFileRows;
    // + spacing.A: the file grid's bottom margin (optical balance below the cards,
    // and breathing room from Show more/less). offsetHeight excludes it, so add it here.
    collapsedHeight = textSectionHeight + (visibleFileRows > 0 ? spacing.C + visibleFilesHeight + spacing.A : 0);
    expandedHeight = highlightedHeight + textNaturalHeight + spacing.C + fileGridHeight + spacing.A;
  } else {
    const combined = highlightedHeight + textNaturalHeight;
    textIsClamped = combined > CONTENT_MAX_HEIGHT;
    isTruncated = textIsClamped;
    collapsedHeight = CONTENT_MAX_HEIGHT;
    expandedHeight = combined;
  }


  const { ref: bubbleRef, clipPath: bubbleClip } = useSquirclePath({
    topLeftCornerRadius: 16,
    topRightCornerRadius: 16,
    bottomRightCornerRadius: 2,
    bottomLeftCornerRadius: 16,
    cornerSmoothing: 0.6,
  });

  // The gradient that hides the truncation seam has to end on whatever the
  // bubble is actually filled with, or the fade reads as a band in the wrong
  // colour. A translucent fill can't be resolved here, so `fadeTo` is how a
  // host names the colour the fade should land on.
  const fadeColor = fadeTo ?? 'var(--rd-sys-color-background-on-base)';

  // ── Edit mode render ────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div ref={wrapperRef} style={s.wrapper}>
        <div style={s.editRow}>
          <div style={{ position: 'relative' }}>
            <div ref={editOuterRef} style={{ ...s.editContainer, clipPath: editClip }} className={styles.editContainerEl}>
              <textarea
                ref={textareaRef}
                value={editText}
                rows={1}
                onChange={e => setEditText(e.target.value)}
                onScroll={e => {
                  const ta = e.currentTarget;
                  ta.classList.add(styles.editTextareaScrolling);
                  if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
                  scrollHideTimer.current = setTimeout(() => {
                    ta.classList.remove(styles.editTextareaScrolling);
                  }, 800);
                }}
                style={s.editTextarea}
                className={styles.editTextareaEl}
                autoFocus
              />
              {files.length > 0 && (
                <div style={{ ...s.fileGrid, gridTemplateColumns: `repeat(${Math.min(files.length, fileColMax)}, ${FILE_CARD_W}px)` }}>
                  {files.map((file, i) => <FileCard key={i} file={file} />)}
                </div>
              )}
              <div style={s.editButtonBar}>
                <Button variant="secondary" size="basic" className={styles.editPillBtn} onClick={() => { setEditText(displayMessage); setIsEditingInternal(false); }}>Cancel</Button>
                <Button variant="primary" size="basic" className={styles.editPillBtn} onClick={() => { setDisplayMessage(editText); setIsExpanded(false); setIsEditingInternal(false); }}>Send</Button>
              </div>
            </div>
            {editPathData && (
              <svg style={s.squircleBorderSvg} xmlns="http://www.w3.org/2000/svg">
                <path d={editPathData} fill="none" stroke="var(--rd-sys-color-border-brand)" strokeWidth="1" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={s.wrapper}>
      <div style={{ ...s.row, paddingLeft }}>
        <div
          style={s.bubbleStack}
          onMouseEnter={() => setIsHoveredInternal(true)}
          onMouseLeave={() => setIsHoveredInternal(false)}
        >
          {/* Message bubble */}
          <div
            ref={bubbleRef}
            style={{
              ...s.bubble,
              clipPath: bubbleClip,
              ...(isHovered ? s.bubbleHover : {}),
              ...bubbleStyle,
            }}
          >
            {/* Content block — files-aware clip + show more below */}
            <div>
              <div
                style={{
                  ...s.contentArea,
                  maxHeight: isTruncated ? (isExpanded ? expandedHeight : collapsedHeight) : undefined,
                  transition: animate ? 'max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
                }}
              >
                {/* Text section — highlighted row + message stay in one block so only
                    the row's own marginBottom separates them, not the flex gap. */}
                <div style={{ position: 'relative' }}>
                  {/* Hidden, unclamped twin — reports the true natural height for the math. */}
                  <p ref={measureRef} aria-hidden="true" style={{ ...s.messageText, ...s.measurer }}>
                    {displayMessage}
                  </p>
                  {highlightedText && (
                    <div style={s.highlightedRow}>
                      <span style={s.highlightedIcon}>
                        <Icon name="follow-up" size="s" color="var(--rd-sys-color-content-secondary)" />
                      </span>
                      <span style={s.highlightedText}>{highlightedText}</span>
                    </div>
                  )}
                  {/* With files, the text animates its own max-height (in lockstep with the
                      outer clip) so files never jump; the native -webkit-line-clamp adds the
                      inline ellipsis once the collapse settles. No files → outer CONTENT_MAX_HEIGHT clip. */}
                  <p
                    onTransitionEnd={(e) => {
                      if (e.propertyName === 'max-height' && !isExpanded) setClampOn(true);
                    }}
                    style={{
                      ...s.messageText,
                      ...(hasFiles
                        ? {
                            overflow: 'hidden',
                            maxHeight: isExpanded ? textNaturalHeight : textClampHeight,
                            transition: animate ? 'max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
                            ...(clampOn
                              ? {
                                  display: '-webkit-box',
                                  WebkitBoxOrient: 'vertical' as const,
                                  WebkitLineClamp: lineClamp,
                                }
                              : {}),
                          }
                        : {}),
                    }}
                  >
                    {displayMessage}
                  </p>
                </div>
                {/* Files — always rendered in full; the outer clip decides how many whole rows peek through */}
                {files.length > 0 && (
                  <div
                    ref={fileGridRef}
                    style={{ ...s.fileGrid, gridTemplateColumns: `repeat(${Math.min(files.length, fileColMax)}, ${FILE_CARD_W}px)` }}
                  >
                    {files.map((file, i) => <FileCard key={i} file={file} />)}
                  </div>
                )}
                {/* Gradient stays mounted so it can dissolve on expand/collapse */}
                {isTruncated && (
                  <div
                    style={{
                      ...s.fadeGradient,
                      background: `linear-gradient(to bottom, transparent, ${fadeColor})`,
                      opacity: isExpanded ? 0 : 1,
                      transition: animate ? 'opacity 0.32s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
                    }}
                  />
                )}
              </div>

              {/* Show more / Show less — sits below the clipped content area */}
              {isTruncated && (
                <button
                  style={{
                    ...s.showMoreBtn,
                    color: showMoreHovered
                      ? 'var(--rd-sys-color-content-primary)'
                      : 'var(--rd-sys-color-content-secondary)',
                  }}
                  onMouseEnter={() => setShowMoreHovered(true)}
                  onMouseLeave={() => setShowMoreHovered(false)}
                  onClick={() => {
                    const next = !isExpanded;
                    if (next) setClampOn(false); // expanding: drop the clamp so the text animates open
                    setIsExpanded(next);
                  }}
                >
                  <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Footer: always rendered for stable height; content shows on hover only */}
          <div style={s.footer}>
            {isHovered && <span style={s.footerTimestamp}>{timestamp}</span>}
            {isHovered && (
              <div style={s.footerButtons}>
                <Button variant="tertiary" size="small" iconOnly icon="copy" title="Copy" className={styles.footerIconBtn}>Copy</Button>
                <Button variant="tertiary" size="small" iconOnly icon="pencil" title="Edit" className={styles.footerIconBtn} onClick={() => { setEditText(displayMessage); setIsEditingInternal(true); }}>Edit</Button>
                <Button variant="tertiary" size="small" iconOnly icon="trash-can" title="Delete" className={styles.footerIconBtn}>Delete</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
  },
  row: {
    paddingRight: spacing.D,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing.A, // 4px between the bubble and the hover footer
    maxWidth: 656,
    minWidth: 320,
  },
  fileGrid: {
    display: 'grid',
    // gridTemplateColumns is set inline with the measured column count so the bubble
    // grows to seat up to 3 fixed-width cards before wrapping to the next row.
    gap: spacing.B,
    marginBottom: spacing.A,
  },
  fileCard: {
    height: 46,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.B,
    padding: `${spacing.A}px ${spacing.B}px ${spacing.A}px ${spacing.A}px`,
    backgroundColor: 'var(--rd-sys-color-background-base)',
    boxSizing: 'border-box' as const,
  },
  squircleBorderSvg: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    overflow: 'visible' as const,
  },
  fileIllustration: {
    width: 38,
    height: 38,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileText: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
    flex: 1,
  },
  fileCardName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.md}px`,
    color: 'var(--rd-sys-color-content-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  fileCardMeta: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.xs}px`,
    color: 'var(--rd-sys-color-content-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  bubble: {
    backgroundColor: 'var(--rd-sys-color-background-on-base)',
    padding: `${spacing.C}px ${spacing.D}px`,
    transition: 'opacity 0.12s ease',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  },
  bubbleHover: {
    opacity: 0.92,
  },
  contentArea: {
    position: 'relative' as const,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.C,
  },
  messageText: {
    margin: 0,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.lg}px`,
    color: 'var(--rd-sys-color-content-primary)',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  measurer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    visibility: 'hidden' as const,
    pointerEvents: 'none' as const,
    zIndex: -1,
  },
  fadeGradient: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    background: 'linear-gradient(to bottom, transparent, var(--rd-sys-color-background-on-base))',
    pointerEvents: 'none' as const,
  },
  highlightedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.A,
    marginBottom: 6,
    minWidth: 0,
  },
  highlightedIcon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  highlightedText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.md}px`,
    color: 'var(--rd-sys-color-content-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    minWidth: 0,
  },
  showMoreBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.A,
    marginTop: spacing.A,
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: `${lineHeight.md}px`,
    fontFamily: 'inherit',
    transition: 'color 0.1s',
  },

  // Edit mode
  editRow: {
    padding: `0 ${spacing.D}px`,
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  editContainer: {
    width: '100%',
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.C,
    backgroundColor: 'var(--rd-sys-color-background-base)',
    // No paddingTop — it lives inside the textarea so text can scroll to the squircle border.
    padding: `0 ${spacing.D}px ${spacing.C}px`,
  },
  editTextarea: {
    width: '100%',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    backgroundColor: 'transparent',
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.lg}px`,
    color: 'var(--rd-sys-color-content-primary)',
    fontFamily: 'inherit',
    paddingTop: spacing.C,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    boxSizing: 'border-box' as const,
    display: 'block' as const,
  },
  editButtonBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.B,
    marginBottom: spacing.A,
  },

  // Hover footer — 24px tall, sits 4px below the bubble (the bubbleStack gap).
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.C,
    width: '100%',
    height: 24,
  },
  footerTimestamp: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.xs}px`,
    color: 'var(--rd-sys-color-content-secondary)',
  },
  footerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.A,
  },
};
