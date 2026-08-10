import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DownloadIcon from '@mui/icons-material/Download';
import FlagIcon from '@mui/icons-material/Flag';
import HistoryIcon from '@mui/icons-material/History';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppTabs } from '../../components/AppTabs';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { usePermission } from '../../hooks/usePermission';
import * as orderService from '../../services/orderService';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import { resolveCreatedBy, resolveStageDates } from './orderActivity';
import { OrderProgressTracker } from './OrderProgressTracker';
import { OrderStatusDialog } from './OrderStatusDialog';
import { OrderSummaryCard } from './OrderSummaryCard';
import OrderDocumentsTab from './tabs/OrderDocumentsTab';
import OrderOverviewTab from './tabs/OrderOverviewTab';
import OrderPaymentsTab from './tabs/OrderPaymentsTab';
import OrderQuotationTab from './tabs/OrderQuotationTab';
import OrderTaskPlanTab from './tabs/OrderTaskPlanTab';
import OrderTimelineTab from './tabs/OrderTimelineTab';

// Tab slugs accepted via `?tab=` so the Orders list's row actions can deep-link straight to the
// relevant tab (e.g. the Payments action) instead of always landing on Overview.
// "planning" and "tasks" are kept as aliases of the Task Plan tab so existing deep links, which
// pointed at the two tabs it replaced, still resolve.
const TAB_SLUGS = ['info', 'quotation', 'payments', 'task-plan', 'documents', 'timeline'] as const;
const TAB_SLUG_ALIASES: Record<string, (typeof TAB_SLUGS)[number]> = {
  planning: 'task-plan',
  tasks: 'task-plan',
  overview: 'info',
};

function DetailSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" height={170} sx={{ borderRadius: '16px', mb: 2 }} />
      <Skeleton variant="rounded" height={96} sx={{ borderRadius: '16px', mb: 2 }} />
      <Skeleton variant="rounded" height={360} sx={{ borderRadius: '16px' }} />
    </Box>
  );
}

// Full page (not a drawer, unlike Enquiries/Quotations forms) — Order Details is documented as
// a tabbed page in its own right (docs/03_MODULES.md §4), too rich for a drawer overlay.
// The separate Planning and Task Checklist tabs were merged into a single Task Plan tab per
// "md files/task plan/scope.md" ("Instead of maintaining separate Plan and Task modules…").
// Timeline is the one addition beyond the documented list, an audit-trail view.
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const canEdit = usePermission('ORDERS', 'canEdit');
  const canCancel = usePermission('ORDERS', 'canCancel');
  const canCompleteEvent = usePermission('ORDERS', 'canCompleteEvent');
  const requestedTab = searchParams.get('tab') ?? 'info';
  const resolvedTab = TAB_SLUG_ALIASES[requestedTab] ?? (requestedTab as (typeof TAB_SLUGS)[number]);
  const initialIndex = Math.max(0, TAB_SLUGS.indexOf(resolvedTab));

  // Lets the summary card's "Edit Order" button drive the edit drawer that lives inside the
  // Overview tab, rather than duplicating the form. The tab index is controlled here too: AppTabs
  // only mounts the active tab, so the button must bring Overview forward first or the drawer it
  // targets wouldn't exist yet.
  const [activeTab, setActiveTab] = useState(initialIndex);
  const [editRequestId, setEditRequestId] = useState(0);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  function requestEdit() {
    setActiveTab(TAB_SLUGS.indexOf('info'));
    setEditRequestId((value) => value + 1);
  }

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id!),
  });

  // The same query the Timeline tab reads, so the two share one request. It is the only source for
  // who raised the order and when it entered each stage — neither is a column on the Order table.
  const { data: timeline } = useQuery({
    queryKey: ['order-timeline', id],
    queryFn: () => orderService.getTimeline(id!),
    enabled: Boolean(id),
  });

  if (isLoading) return <DetailSkeleton />;
  if (!order) return <Typography color="text.secondary">Order not found.</Typography>;

  const entries = timeline ?? [];
  const stageDates = resolveStageDates(order.createdAt, entries);
  const createdBy = resolveCreatedBy(entries);
  const canChangeStatus = canEdit || canCancel || canCompleteEvent;

  function closeActions() {
    setActionsAnchor(null);
  }

  // Both PDF actions are about the order's quotation, and an order confirmed straight from an
  // enquiry may not have one — the order still exists, there is simply no document to print.
  async function handleDownload() {
    if (!order?.quotation) {
      showToast('This order has no quotation to download.', 'error');
      return;
    }
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
    if (!order?.quotation) {
      showToast('This order has no quotation to print.', 'error');
      return;
    }
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
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}
      >
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Orders', to: '/orders' },
            { label: order.orderNumber },
          ]}
        />
        {/* Whole-order actions that aren't the three the header card carries. Status lives here
            rather than as a control buried at the bottom of a tab. */}
        <Button
          size="small"
          variant="outlined"
          endIcon={<MoreVertIcon />}
          aria-haspopup="menu"
          aria-expanded={actionsAnchor ? 'true' : undefined}
          onClick={(event) => setActionsAnchor(event.currentTarget)}
          sx={{ mb: 1.25 }}
        >
          Actions
        </Button>
        <Menu anchorEl={actionsAnchor} open={Boolean(actionsAnchor)} onClose={closeActions}>
          {canChangeStatus && (
            <MenuItem
              onClick={() => {
                closeActions();
                setStatusDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <FlagIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Change Status" />
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              closeActions();
              void handleDownload();
            }}
          >
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Download Quotation PDF" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeActions();
              navigate(`/enquiries/${order.enquiry.id}`);
            }}
          >
            <ListItemIcon>
              <ListAltIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={`Open enquiry ${order.enquiry.enquiryNumber}`} />
          </MenuItem>
        </Menu>
      </Stack>

      <OrderSummaryCard
        order={order}
        canEdit={canEdit}
        onEdit={requestEdit}
        onPrint={() => void handlePrint()}
        onDownload={() => void handleDownload()}
        onWhatsApp={handleWhatsApp}
      />

      <OrderProgressTracker status={order.status} stageDates={stageDates} />

      <AppTabs
        surface
        idPrefix="order-detail"
        activeIndex={activeTab}
        onActiveIndexChange={setActiveTab}
        tabs={[
          {
            label: 'Overview',
            icon: <SpaceDashboardOutlinedIcon fontSize="small" />,
            content: (
              <OrderOverviewTab
                order={order}
                editRequestId={editRequestId}
                createdBy={createdBy}
                onViewPayments={() => setActiveTab(TAB_SLUGS.indexOf('payments'))}
              />
            ),
          },
          {
            label: 'Quotation',
            icon: <ReceiptLongIcon fontSize="small" />,
            content: <OrderQuotationTab order={order} />,
          },
          { label: 'Payments', icon: <PaymentsIcon fontSize="small" />, content: <OrderPaymentsTab order={order} /> },
          { label: 'Task Plan', icon: <ChecklistIcon fontSize="small" />, content: <OrderTaskPlanTab order={order} /> },
          {
            label: 'Documents',
            icon: <ArticleOutlinedIcon fontSize="small" />,
            content: <OrderDocumentsTab order={order} />,
          },
          {
            label: 'Timeline',
            icon: <HistoryIcon fontSize="small" />,
            content: <OrderTimelineTab orderId={order.id} />,
          },
        ]}
      />

      <OrderStatusDialog
        open={statusDialogOpen}
        orderId={order.id}
        currentStatus={order.status}
        onClose={() => setStatusDialogOpen(false)}
      />
    </Box>
  );
}
