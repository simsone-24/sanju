import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Anchored dropdown, rendered through a portal into <body> with `position: fixed`.
// The portal is what makes it usable from inside the DataTable: a menu positioned inside the
// table would be clipped by the scroll container's `overflow: auto`.
//
// Callers are expected to TOGGLE their anchor state on the trigger's click — a mousedown on the
// anchor is deliberately not treated as an outside click, otherwise the menu would close on
// mousedown and immediately reopen on the trigger's own click handler.
interface MenuProps {
  anchorEl: HTMLElement | null | undefined;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Which edge of the menu lines up with the anchor. Defaults to the anchor's left edge. */
  align?: 'left' | 'right';
  /** Minimum width of the menu surface. Defaults to the anchor's own width when wider. */
  minWidth?: number;
}

const GAP = 6;
const VIEWPORT_MARGIN = 8;

export function Menu({ anchorEl, open, onClose, children, align = 'left', minWidth = 180 }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Measured against the menu's own rendered size, so it can flip above the anchor when there
  // isn't room below and shift inward when it would overflow the viewport's right edge.
  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setPosition(null);
      return;
    }
    const anchorRect = anchorEl.getBoundingClientRect();
    const menu = menuRef.current;
    const width = menu?.offsetWidth ?? minWidth;
    const height = menu?.offsetHeight ?? 0;

    let left = align === 'right' ? anchorRect.right - width : anchorRect.left;
    left = Math.min(Math.max(VIEWPORT_MARGIN, left), Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN));

    let top = anchorRect.bottom + GAP;
    if (top + height > window.innerHeight - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, anchorRect.top - height - GAP);
    }

    setPosition({ top, left });
  }, [open, anchorEl, align, minWidth]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    // Capture phase: a scroll inside the table body would otherwise leave the menu floating
    // detached from the row it belongs to.
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [open, anchorEl, onClose]);

  useEffect(() => {
    if (open && position) menuRef.current?.focus();
  }, [open, position]);

  if (!open || !anchorEl) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      // Hidden until measured, so the first paint never flashes at the top-left corner.
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        minWidth,
        zIndex: 1400,
        visibility: position ? 'visible' : 'hidden',
      }}
      className={[
        'tw-fixed tw-max-h-[70vh] tw-overflow-y-auto tw-rounded-control tw-p-1.5',
        'tw-border tw-border-hairline dark:tw-border-hairline-dark',
        'tw-bg-white dark:tw-bg-surface-dark',
        'tw-shadow-[0_16px_40px_-12px_rgba(15,23,42,0.35)]',
        'focus:tw-outline-none',
      ].join(' ')}
    >
      {children}
    </div>,
    document.body,
  );
}

interface MenuItemProps {
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}

export function MenuItem({ onClick, icon, children, disabled = false }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={[
        'tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2',
        'tw-text-left tw-font-sans tw-text-sm tw-text-ink dark:tw-text-ink-dark',
        'tw-transition-colors tw-duration-150',
        'hover:tw-bg-slate-100 dark:hover:tw-bg-slate-700',
        'focus-visible:tw-outline-none focus-visible:tw-bg-slate-100 dark:focus-visible:tw-bg-slate-700',
        'disabled:tw-cursor-not-allowed disabled:tw-opacity-45',
        disabled ? '' : 'tw-cursor-pointer',
      ].join(' ')}
    >
      {icon && <span className="tw-flex tw-shrink-0 tw-text-ink-muted dark:tw-text-ink-dark-muted">{icon}</span>}
      <span className="tw-min-w-0 tw-flex-1 tw-truncate">{children}</span>
    </button>
  );
}
