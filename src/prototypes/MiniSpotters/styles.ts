import { sysVar } from '../../tokens/colors/system';
import { fontFamily, fontWeight, fontSize, lineHeight } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { radius } from '../../tokens/radius';

export const colors = {
  bg: sysVar('background-base'),
  bgSunken: sysVar('background-sunken'),
  bgSubtle: sysVar('background-subtle'),
  bgBrand: sysVar('background-brand'),
  bgGhostHover: sysVar('background-ghost-hover'),
  textPrimary: sysVar('content-primary'),
  textSecondary: sysVar('content-secondary'),
  textTertiary: sysVar('content-tertiary'),
  textBrand: sysVar('content-brand'),
  textWhite: sysVar('content-alternate'),
  borderDefault: sysVar('border-default'),
  borderDivider: sysVar('border-divider'),
  borderBrand: sysVar('border-brand'),
};

export const font = {
  family: fontFamily.primary,
  mono: fontFamily.mono,
  weight: fontWeight,
  size: fontSize,
  line: lineHeight,
};

export const CHAT_PANEL_WIDTH = 260;

/** Spotter secondary chat panel (left side) — matches ThoughtSpot screenshot */
export const chatPanelStyles: Record<string, React.CSSProperties> = {
  container: {
    width: `${CHAT_PANEL_WIDTH}px`,
    flexShrink: 0,
    borderRight: `1px solid ${colors.borderDivider}`,
    backgroundColor: colors.bg,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.E}px ${spacing.D}px ${spacing.D}px`,
  },
  title: {
    fontFamily: font.family,
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    margin: 0,
  },
  newChatBtn: {
    margin: `0 ${spacing.D}px ${spacing.D}px`,
  },
  sectionLabel: {
    fontFamily: font.family,
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: `${spacing.C}px ${spacing.D}px ${spacing.B}px`,
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
  },
  chatItem: {
    display: 'block',
    padding: `${spacing.C}px ${spacing.D}px`,
    cursor: 'pointer',
    border: 'none',
    borderLeft: `3px solid transparent`,
    background: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: font.family,
    fontSize: font.size.sm,
    fontWeight: font.weight.regular,
    color: colors.textPrimary,
    lineHeight: `${font.line.md}px`,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.1s ease',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  chatItemActive: {
    borderLeftColor: colors.borderBrand,
    backgroundColor: colors.bgSunken,
    color: colors.textBrand,
    fontWeight: font.weight.medium,
  },
  pinnedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.C}px`,
    padding: `${spacing.C}px ${spacing.D}px`,
    margin: `${spacing.B}px ${spacing.D}px`,
    borderRadius: `${radius.lg}px`,
    backgroundColor: colors.bgSunken,
    border: `1px solid ${colors.borderDivider}`,
    fontFamily: font.family,
    fontSize: font.size.sm,
    color: colors.textPrimary,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.J}px ${spacing.D}px`,
    gap: `${spacing.C}px`,
  },
  emptyText: {
    fontFamily: font.family,
    fontSize: font.size.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
};

/** Main content area — hero, input, context chips, suggestions */
export const homeStyles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
    padding: `${spacing.J}px ${spacing.H}px ${spacing.H}px`,
  },
  content: {
    width: '100%',
    maxWidth: '780px',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: `${spacing.H}px`,
  },
  heroAvatar: {
    width: `${spacing.J}px`,
    height: `${spacing.J}px`,
    borderRadius: `${radius.full}px`,
    backgroundColor: colors.bgBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: `${spacing.D}px`,
  },
  heroTitle: {
    fontFamily: font.family,
    fontSize: font.size['3xl'],
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    margin: 0,
    letterSpacing: '-0.5px',
    lineHeight: `${font.line['3xl']}px`,
  },
  heroSubtitle: {
    fontFamily: font.family,
    fontSize: font.size.md,
    fontWeight: font.weight.regular,
    color: colors.textSecondary,
    margin: `${spacing.B}px 0 0`,
    lineHeight: `${font.line.lg}px`,
  },
};

/** Prompt input bar */
export const inputStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    marginBottom: `${spacing.H}px`,
  },
  container: {
    border: `1.5px solid ${colors.borderDefault}`,
    borderRadius: `${radius.modal}px`,
    backgroundColor: colors.bg,
    padding: `${spacing.D}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.C}px`,
    transition: 'border-color 0.15s ease',
  },
  containerFocused: {
    borderColor: colors.borderBrand,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    fontFamily: font.family,
    fontSize: font.size.md,
    fontWeight: font.weight.regular,
    color: colors.textPrimary,
    border: 'none',
    outline: 'none',
    background: 'none',
    width: '100%',
    lineHeight: `${font.line.lg}px`,
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftActions: {
    display: 'flex',
    gap: `${spacing.B}px`,
    alignItems: 'center',
  },
  rightActions: {
    display: 'flex',
    gap: `${spacing.B}px`,
    alignItems: 'center',
  },
  sendBtn: {
    width: `${spacing.H}px`,
    height: `${spacing.H}px`,
    borderRadius: `${radius.full}px`,
    backgroundColor: colors.bgBrand,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
};

/** Context chips row */
export const contextStyles: Record<string, React.CSSProperties> = {
  section: {
    width: '100%',
    marginBottom: `${spacing.F}px`,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: `${spacing.D}px`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
  },
  headerTitle: {
    fontFamily: font.family,
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    margin: 0,
  },
  headerSubtitle: {
    fontFamily: font.family,
    fontSize: font.size.sm,
    color: colors.textSecondary,
    margin: `${spacing.A}px 0 0`,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${spacing.C}px`,
  },
};

/** Suggested questions */
export const suggestStyles: Record<string, React.CSSProperties> = {
  section: {
    width: '100%',
    marginTop: `${spacing.D}px`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    marginBottom: `${spacing.D}px`,
  },
  title: {
    fontFamily: font.family,
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: `${spacing.C}px`,
  },
  card: {
    padding: `${spacing.D}px ${spacing.E}px`,
    borderRadius: `${radius.card}px`,
    fontFamily: font.family,
    fontSize: font.size.sm,
    fontWeight: font.weight.regular,
    color: colors.textPrimary,
    lineHeight: `${font.line.md}px`,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'block',
    width: '100%',
    border: `1px solid ${colors.borderDivider}`,
    backgroundColor: colors.bgSunken,
    transition: 'all 0.15s ease',
  },
};

/** Quick insights cue cards */
export const quickInsightStyles: Record<string, React.CSSProperties> = {
  section: {
    width: '100%',
    marginTop: `${spacing.F}px`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    marginBottom: `${spacing.D}px`,
  },
  title: {
    fontFamily: font.family,
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: `${spacing.C}px`,
  },
  card: {
    padding: `${spacing.D}px`,
    borderRadius: `${radius.card}px`,
    border: `1px solid ${colors.borderDivider}`,
    backgroundColor: colors.bg,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.B}px`,
    transition: 'all 0.15s ease',
  },
  cardIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: `${radius.sm}px`,
    backgroundColor: colors.bgSubtle,
    flexShrink: 0,
  },
  cardTitle: {
    fontFamily: font.family,
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    margin: 0,
    lineHeight: `${font.line.md}px`,
  },
  cardDescription: {
    fontFamily: font.family,
    fontSize: font.size.xs,
    fontWeight: font.weight.regular,
    color: colors.textSecondary,
    margin: 0,
    lineHeight: `${font.line.sm}px`,
  },
  cardFeatured: {
    backgroundColor: colors.bgBrand,
    borderColor: 'transparent',
  },
  cardIconFeatured: {
    backgroundColor: 'color-mix(in srgb, var(--rd-sys-color-content-alternate) 20%, transparent)',
  },
  cardTitleFeatured: {
    color: colors.textWhite,
  },
  cardDescFeatured: {
    color: 'color-mix(in srgb, var(--rd-sys-color-content-alternate) 75%, transparent)',
  },
};

/** Chat conversation view */
export const chatStyles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: `${spacing.F}px ${spacing.H}px`,
    maxWidth: '780px',
    width: '100%',
    margin: '0 auto',
  },
  agentRow: {
    display: 'flex',
    gap: `${spacing.C}px`,
    padding: `${spacing.C}px 0`,
    alignItems: 'flex-start',
    animation: 'spotterFadeIn 0.35s ease-out forwards',
  },
  agentAvatar: {
    width: `${spacing.G}px`,
    height: `${spacing.G}px`,
    borderRadius: `${radius.full}px`,
    backgroundColor: colors.bgBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  agentText: {
    fontFamily: font.family,
    fontSize: font.size.sm,
    fontWeight: font.weight.regular,
    lineHeight: `${font.line.md}px`,
    color: colors.textPrimary,
    whiteSpace: 'pre-line',
  },
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: `${spacing.C}px 0`,
  },
  userBubble: {
    backgroundColor: colors.bgBrand,
    color: colors.textWhite,
    borderRadius: `${radius['2xl']}px ${radius['2xl']}px ${radius.sm}px ${radius['2xl']}px`,
    padding: `${spacing.C}px ${spacing.D}px`,
    maxWidth: '70%',
    fontFamily: font.family,
    fontSize: font.size.sm,
    fontWeight: font.weight.regular,
    lineHeight: `${font.line.md}px`,
  },
  inputArea: {
    padding: `${spacing.D}px ${spacing.H}px ${spacing.F}px`,
    maxWidth: '780px',
    width: '100%',
    margin: '0 auto',
  },
  typingIndicator: {
    display: 'flex',
    gap: `${spacing.A}px`,
    alignItems: 'center',
    padding: `${spacing.C}px 0`,
  },
  dot: {
    width: `${spacing.A + 2}px`,
    height: `${spacing.A + 2}px`,
    borderRadius: `${radius.full}px`,
    backgroundColor: colors.textTertiary,
    animation: 'dotPulse 1.2s ease-in-out infinite',
  },
};

/** Creator wizard styles */
export const creatorStyles: Record<string, React.CSSProperties> = {
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.E}px`,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.B}px`,
  },
  fieldLabel: {
    fontFamily: font.family,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textPrimary,
  },
  fieldHelper: {
    fontFamily: font.family,
    fontSize: font.size.xs,
    color: colors.textTertiary,
    marginTop: `${spacing.A}px`,
  },
  emojiPicker: {
    display: 'flex',
    gap: `${spacing.B}px`,
    flexWrap: 'wrap',
  },
  emojiBtn: {
    width: `${spacing.I}px`,
    height: `${spacing.I}px`,
    borderRadius: `${radius.lg}px`,
    border: `1px solid ${colors.borderDefault}`,
    backgroundColor: colors.bg,
    fontSize: font.size.lg,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  emojiBtnActive: {
    borderColor: colors.borderBrand,
    backgroundColor: colors.bgSunken,
  },
  dataSourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.C}px`,
    padding: `${spacing.C}px ${spacing.D}px`,
    borderBottom: `1px solid ${colors.borderDivider}`,
  },
  dataSourceName: {
    flex: 1,
    fontFamily: font.family,
    fontSize: font.size.sm,
    color: colors.textPrimary,
  },
  dataSourceType: {
    fontFamily: font.family,
    fontSize: font.size.xs,
    color: colors.textTertiary,
  },
  promptItem: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.C}px`,
    padding: `${spacing.C}px 0`,
    borderBottom: `1px solid ${colors.borderDivider}`,
  },
  promptText: {
    flex: 1,
    fontFamily: font.family,
    fontSize: font.size.sm,
    color: colors.textPrimary,
  },
  addPromptRow: {
    display: 'flex',
    gap: `${spacing.C}px`,
    alignItems: 'center',
    marginTop: `${spacing.C}px`,
  },
};
