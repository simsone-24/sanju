-- Date: 2026-11-16
-- Purpose: Record the total stock count of each stock item (rental_items), entered after the item rate.
-- Module / feature: Rent / Stock Items
-- Matches: server/prisma/migrations/20261116000400_add_rental_item_total_stock/migration.sql

-- AlterTable
ALTER TABLE `rental_items` ADD COLUMN `total_stock` INTEGER NOT NULL DEFAULT 0;

-- ROLLBACK:
-- ALTER TABLE `rental_items` DROP COLUMN `total_stock`;
