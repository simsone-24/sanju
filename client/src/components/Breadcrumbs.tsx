import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import { Link, useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

// md files/UI-2.md "Breadcrumb": every page shows Dashboard > Module > Page.
//
// The trail also carries the page's Back control, so every page that has a breadcrumb gets one
// from a single place. It navigates to the parent crumb rather than through history: the
// destination is then the same however the page was reached, and it can't dead-end when the page
// was opened from a pasted URL or a new tab. A trail with no parent — the Dashboard, the root of
// every trail — renders no button.
export function Breadcrumbs({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) {
  const navigate = useNavigate();
  const parent = items.length > 1 ? items[items.length - 2] : undefined;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`tw-mb-2.5 tw-flex tw-flex-wrap tw-items-center tw-gap-2 ${className}`}
    >
      {parent?.to && (
        <>
          <button
            type="button"
            onClick={() => navigate(parent.to as string)}
            aria-label={`Back to ${parent.label}`}
            className={[
              'tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1 tw-rounded-control tw-border',
              'tw-border-hairline dark:tw-border-hairline-dark',
              'tw-bg-white dark:tw-bg-surface-dark',
              'tw-px-2 tw-py-1 tw-text-[0.8125rem] tw-font-medium',
              'tw-text-ink-muted dark:tw-text-ink-dark-muted',
              'tw-cursor-pointer tw-transition-colors tw-duration-150',
              'hover:tw-border-brand/40 hover:tw-text-brand',
              'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-brand/20',
            ].join(' ')}
          >
            <ArrowBackIcon aria-hidden sx={{ fontSize: 16 }} />
            Back
          </button>
          <span aria-hidden className="tw-h-4 tw-w-px tw-bg-hairline dark:tw-bg-hairline-dark" />
        </>
      )}
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-items-center tw-gap-1.5 tw-p-0 tw-text-[0.8125rem]">
        <li className="tw-flex tw-items-center tw-text-ink-muted dark:tw-text-ink-dark-muted">
          <SpaceDashboardOutlinedIcon aria-hidden fontSize="small" />
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="tw-flex tw-items-center tw-gap-1.5">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="tw-text-ink-muted tw-no-underline tw-transition-colors hover:tw-text-brand hover:tw-underline dark:tw-text-ink-dark-muted"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'tw-font-medium tw-text-ink dark:tw-text-ink-dark' : 'tw-text-ink-muted dark:tw-text-ink-dark-muted'}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden className="tw-text-ink-muted dark:tw-text-ink-dark-muted">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
