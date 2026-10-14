import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sysVar, compVar, shadowVar } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { getAllProjects, ProjectMeta } from '../prototypes/registry';
import { isLightOnly } from '../prototypes/registry-theme';
import { Icon } from '../components/icons';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { GalleryLivePreview } from './GalleryLivePreview';
import { useIsDarkMode } from '../context/ThemeContext';
import { RadianceBackground } from '../app-chrome/RadianceBackground/RadianceBackground';
import { SectionSwitcher } from '../app-chrome/SectionSwitcher/SectionSwitcher';
import { AppLogo } from '../app-chrome/AppLogo/AppLogo';
import { HelpMenu } from '../app-chrome/HelpMenu/HelpMenu';
import frame from '../app-chrome/AppFrame/AppFrame.module.css';

/** Make an inline thumbnail SVG fill its card, cropping like object-fit: cover. */
const fitSvg = (svg: string): string =>
  svg.replace(/<svg\b([^>]*)>/, (_, attrs: string) =>
    `<svg${attrs.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g, '')} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block">`);

type SectionId = 'prototypes' | 'archived';
type Override = 'archived' | 'restored';
type Overrides = Record<string, Override>;

// Archive overrides live in sessionStorage. Survives refresh within the same
// tab, dies when the tab is closed. "Save to code" is the only way to persist
// across tabs / browsers / deployments.
//
// Bidirectional: each override either force-archives a registry-active entry
// or force-restores a registry-archived entry. Restoring something hardcoded
// in registry-core.ts as `section: 'archived'` lands it back under samples.
const STORAGE_KEY = 'radiantplay:archive-overrides';

function loadOverrides(): Overrides {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Overrides = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === 'archived' || v === 'restored') out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function saveOverrides(o: Overrides) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

// ── Icons ────────────────────────────────────────────────────────────────────

const FolderIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 4.5C1.5 3.94772 1.94772 3.5 2.5 3.5H6.29289C6.55811 3.5 6.81246 3.60536 7 3.79289L8 4.79289H13.5C14.0523 4.79289 14.5 5.24061 14.5 5.79289V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H2.5C1.94772 13.5 1.5 13.0523 1.5 12.5V4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArchiveIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="12" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 6V12.5C3 12.7761 3.22386 13 3.5 13H12.5C12.7761 13 13 12.7761 13 12.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 8.5H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoreIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="3.5" cy="8" r="1.2" fill="currentColor" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    <circle cx="12.5" cy="8" r="1.2" fill="currentColor" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

interface SideNavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  count: number;
}

interface Toast {
  message: string;
  undo?: () => void;
}

export const PlaygroundGallery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = (searchParams.get('section') as SectionId) || 'prototypes';
  const [activeSection, setActiveSectionState] = useState<SectionId>(
    initial === 'archived' ? 'archived' : 'prototypes'
  );

  const [overrides, setOverrides] = useState<Overrides>(() => loadOverrides());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const toastTimer = useRef<number | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-card-menu]') && !t.closest('[data-card-menu-trigger]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  // Clear toast on unmount
  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const setActiveSection = (id: SectionId) => {
    setActiveSectionState(id);
    const params = new URLSearchParams(searchParams);
    if (id === 'prototypes') {
      params.delete('section');
    } else {
      params.set('section', id);
    }
    setSearchParams(params, { replace: true });
  };

  const showToast = useCallback((t: Toast) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  // Apply an override. If the resulting state matches the registry default,
  // drop the override entirely (keeps state minimal).
  const applyOverride = (project: ProjectMeta, target: Override) => {
    const prev = { ...overrides };
    const next = { ...overrides };
    const registryArchived = project.section === 'archived';
    const wouldMatchDefault =
      (target === 'archived' && registryArchived) ||
      (target === 'restored' && !registryArchived);
    if (wouldMatchDefault) {
      delete next[project.id];
    } else {
      next[project.id] = target;
    }
    setOverrides(next);
    saveOverrides(next);
    return prev;
  };

  const archiveProject = (project: ProjectMeta) => {
    setOpenMenuId(null);
    const prev = applyOverride(project, 'archived');
    showToast({
      message: `Moved "${project.name}" to archive.`,
      undo: () => {
        setOverrides(prev);
        saveOverrides(prev);
        setToast(null);
      },
    });
  };

  const restoreProject = (project: ProjectMeta) => {
    setOpenMenuId(null);
    const prev = applyOverride(project, 'restored');
    showToast({
      message: `Restored "${project.name}".`,
      undo: () => {
        setOverrides(prev);
        saveOverrides(prev);
        setToast(null);
      },
    });
  };

  const allProjects = getAllProjects();

  // Effective section: override wins if present. 'restored' on a registry-
  // archived entry falls back to 'sample' since that's where most code-archived
  // entries originally lived.
  const effectiveSection = (p: ProjectMeta): string | undefined => {
    const ov = overrides[p.id];
    if (ov === 'archived') return 'archived';
    if (ov === 'restored') return p.section === 'archived' ? 'sample' : p.section;
    return p.section;
  };

  const myProjects = [...allProjects.filter((p) => !effectiveSection(p) || effectiveSection(p) === 'mine')].reverse();
  const sampleProjects = [...allProjects.filter((p) => effectiveSection(p) === 'sample')].reverse();
  const archivedProjects = [...allProjects.filter((p) => effectiveSection(p) === 'archived')].reverse();

  // Projects whose effective section differs from the committed registry value.
  // These are the "unsaved changes" — what "Save to code" would push to disk.
  const archivedAdditions = allProjects.filter(
    (p) => overrides[p.id] === 'archived' && p.section !== 'archived'
  );
  const archivedRemovals = allProjects.filter(
    (p) => overrides[p.id] === 'restored' && p.section === 'archived'
  );
  const totalUnsavedChanges = archivedAdditions.length + archivedRemovals.length;

  const handleOpenProject = (projectId: string) => {
    navigate(`/playground/${projectId}`);
  };

  const navItems: SideNavItem[] = [
    {
      id: 'prototypes',
      label: 'Prototypes',
      icon: <FolderIcon />,
      count: myProjects.length + sampleProjects.length,
    },
    {
      id: 'archived',
      label: 'Archived',
      icon: <ArchiveIcon />,
      count: archivedProjects.length,
    },
  ];

  return (
    <div style={styles.container} className={frame.surfaces}>
      {/* Left pane: the app's logo and its sections, full height */}
      <nav style={styles.sidebar} aria-label="Sections">
        <div style={styles.logoWrap}>
          <AppLogo />
        </div>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = navHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={styles.navItemIcon}>{item.icon}</span>
                <span style={styles.navItemLabel}>{item.label}</span>
                {item.count > 0 && (
                  <span style={{ ...styles.navItemBadge, ...(isActive ? styles.navItemBadgeActive : {}) }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}


          {/* Bottom of the pane: Save to code when there are changes, then Help after a line */}
          <div style={styles.paneBottom}>
          {totalUnsavedChanges > 0 && (
            <div style={styles.sidebarFooter}>
              <button
                type="button"
                onClick={() => setSaveModalOpen(true)}
                style={styles.saveBtn}
                onMouseEnter={(e) => { e.currentTarget.style.background = compVar('button-primary-hover'); }}
                onMouseLeave={(e) => { e.currentTarget.style.background = sysVar('background-brand'); }}
              >
                Save to code
                <span style={styles.saveBtnBadge}>{totalUnsavedChanges}</span>
              </button>
              <div style={styles.sidebarFooterHint}>
                <div style={styles.sidebarFooterHintTop}>
                  <span style={styles.sidebarFooterDot} aria-hidden />
                  <span style={styles.sidebarFooterHintStrong}>
                    {totalUnsavedChanges} unsaved change{totalUnsavedChanges === 1 ? '' : 's'}
                  </span>
                </div>
                <span style={styles.sidebarFooterHintMuted}>
                  cleared when you close this tab
                </span>
              </div>
            </div>
          )}
            <div style={styles.paneBottomLine} role="separator" />
            <HelpMenu />
          </div>
        </nav>

        <div style={styles.column}>
        {/* Section switcher and theme icon on the page surface, outside the content canvas */}
        <header className={frame.topRow}>
          <span aria-hidden="true" />
          <SectionSwitcher active="playground" />
          <div className={frame.topRowEnd}>
            <ThemeSwitch variant="icon" />
          </div>
        </header>
        {/* Projects: a raised panel with the Radiance wash and the cards */}
        <div style={styles.panel}>
        <RadianceBackground heroHeight={440} />
        <main style={styles.main} className={frame.scrollArea}>
          {activeSection === 'prototypes' && (
            <>
              {myProjects.length > 0 && (
                <>
                  <h2 style={styles.sectionHeader}>My prototypes</h2>
                  <div style={styles.grid}>
                    {myProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => handleOpenProject(project.id)}
                        menuOpen={openMenuId === project.id}
                        onMenuToggle={(open) => setOpenMenuId(open ? project.id : null)}
                        onArchive={() => archiveProject(project)}
                      />
                    ))}
                  </div>
                </>
              )}

              {sampleProjects.length > 0 && (
                <>
                  <h2 style={{ ...styles.sectionHeader, ...(myProjects.length > 0 ? { marginTop: `${spacing.H}px` } : {}) }}>Sample prototypes</h2>
                  <div style={styles.grid}>
                    {sampleProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => handleOpenProject(project.id)}
                        menuOpen={openMenuId === project.id}
                        onMenuToggle={(open) => setOpenMenuId(open ? project.id : null)}
                        onArchive={() => archiveProject(project)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {activeSection === 'archived' && (
            <>
              {archivedProjects.length > 0 ? (
                <>
                  <h2 style={styles.sectionHeader}>Archived prototypes</h2>
                  <div style={styles.grid}>
                    {archivedProjects.map((project) => {
                      return (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onClick={() => handleOpenProject(project.id)}
                          archived
                          menuOpen={openMenuId === project.id}
                          onMenuToggle={(open) => setOpenMenuId(open ? project.id : null)}
                          onRestore={() => restoreProject(project)}
                        />
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={styles.emptyState}>
                  <p style={styles.emptyTitle}>No archived prototypes yet</p>
                  <p style={styles.emptySubtitle}>
                    Use the 3-dot menu on any prototype card to archive it. Archives live in this browser tab until you click "Save to code" to commit them.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
        </div>
        </div>

      {/* Toast */}
      {toast && (
        <div style={styles.toast}>
          <span style={styles.toastMsg}>{toast.message}</span>
          {toast.undo && (
            <button type="button" onClick={toast.undo} style={styles.toastUndo}>
              Undo
            </button>
          )}
        </div>
      )}

      {/* Save to code modal */}
      {saveModalOpen && (
        <SaveToCodeModal
          additions={archivedAdditions}
          removals={archivedRemovals}
          onClose={() => setSaveModalOpen(false)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Save to code modal — generates a Claude-ready prompt
// ─────────────────────────────────────────────────────────────────────────────

const SaveToCodeModal: React.FC<{
  additions: ProjectMeta[];  // currently active, want to archive
  removals: ProjectMeta[];   // currently archived in code, want to restore
  onClose: () => void;
}> = ({ additions, removals, onClose }) => {
  const [copied, setCopied] = useState(false);

  const formatList = (list: ProjectMeta[]) =>
    list.map((p) => `  - '${p.id}'   (${p.name})`).join('\n');

  // Group by source file
  const groupByFile = (list: ProjectMeta[]) => {
    const mine = list.filter((p) => !p.section || p.section === 'mine');
    const sample = list.filter((p) => p.section === 'sample' || p.section === 'archived');
    return { mine, sample };
  };

  const addGroups = groupByFile(additions);
  const removeGroups = groupByFile(removals);

  const parts: string[] = [];

  if (additions.length > 0) {
    const additionBlocks: string[] = [];
    if (addGroups.mine.length > 0) {
      additionBlocks.push(
        `src/prototypes/registry-mine.ts (your personal prototypes, fork-only):\n${formatList(addGroups.mine)}`,
      );
    }
    if (addGroups.sample.length > 0) {
      additionBlocks.push(
        `src/prototypes/registry-core.ts (the shared sample library):\n${formatList(addGroups.sample)}`,
      );
    }
    parts.push(`Add \`section: 'archived'\` to:\n\n${additionBlocks.join('\n\n')}`);
  }

  if (removals.length > 0) {
    const removalBlocks: string[] = [];
    if (removeGroups.mine.length > 0) {
      removalBlocks.push(
        `src/prototypes/registry-mine.ts:\n${formatList(removeGroups.mine)}`,
      );
    }
    if (removeGroups.sample.length > 0) {
      removalBlocks.push(
        `src/prototypes/registry-core.ts:\n${formatList(removeGroups.sample)}`,
      );
    }
    parts.push(
      `Remove \`section: 'archived'\` from (restore as samples):\n\n${removalBlocks.join('\n\n')}`,
    );
  }

  const touchesShared =
    addGroups.sample.length > 0 || removeGroups.sample.length > 0;
  const sharedNote = touchesShared
    ? `\nNote: registry-core.ts is shared. The change stays in your fork unless you push it to a shared branch (main, feat/*, fix/*, chore/*).\n`
    : '';

  const snippet = `Apply the following changes to my Radiant Play registry.

${parts.join('\n\n')}
${sharedNote}
When done, I'll close and reopen this tab to clear my session state.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>Save archive layout to code</h3>
            <p style={styles.modalSubtitle}>
              Paste this prompt into your Claude chat. Claude will update the registry files so your archive state becomes permanent for everyone.
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.modalCloseBtn} aria-label="Close">
            <Icon name="cross" size="s" />
          </button>
        </div>

        <pre style={styles.modalSnippet}>{snippet}</pre>

        <div style={styles.modalActions}>
          <button type="button" onClick={onClose} style={styles.modalSecondaryBtn}>
            Close
          </button>
          <button type="button" onClick={handleCopy} style={styles.modalPrimaryBtn}>
            {copied ? '✓ Copied' : 'Copy to clipboard'}
          </button>
        </div>

        <p style={styles.modalHint}>
          After Claude updates the registry, close and reopen this tab to see the new committed state.
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Project Card
// ─────────────────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectMeta;
  onClick: () => void;
  archived?: boolean;
  menuOpen?: boolean;
  onMenuToggle?: (open: boolean) => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

/**
 * Card image, in order of preference: a captured light/dark screenshot, an inline
 * SVG (theme tokens), a single image URL, then a live preview of the prototype.
 */
const CardThumbnail: React.FC<{ project: ProjectMeta }> = ({ project }) => {
  const isDark = useIsDarkMode();
  const thumb = project.thumbnail;
  if (thumb && typeof thumb === 'object') {
    const src = isDark && thumb.dark && !isLightOnly(project) ? thumb.dark : thumb.light;
    return <img src={src} alt={project.name} style={styles.cardImage} />;
  }
  if (thumb?.trimStart().startsWith('<svg')) {
    // Inline SVG from the repo, so its theme tokens resolve against the page
    return (
      <div
        role="img"
        aria-label={project.name}
        style={styles.cardImage}
        dangerouslySetInnerHTML={{ __html: fitSvg(thumb) }}
      />
    );
  }
  if (thumb) return <img src={thumb} alt={project.name} style={styles.cardImage} />;
  return <GalleryLivePreview id={project.id} name={project.name} />;
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  archived,
  menuOpen,
  onMenuToggle,
  onArchive,
  onRestore,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ ...styles.card, ...(archived ? styles.cardArchived : {}) }}
      onClick={onClick}
      onMouseEnter={(e) => {
        setHovered(true);
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = cardShadowHover;
        e.currentTarget.style.borderColor = `color-mix(in srgb, ${sysVar('border-brand')} 40%, transparent)`;
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = cardShadow;
        e.currentTarget.style.borderColor = 'var(--rp-card-border)'; // back to the rest border: none in light, a hairline in dark
        e.currentTarget.style.opacity = archived ? '0.78' : '1';
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
    >
      {/* 3-dot menu — visible on hover or when open */}
      {(onArchive || onRestore) && (
        <div style={{ ...styles.cardMenuWrapper, opacity: hovered || menuOpen ? 1 : 0 }}>
          <button
            type="button"
            data-card-menu-trigger
            style={styles.cardMenuBtn}
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle?.(!menuOpen);
            }}
            aria-label="More actions"
          >
            <MoreIcon />
          </button>
          {menuOpen && (
            <div data-card-menu style={styles.cardMenu}>
              {onArchive && (
                <button
                  type="button"
                  style={styles.cardMenuItem}
                  onClick={(e) => { e.stopPropagation(); onArchive(); }}
                >
                  <ArchiveIcon />
                  <span>Move to archive</span>
                </button>
              )}
              {onRestore && (
                <button
                  type="button"
                  style={styles.cardMenuItem}
                  onClick={(e) => { e.stopPropagation(); onRestore(); }}
                >
                  <FolderIcon />
                  <span>Restore from archive</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div style={styles.cardThumbnail}>
        <CardThumbnail project={project} />
      </div>

      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{project.name}</h3>
        {project.description && (
          <p style={styles.cardDescription}>{project.description}</p>
        )}
        <div style={styles.cardMeta}>
          {project.author && (
            <span style={styles.cardAuthor}>{project.author}</span>
          )}
          {project.lastModified && (
            <span style={styles.cardDate}>
              {new Date(project.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {(project.dsComponents != null || project.customComponents != null) && (
        <div style={styles.cardPills}>
          {project.dsComponents != null && project.dsComponents > 0 && (
            <span style={styles.cardPill}>
              <Icon name="grid-view" size="xs" />
              {project.dsComponents} DS
            </span>
          )}
          {project.customComponents != null && project.customComponents > 0 && (
            <span style={{ ...styles.cardPill, ...styles.cardPillCustom }}>
              <Icon name="plus" size="xs" />
              {project.customComponents} Custom
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

// Brand tint mixed from theme tokens so it follows light and dark mode.
const brandTintSubtle = `color-mix(in srgb, ${sysVar('background-information')} 40%, ${sysVar('background-base')})`;
// Nav item hover, as in the design system's Sidebar
const navHover = sysVar('background-ghost-hover');

// Card shadows: the surface shadow token at rest, a brand glow on hover.
const cardShadow = shadowVar('surface');
const cardShadowHover = `0 20px 48px color-mix(in srgb, ${sysVar('content-brand')} 18%, transparent), 0 0 0 1px color-mix(in srgb, ${sysVar('content-brand')} 8%, transparent)`;

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'row',
    fontFamily: 'var(--font-family-primary)',
  },

  // Top header — full width
  // The shared logo; with the pane's padding it sits where the design system's does
  logoWrap: {
    margin: `0 0 ${spacing.E}px`,
  },
  paneBottom: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.A}px`,
  },
  paneBottomLine: {
    height: '1px',
    background: sysVar('background-subtle'),
    margin: `${spacing.B}px ${spacing.C}px`,
  },

  // Left pane on the sunken page. 260px, the design system's Sidebar width, so the content panel and its
  // section switcher sit in the same place on both pages.
  sidebar: {
    width: '260px',
    flexShrink: 0,
    padding: `${spacing.F}px ${spacing.C}px ${spacing.C}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.A}px`,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.C}px`,
    padding: `10px ${spacing.C}px`, // the design system Sidebar's item padding
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'var(--font-family-primary)',
    fontSize: '14px',
    fontWeight: 500,
    color: sysVar('content-secondary'),
    textAlign: 'left',
    width: '100%',
    transition: 'background 120ms ease, color 120ms ease',
    textDecoration: 'none',
    boxSizing: 'border-box',
  },
  // Same states as the design system's Sidebar, so both left panes behave alike
  navItemActive: {
    background: sysVar('background-ghost-highlight'),
    color: sysVar('content-brand'),
  },
  navItemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  navItemLabel: {
    flex: 1,
  },
  navItemBadge: {
    fontSize: '11px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-secondary'),
    background: sysVar('background-sunken'),
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center',
  },
  navItemBadgeActive: {
    color: sysVar('content-brand'),
    background: sysVar('background-information'),
  },

  // Sidebar footer — Save to code button
  sidebarFooter: {
    padding: `${spacing.C}px ${spacing.B}px ${spacing.B}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.B}px`,
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${spacing.B}px`,
    padding: `${spacing.B}px ${spacing.C}px`,
    background: sysVar('background-brand'),
    border: 'none',
    borderRadius: '8px',
    color: sysVar('content-alternate'),
    fontSize: '13px',
    fontWeight: 'var(--font-weight-emphasis)',
    cursor: 'pointer',
    fontFamily: 'var(--font-family-primary)',
    transition: 'background 120ms ease',
  },
  saveBtnBadge: {
    fontSize: '11px',
    fontWeight: 'var(--font-weight-emphasis)',
    background: `color-mix(in srgb, ${sysVar('content-alternate')} 20%, transparent)`,
    color: sysVar('content-alternate'),
    padding: '1px 6px',
    borderRadius: '8px',
    minWidth: '18px',
    textAlign: 'center',
  },
  sidebarFooterHint: {
    fontSize: '11px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
  },
  sidebarFooterHintTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sidebarFooterDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: sysVar('content-failure'),
    boxShadow: `0 0 0 3px color-mix(in srgb, ${sysVar('content-failure')} 15%, transparent)`,
    flexShrink: 0,
  },
  sidebarFooterHintStrong: {
    fontSize: '11px',
    color: sysVar('content-failure'),
    fontWeight: 'var(--font-weight-emphasis)',
  },
  sidebarFooterHintMuted: {
    color: sysVar('content-secondary'),
    fontWeight: 400,
    fontSize: '10px',
  },

  // The projects panel: raised from the sunken page like the content area in a desktop app.
  // Parent for the Radiance home pattern (position relative, isolation isolate).
  // Right of the left pane: the top row, then the content panel
  column: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  panel: {
    position: 'relative',
    isolation: 'isolate',
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    margin: `0 ${spacing.B}px ${spacing.B}px 0`,
    borderRadius: '16px',
    backgroundColor: 'var(--rp-panel)',
    overflow: 'hidden',
    boxShadow: shadowVar('surface'),
  },

  // Main scrollable body
  main: {
    position: 'relative',
    isolation: 'isolate',
    flex: 1,
    overflowY: 'auto',
    padding: `${spacing.H}px`,
    minWidth: 0,
  },

  // Section header
  sectionHeader: {
    fontSize: '18px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    margin: `0 0 ${spacing.D}px`,
    letterSpacing: '-0.2px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: `${spacing.F}px`,
    maxWidth: '1200px',
  },

  // Empty state
  emptyState: {
    padding: `${spacing.J}px`,
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    margin: `0 0 ${spacing.B}px 0`,
  },
  emptySubtitle: {
    fontSize: '14px',
    color: sysVar('content-secondary'),
    margin: 0,
    lineHeight: '20px',
  },
  code: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    background: sysVar('background-subtle'),
    padding: '1px 6px',
    borderRadius: '4px',
  },

  // Project Card
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--rp-card)',
    border: '1px solid var(--rp-card-border)',
    borderRadius: '20px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 200ms ease, box-shadow 200ms ease',
    boxShadow: cardShadow,
    textAlign: 'left',
  },
  cardArchived: {
    opacity: 0.78,
  },
  cardMenuWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    transition: 'opacity 120ms ease',
  },
  cardMenuBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: `color-mix(in srgb, ${sysVar('background-base')} 95%, transparent)`,
    border: `1px solid ${sysVar('background-subtle')}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: sysVar('content-secondary'),
    padding: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  cardMenu: {
    position: 'absolute',
    top: 32,
    right: 0,
    background: sysVar('background-base'),
    border: `1px solid ${sysVar('background-subtle')}`,
    borderRadius: 8,
    padding: 4,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    minWidth: 180,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    zIndex: 3,
  },
  cardMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-family-primary)',
    color: sysVar('content-primary'),
    textAlign: 'left',
    width: '100%',
  },
  cardThumbnail: {
    height: '120px',
    backgroundColor: sysVar('background-sunken'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardPlaceholder: {
    color: sysVar('border-default'),
  },
  cardContent: {
    padding: `${spacing.D}px`,
    flex: 1,
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: `${spacing.B}px`,
  },
  cardDescription: {
    fontSize: '13px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '20px',
    marginBottom: `${spacing.C}px`,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.D}px`,
  },
  cardAuthor: {
    fontSize: '12px',
    fontWeight: 500,
    color: sysVar('content-secondary'),
  },
  cardDate: {
    fontSize: '12px',
    fontWeight: 400,
    color: sysVar('content-tertiary'),
  },
  cardPills: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    padding: `0 ${spacing.E}px ${spacing.D}px`,
    flexWrap: 'wrap',
  },
  cardPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${spacing.A}px`,
    fontSize: '12px',
    fontWeight: 500,
    color: sysVar('content-brand'),
    background: brandTintSubtle,
    padding: `3px ${spacing.B}px`,
    borderRadius: `${spacing.A}px`,
  },
  cardPillCustom: {
    color: sysVar('content-accent-purple'),
    background: `color-mix(in srgb, ${sysVar('content-accent-purple')} 8%, transparent)`,
  },

  // Toast
  toast: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: sysVar('background-base-inverse'),
    color: sysVar('content-primary-inverse'),
    padding: '10px 14px 10px 16px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: '13px',
    fontFamily: 'var(--font-family-primary)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
    zIndex: 1000,
  },
  toastMsg: {
    color: sysVar('content-primary-inverse'),
  },
  toastUndo: {
    background: 'transparent',
    border: 'none',
    color: sysVar('content-brand-inverse'),
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'var(--font-weight-emphasis)',
    padding: '4px 8px',
    borderRadius: 4,
    fontFamily: 'var(--font-family-primary)',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 24,
  },
  modal: {
    background: sysVar('background-base'),
    borderRadius: 12,
    padding: 24,
    maxWidth: 600,
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 16px 48px rgba(0,0,0,0.24)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    fontFamily: 'var(--font-family-primary)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    margin: 0,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: '13px',
    color: sysVar('content-secondary'),
    margin: 0,
    lineHeight: '18px',
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: sysVar('content-secondary'),
    padding: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  modalSnippet: {
    background: sysVar('background-sunken'),
    border: `1px solid ${sysVar('background-subtle')}`,
    borderRadius: 8,
    padding: 16,
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    lineHeight: '18px',
    color: sysVar('content-primary'),
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: 320,
    overflow: 'auto',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalSecondaryBtn: {
    padding: '8px 16px',
    background: sysVar('background-base'),
    border: `1px solid ${sysVar('border-default')}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: sysVar('content-primary'),
    fontFamily: 'var(--font-family-primary)',
  },
  modalPrimaryBtn: {
    padding: '8px 16px',
    background: sysVar('background-brand'),
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-alternate'),
    fontFamily: 'var(--font-family-primary)',
  },
  modalHint: {
    fontSize: '13px',
    color: sysVar('content-secondary'),
    margin: 0,
    lineHeight: '18px',
  },
};

export default PlaygroundGallery;
