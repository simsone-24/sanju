-- Backfill: every order that already existed before the Payment Tracker module was added needs
-- its tracker row, since new rows are only created at order-conversion time from here on.
-- Status mirrors derivePaymentTrackerStatus() in payment-tracker/types.ts exactly:
--   nothing collected            -> PENDING
--   collected covers the budget  -> FULLY_PAID
--   only ADVANCE receipts so far -> ADVANCE_PAID
--   otherwise                    -> PARTIAL_PAYMENT
-- Cancelled orders are included so the tracker row exists if an order is ever reinstated; the
-- module filters them out when reading (they carry no payment obligation).
INSERT INTO `payment_trackers` (`id`, `order_id`, `payment_status`, `status_manual`, `created_at`, `updated_at`)
SELECT
    UUID(),
    o.`id`,
    CASE
        WHEN o.`paid_amount` <= 0 THEN 'PENDING'
        WHEN o.`total_amount` > 0 AND o.`paid_amount` >= o.`total_amount` THEN 'FULLY_PAID'
        WHEN EXISTS (
            SELECT 1 FROM `payments` p
            WHERE p.`order_id` = o.`id` AND p.`deleted_at` IS NULL AND p.`payment_type` <> 'ADVANCE'
        ) THEN 'PARTIAL_PAYMENT'
        ELSE 'ADVANCE_PAID'
    END,
    FALSE,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM `orders` o
WHERE o.`deleted_at` IS NULL
  AND NOT EXISTS (SELECT 1 FROM `payment_trackers` t WHERE t.`order_id` = o.`id`);
