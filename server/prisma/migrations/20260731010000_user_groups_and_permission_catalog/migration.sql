-- Masters v1.1 (masters/user.md): the hardcoded Roles master becomes a flexible User Groups module,
-- and permissions move from one boolean column per action to (module, action) grant rows.
--
-- Written by hand rather than generated, because the generated diff would drop the roles tables and
-- every permission with them. Existing access is carried across instead: each role becomes a user
-- group keeping the same id, so users.role_id copies straight into users.user_group_id and no user
-- loses their group or their permissions.

-- CreateTable
CREATE TABLE `user_groups` (
    `id` CHAR(36) NOT NULL,
    `company_id` CHAR(36) NOT NULL,
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
    `id` CHAR(36) NOT NULL,
    `user_group_id` CHAR(36) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_group_permissions_user_group_id_module_action_key`(`user_group_id`, `module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permission_overrides` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_permission_overrides_user_id_module_action_key`(`user_id`, `module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_groups` ADD CONSTRAINT `user_groups_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_group_permissions` ADD CONSTRAINT `user_group_permissions_user_group_id_fkey` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- MigrateData: every role becomes a user group, id preserved.
INSERT INTO `user_groups` (`id`, `company_id`, `group_name`, `description`, `status`, `created_at`, `updated_at`, `deleted_at`)
SELECT `id`, `company_id`, `role_name`, `description`, `status`, `created_at`, `updated_at`, `deleted_at`
FROM `roles`;

-- MigrateData: expand the boolean permission columns into grant rows.
--
-- The mapping below is deliberately not one-to-one. Modules the Masters rework merged (USERS and
-- ROLES both became sections of MASTERS) fold together, and actions that used to ride on a broader
-- flag get their own grant so behaviour is unchanged for existing groups:
--   * a group that could edit an enquiry keeps Assign and Change Status,
--   * a group that could create orders keeps Convert to Order on Enquiries,
--   * a group that could edit an order keeps Cancel Order and Complete Event,
--   * a group that could edit the task plan keeps Update Checklist,
--   * a group that could view payments keeps Print Receipt (the invoice view was gated on view).
-- Old flags with no catalog action left (e.g. creating a customer, which has no endpoint) are
-- simply not carried over. INSERT IGNORE absorbs the duplicates the many-to-one module merge
-- produces.
INSERT IGNORE INTO `user_group_permissions` (`id`, `user_group_id`, `module`, `action`, `created_at`)
SELECT UUID(), granted.`role_id`, map.`module`, map.`action`, NOW(3)
FROM (
             SELECT `role_id`, `module`, 'can_view'    AS `flag` FROM `role_permissions` WHERE `can_view`    = 1
    UNION ALL SELECT `role_id`, `module`, 'can_create'          FROM `role_permissions` WHERE `can_create`  = 1
    UNION ALL SELECT `role_id`, `module`, 'can_edit'            FROM `role_permissions` WHERE `can_edit`    = 1
    UNION ALL SELECT `role_id`, `module`, 'can_delete'          FROM `role_permissions` WHERE `can_delete`  = 1
    UNION ALL SELECT `role_id`, `module`, 'can_approve'         FROM `role_permissions` WHERE `can_approve` = 1
    UNION ALL SELECT `role_id`, `module`, 'can_print'           FROM `role_permissions` WHERE `can_print`   = 1
    UNION ALL SELECT `role_id`, `module`, 'can_export'          FROM `role_permissions` WHERE `can_export`  = 1
) granted
JOIN (
             SELECT 'DASHBOARD'  AS `old_module`, 'can_view'    AS `old_flag`, 'DASHBOARD'  AS `module`, 'canView'           AS `action`
    UNION ALL SELECT 'USERS',      'can_view',    'MASTERS',    'canView'
    UNION ALL SELECT 'USERS',      'can_create',  'MASTERS',    'canCreate'
    UNION ALL SELECT 'USERS',      'can_edit',    'MASTERS',    'canEdit'
    UNION ALL SELECT 'USERS',      'can_delete',  'MASTERS',    'canDelete'
    UNION ALL SELECT 'ROLES',      'can_view',    'MASTERS',    'canView'
    UNION ALL SELECT 'ROLES',      'can_create',  'MASTERS',    'canCreate'
    UNION ALL SELECT 'ROLES',      'can_edit',    'MASTERS',    'canEdit'
    UNION ALL SELECT 'ROLES',      'can_delete',  'MASTERS',    'canDelete'
    UNION ALL SELECT 'MASTERS',    'can_view',    'MASTERS',    'canView'
    UNION ALL SELECT 'MASTERS',    'can_create',  'MASTERS',    'canCreate'
    UNION ALL SELECT 'MASTERS',    'can_edit',    'MASTERS',    'canEdit'
    UNION ALL SELECT 'MASTERS',    'can_delete',  'MASTERS',    'canDelete'
    UNION ALL SELECT 'CUSTOMERS',  'can_view',    'CUSTOMERS',  'canView'
    UNION ALL SELECT 'CUSTOMERS',  'can_export',  'CUSTOMERS',  'canExport'
    UNION ALL SELECT 'ENQUIRIES',  'can_view',    'ENQUIRIES',  'canView'
    UNION ALL SELECT 'ENQUIRIES',  'can_create',  'ENQUIRIES',  'canCreate'
    UNION ALL SELECT 'ENQUIRIES',  'can_edit',    'ENQUIRIES',  'canEdit'
    UNION ALL SELECT 'ENQUIRIES',  'can_edit',    'ENQUIRIES',  'canAssign'
    UNION ALL SELECT 'ENQUIRIES',  'can_edit',    'ENQUIRIES',  'canChangeStatus'
    UNION ALL SELECT 'ENQUIRIES',  'can_export',  'ENQUIRIES',  'canExport'
    UNION ALL SELECT 'QUOTATIONS', 'can_view',    'QUOTATIONS', 'canView'
    UNION ALL SELECT 'QUOTATIONS', 'can_create',  'QUOTATIONS', 'canCreate'
    UNION ALL SELECT 'QUOTATIONS', 'can_edit',    'QUOTATIONS', 'canEdit'
    UNION ALL SELECT 'QUOTATIONS', 'can_approve', 'QUOTATIONS', 'canApprove'
    UNION ALL SELECT 'QUOTATIONS', 'can_print',   'QUOTATIONS', 'canPrint'
    UNION ALL SELECT 'QUOTATIONS', 'can_export',  'QUOTATIONS', 'canExport'
    UNION ALL SELECT 'ORDERS',     'can_view',    'ORDERS',     'canView'
    UNION ALL SELECT 'ORDERS',     'can_create',  'ORDERS',     'canCreate'
    UNION ALL SELECT 'ORDERS',     'can_create',  'ENQUIRIES',  'canConvertToOrder'
    UNION ALL SELECT 'ORDERS',     'can_edit',    'ORDERS',     'canEdit'
    UNION ALL SELECT 'ORDERS',     'can_edit',    'ORDERS',     'canCancel'
    UNION ALL SELECT 'ORDERS',     'can_edit',    'ORDERS',     'canCompleteEvent'
    UNION ALL SELECT 'ORDERS',     'can_export',  'ORDERS',     'canExport'
    UNION ALL SELECT 'PLANNING',   'can_view',    'PLANNING',   'canView'
    UNION ALL SELECT 'PLANNING',   'can_create',  'PLANNING',   'canCreate'
    UNION ALL SELECT 'PLANNING',   'can_edit',    'PLANNING',   'canEdit'
    UNION ALL SELECT 'PLANNING',   'can_edit',    'PLANNING',   'canUpdateChecklist'
    UNION ALL SELECT 'PLANNING',   'can_delete',  'PLANNING',   'canDelete'
    UNION ALL SELECT 'PAYMENTS',   'can_view',    'PAYMENTS',   'canView'
    UNION ALL SELECT 'PAYMENTS',   'can_view',    'PAYMENTS',   'canPrint'
    UNION ALL SELECT 'PAYMENTS',   'can_create',  'PAYMENTS',   'canCreate'
    UNION ALL SELECT 'PAYMENTS',   'can_edit',    'PAYMENTS',   'canEdit'
    UNION ALL SELECT 'PAYMENTS',   'can_export',  'PAYMENTS',   'canExport'
    UNION ALL SELECT 'CALENDAR',   'can_view',    'CALENDAR',   'canView'
    UNION ALL SELECT 'REPORTS',    'can_view',    'REPORTS',    'canView'
    UNION ALL SELECT 'REPORTS',    'can_export',  'REPORTS',    'canExport'
    UNION ALL SELECT 'SETTINGS',   'can_view',    'SETTINGS',   'canView'
    UNION ALL SELECT 'SETTINGS',   'can_edit',    'SETTINGS',   'canEdit'
) map ON map.`old_module` = granted.`module` AND map.`old_flag` = granted.`flag`;

-- AlterTable: the user profile fields from user.md §Create User, added nullable so existing rows
-- can be backfilled before the NOT NULL constraints go on.
ALTER TABLE `users`
    ADD COLUMN `employee_code` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `user_group_id` CHAR(36) NULL;

-- MigrateData: the role a user held is now the group they belong to (ids were preserved above).
UPDATE `users` SET `user_group_id` = `role_id`;

-- MigrateData: logins move from email to username, so every existing account is given one derived
-- from its email's local part (admin@sanju.local -> admin).
UPDATE `users` SET `username` = LOWER(SUBSTRING_INDEX(`email`, '@', 1));

-- Two accounts on different domains can share a local part; all but the oldest get a short suffix
-- from their id so the unique index below can be created.
UPDATE `users` u
JOIN (
    SELECT LOWER(SUBSTRING_INDEX(`email`, '@', 1)) AS `local_part`, MIN(`id`) AS `keep_id`
    FROM `users`
    GROUP BY `local_part`
    HAVING COUNT(*) > 1
) dup ON dup.`local_part` = LOWER(SUBSTRING_INDEX(u.`email`, '@', 1)) AND u.`id` <> dup.`keep_id`
SET u.`username` = CONCAT(u.`username`, '-', LEFT(REPLACE(u.`id`, '-', ''), 6));

-- Mobile becomes mandatory (user.md §Validation Rules). Accounts predating the rule have no number
-- on record; they are left blank rather than invented, and the next edit of that user must supply one.
UPDATE `users` SET `mobile` = '' WHERE `mobile` IS NULL;

-- AlterTable
ALTER TABLE `users`
    MODIFY `username` VARCHAR(191) NOT NULL,
    MODIFY `user_group_id` CHAR(36) NOT NULL,
    MODIFY `mobile` VARCHAR(191) NOT NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_username_key` ON `users`(`username`);

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_role_id_fkey`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `role_id`;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_user_group_id_fkey` FOREIGN KEY (`user_group_id`) REFERENCES `user_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permission_overrides` ADD CONSTRAINT `user_permission_overrides_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropTable
DROP TABLE `role_permissions`;

-- DropTable
DROP TABLE `roles`;
