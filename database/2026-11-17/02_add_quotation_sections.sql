-- Date: 2026-11-17
-- Purpose: Section-wise quotations. A quotation can group its items under named sections, each priced
--          as one amount (e.g. "EVENING STAGE" - 1,20,000), as on Sanju's printed quotation. Items
--          under a section are descriptions with a free-text Size/Qty, so quantity / rate / amount
--          on quotation_items become optional. Existing quotations are unchanged (flat priced items).
-- Module / feature: Quotations
-- Matches: server/prisma/migrations/20261117000100_add_quotation_sections/migration.sql

-- AlterTable
ALTER TABLE `quotation_items` ADD COLUMN `section_id` INTEGER NULL,
    ADD COLUMN `size_qty` VARCHAR(191) NULL,
    MODIFY `quantity` DECIMAL(10, 2) NULL,
    MODIFY `rate` DECIMAL(12, 2) NULL,
    MODIFY `amount` DECIMAL(12, 2) NULL;

-- CreateTable
CREATE TABLE `quotation_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quotation_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `quotation_sections_quotation_id_idx`(`quotation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `quotation_items_section_id_idx` ON `quotation_items`(`section_id`);

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `quotation_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_sections` ADD CONSTRAINT `quotation_sections_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- ROLLBACK:
-- (Remove section-based quotations first: items with NULL quantity / rate / amount block the MODIFY below.)
-- ALTER TABLE `quotation_items` DROP FOREIGN KEY `quotation_items_section_id_fkey`;
-- ALTER TABLE `quotation_sections` DROP FOREIGN KEY `quotation_sections_quotation_id_fkey`;
-- DROP INDEX `quotation_items_section_id_idx` ON `quotation_items`;
-- DROP TABLE `quotation_sections`;
-- ALTER TABLE `quotation_items` DROP COLUMN `section_id`, DROP COLUMN `size_qty`,
--     MODIFY `quantity` DECIMAL(10, 2) NOT NULL, MODIFY `rate` DECIMAL(12, 2) NOT NULL, MODIFY `amount` DECIMAL(12, 2) NOT NULL;
