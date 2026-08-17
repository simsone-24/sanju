-- AlterTable
ALTER TABLE `document_sequences` MODIFY `sequence_type` ENUM('ENQUIRY', 'QUOTATION', 'ORDER', 'RECEIPT', 'INVOICE', 'CUSTOMER', 'RENT_OUT', 'RENT_RETURN', 'RENT_PAYMENT') NOT NULL;

-- CreateTable
CREATE TABLE `rental_persons` (
    `id` CHAR(36) NOT NULL,
    `company_id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `rental_persons_company_id_name_idx`(`company_id`, `name`),
    INDEX `rental_persons_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_items` (
    `id` CHAR(36) NOT NULL,
    `company_id` CHAR(36) NOT NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `default_rent_rate` DECIMAL(12, 2) NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `rental_items_company_id_item_name_key`(`company_id`, `item_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_outs` (
    `id` CHAR(36) NOT NULL,
    `company_id` CHAR(36) NOT NULL,
    `rent_no` VARCHAR(191) NOT NULL,
    `rental_person_id` CHAR(36) NOT NULL,
    `stock_out_date` DATETIME(3) NOT NULL,
    `expected_return_date` DATETIME(3) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `additional_charges` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `grand_total` DECIMAL(12, 2) NOT NULL,
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `issued_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `returned_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `return_status` ENUM('NOT_RETURNED', 'PARTIAL_RETURNED', 'RETURNED') NOT NULL DEFAULT 'NOT_RETURNED',
    `payment_status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `created_by_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `stock_outs_rent_no_key`(`rent_no`),
    INDEX `stock_outs_company_id_stock_out_date_idx`(`company_id`, `stock_out_date`),
    INDEX `stock_outs_rental_person_id_idx`(`rental_person_id`),
    INDEX `stock_outs_return_status_idx`(`return_status`),
    INDEX `stock_outs_payment_status_idx`(`payment_status`),
    INDEX `stock_outs_expected_return_date_idx`(`expected_return_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_out_items` (
    `id` CHAR(36) NOT NULL,
    `stock_out_id` CHAR(36) NOT NULL,
    `rental_item_id` CHAR(36) NULL,
    `item_name_snapshot` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `rate` DECIMAL(12, 2) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `returned_quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stock_out_items_stock_out_id_idx`(`stock_out_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_returns` (
    `id` CHAR(36) NOT NULL,
    `company_id` CHAR(36) NOT NULL,
    `return_no` VARCHAR(191) NOT NULL,
    `stock_out_id` CHAR(36) NOT NULL,
    `return_date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `created_by_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `stock_returns_return_no_key`(`return_no`),
    INDEX `stock_returns_stock_out_id_idx`(`stock_out_id`),
    INDEX `stock_returns_company_id_return_date_idx`(`company_id`, `return_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_return_items` (
    `id` CHAR(36) NOT NULL,
    `stock_return_id` CHAR(36) NOT NULL,
    `stock_out_item_id` CHAR(36) NOT NULL,
    `quantity_returned` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stock_return_items_stock_return_id_idx`(`stock_return_id`),
    INDEX `stock_return_items_stock_out_item_id_idx`(`stock_out_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rent_payments` (
    `id` CHAR(36) NOT NULL,
    `company_id` CHAR(36) NOT NULL,
    `payment_no` VARCHAR(191) NOT NULL,
    `stock_out_id` CHAR(36) NOT NULL,
    `rental_person_id` CHAR(36) NOT NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_mode` ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER') NOT NULL,
    `reference_no` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `received_by_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `rent_payments_payment_no_key`(`payment_no`),
    INDEX `rent_payments_stock_out_id_idx`(`stock_out_id`),
    INDEX `rent_payments_rental_person_id_idx`(`rental_person_id`),
    INDEX `rent_payments_company_id_payment_date_idx`(`company_id`, `payment_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rental_persons` ADD CONSTRAINT `rental_persons_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_items` ADD CONSTRAINT `rental_items_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_outs` ADD CONSTRAINT `stock_outs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_outs` ADD CONSTRAINT `stock_outs_rental_person_id_fkey` FOREIGN KEY (`rental_person_id`) REFERENCES `rental_persons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_outs` ADD CONSTRAINT `stock_outs_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_out_items` ADD CONSTRAINT `stock_out_items_stock_out_id_fkey` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_out_items` ADD CONSTRAINT `stock_out_items_rental_item_id_fkey` FOREIGN KEY (`rental_item_id`) REFERENCES `rental_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_returns` ADD CONSTRAINT `stock_returns_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_returns` ADD CONSTRAINT `stock_returns_stock_out_id_fkey` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_returns` ADD CONSTRAINT `stock_returns_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_return_items` ADD CONSTRAINT `stock_return_items_stock_return_id_fkey` FOREIGN KEY (`stock_return_id`) REFERENCES `stock_returns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_return_items` ADD CONSTRAINT `stock_return_items_stock_out_item_id_fkey` FOREIGN KEY (`stock_out_item_id`) REFERENCES `stock_out_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rent_payments` ADD CONSTRAINT `rent_payments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rent_payments` ADD CONSTRAINT `rent_payments_stock_out_id_fkey` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rent_payments` ADD CONSTRAINT `rent_payments_rental_person_id_fkey` FOREIGN KEY (`rental_person_id`) REFERENCES `rental_persons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rent_payments` ADD CONSTRAINT `rent_payments_received_by_id_fkey` FOREIGN KEY (`received_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
