import { Box, CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppTabs } from '../../components/AppTabs';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { usePermission } from '../../hooks/usePermission';
import * as orderService from '../../services/orderService';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import { OrderProgressTracker } from './OrderProgressTracker';
import { OrderSummaryCard } from './OrderSummaryCard';
import OrderDocumentsTab from './tabs/OrderDocumentsTab';
import OrderEventInfoTab from './tabs/OrderEventInfoTab';
import OrderPaymentsTab from './tabs/OrderPaymentsTab';
import OrderQuotationTab from './tabs/OrderQuotationTab';
import OrderTaskPlanTab from './tabs/OrderTaskPlanTab';
import OrderTimelineTab from './tabs/OrderTimelineTab';

// Tab slugs accepted via `?tab=` so the Orders list's row actions can deep-link straight to the
// relevant tab (e.g. the Payments action) instead of always landing on Event Information.
// "planning" and "tasks" are kept as aliases of the Task Plan tab so existing deep links, which
// pointed at the two tabs it replaced, still resolve.
const TAB_SLUGS = ['info', 'quotation', 'payments', 'task-plan', 'documents', 'timeline'] as const;
const TAB_SLUG_ALIASES: Record<string, (typeof TAB_SLUGS)[number]> = {
  planning: 'task-plan',
  tasks: 'task-plan',
};

// Full page (not a drawer, unlike Enquiries/Quotations forms) — Order Details is documented as
// a tabbed page in its own right (docs/03_MODULES.md §4), too rich for a drawer overlay.
// The separate Planning and Task Checklist tabs were merged into a single Task Plan tab per
// "md files/task plan/scope.md" ("Instead of maintaining separate Plan and Task modules…").
// Timeline is the one addition beyond the documented list, an audit-trail view.
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const canEdit = usePermission('ORDERS', 'canEdit');
  const requestedTab = searchParams.get('tab') ?? 'info';
  const resolvedTab = TAB_SLUG_ALIASES[requestedTab] ?? (requestedTab as (typeof TAB_SLUGS)[number]);
  const initialIndex = Math.max(0, TAB_SLUGS.indexOf(resolvedTab));

  // Lets the summary card's "Edit Order" button drive the edit drawer that lives inside the
  // Event Information tab, rather than duplicating the form. The tab index is controlled here
  // too: AppTabs only mounts the active tab, so the button must bring Event Information forward
  // first or the drawer it targets wouldn't exist yet.
  const [activeTab, setActiveTab] = useState(initialIndex);
  const [editRequestId, setEditRequestId] = useState(0);

  function requestEdit() {
    setActiveTab(TAB_SLUGS.indexOf('info'));
    setEditRequestId((value) => value + 1);
  }

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id!),
  });

  if (isLoading) return <CircularProgress size={28} />;
  if (!order) return <Typography color="text.secondary">Order not found.</Typography>;

  async function handleDownload() {
    if (!order) return;
    try {
      await quotationService.downloadPdf(
        order.quotation.id,
        `${order.quotation.quotationNumber}-v${order.quotation.version}.pdf`,
      );
    } catch {
      showToast('Unable to download the quotation PDF.', 'error');
    }
  }

  async function handlePrint() {
    if (!order) return;
    try {
      await quotationService.openPdf(order.quotation.id);
    } catch {
      showToast('Unable to open the quotation PDF.', 'error');
    }
  }

  function handleWhatsApp() {
    if (!order) return;
    const number = order.customer.mobile.replace(/\D/g, '');
    if (!number) {
      showToast('This customer has no mobile number on record.', 'error');
      return;
    }
    const message = `Hello ${order.customer.customerName}, here are the details for your order ${order.orderNumber}. Regards.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Orders', to: '/orders' },
          { label: order.orderNumber },
        ]}
      />

      <OrderSummaryCard
        order={order}
        canEdit={canEdit}
        onEdit={requestEdit}
        onPrint={() => void handlePrint()}
        onDownload={() => void handleDownload()}
        onWhatsApp={handleWhatsApp}
      />

      <OrderProgressTracker status={order.status} />

      <AppTabs
        idPrefix="order-detail"
        activeIndex={activeTab}
        onActiveIndexChange={setActiveTab}
        tabs={[
          { label: 'Event Information', content: <OrderEventInfoTab order={order} editRequestId={editRequestId} /> },
          { label: 'Quotation', content: <OrderQuotationTab order={order} /> },
          { label: 'Payments', content: <OrderPaymentsTab order={order} /> },
          { label: 'Task Plan', content: <OrderTaskPlanTab order={order} /> },
          { label: 'Documents', content: <OrderDocumentsTab order={order} /> },
          { label: 'Timeline', content: <OrderTimelineTab orderId={order.id} /> },
        ]}
      />
    </Box>
  );
}
