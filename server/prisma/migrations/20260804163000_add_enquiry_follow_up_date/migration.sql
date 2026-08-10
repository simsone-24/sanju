-- AlterTable: record when the customer should next be contacted, and drop the short-lived
-- FOLLOW_UP status (added in 20260804151006) — follow-up is a date on the enquiry, not a
-- lifecycle stage. No row ever held the value.
ALTER TABLE `enquiries` ADD COLUMN `follow_up_date` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING', 'APPOINTMENT_FIXED', 'QUOTATION_TO_SHARE', 'QUOTATION_SHARED', 'ORDER_CONFIRMED', 'ORDER_LOST') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `enquiries_follow_up_date_idx` ON `enquiries`(`follow_up_date`);
