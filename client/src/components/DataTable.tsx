import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useState, type ReactNode } from 'react';
import type { PaginationMeta } from '../types/api';
import { IconButton } from './ui/IconButton';
import { Menu, MenuItem } from './ui/Menu';
import { SelectField } from './ui/Select';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** Plain-text value for sorting/CSV export, needed whenever render() returns JSX rather than text. */
  exportValue?: (row: T) => string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  hideByDefault?: boolean;
  /** Constrains the column's width (e.g. a short status badge) instead of growing to fit its header text. */
  width?: number | string;
}

/**
 * A leading checkbox column for picking rows, e.g. for a bulk delete. The page owns the selection and
 * the table only draws it. `getId` is the record's own key, which can differ from `getRowId` when one
 * table mixes record types whose ids could collide.
 */
export interface DataTableSelection<T, K extends string | number> {
  selectedIds: readonly K[];
  onChange: (ids: K[]) => void;
  getId: (row: T) => K;
  /** Leaves a row's box disabled when the bulk action could never apply to it. */
  isSelectable?: (row: T) => boolean;
  /** Shown when hovering a disabled box, saying why that row can't be picked. */
  disabledReason?: string;
}

interface EmptyStateConfig {
  icon: ReactNode;
  title: string;
  description: string;
  /** Optional action rendered below the description — e.g. a "Reset Filters" button. */
  action?: ReactNode;
}

interface DataTableProps<T, K extends string | number> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Usually the record's primary key; report rows with no single key compose one from their parts. */
  getRowId: (row: T) => string | number;
  loading?: boolean;
  meta?: PaginationMeta;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  /** Richer empty state (icon + title + description), shown instead of `emptyMessage` when set. */
  emptyState?: EmptyStateConfig;
  exportFileName?: string;
  /**
   * Hides the CSV export button when the signed-in group lacks the module's Export permission
   * (masters/user.md §Module Permission Matrix). Defaults to true for tables whose module has no
   * Export action to grant.
   */
  canExport?: boolean;
  /** Row id to briefly flash — e.g. the record just created/updated on a form page. */
  highlightRowId?: number;
  /** Optional colored left-border accent per row (e.g. status color) — returns a CSS color or undefined for none. */
  rowAccentColor?: (row: T) => string | undefined;
  /** Skip the built-in card wrapper — for pages that nest DataTable inside their own card. */
  disableContainer?: boolean;
  /**
   * Use `table-layout: fixed` so every column obeys its declared `width` exactly instead of the
   * browser redistributing leftover space (which tends to dump it onto short/badge columns).
   * Opt-in only — pages without per-column widths on every column should leave this off.
   */
  fixedLayout?: boolean;
  /**
   * Keeps the header row visible while the rows scroll under it (md files/Enquiry/UI1.md §Table
   * Improvements). A sticky header can only stick to a scrollport, so this also caps the scroll
   * area's height via `maxHeight` — without that cap the scrollport is the full table and the
   * header has nothing to stick to.
   */
  stickyHeader?: boolean;
  /** Height cap for the scroll area. Only meaningful together with `stickyHeader`. */
  maxHeight?: number | string;
  /** Header band colour: a barely-there `soft` brand tint (default), or a stronger `tint` band. */
  headerTone?: DataTableHeaderTone;
  /** Renders a refresh button in the toolbar (md files/design.md §Page Header — Search/Filters/Export/Refresh). */
  onRefresh?: () => void;
  /** Spins the refresh button while a background refetch is in flight. */
  refreshing?: boolean;
  /**
   * Narrows the horizontal cell padding, closing the gap between columns. For wide tables whose
   * columns already carry their own internal structure (avatar + two lines of text), where the
   * default gutter reads as wasted space rather than separation.
   */
  dense?: boolean;
  /**
   * Adds a leading "S.No" column numbering the rows. The count continues across pages (page 2 of 20
   * starts at 21) and follows the order the rows are shown in, so it stays 1, 2, 3… when a column is
   * sorted. Also written first in the CSV export.
   */
  showSerialNumber?: boolean;
  /** Adds a leading checkbox column; see DataTableSelection. */
  selection?: DataTableSelection<T, K>;
}

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const SELECTION_COLUMN_WIDTH = 48;

// Brand blue at 8%: reads as "picked" on both the light and the dark card without hiding the
// even-row banding or the status accent stripe.
const SELECTED_ROW_BACKGROUND = 'rgba(37, 99, 235, 0.08)';

interface SelectionCheckboxProps {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
}

// A native checkbox tinted with the brand colour. "Some but not all picked" has no HTML attribute,
// so `indeterminate` is set on the element itself, on every render, to stay in step.
function SelectionCheckbox({ label, checked, indeterminate = false, disabled = false, onChange }: SelectionCheckboxProps) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      ref={(element) => {
        if (element) element.indeterminate = indeterminate;
      }}
      className="tw-m-0 tw-h-4 tw-w-4 tw-cursor-pointer tw-align-middle tw-accent-brand disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
    />
  );
}

const ALIGN_TEXT = {
  left: 'tw-text-left',
  center: 'tw-text-center',
  right: 'tw-text-right',
} as const;

// Row dividers live on the cells, not the <tr>: under `border-separate` a row box paints its
// background but not its borders.
const ROW_DIVIDER = 'tw-border-b tw-border-hairline dark:tw-border-hairline-dark';

const ALIGN_FLEX = {
  left: 'tw-justify-start',
  center: 'tw-justify-center',
  right: 'tw-justify-end',
} as const;

interface HeaderTone {
  /** Band background, bottom rule, and the label colour that reads on it. */
  cell: string;
  /** Hover/focus colour for a sortable column's button. */
  sortInteractive: string;
  sortIcon: string;
}

export type DataTableHeaderTone = 'soft' | 'tint';

// Header band presets. Every background here must be an OPAQUE colour rather than a translucent
// alpha: a sticky header sits over the rows, and anything see-through lets them show through it as
// they scroll under.
const HEADER_TONES: Record<DataTableHeaderTone, HeaderTone> = {
  // Brand at ~6% over the card background, baked flat.
  soft: {
    cell: [
      'tw-border-brand/15 tw-bg-[#F2F6FE] tw-text-ink-muted',
      'dark:tw-border-brand-light/25 dark:tw-bg-[#213451] dark:tw-text-ink-dark-muted',
    ].join(' '),
    sortInteractive: 'hover:tw-text-brand focus-visible:tw-text-brand dark:hover:tw-text-brand-light',
    sortIcon: 'tw-text-brand',
  },
  // A soft blue band — visible against the white card, but pale enough that the rows underneath
  // stay the focus. Labels are slate rather than blue so the band reads calm rather than loud.
  tint: {
    cell: [
      'tw-border-brand/20 tw-bg-[#E8EFFC] tw-text-slate-600',
      'dark:tw-border-brand-light/25 dark:tw-bg-[#27364F] dark:tw-text-slate-300',
    ].join(' '),
    sortInteractive: 'hover:tw-text-brand-dark focus-visible:tw-text-brand-dark dark:hover:tw-text-white',
    sortIcon: 'tw-text-brand-dark dark:tw-text-slate-200',
  },
};

function cellValue<T>(column: DataTableColumn<T>, row: T): string {
  if (column.exportValue) return column.exportValue(row);
  return String((row as Record<string, unknown>)[column.key] ?? '');
}

// First page, last page, and a one-page window either side of the current page, with gaps
// collapsed into an ellipsis — so a 40-page result set still fits on one line.
function paginationItems(current: number, total: number): (number | 'gap')[] {
  const wanted = new Set<number>([1, total]);
  for (let candidate = current - 1; candidate <= current + 1; candidate += 1) {
    if (candidate >= 1 && candidate <= total) wanted.add(candidate);
  }

  const items: (number | 'gap')[] = [];
  let previous = 0;
  for (const pageNumber of [...wanted].sort((a, b) => a - b)) {
    if (previous && pageNumber - previous > 1) items.push('gap');
    items.push(pageNumber);
    previous = pageNumber;
  }
  return items;
}

// Two documented but honestly-limited features, flagged rather than silently half-built:
// - Sorting is client-side over the CURRENT page only — none of the 14 backend list endpoints
//   implement a server-side `sort` query param yet.
// - CSV export covers only the currently loaded page, not the full filtered result set, since
//   fetching every page isn't wired up. Real Excel export is a separately deferred backend item.
export function DataTable<T, K extends string | number = string | number>({
  columns,
  rows,
  getRowId,
  loading = false,
  meta,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onRowClick,
  emptyMessage = 'No records found.',
  emptyState,
  exportFileName = 'export',
  canExport = true,
  highlightRowId,
  disableContainer = false,
  fixedLayout = false,
  stickyHeader = false,
  maxHeight,
  headerTone = 'soft',
  onRefresh,
  refreshing = false,
  rowAccentColor,
  dense = false,
  showSerialNumber = false,
  selection,
}: DataTableProps<T, K>) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    () => new Set(columns.filter((column) => column.hideByDefault).map((column) => column.key)),
  );
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const visibleColumns = columns.filter((column) => !hiddenColumns.has(column.key));
  // The server's own page and size when it sent them, so S.No stays right even if a parent's local
  // state is a render behind; tables with no pagination (meta absent) start from 1.
  const serialOffset = ((meta?.page ?? page) - 1) * (meta?.limit ?? limit);
  const columnCount = visibleColumns.length + (showSerialNumber ? 1 : 0) + (selection ? 1 : 0);

  const sortedRows = (() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return rows;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => cellValue(column, a).localeCompare(cellValue(column, b)) * factor);
  })();

  // Selection is scoped to the rows on screen: the header box picks or clears every selectable row of
  // this page, leaving any other picked ids alone.
  const selectedSet = new Set<K>(selection?.selectedIds ?? []);
  const isRowSelectable = (row: T) => selection?.isSelectable?.(row) ?? true;
  const selectableRows = selection ? sortedRows.filter(isRowSelectable) : [];
  const selectedOnPageCount = selection
    ? selectableRows.filter((row) => selectedSet.has(selection.getId(row))).length
    : 0;
  const allOnPageSelected = selectableRows.length > 0 && selectedOnPageCount === selectableRows.length;

  function toggleRowSelection(row: T) {
    if (!selection) return;
    const id = selection.getId(row);
    selection.onChange(
      selectedSet.has(id) ? selection.selectedIds.filter((selected) => selected !== id) : [...selection.selectedIds, id],
    );
  }

  function togglePageSelection() {
    if (!selection) return;
    const pageIds = new Set(selectableRows.map((row) => selection.getId(row)));
    const othersSelected = selection.selectedIds.filter((id) => !pageIds.has(id));
    selection.onChange(allOnPageSelected ? othersSelected : [...othersSelected, ...pageIds]);
  }

  function toggleSort(key: string) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  }

  function toggleColumn(key: string) {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function exportCsv() {
    const header = [...(showSerialNumber ? ['S.No'] : []), ...visibleColumns.map((column) => column.header)].join(',');
    const lines = sortedRows.map((row, index) =>
      [
        ...(showSerialNumber ? [`"${serialOffset + index + 1}"`] : []),
        ...visibleColumns.map((column) => `"${cellValue(column, row).replace(/"/g, '""')}"`),
      ].join(','),
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // "Showing 1 to 20 of 132 results" — orients the user inside a paginated result set without them
  // having to read the pagination footer at the other end of the table.
  const rangeLabel = (() => {
    if (!meta || meta.totalRecords === 0) return null;
    const first = (meta.page - 1) * meta.limit + 1;
    const last = Math.min(meta.page * meta.limit, meta.totalRecords);
    return `Showing ${first} to ${last} of ${meta.totalRecords} result${meta.totalRecords === 1 ? '' : 's'}`;
  })();

  const cellPadding = dense ? 'tw-px-2 tw-py-2.5' : 'tw-px-3 tw-py-3.5';
  const headerStyle = HEADER_TONES[headerTone];
  const totalPages = Math.max(1, meta?.totalPages ?? 1);

  const content = (
    <>
      {/* Top bar: how much of the result set is on screen, how much to show at a time, and the
          table-level tools. Page size sits with the range label it changes, rather than at the far
          end of the table where the user would have to scroll past every row to reach it. */}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-border-b tw-border-hairline tw-px-2 tw-py-2 dark:tw-border-hairline-dark sm:tw-px-4">
        <span className="tw-inline-flex tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-tabular-nums tw-text-ink-muted dark:tw-text-ink-dark-muted">
          {rangeLabel && <span aria-hidden className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-brand/60" />}
          {rangeLabel}
        </span>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          {meta && (
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-hidden tw-text-xs tw-font-medium tw-text-ink-muted dark:tw-text-ink-dark-muted sm:tw-inline">
                Rows per page:
              </span>
              <SelectField
                size="sm"
                ariaLabel="Rows per page"
                value={String(limit)}
                onChange={(next) => onLimitChange(Number(next))}
                options={ROWS_PER_PAGE_OPTIONS.map((option) => ({ value: String(option), label: String(option) }))}
              />
            </div>
          )}
          <div className="tw-flex tw-items-center tw-gap-0.5 tw-rounded-full tw-border tw-border-hairline tw-bg-surface-muted tw-p-0.5 dark:tw-border-hairline-dark dark:tw-bg-surface-dark-muted">
            {onRefresh && (
              <IconButton title="Refresh" size="sm" onClick={onRefresh}>
                <RefreshIcon
                  fontSize="small"
                  style={{ animation: refreshing ? 'data-table-spin 900ms linear infinite' : undefined }}
                />
              </IconButton>
            )}
            {canExport && (
              <IconButton title="Export CSV (current page)" size="sm" onClick={exportCsv}>
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton
              title="Columns"
              size="sm"
              onClick={(event) => {
                const trigger = event.currentTarget;
                setColumnMenuAnchor((current) => (current ? null : trigger));
              }}
            >
              <ViewColumnIcon fontSize="small" />
            </IconButton>
          </div>
          <Menu
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={() => setColumnMenuAnchor(null)}
            align="right"
            minWidth={200}
          >
            {columns.map((column) => {
              const visible = !hiddenColumns.has(column.key);
              return (
                <MenuItem
                  key={column.key}
                  onClick={() => toggleColumn(column.key)}
                  icon={
                    visible ? (
                      <CheckBoxIcon fontSize="small" className="tw-text-brand" />
                    ) : (
                      <CheckBoxOutlineBlankIcon fontSize="small" />
                    )
                  }
                >
                  {column.header}
                </MenuItem>
              );
            })}
          </Menu>
        </div>
      </div>

      <div
        className="tw-overflow-auto"
        style={stickyHeader && maxHeight !== undefined ? { maxHeight } : undefined}
      >
        <table
          // `border-separate` rather than `collapse`: the CSS Backgrounds spec leaves box-shadow
          // undefined on table elements under a collapsed border model, and rows use an inset
          // box-shadow for their status accent stripe. Cell borders carry the row dividers.
          className="tw-w-full tw-border-separate tw-border-spacing-0 tw-text-sm"
          style={fixedLayout ? { tableLayout: 'fixed', width: 'max-content', minWidth: '100%' } : undefined}
        >
          <thead>
            <tr>
              {selection && (
                <th
                  scope="col"
                  style={{ width: SELECTION_COLUMN_WIDTH }}
                  className={[
                    cellPadding,
                    'tw-text-center tw-border-b',
                    headerStyle.cell,
                    stickyHeader ? 'tw-sticky tw-top-0 tw-z-10' : '',
                  ].join(' ')}
                >
                  <SelectionCheckbox
                    label="Select all rows on this page"
                    checked={allOnPageSelected}
                    indeterminate={selectedOnPageCount > 0 && !allOnPageSelected}
                    disabled={loading || selectableRows.length === 0}
                    onChange={togglePageSelection}
                  />
                </th>
              )}
              {showSerialNumber && (
                <th
                  scope="col"
                  style={{ width: 64 }}
                  className={[
                    cellPadding,
                    'tw-text-center tw-border-b',
                    headerStyle.cell,
                    'tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.05em]',
                    stickyHeader ? 'tw-sticky tw-top-0 tw-z-10' : '',
                  ].join(' ')}
                >
                  S.No
                </th>
              )}
              {visibleColumns.map((column) => {
                const align = column.align ?? 'left';
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={{ width: column.width }}
                    className={[
                      cellPadding,
                      ALIGN_TEXT[align],
                      // Band colour, its matching bottom rule, and the label colour that reads on
                      // it — see HEADER_TONES.
                      'tw-border-b',
                      headerStyle.cell,
                      'tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.05em]',
                      // Sticks to the scroll container above; the z-index keeps it over the rows.
                      stickyHeader ? 'tw-sticky tw-top-0 tw-z-10' : '',
                    ].join(' ')}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={[
                          'tw-group tw-inline-flex tw-w-full tw-items-center tw-gap-1 tw-border-0 tw-bg-transparent tw-p-0',
                          'tw-cursor-pointer tw-font-sans tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.05em]',
                          'tw-text-inherit tw-transition-colors focus-visible:tw-outline-none',
                          headerStyle.sortInteractive,
                          ALIGN_FLEX[align],
                        ].join(' ')}
                      >
                        {column.header}
                        {active ? (
                          sort.direction === 'asc' ? (
                            <ArrowUpwardIcon sx={{ fontSize: 14 }} className={headerStyle.sortIcon} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 14 }} className={headerStyle.sortIcon} />
                          )
                        ) : (
                          <UnfoldMoreIcon
                            sx={{ fontSize: 14 }}
                            className="tw-opacity-0 tw-transition-opacity tw-duration-150 tw-group-hover:tw-opacity-60"
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: Math.min(limit, 10) }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {selection && <td className={`${cellPadding} ${ROW_DIVIDER}`} />}
                  {showSerialNumber && (
                    <td className={`${cellPadding} ${ROW_DIVIDER}`}>
                      <span className="tw-mx-auto tw-block tw-h-4 tw-w-6 tw-animate-pulse tw-rounded tw-bg-slate-100 dark:tw-bg-slate-700" />
                    </td>
                  )}
                  {visibleColumns.map((column) => (
                    <td key={column.key} className={`${cellPadding} ${ROW_DIVIDER}`}>
                      <span className="tw-block tw-h-4 tw-w-full tw-animate-pulse tw-rounded tw-bg-slate-100 dark:tw-bg-slate-700" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && sortedRows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className={emptyState ? 'tw-px-4 tw-py-16' : 'tw-px-4 tw-py-12'}>
                  {emptyState ? (
                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-text-center">
                      <div className="tw-flex tw-h-[72px] tw-w-[72px] tw-items-center tw-justify-center tw-rounded-full tw-bg-brand/10 tw-text-brand dark:tw-bg-brand-light/20">
                        {emptyState.icon}
                      </div>
                      <h4 className="tw-m-0 tw-text-lg tw-font-bold tw-text-ink dark:tw-text-ink-dark">
                        {emptyState.title}
                      </h4>
                      <p className="tw-m-0 tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted">
                        {emptyState.description}
                      </p>
                      {emptyState.action}
                    </div>
                  ) : (
                    <p className="tw-m-0 tw-text-center tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted">
                      {emptyMessage}
                    </p>
                  )}
                </td>
              </tr>
            )}

            {!loading &&
              sortedRows.map((row, rowIndex) => {
                const accentColor = rowAccentColor?.(row);
                const selectable = Boolean(selection) && isRowSelectable(row);
                const selected = selection ? selectedSet.has(selection.getId(row)) : false;
                const rowStyle =
                  accentColor || selected
                    ? {
                        ...(accentColor ? { boxShadow: `inset 4px 0 0 ${accentColor}` } : {}),
                        ...(selected ? { backgroundColor: SELECTED_ROW_BACKGROUND } : {}),
                      }
                    : undefined;
                return (
                  <tr
                    key={getRowId(row)}
                    onClick={() => onRowClick?.(row)}
                    className={[
                      'tw-transition-colors tw-duration-150',
                      'even:tw-bg-surface-muted/60 dark:even:tw-bg-surface-dark-muted/40',
                      onRowClick
                        ? 'tw-cursor-pointer hover:tw-bg-brand/[0.06] dark:hover:tw-bg-brand-light/10'
                        : 'tw-cursor-default',
                      getRowId(row) === highlightRowId ? 'row-highlight' : '',
                    ].join(' ')}
                    style={rowStyle}
                  >
                    {selection && (
                      <td
                        style={{ width: SELECTION_COLUMN_WIDTH }}
                        title={selectable ? undefined : selection.disabledReason}
                        className={[cellPadding, ROW_DIVIDER, 'tw-text-center tw-align-middle'].join(' ')}
                        // Ticking a box, or just missing it inside its cell, must not also open the row.
                        onClick={(event) => event.stopPropagation()}
                      >
                        <SelectionCheckbox
                          label={`Select row ${serialOffset + rowIndex + 1}`}
                          checked={selected}
                          disabled={!selectable}
                          onChange={() => toggleRowSelection(row)}
                        />
                      </td>
                    )}
                    {showSerialNumber && (
                      <td
                        style={{ width: 64 }}
                        className={[
                          cellPadding,
                          ROW_DIVIDER,
                          'tw-text-center tw-align-middle tw-tabular-nums tw-text-ink-muted dark:tw-text-ink-dark-muted',
                        ].join(' ')}
                      >
                        {serialOffset + rowIndex + 1}
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        style={{ width: column.width }}
                        className={[
                          cellPadding,
                          ROW_DIVIDER,
                          ALIGN_TEXT[column.align ?? 'left'],
                          'tw-align-middle tw-text-ink dark:tw-text-ink-dark',
                          fixedLayout ? 'tw-overflow-hidden' : '',
                        ].join(' ')}
                      >
                        {column.render ? column.render(row) : cellValue(column, row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Numbered pages at the bottom right (md files/Enquiry/indexUI.md §Table Improvements —
          "Pagination at Bottom Right"). Numbered pages beat a prev/next-only control for jumping
          around a long result set. Page size now lives in the top bar. */}
      {meta && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3 tw-border-t tw-border-hairline tw-px-3 tw-py-2 dark:tw-border-hairline-dark">
          <nav aria-label="Pagination" className="tw-flex tw-items-center tw-gap-1">
            <IconButton
              title="Previous page"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            {paginationItems(page, totalPages).map((item, index) =>
              item === 'gap' ? (
                <span
                  key={`gap-${index}`}
                  className="tw-px-1 tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => onPageChange(item)}
                  className={[
                    'tw-h-8 tw-min-w-[2rem] tw-cursor-pointer tw-rounded-full tw-border-0 tw-px-2',
                    'tw-font-sans tw-text-sm tw-font-semibold tw-transition-colors tw-duration-150',
                    'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-brand/40',
                    item === page
                      ? 'tw-bg-brand tw-text-white tw-shadow-sm'
                      : 'tw-bg-transparent tw-text-ink-muted hover:tw-bg-slate-100 dark:tw-text-ink-dark-muted dark:hover:tw-bg-slate-700',
                  ].join(' ')}
                >
                  {item}
                </button>
              ),
            )}

            <IconButton
              title="Next page"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </nav>
        </div>
      )}
    </>
  );

  if (disableContainer) return content;

  return (
    <div className="tw-overflow-hidden tw-rounded-card tw-border tw-border-solid tw-border-hairline tw-bg-white tw-shadow-lifted dark:tw-border-hairline-dark dark:tw-bg-surface-dark">
      {content}
    </div>
  );
}
