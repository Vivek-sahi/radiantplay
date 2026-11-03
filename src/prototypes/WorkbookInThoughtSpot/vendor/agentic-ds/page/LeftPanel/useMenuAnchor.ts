import { RefObject, useCallback, useEffect, useLayoutEffect, useState } from 'react';

export type MenuSide = 'top' | 'bottom';
export type MenuAlign = 'left' | 'right';

export interface MenuAnchor {
  top: number;
  left?: number;
  right?: number;
}

/** Clearance between trigger and menu, and from the viewport edge. */
const GAP = 4;
const EDGE = 8;

/**
 * Positions a portalled menu against its trigger, flipping to the other side
 * when the preferred one doesn't fit.
 *
 * Menus in this panel have to be portalled and `fixed`: their rows sit inside
 * the section's `overflow: hidden` clip and the list's scroll container, either
 * of which would crop an absolutely-positioned panel.
 */
export function useMenuAnchor(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
  side: MenuSide = 'bottom',
  align: MenuAlign = 'left'
): MenuAnchor | null {
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const rect = trigger.getBoundingClientRect();
    const height = menu.offsetHeight;

    const below = rect.bottom + GAP;
    const above = rect.top - GAP - height;
    const fitsBelow = below + height <= window.innerHeight - EDGE;
    const fitsAbove = above >= EDGE;

    let top =
      side === 'bottom'
        ? fitsBelow || !fitsAbove
          ? below
          : above
        : fitsAbove || !fitsBelow
          ? above
          : below;
    // Last resort for a menu taller than the space either way.
    top = Math.max(EDGE, Math.min(top, window.innerHeight - EDGE - height));

    setAnchor(
      align === 'left'
        ? { top, left: rect.left }
        : { top, right: window.innerWidth - rect.right }
    );
  }, [open, side, align, triggerRef, menuRef]);

  return anchor;
}

/** Closes an open menu on outside pointerdown, scroll, or resize. */
export function useMenuDismiss(
  open: boolean,
  close: () => void,
  refs: RefObject<HTMLElement | null>[]
) {
  const contains = useCallback(
    (node: Node) => refs.some((ref) => ref.current?.contains(node)),
    [refs]
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (contains(event.target as Node)) return;
      close();
    };
    // Fixed positioning cannot track the list scrolling underneath it.
    const onScroll = () => close();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open, close, contains]);
}
