import type { ReactNode } from 'react';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Rendered inline after the title — e.g. the module's total record count
   * (md files/Enquiry/UIen.md §UX Improvements: "Display total record count beside the page title"). */
  titleAdornment?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, breadcrumbs, titleAdornment }: PageHeaderProps) {
  return (
    <div>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-1">
            <h1 className="tw-m-0 tw-text-2xl tw-font-bold tw-leading-tight tw-text-ink dark:tw-text-ink-dark">
              {title}
            </h1>
            {titleAdornment}
          </div>
          {subtitle && (
            <p className="tw-mb-0 tw-mt-1 tw-text-[0.8125rem] tw-text-ink-muted dark:tw-text-ink-dark-muted">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">{actions}</div>}
      </div>
    </div>
  );
}
