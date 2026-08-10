import { useQuery } from '@tanstack/react-query';
import * as quotationService from '../../services/quotationService';

/**
 * The quotations raised against one enquiry. Shares its cache key with the enquiry detail page and
 * the enquiry form's Quotation section, so the Order Confirmed guard ("md files/Enquiry/flow.md"
 * §3) reads the same list the user is looking at rather than issuing a request of its own.
 */
export function useEnquiryQuotations(enquiryId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['quotations', { enquiryId }],
    queryFn: () => quotationService.list({ page: 1, limit: 50, enquiryId: enquiryId! }),
    enabled: Boolean(enquiryId) && enabled,
  });
}
