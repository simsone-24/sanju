-- Data-only migration. Mirrors database/2026-11-24/01_split_report_permissions.sql (rollback is documented there).

-- 1. Dashboard Reports. Whoever could open the Dashboard's Reports tab keeps it: the interim
--    DASHBOARD_REPORTS grant, or the Reports View that gated the tab before that existed.
INSERT IGNORE INTO `user_group_permissions` (`user_group_id`, `module`, `action`)
SELECT DISTINCT `user_group_id`, 'DASHBOARD', 'canViewReports'
FROM `user_group_permissions`
WHERE (`module` = 'DASHBOARD_REPORTS' AND `action` = 'canView')
   OR (`module` = 'REPORTS' AND `action` = 'canView');

INSERT IGNORE INTO `user_permission_overrides` (`user_id`, `module`, `action`)
SELECT DISTINCT `user_id`, 'DASHBOARD', 'canViewReports'
FROM `user_permission_overrides`
WHERE (`module` = 'DASHBOARD_REPORTS' AND `action` = 'canView')
   OR (`module` = 'REPORTS' AND `action` = 'canView');

-- 2. Reports page. Every tab is granted wherever the old page-wide View was.
INSERT IGNORE INTO `user_group_permissions` (`user_group_id`, `module`, `action`)
SELECT p.`user_group_id`, 'REPORTS', t.`action`
FROM `user_group_permissions` p
CROSS JOIN (
  SELECT 'canViewRevenueReport' AS `action`
  UNION ALL SELECT 'canViewOutstandingReport'
  UNION ALL SELECT 'canViewCustomerReport'
  UNION ALL SELECT 'canViewOrderReport'
  UNION ALL SELECT 'canViewExpenseReport'
) t
WHERE p.`module` = 'REPORTS' AND p.`action` = 'canView';

INSERT IGNORE INTO `user_permission_overrides` (`user_id`, `module`, `action`)
SELECT p.`user_id`, 'REPORTS', t.`action`
FROM `user_permission_overrides` p
CROSS JOIN (
  SELECT 'canViewRevenueReport' AS `action`
  UNION ALL SELECT 'canViewOutstandingReport'
  UNION ALL SELECT 'canViewCustomerReport'
  UNION ALL SELECT 'canViewOrderReport'
  UNION ALL SELECT 'canViewExpenseReport'
) t
WHERE p.`module` = 'REPORTS' AND p.`action` = 'canView';

-- 3. Retire the old grants; the catalog no longer recognises them.
DELETE FROM `user_group_permissions`
WHERE `module` = 'DASHBOARD_REPORTS' OR (`module` = 'REPORTS' AND `action` = 'canView');

DELETE FROM `user_permission_overrides`
WHERE `module` = 'DASHBOARD_REPORTS' OR (`module` = 'REPORTS' AND `action` = 'canView');
