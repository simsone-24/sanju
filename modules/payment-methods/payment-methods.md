# Payment Methods

## Purpose

Serves the fixed list of payment methods that fills the dropdown on every record-payment form. The
smallest module in the codebase: a controller and a router, no service, repository or table.

## Source Files

```
server/src/modules/payment-methods/
  controller.ts   routes.ts
```

## Data

None. The list is the Prisma `PaymentMethod` enum:

`CASH`, `UPI`, `BANK`, `CARD`, `CHEQUE`

The rent module uses its own separate `RentPaymentMode` enum (`CASH`, `UPI`, `BANK_TRANSFER`,
`CARD`, `OTHER`) — see [Rent Payments](../rent-payments/rent-payments.md).

## API

Base path `/api/v1/payment-methods`.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | authenticated only | Returns the enum values as a string array. |

## Business Rules

- Authentication alone is the gate. The list is a fixed enum rather than company data, and an
  accountant role holding Payment Tracker rights but no Masters rights has to be able to read it in
  order to record a collection.
- Because it is an enum, adding a method is a schema change plus a migration — it is deliberately
  not user-editable master data.

## Frontend

Consumed by the payment dialogs in the Payment Tracker and the Order Payments tab
(`client/src/pages/payment-tracker/`, `client/src/pages/orders/tabs/OrderPaymentsTab.tsx`).

## Related Modules

[Payments](../payments/payments.md) · [Payment Tracker](../payment-tracker/payment-tracker.md)
