import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// docs/03_MODULES.md §2 documents 4 quick actions (New Enquiry / New Order / Receive Payment /
// Add Customer), but this app's business rules mean 3 of the 4 have no standalone creation
// screen: Orders are only ever created by converting an approved Quotation
// (CLAUDE.md "Order - Created only from approved quotation"), Payments only exist inside an
// Order's Payments tab, and Customers are only ever created as a side effect of a New Enquiry
// (docs/03_MODULES.md §6 "Customer records are created automatically. No manual creation.").
// Each button below routes to the real starting point of that workflow rather than a
// nonexistent direct-create page — "Add Customer" intentionally lands on the same New Enquiry
// form as "New Enquiry" for this reason, not by mistake.
export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h2" sx={{ mb: 1.5 }}>
        Quick Actions
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/enquiries/new')}>
          New Enquiry
        </Button>
        <Button
          variant="outlined"
          startIcon={<ShoppingCartCheckoutIcon />}
          onClick={() => navigate('/quotations')}
        >
          New Order
        </Button>
        <Button variant="outlined" startIcon={<PaymentIcon />} onClick={() => navigate('/orders')}>
          Receive Payment
        </Button>
        <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => navigate('/enquiries/new')}>
          Add Customer
        </Button>
      </Stack>
    </Paper>
  );
}
