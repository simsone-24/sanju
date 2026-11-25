-- Date: 2026-11-24
-- Purpose: Report permissions are re-shaped (data only: no table, column or index changes).
--          1. "Dashboard Reports" moves into the Dashboard module as DASHBOARD.canViewReports.
--          2. The Reports page's single REPORTS.canView becomes one permission per tab:
--             canViewRevenueReport, canViewOutstandingReport, canViewCustomerReport,
--             canViewOrderReport, canViewExpenseReport.
--          Every group and user override keeps exactly the access it had.
-- Module / feature: Permissions (Masters -> User Groups / Users), Dashboard, Reports
-- Matches: server/prisma/migrations/20261124000000_split_report_permissions/migration.sql

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

-- ROLLBACK:
-- (Restores the page-wide Reports View for anyone holding at least one tab; DASHBOARD_REPORTS was
--  never deployed outside development, so the Dashboard grant folds back into Reports View. Deploy
--  the previous application code alongside it.)
-- INSERT IGNORE INTO `user_group_permissions` (`user_group_id`, `module`, `action`)
--   SELECT DISTINCT `user_group_id`, 'REPORTS', 'canView' FROM `user_group_permissions`
--   WHERE (`module` = 'REPORTS' AND `action` IN ('canViewRevenueReport', 'canViewOutstandingReport',
--          'canViewCustomerReport', 'canViewOrderReport', 'canViewExpenseReport'))
--      OR (`module` = 'DASHBOARD' AND `action` = 'canViewReports');
-- INSERT IGNORE INTO `user_permission_overrides` (`user_id`, `module`, `action`)
--   SELECT DISTINCT `user_id`, 'REPORTS', 'canView' FROM `user_permission_overrides`
--   WHERE (`module` = 'REPORTS' AND `action` IN ('canViewRevenueReport', 'canViewOutstandingReport',
--          'canViewCustomerReport', 'canViewOrderReport', 'canViewExpenseReport'))
--      OR (`module` = 'DASHBOARD' AND `action` = 'canViewReports');
-- DELETE FROM `user_group_permissions`
--   WHERE (`module` = 'REPORTS' AND `action` IN ('canViewRevenueReport', 'canViewOutstandingReport',
--          'canViewCustomerReport', 'canViewOrderReport', 'canViewExpenseReport'))
--      OR (`module` = 'DASHBOARD' AND `action` = 'canViewReports');
-- DELETE FROM `user_permission_overrides`
--   WHERE (`module` = 'REPORTS' AND `action` IN ('canViewRevenueReport', 'canViewOutstandingReport',
--          'canViewCustomerReport', 'canViewOrderReport', 'canViewExpenseReport'))
--      OR (`module` = 'DASHBOARD' AND `action` = 'canViewReports');
