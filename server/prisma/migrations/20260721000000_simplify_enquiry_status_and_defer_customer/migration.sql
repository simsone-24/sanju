-- Simplify the enquiry lifecycle to 6 statuses and defer customer creation to ORDER_CONFIRMED.

-- 1. Add prospective-customer columns (held until an enquiry reaches ORDER_CONFIRMED).
ALTER TABLE `enquiries`
  ADD COLUMN `prospect_name` VARCHAR(191) NULL,
  ADD COLUMN `prospect_mobile` VARCHAR(191) NULL,
  ADD COLUMN `prospect_whatsapp` VARCHAR(191) NULL,
  ADD COLUMN `prospect_email` VARCHAR(191) NULL,
  ADD COLUMN `prospect_address` TEXT NULL,
  ADD COLUMN `prospect_city` VARCHAR(191) NULL;

-- 2. Make customer_id nullable (a NEW-customer enquiry has no Customer row until confirmed).
ALTER TABLE `enquiries` DROP FOREIGN KEY `enquiries_customer_id_fkey`;
ALTER TABLE `enquiries` MODIFY `customer_id` CHAR(36) NULL;
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_customer_id_fkey`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Widen the status enum to a temporary superset so existing rows can be remapped in place.
ALTER TABLE `enquiries` MODIFY `status` ENUM(
  'NEW','APPOINTMENT_SCHEDULED','APPOINTMENT_COMPLETED','FOLLOW_UP','QUOTATION_REQUESTED',
  'QUOTATION_CREATED','QUOTATION_SENT','WAITING_APPROVAL','QUOTATION_APPROVED','CONVERTED_TO_ORDER','CLOSED',
  'PENDING','APPOINTMENT_FIXED','QUOTATION_TO_SHARE','QUOTATION_SHARED','ORDER_CONFIRMED','ORDER_LOST'
) NOT NULL DEFAULT 'PENDING';

-- 4. Remap old statuses onto the new 6.
UPDATE `enquiries` SET `status` = 'PENDING'            WHERE `status` = 'NEW';
UPDATE `enquiries` SET `status` = 'APPOINTMENT_FIXED'  WHERE `status` IN ('APPOINTMENT_SCHEDULED','APPOINTMENT_COMPLETED','FOLLOW_UP');
UPDATE `enquiries` SET `status` = 'QUOTATION_TO_SHARE' WHERE `status` IN ('QUOTATION_REQUESTED','QUOTATION_CREATED');
UPDATE `enquiries` SET `status` = 'QUOTATION_SHARED'   WHERE `status` IN ('QUOTATION_SENT','WAITING_APPROVAL','QUOTATION_APPROVED');
UPDATE `enquiries` SET `status` = 'ORDER_CONFIRMED'    WHERE `status` = 'CONVERTED_TO_ORDER';
UPDATE `enquiries` SET `status` = 'ORDER_LOST'         WHERE `status` = 'CLOSED';

-- 5. Narrow the enum to the final 6 values.
ALTER TABLE `enquiries` MODIFY `status` ENUM(
  'PENDING','APPOINTMENT_FIXED','QUOTATION_TO_SHARE','QUOTATION_SHARED','ORDER_CONFIRMED','ORDER_LOST'
) NOT NULL DEFAULT 'PENDING';
