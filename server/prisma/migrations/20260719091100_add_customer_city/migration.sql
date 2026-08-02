-- AlterTable
ALTER TABLE `customers` ADD COLUMN `city` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `customers_city_idx` ON `customers`(`city`);
