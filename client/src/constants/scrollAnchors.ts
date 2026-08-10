/**
 * DOM ids of page sections a link can open a page on, by navigating with
 * `state: { scrollTo: <anchor> }` (see hooks/useScrollToAnchor.ts).
 *
 * Kept here rather than on the page that renders the section so a link doesn't have to import the
 * page component it is navigating to.
 */
export const SCROLL_ANCHORS = {
  /**
   * The quotation form's item-entry section. Opening that form from a record which already answers
   * "who is this for" (an enquiry, a customer) leaves adding items as the only thing left to do, so
   * those links land there rather than on a header and a locked customer summary.
   */
  quotationItems: 'quotation-items',
} as const;
