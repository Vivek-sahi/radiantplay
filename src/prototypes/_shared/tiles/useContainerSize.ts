import { useState, useEffect, useRef } from 'react';

interface Size {
  width: number;
  height: number;
}

/**
 * Measures a container element via ResizeObserver.
 * Returns a ref to attach to the container and the current { width, height }.
 */
export function useContainerSize(): [React.RefObject<HTMLDivElement>, Size] {
  const ref = useRef<HTMLDivElement>(null!);
  const [size, setSize] = useState<Size>({ width: 300, height: 180 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width:  Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });

    ro.observe(el);
    // Measure immediately
    setSize({ width: Math.floor(el.clientWidth), height: Math.floor(el.clientHeight) });

    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
