-- Drops the rent module's `unit` column.
--
-- Unit was a free-text label ("nos", "metre") that no calculation ever read: amounts, balances and
-- return status are all driven by `quantity` alone, so the column only ever decorated the number
-- beside it. Removed rather than left unused.
--
-- Safe to drop outright: both tables were introduced in 20260815124915_add_rent_module and carry no
-- rows yet, so there is no data to migrate or preserve.
ALTER TABLE `rental_items` DROP COLUMN `unit`;

ALTER TABLE `stock_out_items` DROP COLUMN `unit`;
