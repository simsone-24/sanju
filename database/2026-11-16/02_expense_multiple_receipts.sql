-- Date: 2026-11-16
-- Purpose: Let an expense carry several receipts (images / PDFs). Moves the single receipt stored on
--          `expenses` into a new `expense_receipts` table (existing receipts are copied across) and
--          drops the old columns.
-- Module / feature: Expenses
-- Matches: server/prisma/migrations/20261116000100_expense_multiple_receipts/migration.sql

-- CreateTable
CREATE TABLE `expense_receipts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expense_id` INTEGER NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `expense_receipts_expense_id_idx`(`expense_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `expense_receipts` ADD CONSTRAINT `expense_receipts_expense_id_fkey` FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Carry over the single receipt each existing expense may already have.
INSERT INTO `expense_receipts` (`expense_id`, `file_name`, `file_path`, `created_at`, `updated_at`)
SELECT `id`, `receipt_file_name`, `receipt_path`, `created_at`, `updated_at`
FROM `expenses`
WHERE `receipt_path` IS NOT NULL AND `receipt_file_name` IS NOT NULL;

-- AlterTable
ALTER TABLE `expenses` DROP COLUMN `receipt_file_name`,
    DROP COLUMN `receipt_path`;

-- ROLLBACK (keeps only the first receipt of each expense — an expense can hold one again):
-- ALTER TABLE `expenses` ADD COLUMN `receipt_file_name` VARCHAR(191) NULL,
--     ADD COLUMN `receipt_path` VARCHAR(191) NULL;
-- UPDATE `expenses` e
--   JOIN (SELECT `expense_id`, MIN(`id`) AS `first_id` FROM `expense_receipts` WHERE `deleted_at` IS NULL GROUP BY `expense_id`) f
--     ON f.`expense_id` = e.`id`
--   JOIN `expense_receipts` r ON r.`id` = f.`first_id`
--   SET e.`receipt_file_name` = r.`file_name`, e.`receipt_path` = r.`file_path`;
-- DROP TABLE `expense_receipts`;
