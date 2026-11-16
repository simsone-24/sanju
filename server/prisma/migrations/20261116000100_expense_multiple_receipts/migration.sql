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
