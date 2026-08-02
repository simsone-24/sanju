-- AlterTable
ALTER TABLE `document_sequences` MODIFY `sequence_type` ENUM('ENQUIRY', 'QUOTATION', 'ORDER', 'RECEIPT', 'CUSTOMER') NOT NULL;

-- AlterTable
ALTER TABLE `enquiries` ADD COLUMN `meeting_location` VARCHAR(191) NULL,
    ADD COLUMN `notes` TEXT NULL;
