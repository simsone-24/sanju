import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PlaceIcon from '@mui/icons-material/Place';
import PrintIcon from '@mui/icons-material/Print';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ShareIcon from '@mui/icons-material/Share';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { RecordHeaderCard } from '../../components/RecordHeaderCard';
import { StatusBadge } from '../../components/StatusBadge';
import type { OrderDetail } from '../../types/order';
import { formatCurrency, formatDate } from '../../utils/format';

interface OrderSummaryCardProps {
  order: OrderDetail;
  canEdit: boolean;
  onEdit: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onWhatsApp: () => void;
}

/**
 * Order Details header — the shared RecordHeaderCard filled in for an order.
 *
 * Print, Download and Share all act on the approved quotation: an order has no printable document
 * of its own, so the share menu names the quotation rather than implying an "order PDF" exists.
 */
export function OrderSummaryCard({ order, canEdit, onEdit, onPrint, onDownload, onWhatsApp }: OrderSummaryCardProps) {
  const [shareAnchor, setShareAnchor] = useState<HTMLElement | null>(null);

  function runAndClose(action: () => void) {
    setShareAnchor(null);
    action();
  }

  return (
    <RecordHeaderCard
      icon={<BusinessCenterOutlinedIcon />}
      eyebrow="Order"
      title={order.orderNumber}
      badge={<StatusBadge type="order" status={order.status} />}
      actions={
        <>
          {canEdit && (
            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
              Edit Order
            </Button>
          )}
          <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={onPrint}>
            Print
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<ShareIcon />}
            endIcon={<ArrowDropDownIcon />}
            aria-haspopup="menu"
            aria-expanded={shareAnchor ? 'true' : undefined}
            onClick={(event) => setShareAnchor(event.currentTarget)}
          >
            Share
          </Button>
          <Menu anchorEl={shareAnchor} open={Boolean(shareAnchor)} onClose={() => setShareAnchor(null)}>
            <MenuItem onClick={() => runAndClose(onWhatsApp)}>
              <ListItemIcon>
                <WhatsAppIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Share on WhatsApp" secondary="Messages the customer" />
            </MenuItem>
            <MenuItem onClick={() => runAndClose(onDownload)}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Download PDF" secondary="The approved quotation" />
            </MenuItem>
          </Menu>
        </>
      }
      facts={[
        {
          icon: <PersonOutlinedIcon sx={{ fontSize: 16 }} />,
          label: 'Customer',
          value: order.customer.customerName,
        },
        { icon: <PlaceIcon sx={{ fontSize: 16 }} />, label: 'Venue', value: order.venue || '—' },
        { icon: <ScheduleIcon sx={{ fontSize: 16 }} />, label: 'Created On', value: formatDate(order.createdAt) },
        { icon: <EventIcon sx={{ fontSize: 16 }} />, label: 'Event Date', value: formatDate(order.eventDate) },
        { icon: <ListAltIcon sx={{ fontSize: 16 }} />, label: 'Enquiry', value: order.enquiry.enquiryNumber },
      ]}
      figures={[
        { label: 'Total Amount', value: formatCurrency(order.totalAmount) },
        { label: 'Paid Amount', value: formatCurrency(order.paidAmount), tone: 'positive' },
        { label: 'Balance Amount', value: formatCurrency(order.pendingAmount), tone: 'due' },
      ]}
    />
  );
}
