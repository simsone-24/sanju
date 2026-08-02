/*
  Warnings:

  - Added the required column `company_id` to the `quotations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `enquiries` DROP FOREIGN KEY `enquiries_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_enquiry_id_fkey`;

-- AlterTable
ALTER TABLE `companies` ADD COLUMN `authorized_signatory` VARCHAR(191) NULL,
    ADD COLUMN `bank_account_name` VARCHAR(191) NULL,
    ADD COLUMN `bank_account_number` VARCHAR(191) NULL,
    ADD COLUMN `bank_branch` VARCHAR(191) NULL,
    ADD COLUMN `bank_ifsc` VARCHAR(191) NULL,
    ADD COLUMN `bank_name` VARCHAR(191) NULL,
    ADD COLUMN `bank_upi` VARCHAR(191) NULL,
    ADD COLUMN `footer_message` TEXT NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- AlterTable
-- company_id is added NULLable first, backfilled from each quotation's enquiry, then made NOT NULL,
-- so the migration is safe against a non-empty quotations table (every existing quotation is
-- enquiry-sourced and therefore has an enquiry to derive the company from).
ALTER TABLE `quotations` ADD COLUMN `company_id` CHAR(36) NULL,
    ADD COLUMN `customer_id` CHAR(36) NULL,
    ADD COLUMN `manual_address` TEXT NULL,
    ADD COLUMN `manual_customer_name` VARCHAR(191) NULL,
    ADD COLUMN `manual_email` VARCHAR(191) NULL,
    ADD COLUMN `manual_gst` VARCHAR(191) NULL,
    ADD COLUMN `manual_phone` VARCHAR(191) NULL,
    ADD COLUMN `manual_whatsapp` VARCHAR(191) NULL,
    ADD COLUMN `order_id` CHAR(36) NULL,
    ADD COLUMN `source` ENUM('ENQUIRY', 'CUSTOMER', 'ORDER', 'MANUAL') NOT NULL DEFAULT 'ENQUIRY',
    MODIFY `enquiry_id` CHAR(36) NULL;

-- Backfill company_id for pre-existing (enquiry-sourced) quotations.
UPDATE `quotations` `q`
    JOIN `enquiries` `e` ON `e`.`id` = `q`.`enquiry_id`
    SET `q`.`company_id` = `e`.`company_id`
    WHERE `q`.`company_id` IS NULL;

-- Enforce NOT NULL now that every row has a company_id.
ALTER TABLE `quotations` MODIFY `company_id` CHAR(36) NOT NULL;

-- CreateIndex
CREATE INDEX `quotations_company_id_idx` ON `quotations`(`company_id`);

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
