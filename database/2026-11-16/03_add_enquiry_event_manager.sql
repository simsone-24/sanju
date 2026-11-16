-- Date: 2026-11-16
-- Purpose: Add an optional Event Manager (a system user) to enquiries, entered in the enquiry form's
--          Event Information section and carried onto the order's coordinator on conversion.
-- Module / feature: Enquiries
-- Matches: server/prisma/migrations/20261116000200_add_enquiry_event_manager/migration.sql

-- AlterTable
ALTER TABLE `enquiries` ADD COLUMN `event_manager_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `enquiries_event_manager_id_idx` ON `enquiries`(`event_manager_id`);

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_event_manager_id_fkey` FOREIGN KEY (`event_manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ROLLBACK:
-- ALTER TABLE `enquiries` DROP FOREIGN KEY `enquiries_event_manager_id_fkey`;
-- DROP INDEX `enquiries_event_manager_id_idx` ON `enquiries`;
-- ALTER TABLE `enquiries` DROP COLUMN `event_manager_id`;
