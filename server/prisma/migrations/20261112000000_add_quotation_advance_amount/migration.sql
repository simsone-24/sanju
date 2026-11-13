-- The advance agreed against a quotation, entered on every quotation form (New/Edit Quotation and
-- the enquiry's Create/Edit Quotation dialog). Kept separate from total_amount: the printed total
-- remains the full quote and the advance creates no payment on its own.
ALTER TABLE `quotations` ADD COLUMN `advance_amount` DECIMAL(12, 2) NULL;
