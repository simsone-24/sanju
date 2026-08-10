import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Holds the scroll offset steady across a route change.
 *
 * The app scrolls inside AppLayout's main pane, not the window, and that element is part of the
 * persistent parent route — so its scrollTop already survives navigation on its own. What breaks it
 * is the gap while the incoming page is still short (a spinner, queries not yet resolved): the
 * browser clamps the offset to that smaller content height, and the position it lands on depends on
 * how tall each page happens to be mid-load. That is the arbitrary jump this removes.
 *
 * The offset is re-applied as the new page grows, and control is handed back the moment the content
 * settles or the user scrolls for themselves.
 */
const SETTLE_MS = 800;

export function usePreservedScroll(
  scrollRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
): void {
  const location = useLocation();
  const offsetRef = useRef(0);
  // Scroll events fired by our own restore writes must not be recorded — doing so would overwrite
  // the offset being restored with the clamped value it is trying to escape.
  const restoringRef = useRef(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      if (!restoringRef.current) offsetRef.current = element.scrollTop;
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    const content = contentRef.current;
    const target = offsetRef.current;
    // Already at the top: there is nothing to hold, and every page that legitimately starts there
    // should be left alone.
    if (!element || !content || target <= 0) return;
    // A link that asks for a specific section (useScrollToAnchor) has said where this page belongs,
    // which outranks holding the position of the one being left behind.
    if ((location.state as { scrollTo?: string } | null)?.scrollTo) return;

    restoringRef.current = true;

    const apply = () => {
      if (element.scrollTop !== target) element.scrollTop = target;
    };

    // Each growth of the incoming page is a fresh chance to reach an offset the browser clamped
    // away. Observing the content wrapper (not the scrollport, whose own box never changes) is what
    // makes that observable.
    const observer = new ResizeObserver(apply);
    let timer = 0;

    const stop = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      element.removeEventListener('wheel', stop);
      element.removeEventListener('touchstart', stop);
      element.removeEventListener('keydown', stop);
      restoringRef.current = false;
      offsetRef.current = element.scrollTop;
    };

    apply();
    observer.observe(content);
    timer = window.setTimeout(stop, SETTLE_MS);

    // Real input hands control back at once — being yanked to a remembered offset while
    // deliberately scrolling would be worse than the jump this fixes.
    element.addEventListener('wheel', stop, { passive: true });
    element.addEventListener('touchstart', stop, { passive: true });
    element.addEventListener('keydown', stop);

    return stop;
  }, [location.key, location.state, scrollRef, contentRef]);
}
