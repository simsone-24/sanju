/*
  Warnings:

  - You are about to drop the column `gst_percent` on the `quotations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `quotations` DROP COLUMN `gst_percent`,
    ADD COLUMN `cgst_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `sgst_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0;
