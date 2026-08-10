-- An enquiry moved to Order Confirmed always produces an order and its payment tracker record,
-- whether or not a quotation was ever raised for it and whether or not an event date is set yet.
-- Both columns therefore become nullable; existing rows are unaffected.

-- DropForeignKey (re-added below against the now-nullable column)
ALTER TABLE `orders` DROP FOREIGN KEY `orders_quotation_id_fkey`;

-- AlterTable
ALTER TABLE `orders`
  MODIFY `quotation_id` CHAR(36) NULL,
  MODIFY `event_date` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_quotation_id_fkey`
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
