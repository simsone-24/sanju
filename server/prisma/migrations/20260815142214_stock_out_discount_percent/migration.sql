-- Discount on a stock out is now entered as a percentage of the subtotal rather than as a flat
-- amount. `discount` keeps its meaning — the resulting money off — so every total, report, print
-- and payment balance that already reads it is unaffected; `discount_percent` records what was
-- actually agreed, the same way quotations keep cgst_percent alongside the computed tax.
--
-- Existing rows default to 0%. Any stock out already carrying a flat discount would now show 0%
-- against a non-zero amount, so the backfill below restates it as the equivalent percentage of its
-- own subtotal. Subtotal is never zero on a saved stock out (at least one line is required), but
-- the guard is kept so the statement cannot divide by zero on unexpected data.
ALTER TABLE `stock_outs` ADD COLUMN `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00;

UPDATE `stock_outs`
SET `discount_percent` = LEAST(100, ROUND((`discount` / `subtotal`) * 100, 2))
WHERE `discount` > 0 AND `subtotal` > 0;
