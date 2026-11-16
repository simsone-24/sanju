-- CreateTable
CREATE TABLE `enquiry_event_days` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enquiry_id` INTEGER NOT NULL,
    `event_date` DATE NOT NULL,
    `event_time` ENUM('MORNING', 'EVENING') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `enquiry_event_days_enquiry_id_event_date_idx`(`enquiry_id`, `event_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `enquiry_event_days` ADD CONSTRAINT `enquiry_event_days_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: every enquiry that already has an event date gets it as its first (and only) event day.
INSERT INTO `enquiry_event_days` (`enquiry_id`, `event_date`, `event_time`, `created_at`, `updated_at`, `deleted_at`)
SELECT `id`, DATE(`event_date`), `event_time`, `created_at`, `updated_at`, `deleted_at`
FROM `enquiries`
WHERE `event_date` IS NOT NULL;
