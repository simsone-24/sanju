-- AlterTable
ALTER TABLE `enquiries` ADD COLUMN `event_manager_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `enquiries_event_manager_id_idx` ON `enquiries`(`event_manager_id`);

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_event_manager_id_fkey` FOREIGN KEY (`event_manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
