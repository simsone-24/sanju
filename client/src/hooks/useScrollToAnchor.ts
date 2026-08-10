import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lands a newly opened page on a specific section instead of at its top.
 *
 * A link opts in by carrying `state: { scrollTo: '<element id>' }` — e.g. "Create Quotation" on an
 * enquiry, which opens the quotation form at the item-entry table rather than at the header the
 * user has nothing to do with. Pages stay unaware of it: they only need to give the section an id.
 *
 * The offset is re-applied on every frame for a short window rather than once, because the target's
 * position moves while the incoming page's queries resolve — scrolling once on mount would land on
 * whatever happened to be there mid-load. Applied instantly (never smoothly) so the page simply
 * appears already scrolled; user input hands control straight back.
 */
const SETTLE_MS = 900;
// Leaves the section's heading clear of the top edge rather than flush against it.
const HEADROOM_PX = 16;

export function useScrollToAnchor(scrollRef: RefObject<HTMLElement | null>): void {
  const location = useLocation();
  const anchor = (location.state as { scrollTo?: string } | null)?.scrollTo;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !anchor) return;

    let frame = 0;
    let timer = 0;

    const apply = () => {
      const target = document.getElementById(anchor);
      if (target) {
        const offset =
          target.getBoundingClientRect().top - element.getBoundingClientRect().top + element.scrollTop - HEADROOM_PX;
        const clamped = Math.max(0, Math.min(offset, element.scrollHeight - element.clientHeight));
        if (Math.round(element.scrollTop) !== Math.round(clamped)) element.scrollTop = clamped;
      }
      frame = window.requestAnimationFrame(apply);
    };

    const stop = () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      element.removeEventListener('wheel', stop);
      element.removeEventListener('touchstart', stop);
      element.removeEventListener('keydown', stop);
    };

    frame = window.requestAnimationFrame(apply);
    timer = window.setTimeout(stop, SETTLE_MS);

    element.addEventListener('wheel', stop, { passive: true });
    element.addEventListener('touchstart', stop, { passive: true });
    element.addEventListener('keydown', stop);

    return stop;
  }, [anchor, location.key, scrollRef]);
}
