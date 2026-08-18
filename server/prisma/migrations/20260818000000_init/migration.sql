-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_name` VARCHAR(191) NOT NULL,
    `contact_person` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `logo` VARCHAR(191) NULL,
    `gst_number` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `bank_name` VARCHAR(191) NULL,
    `bank_account_name` VARCHAR(191) NULL,
    `bank_account_number` VARCHAR(191) NULL,
    `bank_branch` VARCHAR(191) NULL,
    `bank_ifsc` VARCHAR(191) NULL,
    `bank_upi` VARCHAR(191) NULL,
    `authorized_signatory` VARCHAR(191) NULL,
    `footer_message` TEXT NULL,
    `terms_and_conditions` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `group_name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `user_groups_company_id_group_name_key`(`company_id`, `group_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_group_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_group_id` INTEGER NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_group_permissions_user_group_id_module_action_key`(`user_group_id`, `module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permission_overrides` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_permission_overrides_user_id_module_action_key`(`user_id`, `module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `user_group_id` INTEGER NOT NULL,
    `employee_code` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `profile_photo` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_mobile_idx`(`mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `customer_code` VARCHAR(191) NOT NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `remarks` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `customers_customer_code_key`(`customer_code`),
    INDEX `customers_mobile_idx`(`mobile`),
    INDEX `customers_customer_name_idx`(`customer_name`),
    INDEX `customers_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `event_name` VARCHAR(191) NOT NULL,
    `color_code` VARCHAR(191) NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `event_types_company_id_event_name_key`(`company_id`, `event_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `task_name` VARCHAR(191) NOT NULL,
    `task_category` ENUM('PLANNING', 'EXECUTION') NOT NULL DEFAULT 'EXECUTION',
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_default` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enquiries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `enquiry_number` VARCHAR(191) NOT NULL,
    `customer_id` INTEGER NULL,
    `event_type_id` INTEGER NOT NULL,
    `prospect_name` VARCHAR(191) NULL,
    `prospect_mobile` VARCHAR(191) NULL,
    `prospect_whatsapp` VARCHAR(191) NULL,
    `prospect_email` VARCHAR(191) NULL,
    `prospect_address` TEXT NULL,
    `prospect_city` VARCHAR(191) NULL,
    `event_name` VARCHAR(191) NULL,
    `event_date` DATETIME(3) NULL,
    `event_time` ENUM('MORNING', 'EVENING') NULL,
    `mahal` VARCHAR(191) NULL,
    `venue` VARCHAR(191) NULL,
    `estimated_budget` DECIMAL(12, 2) NULL,
    `notes` TEXT NULL,
    `appointment_date` DATETIME(3) NULL,
    `appointment_time` VARCHAR(191) NULL,
    `meeting_location` VARCHAR(191) NULL,
    `appointment_notes` TEXT NULL,
    `appointment_status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `assigned_user_id` INTEGER NULL,
    `quotation_amount` DECIMAL(12, 2) NULL,
    `quotation_version` INTEGER NULL,
    `final_budget_amount` DECIMAL(12, 2) NULL,
    `advance_amount` DECIMAL(12, 2) NULL,
    `follow_up_date` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'APPOINTMENT_FIXED', 'QUOTATION_TO_SHARE', 'QUOTATION_SHARED', 'ORDER_CONFIRMED', 'ORDER_LOST') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `enquiries_enquiry_number_key`(`enquiry_number`),
    INDEX `enquiries_event_date_idx`(`event_date`),
    INDEX `enquiries_status_idx`(`status`),
    INDEX `enquiries_follow_up_date_idx`(`follow_up_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enquiry_followups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enquiry_id` INTEGER NOT NULL,
    `follow_up_date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `outcome` VARCHAR(191) NULL,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `source` ENUM('ENQUIRY', 'CUSTOMER', 'ORDER', 'MANUAL') NOT NULL DEFAULT 'ENQUIRY',
    `enquiry_id` INTEGER NULL,
    `customer_id` INTEGER NULL,
    `order_id` INTEGER NULL,
    `manual_customer_name` VARCHAR(191) NULL,
    `manual_phone` VARCHAR(191) NULL,
    `manual_whatsapp` VARCHAR(191) NULL,
    `manual_email` VARCHAR(191) NULL,
    `manual_address` TEXT NULL,
    `manual_gst` VARCHAR(191) NULL,
    `quotation_number` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `quotation_date` DATETIME(3) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `cgst_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `tax` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `remarks` TEXT NULL,
    `status` ENUM('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'REVISED') NOT NULL DEFAULT 'DRAFT',
    `pdf_path` VARCHAR(191) NULL,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `quotations_company_id_idx`(`company_id`),
    INDEX `quotations_quotation_number_idx`(`quotation_number`),
    UNIQUE INDEX `quotations_enquiry_id_version_key`(`enquiry_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quotation_id` INTEGER NOT NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `rate` DECIMAL(12, 2) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quotation_id` INTEGER NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `quotation_images_quotation_id_idx`(`quotation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `order_number` VARCHAR(191) NOT NULL,
    `enquiry_id` INTEGER NOT NULL,
    `quotation_id` INTEGER NULL,
    `customer_id` INTEGER NOT NULL,
    `event_date` DATETIME(3) NULL,
    `venue` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `remarks` TEXT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `pending_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `coordinator_id` INTEGER NULL,
    `cancellation_reason` TEXT NULL,
    `status` ENUM('YET_TO_START', 'IN_PROGRESS', 'ORDER_CLOSED', 'REJECTED') NOT NULL DEFAULT 'YET_TO_START',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_event_date_idx`(`event_date`),
    INDEX `orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `payment_type` ENUM('ADVANCE', 'PARTIAL', 'FINAL') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` ENUM('CASH', 'UPI', 'BANK', 'CARD', 'CHEQUE') NOT NULL,
    `reference_number` VARCHAR(191) NULL,
    `remarks` TEXT NULL,
    `received_by_id` INTEGER NULL,
    `receipt_number` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `payments_receipt_number_key`(`receipt_number`),
    INDEX `payments_payment_date_idx`(`payment_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `invoice_number` VARCHAR(191) NOT NULL,
    `invoice_date` DATETIME(3) NOT NULL,
    `issued_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `invoices_order_id_key`(`order_id`),
    UNIQUE INDEX `invoices_invoice_number_key`(`invoice_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_trackers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE `order_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `task_name` VARCHAR(191) NOT NULL,
    `task_category` ENUM('PLANNING', 'EXECUTION') NOT NULL,
    `assigned_to_id` INTEGER NULL,
    `due_date` DATETIME(3) NULL,
    `completed_date` DATETIME(3) NULL,
    `completed_by_id` INTEGER NULL,
    `remarks` TEXT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `task_groups_order_id_display_order_idx`(`order_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_group_id` INTEGER NOT NULL,
    `task_name` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `remarks` TEXT NULL,
    `photo_path` VARCHAR(191) NULL,
    `completed_at` DATETIME(3) NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `task_items_task_group_id_display_order_idx`(`task_group_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `document_type` ENUM('QUOTATION_PDF', 'RECEIPT', 'AGREEMENT', 'EVENT_PHOTO', 'OTHER') NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `uploaded_by_id` INTEGER NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_persons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
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
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
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
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `rent_no` VARCHAR(191) NOT NULL,
    `rental_person_id` INTEGER NOT NULL,
    `stock_out_date` DATETIME(3) NOT NULL,
    `expected_return_date` DATETIME(3) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
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
    `created_by_id` INTEGER NULL,
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
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stock_out_id` INTEGER NOT NULL,
    `rental_item_id` INTEGER NULL,
    `item_name_snapshot` VARCHAR(191) NOT NULL,
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
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `return_no` VARCHAR(191) NOT NULL,
    `stock_out_id` INTEGER NOT NULL,
    `return_date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `created_by_id` INTEGER NULL,
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
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stock_return_id` INTEGER NOT NULL,
    `stock_out_item_id` INTEGER NOT NULL,
    `quantity_returned` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stock_return_items_stock_return_id_idx`(`stock_return_id`),
    INDEX `stock_return_items_stock_out_item_id_idx`(`stock_out_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rent_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `payment_no` VARCHAR(191) NOT NULL,
    `stock_out_id` INTEGER NOT NULL,
    `rental_person_id` INTEGER NOT NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_mode` ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER') NOT NULL,
    `reference_no` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `received_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `rent_payments_payment_no_key`(`payment_no`),
    INDEX `rent_payments_stock_out_id_idx`(`stock_out_id`),
    INDEX `rent_payments_rental_person_id_idx`(`rental_person_id`),
    INDEX `rent_payments_company_id_payment_date_idx`(`company_id`, `payment_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NULL,
    `module` VARCHAR(191) NOT NULL,
    `reference_id` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `metadata` JSON NULL,
    `performed_by_id` INTEGER NULL,
    `performed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_module_reference_id_idx`(`module`, `reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_sequences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `sequence_type` ENUM('ENQUIRY', 'QUOTATION', 'ORDER', 'RECEIPT', 'INVOICE', 'CUSTOMER', 'RENT_OUT', 'RENT_RETURN', 'RENT_PAYMENT') NOT NULL,
    `year` INTEGER NOT NULL,
    `last_number` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `document_sequences_company_id_sequence_type_year_key`(`company_id`, `sequence_type`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_groups` ADD CONSTRAINT `user_groups_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_group_permissions` ADD CONSTRAINT `user_group_permissions_user_group_id_fkey` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permission_overrides` ADD CONSTRAINT `user_permission_overrides_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_user_group_id_fkey` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_types` ADD CONSTRAINT `event_types_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_templates` ADD CONSTRAINT `task_templates_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_event_type_id_fkey` FOREIGN KEY (`event_type_id`) REFERENCES `event_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_assigned_user_id_fkey` FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiry_followups` ADD CONSTRAINT `enquiry_followups_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiry_followups` ADD CONSTRAINT `enquiry_followups_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_images` ADD CONSTRAINT `quotation_images_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_coordinator_id_fkey` FOREIGN KEY (`coordinator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_received_by_id_fkey` FOREIGN KEY (`received_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_issued_by_id_fkey` FOREIGN KEY (`issued_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_trackers` ADD CONSTRAINT `payment_trackers_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_tasks` ADD CONSTRAINT `order_tasks_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_tasks` ADD CONSTRAINT `order_tasks_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_tasks` ADD CONSTRAINT `order_tasks_completed_by_id_fkey` FOREIGN KEY (`completed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_groups` ADD CONSTRAINT `task_groups_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_items` ADD CONSTRAINT `task_items_task_group_id_fkey` FOREIGN KEY (`task_group_id`) REFERENCES `task_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_documents` ADD CONSTRAINT `order_documents_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_documents` ADD CONSTRAINT `order_documents_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_performed_by_id_fkey` FOREIGN KEY (`performed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_sequences` ADD CONSTRAINT `document_sequences_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

