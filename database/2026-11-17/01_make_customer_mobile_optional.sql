-- Date: 2026-11-17
-- Purpose: A customer's mobile number is no longer mandatory (enquiry / quotation forms may be saved
--          without a phone or WhatsApp number). When a number is given it must still be unique per
--          company; that is enforced in the service layer, as before.
-- Module / feature: Customers / Enquiries / Quotations
-- Matches: server/prisma/migrations/20261117000000_make_customer_mobile_optional/migration.sql

-- AlterTable
ALTER TABLE `customers` MODIFY `mobile` VARCHAR(191) NULL;

-- ROLLBACK:
-- (Fails if any customer row has a NULL mobile - fill those in first.)
-- ALTER TABLE `customers` MODIFY `mobile` VARCHAR(191) NOT NULL;
