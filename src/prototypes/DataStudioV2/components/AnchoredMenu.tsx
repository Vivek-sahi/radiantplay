import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * AnchoredMenu — a dropdown surface that never gets clipped.
 *
 * Renders its children into a portal on document.body with `position: fixed`,
 * anchored to `anchorRef`. It auto-flips (bottom↔top, right↔left) when there
 * isn't room on the preferred side and clamps into the viewport, so menus stay
 * fully on-screen no matter how many `overflow: hidden` / rounded containers
 * they live inside.
 *
 * Drop-in for the prototype's inline `position: absolute` dropdowns: keep the
 * trigger button (give it a ref), and move the menu box styles onto `style`.
 */

type Placement =
  | 'bottom-start' | 'bottom-end'
  | 'top-start' | 'top-end'
  | 'right-start' | 'right-end'
  | 'left-start' | 'left-end';

export interface AnchoredMenuProps {
  open: boolean;
  /** Anchor to an element. Ignored when `anchorPoint` is provided. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Anchor to a point (e.g. a text caret) instead of an element. Takes precedence over `anchorRef`. */
  anchorPoint?: { x: number; y: number; height?: number } | null;
  onClose: () => void;
  placement?: Placement;
  gap?: number;
  /** Box styles for the menu surface (background, border, radius, padding, width…). */
  style?: React.CSSProperties;
  /** Extra elements that count as "inside" for outside-click detection (e.g. submenu portals). */
  children: React.ReactNode;
}

const VIEWPORT_PAD = 8;

export const AnchoredMenu: React.FC<AnchoredMenuProps> = ({
  open,
  anchorRef,
  anchorPoint,
  onClose,
  placement = 'bottom-start',
  gap = 4,
  style,
  children,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }

    const compute = () => {
      const h = anchorPoint?.height ?? 16;
      const anchor = anchorPoint
        ? { top: anchorPoint.y, bottom: anchorPoint.y + h, left: anchorPoint.x, right: anchorPoint.x, width: 0, height: h } as DOMRect
        : anchorRef?.current?.getBoundingClientRect();
      const menu = menuRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const mw = menu?.width ?? 0;
      const mh = menu?.height ?? 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let side = placement.split('-')[0] as 'bottom' | 'top' | 'right' | 'left';
      const align = placement.split('-')[1] as 'start' | 'end';
      let top = 0;
      let left = 0;

      if (side === 'bottom' || side === 'top') {
        const roomBelow = vh - anchor.bottom;
        const roomAbove = anchor.top;
        if (side === 'bottom' && roomBelow < mh + gap + VIEWPORT_PAD && roomAbove > roomBelow) side = 'top';
        else if (side === 'top' && roomAbove < mh + gap + VIEWPORT_PAD && roomBelow > roomAbove) side = 'bottom';
        top = side === 'bottom' ? anchor.bottom + gap : anchor.top - mh - gap;
        left = align === 'end' ? anchor.right - mw : anchor.left;
      } else {
        const roomRight = vw - anchor.right;
        const roomLeft = anchor.left;
        if (side === 'right' && roomRight < mw + gap + VIEWPORT_PAD && roomLeft > roomRight) side = 'left';
        else if (side === 'left' && roomLeft < mw + gap + VIEWPORT_PAD && roomRight > roomLeft) side = 'right';
        left = side === 'right' ? anchor.right + gap : anchor.left - mw - gap;
        top = align === 'end' ? anchor.bottom - mh : anchor.top;
      }

      // Clamp fully into the viewport as a final guard.
      left = Math.max(VIEWPORT_PAD, Math.min(left, vw - mw - VIEWPORT_PAD));
      top = Math.max(VIEWPORT_PAD, Math.min(top, vh - mh - VIEWPORT_PAD));
      setPos({ top, left });
    };

    compute();
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [open, placement, gap, anchorRef, anchorPoint?.x, anchorPoint?.y]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || anchorRef?.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        zIndex: 4000,
        // Hide the first frame until measured so it doesn't flash at the fallback offset.
        visibility: pos ? 'visible' : 'hidden',
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

export default AnchoredMenu;
