import React, { useState } from 'react';
import { Button, Card, Divider, SegmentedControl, Select, Toggle, Typography, Horizontal, Vertical } from '@/components';
import { JUMPS, SCENARIOS, type ScenarioId } from '../scenarios';
import { HOOK_BOX_OPTIONS, type HookBoxStyle } from './HookBoxes';
import { BANNER_OPTIONS, TITLE_TAG_OPTIONS, PLAN_LINE_OPTIONS, type BannerStyle, type TitleTag, type PlanLine } from './DataCacheViewV3';
import type { NavBadge } from './Shell';
import { HERO_OPTIONS, LAYOUT_OPTIONS, BACKGROUND_OPTIONS, ANIMATION_OPTIONS, ICON_OPTIONS, type HeroStyle, type HookLayout, type HookBackground, type AnimationStyle, type IconStyle } from './CachingHook';
import { LIMIT_OPTIONS, type Limit } from './LimitBanner';
import styles from './ProtoMenu.module.css';

export type PageVersion = 'v1' | 'v2' | BannerStyle;
const EARLIER: { id: PageVersion; label: string }[] = [
  { id: 'v1', label: 'v1 · everything on one page' },
  { id: 'v2', label: 'v2 · state picks what leads' },
];
const PROPOSED: { id: PageVersion; label: string }[] = BANNER_OPTIONS;

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Horizontal justify="space-between" align="center" gap={spacingGap} className={styles.row}>
    <Typography variant="footnote" color="gray-light" noMargin>{label}</Typography>
    <div className={styles.control}>{children}</div>
  </Horizontal>
);
const spacingGap = 12;

/**
 * The prototype's own controls: a gear bottom-left that opens a settings panel. The
 * panel stays open while you switch, so two settings can be compared without
 * reopening a menu. None of it is a product feature.
 */
export const ProtoMenu: React.FC<{
  version: PageVersion;
  onVersion: (v: PageVersion) => void;
  boxStyle: HookBoxStyle;
  onBoxStyle: (b: HookBoxStyle) => void;
  hero: HeroStyle;
  onHero: (h: HeroStyle) => void;
  layout: HookLayout;
  onLayout: (l: HookLayout) => void;
  background: HookBackground;
  onBackground: (b: HookBackground) => void;
  animation: AnimationStyle;
  onAnimation: (a: AnimationStyle) => void;
  icon: IconStyle;
  onIcon: (i: IconStyle) => void;
  navBadge: NavBadge;
  onNavBadge: (b: NavBadge) => void;
  titleTag: TitleTag;
  onTitleTag: (t: TitleTag) => void;
  planLine: PlanLine;
  onPlanLine: (p: PlanLine) => void;
  scenario: ScenarioId;
  onScenario: (id: ScenarioId) => void;
  enabled: boolean;
  onEnabled: (on: boolean) => void;
  limit: Limit;
  onLimit: (l: Limit) => void;
  savingForAll: boolean;
  onSavingForAll: (on: boolean) => void;
  onJump: (id: 'heavy' | 'low') => void;
  onReset: () => void;
}> = ({ version, onVersion, boxStyle, onBoxStyle, hero, onHero, layout, onLayout, background, onBackground, animation, onAnimation, icon, onIcon, navBadge, onNavBadge, titleTag, onTitleTag, planLine, onPlanLine, scenario, onScenario, enabled, onEnabled, limit, onLimit, savingForAll, onSavingForAll, onJump, onReset }) => {
  const [open, setOpen] = useState(false);
  const seg = (opts: { id: string; label: string }[]) => opts.map((o) => ({ id: o.id, label: o.label }));
  return (
    <div className={styles.protoControls}>
      {open && (
        <Card className={styles.panel}>
          <Vertical gap={8} className={styles.panelBody}>
            <Horizontal justify="space-between" align="center">
              <Typography variant="content-label" color="base" noMargin>Prototype settings</Typography>
              <Button variant="tertiary" size="small" icon="cross" iconOnly aria-label="Close" onClick={() => setOpen(false)}>Close</Button>
            </Horizontal>

            <Typography variant="overline" color="gray-light" noMargin>Caching tab</Typography>
            <Row label="Layout"><SegmentedControl size="small" options={seg(LAYOUT_OPTIONS.map((o) => ({ id: o.id, label: o.id === 'stacked' ? '1 column' : '2 columns' })))} value={layout} onChange={(v) => onLayout(v as HookLayout)} /></Row>
            <Row label="Hero"><SegmentedControl size="small" options={seg(HERO_OPTIONS)} value={hero} onChange={(v) => onHero(v as HeroStyle)} /></Row>
            {hero === 'animation' && <Row label="Animation"><Select size="small" options={ANIMATION_OPTIONS} value={animation} onChange={(v) => onAnimation(v as AnimationStyle)} aria-label="Which animation" /></Row>}
            {hero === 'icon' && <Row label="Icon"><Select size="small" options={ICON_OPTIONS} value={icon} onChange={(v) => onIcon(v as IconStyle)} aria-label="Which icon" /></Row>}
            <Row label="Background"><SegmentedControl size="small" options={seg(BACKGROUND_OPTIONS.map((o) => ({ id: o.id, label: o.id === 'dots' ? 'Dots' : o.id === 'lines' ? 'Lines' : 'None' })))} value={background} onChange={(v) => onBackground(v as HookBackground)} /></Row>
            <Row label="Box"><SegmentedControl size="small" options={seg(HOOK_BOX_OPTIONS.map((o) => ({ id: o.id, label: o.id === 'original' ? 'Original' : o.id === 'receipt' ? 'Receipt' : 'Calculator' })))} value={boxStyle} onChange={(v) => onBoxStyle(v as HookBoxStyle)} /></Row>

            <Divider />
            <Typography variant="overline" color="gray-light" noMargin>Data Cache page</Typography>
            <Row label="Earlier designs">
              <SegmentedControl size="small" options={[{ id: 'v1', label: 'v1' }, { id: 'v2', label: 'v2' }]} value={EARLIER.some((o) => o.id === version) ? version : ''} onChange={(v) => onVersion(v as PageVersion)} />
            </Row>
            <Row label="Nav badge">
              <SegmentedControl size="small" options={[{ id: 'included', label: 'Included' }, { id: 'new', label: 'New' }]} value={navBadge} onChange={(v) => onNavBadge(v as NavBadge)} />
            </Row>
            <Row label="Title tag">
              <SegmentedControl size="small" options={TITLE_TAG_OPTIONS.map((o) => ({ id: o.id, label: o.label }))} value={titleTag} onChange={(v) => onTitleTag(v as TitleTag)} />
            </Row>
            <Row label="Plan line">
              <SegmentedControl size="small" options={seg(PLAN_LINE_OPTIONS)} value={planLine} onChange={(v) => onPlanLine(v as PlanLine)} />
            </Row>
            <Row label="Saving column, small orgs"><SegmentedControl size="small" options={[{ id: 'hide', label: 'Hidden' }, { id: 'show', label: 'Shown' }]} value={savingForAll ? 'show' : 'hide'} onChange={(v) => onSavingForAll(v === 'show')} /></Row>
            <Row label="Proposed designs">
              <Select
                size="small"
                options={PROPOSED.map((o) => ({ id: o.id, label: o.label.replace('Banner · ', '') }))}
                value={PROPOSED.some((o) => o.id === version) ? version : undefined}
                placeholder="Pick a banner"
                onChange={(v) => onVersion(v as PageVersion)}
                aria-label="Proposed designs"
              />
            </Row>

            <Divider />
            <Typography variant="overline" color="gray-light" noMargin>Data</Typography>
            <Row label="Scenario"><Select size="small" options={SCENARIOS.map((s) => ({ id: s.id, label: s.label }))} value={scenario} onChange={(v) => onScenario(v as ScenarioId)} aria-label="Scenario" /></Row>
            <Row label="Caching enabled on cluster"><Toggle checked={enabled} onChange={onEnabled} aria-label="Caching enabled on cluster" /></Row>
            <Row label="Limit reached"><SegmentedControl size="small" options={seg(LIMIT_OPTIONS)} value={limit} onChange={(v) => onLimit(v as Limit)} /></Row>
            <Row label="Jump to">
              <Horizontal gap={8}>
                {JUMPS.map((j) => (
                  <Button key={j.id} variant="secondary" size="small" onClick={() => onJump(j.id)}>{j.id === 'heavy' ? 'Heavy model' : 'Low-usage model'}</Button>
                ))}
              </Horizontal>
            </Row>
            <div className={styles.reset}>
              <Button variant="tertiary" size="small" icon="reset" iconPosition="leading" onClick={onReset}>Reset scenario</Button>
            </div>
          </Vertical>
        </Card>
      )}
      <Button variant="secondary" icon="settings" iconOnly aria-label="Prototype settings" onClick={() => setOpen((v) => !v)}>
        Prototype settings
      </Button>
    </div>
  );
};
