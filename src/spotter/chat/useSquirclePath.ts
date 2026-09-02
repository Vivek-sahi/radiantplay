import { useCallback, useRef, useState } from 'react';
import { getSvgPath, FigmaSquircleParams } from './figmaSquircle';

type Options = Omit<FigmaSquircleParams, 'width' | 'height'>;

export function useSquirclePath(opts: Options) {
  const [clipPath, setClipPath] = useState<string>('none');
  const roRef = useRef<ResizeObserver | null>(null);

  // Callback ref fires whenever the element mounts or unmounts,
  // so the ResizeObserver is always attached to the live DOM node.
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }
    if (!el) { setClipPath('none'); return; }

    const update = () => {
      // offsetWidth/Height give the untransformed layout (border-box) size.
      // getBoundingClientRect would return the *transformed* size, so an
      // ancestor `transform: scale(...)` (e.g. the scale-up open animation)
      // would freeze the clip-path at the wrong dimensions.
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width > 0 && height > 0) {
        const svgPath = getSvgPath({ ...opts, width, height });
        setClipPath(`path("${svgPath}")`);
      }
    };

    update();
    roRef.current = new ResizeObserver(update);
    roRef.current.observe(el);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opts.cornerRadius,
    opts.topLeftCornerRadius,
    opts.topRightCornerRadius,
    opts.bottomRightCornerRadius,
    opts.bottomLeftCornerRadius,
    opts.cornerSmoothing,
    opts.preserveSmoothing,
  ]);

  return { ref, clipPath };
}
