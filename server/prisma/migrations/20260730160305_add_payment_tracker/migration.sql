-- CreateTable
CREATE TABLE `payment_trackers` (
    `id` CHAR(36) NOT NULL,
    `order_id` CHAR(36) NOT NULL,
    `payment_status` ENUM('PENDING', 'ADVANCE_PAID', 'PARTIAL_PAYMENT', 'FULLY_PAID') NOT NULL DEFAULT 'PENDING',
    `status_manual` BOOLEAN NOT NULL DEFAULT false,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `payment_trackers_order_id_key`(`order_id`),
    INDEX `payment_trackers_payment_status_idx`(`payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_trackers` ADD CONSTRAINT `payment_trackers_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
