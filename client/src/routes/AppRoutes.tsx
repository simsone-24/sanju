import { Route, Navigate, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/auth/LoginPage';
import CalendarPage from '../pages/calendar/CalendarPage';
import CustomerDetailPage from '../pages/customers/CustomerDetailPage';
import CustomerListPage from '../pages/customers/CustomerListPage';
import EnquiryDetailPage from '../pages/enquiries/EnquiryDetailPage';
import EnquiryFormPage from '../pages/enquiries/EnquiryFormPage';
import EnquiryListPage from '../pages/enquiries/EnquiryListPage';
import MastersPage from '../pages/masters/MastersPage';
import OrderDetailPage from '../pages/orders/OrderDetailPage';
import OrderListPage from '../pages/orders/OrderListPage';
import InvoicePage from '../pages/payment-tracker/InvoicePage';
import PaymentTrackerDetailPage from '../pages/payment-tracker/PaymentTrackerDetailPage';
import PaymentTrackerListPage from '../pages/payment-tracker/PaymentTrackerListPage';
import QuotationDetailPage from '../pages/quotations/QuotationDetailPage';
import QuotationFormPage from '../pages/quotations/QuotationFormPage';
import QuotationListPage from '../pages/quotations/QuotationListPage';
import RentDashboardPage from '../pages/rent/RentDashboardPage';
import RentPaymentListPage from '../pages/rent/RentPaymentListPage';
import RentReportsPage from '../pages/rent/RentReportsPage';
import RentalItemListPage from '../pages/rent/RentalItemListPage';
import RentalPersonDetailPage from '../pages/rent/RentalPersonDetailPage';
import RentalPersonListPage from '../pages/rent/RentalPersonListPage';
import StockOutDetailPage from '../pages/rent/StockOutDetailPage';
import StockOutFormPage from '../pages/rent/StockOutFormPage';
import StockOutListPage from '../pages/rent/StockOutListPage';
import StockOutPrintPage from '../pages/rent/StockOutPrintPage';
import StockReturnPage from '../pages/rent/StockReturnPage';
import ReportsPage from '../pages/reports/ReportsPage';
import { ProtectedRoute } from './ProtectedRoute';

// createBrowserRouter (rather than a bare <BrowserRouter>) is required for useBlocker, which
// FormPage's unsaved-changes guard depends on — see src/hooks/useUnsavedChangesGuard.ts.
export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Enquiries: create/edit are dedicated pages (md files/UI-2.md), not nested/inline. */}
          <Route path="/enquiries" element={<EnquiryListPage />} />
          <Route path="/enquiries/new" element={<EnquiryFormPage />} />
          <Route path="/enquiries/:id/edit" element={<EnquiryFormPage />} />
          <Route path="/enquiries/:id" element={<EnquiryDetailPage />} />

          {/* Quotations own their whole workflow: a row opens the quotation's view page, not the
              enquiry it came from ("md files/Quotation/cr1.md"). Edit is a page, never a popup. */}
          <Route path="/quotations" element={<QuotationListPage />} />
          <Route path="/quotations/new" element={<QuotationFormPage />} />
          <Route path="/quotations/:id/edit" element={<QuotationFormPage />} />
          <Route path="/quotations/:id" element={<QuotationDetailPage />} />

          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />

          {/* Payment Tracker is keyed by the order's id — "payment/payment.md" §Business Rules:
              "The module uses the existing Order ID." */}
          <Route path="/payment-tracker" element={<PaymentTrackerListPage />} />
          {/* Registered before ":id" is irrelevant here (different depth), but the invoice is a
              print view of the same order, so it stays nested under the tracker's route. */}
          <Route path="/payment-tracker/:id/invoice" element={<InvoicePage />} />
          <Route path="/payment-tracker/:id" element={<PaymentTrackerDetailPage />} />

          <Route path="/calendar" element={<CalendarPage />} />

          {/* Rent — a self-contained workflow with no link to enquiries, quotations or orders
              ("md files/Stock/stock.md" §1). Create/edit are dedicated pages like every other
              module; returns and payments are dialogs raised from the record they belong to. */}
          <Route path="/rent" element={<RentDashboardPage />} />
          <Route path="/rent/persons" element={<RentalPersonListPage />} />
          <Route path="/rent/persons/:id" element={<RentalPersonDetailPage />} />
          <Route path="/rent/items" element={<RentalItemListPage />} />
          <Route path="/rent/stock-outs" element={<StockOutListPage />} />
          {/* Registered before ":id" so "new" isn't captured as an id. */}
          <Route path="/rent/stock-outs/new" element={<StockOutFormPage />} />
          <Route path="/rent/stock-outs/:id/edit" element={<StockOutFormPage />} />
          <Route path="/rent/stock-outs/:id/print" element={<StockOutPrintPage />} />
          <Route path="/rent/stock-outs/:id" element={<StockOutDetailPage />} />
          <Route path="/rent/returns" element={<StockReturnPage />} />
          <Route path="/rent/payments" element={<RentPaymentListPage />} />
          <Route path="/rent/reports" element={<RentReportsPage />} />

          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />

          <Route path="/masters" element={<MastersPage />} />

          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </>,
  ),
);
