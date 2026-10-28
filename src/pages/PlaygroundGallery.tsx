import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sysVar, compVar, shadowVar } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { getAllProjects, myRegistry, ProjectMeta } from '../prototypes/registry';
import { isLightOnly } from '../prototypes/registry-theme';
import { Icon } from '../components/icons';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { ActionMenu } from '../components/ActionMenu';
import { Button } from '../components/Button';
import { InlineEdit } from '../components/InlineEdit';
import { Table, TableColumn } from '../components/Table';
import { TextInput } from '../components/TextInput';
import { GalleryNote } from './GalleryNote';
import { GalleryAnnouncement } from './GalleryAnnouncement';
import { useIsDarkMode } from '../context/ThemeContext';
import { RadianceBackground } from '../app-chrome/RadianceBackground/RadianceBackground';
import { SectionSwitcher } from '../app-chrome/SectionSwitcher/SectionSwitcher';
import { AppLogo } from '../app-chrome/AppLogo/AppLogo';
import { HelpMenu } from '../app-chrome/HelpMenu/HelpMenu';
import frame from '../app-chrome/AppFrame/AppFrame.module.css';
import gallery from './PlaygroundGallery.module.css';
// The view switch matches the Playground / Design system switcher above it
import switcher from '../app-chrome/SectionSwitcher/SectionSwitcher.module.css';
import { GalleryGroupPicker } from './GalleryGroupPicker';
import { suggestGroups, suggestionPrompt, GroupSuggestion } from './gallerySuggestGroups';
import {
  canSaveLocally,
  saveRegistryChange,
  stashToast,
  takeStashedToast,
  thumbnailState,
  ThumbnailState,
  groupPrompt,
  RegistryChange,
  SavedToast,
} from './galleryRegistryWrite';

const THUMBS_DISMISSED_KEY = 'radiantplay:thumbnails-note-dismissed';
const THUMBS_TOLD_KEY = 'radiantplay:thumbnails-announced';
// Group suggestions the designer dismissed, by suggestion key; kept across visits
const SUGGESTIONS_DISMISSED_KEY = 'radiantplay:group-suggestions-dismissed';

function loadDismissedSuggestions(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(SUGGESTIONS_DISMISSED_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

// Shown under every toast for a change saved to registry-mine.ts
const SAVED_DETAIL = 'Saved here. Your shared link updates after you push your changes.';

/** Make an inline thumbnail SVG fill its card, cropping like object-fit: cover. */
const fitSvg = (svg: string): string =>
  svg.replace(/<svg\b([^>]*)>/, (_, attrs: string) =>
    `<svg${attrs.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g, '')} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block">`);

type SectionId = 'prototypes' | 'archived' | 'samples';
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

const SamplesIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
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
  detail?: string;
  undo?: () => void;
}

export const PlaygroundGallery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get('section');
  const [activeSection, setActiveSectionState] = useState<SectionId>(
    initial === 'archived' || initial === 'samples' ? initial : 'prototypes'
  );

  const [overrides, setOverrides] = useState<Overrides>(() => loadOverrides());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [groupPickerId, setGroupPickerIdState] = useState<string | null>(null);
  const setGroupPickerId = (id: string | null) => {
    pickerAnchor.current = id ? lastPointer.current : null;
    setGroupPickerIdState(id);
  };
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropNav, setDropNav] = useState<SectionId | null>(null);
  const [thumbs, setThumbs] = useState<ThumbnailState | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(() => loadDismissedSuggestions());
  const [thumbsDismissed, setThumbsDismissed] = useState(() => {
    try { return sessionStorage.getItem(THUMBS_DISMISSED_KEY) === '1'; } catch { return false; }
  });
  const toastTimer = useRef<number | null>(null);
  // Where the last click landed, so the group picker opens next to the menu that opened it
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const pickerAnchor = useRef<{ x: number; y: number } | null>(null);

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
    toastTimer.current = window.setTimeout(() => setToast(null), t.detail ? 7000 : 5000);
  }, []);

  // Save one change to registry-mine.ts through the dev server, then toast it.
  // The toast is stashed first: if Vite reloads the page to pick up the new
  // registry, the reloaded gallery shows it (see the effect below).
  const commitLocal = useCallback(async function commit(change: RegistryChange, saved: SavedToast) {
    setOpenMenuId(null);
    stashToast(saved);
    const ok = await saveRegistryChange(change);
    if (!ok) {
      takeStashedToast();
      showToast({ message: "Couldn't save to registry-mine.ts.", detail: 'Is npm run dev still running? Nothing was changed.' });
      return;
    }
    showSaved(saved);
    // No reload came, so drop the stash rather than show it again later
    window.setTimeout(() => takeStashedToast(), 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  const showSaved = (saved: SavedToast) => {
    showToast({
      message: saved.message,
      detail: saved.detail,
      undo: saved.undo
        ? () => {
            setToast(null);
            commitLocal(saved.undo!, { message: 'Undone.', detail: SAVED_DETAIL });
          }
        : undefined,
    });
  };

  // Announce captures this tab hasn't mentioned yet. Wiring a thumbnail rewrites
  // registry-mine.ts, which can reload the page, so the count lives in sessionStorage.
  const announceThumbs = useCallback((state: ThumbnailState) => {
    if (state.status !== 'idle') return;
    let told = 0;
    try { told = Number(sessionStorage.getItem(THUMBS_TOLD_KEY)) || 0; } catch { /* start from 0 */ }
    const total = state.done.length + state.failed.length;
    if (total <= told) return;
    const n = state.done.length - Math.min(told, state.done.length);
    const failed = total - told - n;
    try { sessionStorage.setItem(THUMBS_TOLD_KEY, String(total)); } catch { /* may repeat once */ }
    showToast({
      message: failed
        ? `Captured ${n} thumbnail${n === 1 ? '' : 's'}; ${failed} didn't work.`
        : `Captured ${n} thumbnail${n === 1 ? '' : 's'}.`,
      detail: SAVED_DETAIL,
    });
  }, [showToast]);

  // Thumbnails: ask the dev server which prototypes have none (nothing on a deployed site)
  useEffect(() => {
    thumbnailState().then((state) => {
      setThumbs(state);
      if (state) announceThumbs(state);
    });
  }, [announceThumbs]);

  // While a capture runs, check on it; when it ends, say how it went
  useEffect(() => {
    if (thumbs?.status !== 'running') return;
    const timer = window.setInterval(async () => {
      const next = await thumbnailState();
      if (!next) return;
      setThumbs(next);
      announceThumbs(next);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [thumbs?.status, announceThumbs]);

  const captureThumbnails = async () => {
    if (!thumbs) return;
    const next = await thumbnailState(thumbs.missing);
    if (next) setThumbs(next);
  };

  const dismissSuggestion = (s: GroupSuggestion) => {
    const next = new Set(dismissedSuggestions).add(s.key);
    setDismissedSuggestions(next);
    try { localStorage.setItem(SUGGESTIONS_DISMISSED_KEY, JSON.stringify([...next])); } catch { /* shows again next visit */ }
  };

  // Group the suggested prototypes in one write, so a single Undo puts them back
  const applySuggestion = (s: GroupSuggestion) => {
    const n = s.members.length;
    if (s.members.every((m) => canSaveLocally({ id: m.id } as ProjectMeta))) {
      commitLocal(
        { batch: s.members.map((m) => ({ id: m.id, group: s.group, ...(m.newName ? { name: m.newName } : {}) })) },
        {
          message: s.joins
            ? `Added ${n} prototype${n === 1 ? '' : 's'} to ${s.group}.`
            : `Grouped ${n} prototypes as ${s.group}.`,
          detail: SAVED_DETAIL,
          undo: { batch: s.members.map((m) => ({ id: m.id, group: null, ...(m.newName ? { name: m.name } : {}) })) },
        },
      );
      return;
    }
    navigator.clipboard?.writeText(suggestionPrompt(s)).then(
      () => showToast({ message: 'Copied a prompt for Claude.', detail: 'Paste it into Claude to group these prototypes.' }),
      () => showToast({ message: "Couldn't copy the prompt.", detail: suggestionPrompt(s) }),
    );
  };

  const dismissThumbs = () => {
    setThumbsDismissed(true);
    try { sessionStorage.setItem(THUMBS_DISMISSED_KEY, '1'); } catch { /* stays dismissed until reload */ }
  };

  // A save that made Vite reload the page left its toast behind
  useEffect(() => {
    const saved = takeStashedToast();
    if (saved) showSaved(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (canSaveLocally(project)) {
      dropOverride(project);
      commitLocal(
        { id: project.id, section: 'archived' },
        { message: `Moved "${project.name}" to archive.`, detail: SAVED_DETAIL, undo: { id: project.id, section: 'mine' } },
      );
      return;
    }
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
    if (canSaveLocally(project)) {
      dropOverride(project);
      commitLocal(
        { id: project.id, section: 'mine' },
        { message: `Restored "${project.name}".`, detail: SAVED_DETAIL, undo: { id: project.id, section: 'archived' } },
      );
      return;
    }
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

  // A saved change makes any session override for that prototype stale
  const dropOverride = (project: ProjectMeta) => {
    if (!overrides[project.id]) return;
    const next = { ...overrides };
    delete next[project.id];
    setOverrides(next);
    saveOverrides(next);
  };

  const groupUndo = (project: ProjectMeta): RegistryChange => ({ id: project.id, group: project.group?.trim() || null });

  // From the group picker, or from dropping a card on a heading (null: Other)
  const moveToGroup = (project: ProjectMeta, group: string | null) => {
    setGroupPickerId(null);
    if ((project.group?.trim() || null)?.toLowerCase() === group?.toLowerCase()) return;
    if (canSaveLocally(project)) {
      commitLocal(
        { id: project.id, group },
        {
          message: group ? `Moved "${project.name}" to ${group}.` : `Took "${project.name}" out of its group.`,
          detail: SAVED_DETAIL,
          undo: groupUndo(project),
        },
      );
      return;
    }
    navigator.clipboard?.writeText(groupPrompt(project, group)).then(
      () => showToast({ message: 'Copied a prompt for Claude.', detail: 'Paste it into Claude to move this prototype.' }),
      () => showToast({ message: "Couldn't copy the prompt.", detail: groupPrompt(project, group) }),
    );
  };

  const renameGroup = (from: string, to: string) => {
    commitLocal(
      { renameGroup: { from, to } },
      { message: `Renamed "${from}" to "${to}".`, detail: SAVED_DETAIL, undo: { renameGroup: { from: to, to: from } } },
    );
  };
  const allSaveLocally = (items: ProjectMeta[]) => items.every(canSaveLocally);

  const allProjects = getAllProjects();

  // Groups the picker offers: those used in the same registry as the prototype, so a
  // designer's own prototype isn't offered the sample groups. First spelling wins.
  const groupsLike = (project: ProjectMeta) => {
    const mine = myRegistry.some((p) => p.id === project.id);
    return [...new Map(
      allProjects
        .filter((p) => myRegistry.some((m) => m.id === p.id) === mine)
        .map((p) => p.group?.trim() || '').filter(Boolean).reverse()
        .map((g) => [g.toLowerCase(), g] as const),
    ).values()].sort((a, b) => a.localeCompare(b));
  };
  const groupPickerProject = groupPickerId ? allProjects.find((p) => p.id === groupPickerId) : undefined;
  const draggingProject = draggingId ? allProjects.find((p) => p.id === draggingId) : undefined;

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
      count: myProjects.length,
    },
    {
      id: 'archived',
      label: 'Archived',
      icon: <ArchiveIcon />,
      count: archivedProjects.length,
    },
    {
      id: 'samples',
      label: 'Samples',
      icon: <SamplesIcon />,
      count: sampleProjects.length,
    },
  ];

  const dragProps = (project: ProjectMeta) =>
    canSaveLocally(project)
      ? { onDragStart: () => setDraggingId(project.id), onDragEnd: () => { setDraggingId(null); setDropNav(null); } }
      : {};

  const renderRowActions = (project: ProjectMeta) => {
    const archived = effectiveSection(project) === 'archived';
    return (
      <ActionMenu
        placement="bottom-end"
        trigger={<Button variant="tertiary" size="small" icon="more" iconOnly aria-label={`Actions for ${project.name}`}>Actions</Button>}
      >
        <ActionMenu.Item label="Move to group" icon={<FolderIcon />} onClick={() => setGroupPickerId(project.id)} />
        {archived
          ? <ActionMenu.Item label="Restore from archive" icon={<FolderIcon />} onClick={() => restoreProject(project)} />
          : <ActionMenu.Item label="Move to archive" icon={<ArchiveIcon />} onClick={() => archiveProject(project)} />}
      </ActionMenu>
    );
  };

  const renderCard = (project: ProjectMeta) => (
    <ProjectCard
      key={project.id}
      project={project}
      onClick={() => handleOpenProject(project.id)}
      menuOpen={openMenuId === project.id}
      onMenuToggle={(open) => setOpenMenuId(open ? project.id : null)}
      onArchive={() => archiveProject(project)}
      onMoveToGroup={() => { setOpenMenuId(null); setGroupPickerId(project.id); }}
      {...dragProps(project)}
    />
  );

  // Where a dragged card can land in the left pane: Archived archives it, Prototypes restores it
  const navAccepts = (id: SectionId) => {
    if (!draggingProject) return false;
    const archived = effectiveSection(draggingProject) === 'archived';
    return (id === 'archived' && !archived) || (id === 'prototypes' && archived);
  };
  const dropOnNav = (id: SectionId) => {
    setDropNav(null);
    if (!draggingProject || !navAccepts(id)) return;
    if (id === 'archived') archiveProject(draggingProject);
    else restoreProject(draggingProject);
    setDraggingId(null);
  };

  return (
    <div
      style={styles.container}
      className={frame.surfaces}
      onPointerDownCapture={(e) => { lastPointer.current = { x: e.clientX, y: e.clientY }; }}
    >
      {/* Left pane: the app's logo and its sections, full height */}
      <nav style={styles.sidebar} aria-label="Sections">
        <div style={styles.logoWrap}>
          <AppLogo />
        </div>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const accepts = navAccepts(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
                className={accepts ? `${gallery.dropTarget} ${dropNav === item.id ? gallery.dropTargetOver : ''}` : undefined}
                onDragOver={accepts ? (e) => { e.preventDefault(); setDropNav(item.id); } : undefined}
                onDragLeave={accepts ? () => setDropNav(null) : undefined}
                onDrop={accepts ? (e) => { e.preventDefault(); dropOnNav(item.id); } : undefined}
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
        <CapturingContext.Provider value={new Set(thumbs?.capturing ?? [])}>
          {activeSection === 'prototypes' && (() => {
            // One suggestion at a time; the next shows once this one is used or dismissed
            const s = suggestGroups(myProjects).find((x) => !dismissedSuggestions.has(x.key));
            if (!s) return null;
            const n = s.members.length;
            return (
              <div className={gallery.note}>
                <GalleryNote
                  icon="folder"
                  actionLabel={s.joins ? 'Add to group' : 'Group them'}
                  onAction={() => applySuggestion(s)}
                  onDismiss={() => dismissSuggestion(s)}
                >
                  {s.joins
                    ? <>{n} prototype{n === 1 ? ' looks' : 's look'} like part of <strong>{s.group}</strong>.</>
                    : <>{n} prototypes look like one project: <strong>{s.group}</strong>.</>}
                </GalleryNote>
              </div>
            );
          })()}

          {activeSection === 'prototypes' && thumbs && (() => {
            const running = thumbs.status === 'running';
            const n = thumbs.missing.length;
            if (running) {
              const left = thumbs.capturing.length;
              return (
                <div className={gallery.note}>
                  <GalleryNote icon="camera">Capturing thumbnails, {left} left…</GalleryNote>
                </div>
              );
            }
            if (!n || thumbsDismissed || thumbs.setup === 'declined') return null;
            const which = `${n} ${n === 1 ? 'prototype has' : 'prototypes have'} no thumbnail yet`;
            return (
              <div className={gallery.note}>
                {thumbs.setup === 'ready' ? (
                  <GalleryNote icon="camera" actionLabel="Capture thumbnails" onAction={captureThumbnails} onDismiss={dismissThumbs}>
                    {which}.
                  </GalleryNote>
                ) : (
                  <GalleryNote icon="camera" onDismiss={dismissThumbs}>
                    {which}. Ask Claude to &ldquo;set up thumbnails&rdquo; to capture them.
                  </GalleryNote>
                )}
              </div>
            );
          })()}

          {activeSection === 'prototypes' && (
            myProjects.length > 0 ? (
              <GroupedProjects
                key="prototypes"
                scope="mine"
                title="My prototypes"
                projects={myProjects}
                renderCard={renderCard}
                draggingProject={draggingProject}
                onDropOnHeading={(project, group) => { setDraggingId(null); moveToGroup(project, group); }}
                onRenameGroup={renameGroup}
                canRename={allSaveLocally}
                onOpen={(p) => handleOpenProject(p.id)}
                renderRowActions={renderRowActions}
              />
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>No prototypes yet</p>
                <p style={styles.emptySubtitle}>
                  Ask Claude to run /rp-new-prototype to start one. Built-in examples are under Samples.
                </p>
              </div>
            )
          )}

          {activeSection === 'samples' && (
            <GroupedProjects
              key="samples"
              scope="sample"
              title="Sample prototypes"
              projects={sampleProjects}
              renderCard={renderCard}
              onOpen={(p) => handleOpenProject(p.id)}
              renderRowActions={renderRowActions}
            />
          )}

          {activeSection === 'archived' && (
            <>
              {archivedProjects.length > 0 ? (
                <GroupedProjects
                  key="archived"
                  scope="archived"
                  title="Archived prototypes"
                  projects={archivedProjects}
                  renderCard={(project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => handleOpenProject(project.id)}
                      archived
                      menuOpen={openMenuId === project.id}
                      onMenuToggle={(open) => setOpenMenuId(open ? project.id : null)}
                      onRestore={() => restoreProject(project)}
                      onMoveToGroup={() => { setOpenMenuId(null); setGroupPickerId(project.id); }}
                      {...dragProps(project)}
                    />
                  )}
                  draggingProject={draggingProject}
                  onDropOnHeading={(project, group) => { setDraggingId(null); moveToGroup(project, group); }}
                  onRenameGroup={renameGroup}
                  canRename={allSaveLocally}
                  onOpen={(p) => handleOpenProject(p.id)}
                  renderRowActions={renderRowActions}
                />
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
        </CapturingContext.Provider>
        </main>
        </div>
        </div>

      {/* Toast */}
      {toast && (
        <div style={styles.toast} role="status">
          <span className={gallery.toastText}>
            <span style={styles.toastMsg}>{toast.message}</span>
            {toast.detail && <span className={gallery.toastDetail}>{toast.detail}</span>}
          </span>
          {toast.undo && (
            <button type="button" onClick={toast.undo} style={styles.toastUndo}>
              Undo
            </button>
          )}
        </div>
      )}

      {groupPickerProject && (
        <GalleryGroupPicker
          project={groupPickerProject}
          knownGroups={groupsLike(groupPickerProject)}
          anchor={pickerAnchor.current}
          savesLocally={canSaveLocally(groupPickerProject)}
          onSave={(group) => moveToGroup(groupPickerProject, group)}
          onClose={() => setGroupPickerId(null)}
        />
      )}

      {/* Save to code modal */}
      {saveModalOpen && (
        <SaveToCodeModal
          additions={archivedAdditions}
          removals={archivedRemovals}
          onClose={() => setSaveModalOpen(false)}
        />
      )}

      {/* Shows once per browser, to introduce gallery groups */}
      <GalleryAnnouncement />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Groups. Each prototype's `group` comes from its registry entry, so everyone
// opening the site sees the same headings. Group names match without case, so
// "Spotter" and "spotter" are one group; the first spelling seen is shown.
// ─────────────────────────────────────────────────────────────────────────────

const COLLAPSED_KEY = 'radiantplay:gallery-collapsed';
const SORT_KEY = 'radiantplay:gallery-sort';
const UNGROUPED = 'Other';
// Drop-target id for the new-group area; not a real group name
const NEW_GROUP = '\u0000new';

type SortId = 'recent' | 'name' | 'group';
const SORT_LABELS: Record<SortId, string> = { recent: 'Recent', name: 'Name', group: 'Group' };
type ViewId = 'grid' | 'list';
const VIEW_KEY = 'radiantplay:gallery-view';

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

function loadSort(): SortId {
  try {
    const v = localStorage.getItem(SORT_KEY);
    return v === 'name' || v === 'group' ? v : 'recent';
  } catch {
    return 'recent';
  }
}

const GROUPED_KEY = 'radiantplay:gallery-grouping';

function loadGrouped(): boolean {
  try {
    return localStorage.getItem(GROUPED_KEY) !== 'all';
  } catch {
    return true;
  }
}

function loadView(): ViewId {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable: the choice just resets next visit
  }
}

const groupOf = (p: ProjectMeta) => p.group?.trim() || '';
const sameGroup = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
// Undated prototypes sort after dated ones
const modifiedTime = (p: ProjectMeta) => {
  const t = p.lastModified ? Date.parse(p.lastModified) : NaN;
  return Number.isNaN(t) ? -Infinity : t;
};

const GroupedProjects: React.FC<{
  /** Keeps collapse state apart per section */
  scope: string;
  title: string;
  projects: ProjectMeta[];
  renderCard: (project: ProjectMeta) => React.ReactNode;
  /** The card being dragged, when it can be saved; headings then accept it */
  draggingProject?: ProjectMeta;
  /** `group` is null for Other, which takes the card out of its group */
  onDropOnHeading?: (project: ProjectMeta, group: string | null) => void;
  /** Renames a group on every prototype in it; offered when all of them can be saved */
  onRenameGroup?: (from: string, to: string) => void;
  canRename?: (items: ProjectMeta[]) => boolean;
  /** List view: open a prototype, and the actions at the end of its row */
  onOpen: (project: ProjectMeta) => void;
  renderRowActions?: (project: ProjectMeta) => React.ReactNode;
}> = ({ scope, title, projects, renderCard, draggingProject, onDropOnHeading, onRenameGroup, canRename, onOpen, renderRowActions }) => {
  const [dropHeading, setDropHeading] = useState<string | null>(null);
  const [newGroupFor, setNewGroupFor] = useState<ProjectMeta | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => loadCollapsed());
  const [storedSort, setSort] = useState<SortId>(() => loadSort());
  const [view, setView] = useState<ViewId>(() => loadView());
  const [grouped, setGrouped] = useState<boolean>(() => loadGrouped());
  // Group is a list-view sort; the grid already sorts into groups
  const sort: SortId = view === 'grid' && storedSort === 'group' ? 'recent' : storedSort;
  const sortOptions = (Object.keys(SORT_LABELS) as SortId[]).filter((id) => view === 'list' || id !== 'group');

  // Recent: newest first, ties keep registry order (newest added first). Name: A to Z.
  // Group: A to Z by group, prototypes without one last, then by name.
  const visible = [...projects].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'group') {
      const ga = groupOf(a);
      const gb = groupOf(b);
      if (!ga !== !gb) return ga ? -1 : 1;
      return ga.localeCompare(gb) || a.name.localeCompare(b.name);
    }
    return modifiedTime(b) - modifiedTime(a);
  });

  // Headings follow the sort: by their newest prototype, or by name.
  // Prototypes without a group go last, under Other.
  const headings = new Map<string, ProjectMeta[]>();
  for (const p of visible) {
    const group = groupOf(p);
    const name = group ? [...headings.keys()].find((k) => sameGroup(k, group)) ?? group : UNGROUPED;
    if (!headings.has(name)) headings.set(name, []);
    headings.get(name)!.push(p);
  }
  const ordered = [...headings.entries()]
    .filter(([name]) => name !== UNGROUPED)
    .sort((a, b) => (sort === 'name' ? a[0].localeCompare(b[0]) : 0));
  if (headings.has(UNGROUPED)) ordered.push([UNGROUPED, headings.get(UNGROUPED)!]);
  const hasGroups = projects.some((p) => groupOf(p));

  const changeSort = (next: SortId) => {
    setSort(next);
    store(SORT_KEY, next);
  };

  const changeGrouped = (next: boolean) => {
    setGrouped(next);
    store(GROUPED_KEY, next ? 'groups' : 'all');
  };

  const changeView = (next: ViewId) => {
    setView(next);
    store(VIEW_KEY, next);
  };

  const columns: TableColumn<ProjectMeta>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (_v, p) => (
        <span className={gallery.listName}>
          <span className={gallery.listTitle}>{p.name}</span>
          {p.description && <span className={gallery.listDescription}>{p.description}</span>}
        </span>
      ),
    },
    {
      key: 'group',
      label: 'Group',
      width: '180px',
      render: (_v, p) => (groupOf(p) ? <span className={gallery.listGroup}>{groupOf(p)}</span> : <span className={gallery.listMuted}>None</span>),
    },
    { key: 'author', label: 'Author', width: '140px', render: (_v, p) => p.author ?? <span className={gallery.listMuted}>None</span> },
    {
      key: 'lastModified',
      label: 'Last modified',
      width: '130px',
      render: (_v, p) => (p.lastModified
        ? <span className={gallery.listDate}>{new Date(p.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        : <span className={gallery.listMuted}>None</span>),
    },
    ...(renderRowActions
      ? [{
          key: 'actions',
          label: '',
          width: '56px',
          align: 'right' as const,
          // The menu sits inside a clickable row, so its clicks stop here
          render: (_v: unknown, p: ProjectMeta) => (
            <span onClick={(e) => e.stopPropagation()} className={gallery.listActions}>{renderRowActions(p)}</span>
          ),
        }]
      : []),
  ];

  const toggleHeading = (name: string) => {
    const id = `${scope}:${name}`;
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
    store(COLLAPSED_KEY, JSON.stringify([...next]));
  };

  // Cards keep one order in the page (by id) and CSS `order` places them. Re-sorting then
  // moves nothing in the page, so cards (and their images) aren't rebuilt.
  const renderGrid = (items: ProjectMeta[]) => (
    <div style={styles.grid}>
      {[...items].sort((a, b) => a.id.localeCompare(b.id)).map((p) => (
        <div key={p.id} className={gallery.cardSlot} style={{ order: items.indexOf(p) }}>
          {renderCard(p)}
        </div>
      ))}
    </div>
  );

  return (
    <div className={gallery.content}>
      <div className={gallery.titleRow}>
        <h2 style={{ ...styles.sectionHeader, margin: 0 }}>{title}</h2>
        <div className={gallery.titleControls}>
        {projects.length > 1 && (
          <ActionMenu
            placement="bottom-end"
            trigger={
              <button type="button" className={gallery.sortTrigger} aria-label="Sort prototypes">
                <span className={gallery.sortLabel}>Sort:</span> {SORT_LABELS[sort]}
                <Icon name="chevron-down" size="xs" />
              </button>
            }
          >
            <ActionMenu.Group label="Sort by">
              {sortOptions.map((id) => (
                <ActionMenu.Item
                  key={id}
                  label={SORT_LABELS[id]}
                  icon={<span className={gallery.sortCheck}>{sort === id && <Icon name="checkmark" size="s" />}</span>}
                  onClick={() => changeSort(id)}
                />
              ))}
            </ActionMenu.Group>
            {view === 'grid' && hasGroups && (
              <ActionMenu.Group label="Show">
                {([['groups', 'In groups'], ['all', 'All in one grid']] as const).map(([id, label]) => (
                  <ActionMenu.Item
                    key={id}
                    label={label}
                    icon={<span className={gallery.sortCheck}>{(grouped ? 'groups' : 'all') === id && <Icon name="checkmark" size="s" />}</span>}
                    onClick={() => changeGrouped(id === 'groups')}
                  />
                ))}
              </ActionMenu.Group>
            )}
          </ActionMenu>
        )}
          <div className={switcher.switcher} role="group" aria-label="View">
            {([['grid', 'grid-view', 'Grid view'], ['list', 'list-view', 'List view']] as const).map(([id, icon, label]) => (
              <button
                key={id}
                type="button"
                className={`${switcher.item} ${gallery.viewItem} ${view === id ? switcher.active : ''}`}
                aria-pressed={view === id}
                aria-label={label}
                title={label}
                onClick={() => changeView(id)}
              >
                <Icon name={icon} size="s" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className={gallery.list}>
          {/* Table isn't generic at the JSX level, so its rows are typed as plain records here */}
          <Table
            columns={columns as unknown as TableColumn[]}
            data={visible as unknown as Record<string, unknown>[]}
            rowKey="id"
            hoverable
            onRowClick={(row) => onOpen(row as unknown as ProjectMeta)}
          />
        </div>
      ) : !hasGroups || !grouped ? (
        renderGrid(visible)
      ) : (
        <div className={gallery.groups}>
        {[...ordered].sort((a, b) => a[0].localeCompare(b[0])).map(([name, items]) => {
          const position = ordered.findIndex(([n]) => n === name);
          const isCollapsed = collapsed.has(`${scope}:${name}`);
          const current = draggingProject ? groupOf(draggingProject) : '';
          const accepts = Boolean(draggingProject && onDropOnHeading
            && (name === UNGROUPED ? current !== '' : !sameGroup(current, name)));
          const editable = name !== UNGROUPED && Boolean(onRenameGroup) && Boolean(canRename?.(items));
          const toggle = (
            <button
              type="button"
              className={gallery.groupToggle}
              aria-expanded={!isCollapsed}
              aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${name}`}
              onClick={() => toggleHeading(name)}
            >
              <span className={`${gallery.groupChevron} ${isCollapsed ? gallery.groupChevronCollapsed : ''}`}>
                <Icon name="chevron-down" size="s" />
              </span>
            </button>
          );
          return (
            <section
              key={name}
              style={{ order: position }}
              className={`${gallery.group} ${position === 0 ? gallery.groupFirst : ''} ${isCollapsed ? gallery.groupCollapsed : ''} ${accepts ? gallery.dropTarget : ''} ${accepts && dropHeading === name ? gallery.dropTargetOver : ''}`}
              onDragOver={accepts ? (e) => { e.preventDefault(); setDropHeading(name); } : undefined}
              onDragLeave={accepts ? (e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropHeading(null);
              } : undefined}
              onDrop={accepts ? (e) => {
                e.preventDefault();
                setDropHeading(null);
                onDropOnHeading!(draggingProject!, name === UNGROUPED ? null : name);
              } : undefined}
            >
              {/* Same row either way: chevron, name, count, and when collapsed what's inside */}
              <div className={gallery.groupHeader}>
                {toggle}
                {editable ? (
                  // Hover shows an outline; click to type, Enter saves, Escape cancels
                  <InlineEdit
                    key={name}
                    size="large"
                    defaultValue={name}
                    required
                    aria-label="Group name"
                    className={gallery.groupNameEdit}
                    onChange={(next) => {
                      const to = next.trim().slice(0, 60);
                      if (to && to !== name) onRenameGroup!(name, to);
                    }}
                  />
                ) : (
                  <button type="button" className={gallery.groupName} onClick={() => toggleHeading(name)}>
                    {name}
                  </button>
                )}
                <span className={gallery.groupCount}>{items.length}</span>
                {isCollapsed && (
                  <span className={gallery.groupPeek}>{items.map((p) => p.name).join(', ')}</span>
                )}
              </div>
              {!isCollapsed && renderGrid(items)}
            </section>
          );
        })}

        {/* While a card is dragged: drop it here, name the group, press Enter */}
        {(draggingProject || newGroupFor) && onDropOnHeading && (
          <section
            style={{ order: ordered.length }}
            className={`${gallery.newGroup} ${dropHeading === NEW_GROUP ? gallery.dropTargetOver : ''}`}
            onDragOver={draggingProject ? (e) => { e.preventDefault(); setDropHeading(NEW_GROUP); } : undefined}
            onDragLeave={draggingProject ? () => setDropHeading(null) : undefined}
            onDrop={draggingProject ? (e) => {
              e.preventDefault();
              setDropHeading(null);
              setNewGroupFor(draggingProject);
            } : undefined}
          >
            {newGroupFor ? (
              <div className={gallery.newGroupForm}>
                <TextInput
                  label={`New group for ${newGroupFor.name}`}
                  placeholder="Group name"
                  value={newGroupName}
                  maxLength={60}
                  autoFocus
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newGroupName.trim()) {
                      onDropOnHeading(newGroupFor, newGroupName.trim());
                      setNewGroupFor(null);
                      setNewGroupName('');
                    } else if (e.key === 'Escape') {
                      setNewGroupFor(null);
                      setNewGroupName('');
                    }
                  }}
                />
                <span className={gallery.newGroupHint}>Press Enter to create it, Escape to cancel.</span>
              </div>
            ) : (
              <span className={gallery.newGroupLabel}>
                <Icon name="plus" size="s" />
                Drop here to start a new group
              </span>
            )}
          </section>
        )}
        </div>
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
  onMoveToGroup?: () => void;
  /** Set when the card can be dragged onto a heading or the left pane */
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

// Ids whose thumbnails are being captured right now, so their placeholders say so
const CapturingContext = React.createContext<ReadonlySet<string>>(new Set());

/**
 * No thumbnail yet: the prototype's initial on a Radiance-style wash. A live preview used to
 * run here, but each one is a whole prototype, which made a long gallery heavy.
 */
// Radiance's glow hues (pink, mint, violet, amber, blue) as the nearest Radiant accents,
// so the washes follow light and dark mode
const RADIANCE_HUES = ['red', 'green', 'purple', 'yellow', 'blue'].map((h) => `var(--rd-sys-color-content-accent-${h})`);

/** Small stable hash, so a prototype keeps the same wash every time */
const hashOf = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Two hues and where their glows sit, picked from the prototype's id */
const washFor = (id: string): React.CSSProperties => {
  const h = hashOf(id);
  const first = h % RADIANCE_HUES.length;
  const second = (first + 1 + ((h >>> 3) % (RADIANCE_HUES.length - 1))) % RADIANCE_HUES.length;
  const third = (second + 1 + ((h >>> 6) % (RADIANCE_HUES.length - 1))) % RADIANCE_HUES.length;
  return {
    '--wash-a': RADIANCE_HUES[first],
    '--wash-b': RADIANCE_HUES[second],
    '--wash-c': RADIANCE_HUES[third],
    '--wash-ax': `${10 + ((h >>> 9) % 35)}%`,
    '--wash-ay': `${5 + ((h >>> 13) % 40)}%`,
    '--wash-bx': `${55 + ((h >>> 17) % 40)}%`,
    '--wash-by': `${45 + ((h >>> 21) % 50)}%`,
  } as React.CSSProperties;
};

const CardPlaceholder: React.FC<{ project: ProjectMeta }> = ({ project }) => {
  const capturing = React.useContext(CapturingContext).has(project.id);
  return (
    <div
      className={gallery.placeholder}
      style={washFor(project.id)}
      role="img"
      aria-label={`${project.name}, no thumbnail yet`}
    >
      <span className={gallery.placeholderInitial} aria-hidden>{project.name.trim().charAt(0).toUpperCase()}</span>
      {capturing && <span className={gallery.placeholderNote}>Capturing thumbnail…</span>}
    </div>
  );
};

/**
 * Card image, in order of preference: a captured light/dark screenshot, an inline
 * SVG (theme tokens), a single image URL, then a placeholder.
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
  return <CardPlaceholder project={project} />;
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  archived,
  menuOpen,
  onMenuToggle,
  onArchive,
  onRestore,
  onMoveToGroup,
  onDragStart,
  onDragEnd,
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
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart ? (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', project.id);
        onDragStart();
      } : undefined}
      onDragEnd={onDragEnd}
    >
      {/* 3-dot menu — visible on hover or when open */}
      {(onArchive || onRestore || onMoveToGroup) && (
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
              {onMoveToGroup && (
                <button
                  type="button"
                  style={styles.cardMenuItem}
                  onClick={(e) => { e.stopPropagation(); onMoveToGroup(); }}
                >
                  <FolderIcon />
                  <span>Move to group</span>
                </button>
              )}
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
