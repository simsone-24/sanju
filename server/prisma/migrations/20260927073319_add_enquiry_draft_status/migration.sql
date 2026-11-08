-- DropForeignKey
ALTER TABLE `enquiries` DROP FOREIGN KEY `enquiries_event_type_id_fkey`;

-- AlterTable
ALTER TABLE `enquiries`
    MODIFY `event_type_id` INTEGER NULL,
    MODIFY `status` ENUM('DRAFT', 'PENDING', 'APPOINTMENT_FIXED', 'QUOTATION_TO_SHARE', 'QUOTATION_SHARED', 'ORDER_CONFIRMED', 'ORDER_LOST') NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_event_type_id_fkey` FOREIGN KEY (`event_type_id`) REFERENCES `event_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
