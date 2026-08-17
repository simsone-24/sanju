-- Backfill: the RENT module was added to the permission catalog after these groups were seeded, so
-- every existing Super Admin group is missing it and would find the whole Rent module invisible.
--
-- Only "Super Admin" is granted here. That group means "everything" by definition (prisma/seed.ts
-- gives it 'All' for every module), so withholding a new module from it would be a bug rather than
-- a policy. Every other group's rent access is a decision for an administrator to make in Masters →
-- User Groups, and is deliberately left ungranted.
INSERT INTO `user_group_permissions` (`id`, `user_group_id`, `module`, `action`, `created_at`)
SELECT UUID(), g.`id`, 'RENT', a.`action`, CURRENT_TIMESTAMP(3)
FROM `user_groups` g
CROSS JOIN (
    SELECT 'canView' AS `action`
    UNION ALL SELECT 'canCreate'
    UNION ALL SELECT 'canEdit'
    UNION ALL SELECT 'canDelete'
    UNION ALL SELECT 'canPrint'
    UNION ALL SELECT 'canExport'
) a
WHERE g.`group_name` = 'Super Admin'
  AND g.`deleted_at` IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM `user_group_permissions` p
      WHERE p.`user_group_id` = g.`id` AND p.`module` = 'RENT' AND p.`action` = a.`action`
  );
