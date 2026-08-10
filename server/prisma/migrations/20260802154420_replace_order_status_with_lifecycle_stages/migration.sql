-- Replace the 10-value OrderStatus enum with a 4-stage lifecycle
-- (YET_TO_START, IN_PROGRESS, ORDER_CLOSED, REJECTED). Payment standing (PaymentTracker) and
-- task planning (TaskGroup/TaskItem) are tracked independently and no longer read this column.
--
-- Done in three steps because MySQL's native ENUM type rejects values outside its declared set:
-- 1. Widen the column to accept both the old and new value names.
-- 2. Remap every existing row from its old value to the corresponding new stage.
-- 3. Narrow the column down to just the 4 new values.

-- Step 1: widen
ALTER TABLE `orders`
  MODIFY `status` ENUM(
    'CONFIRMED', 'ADVANCE_PENDING', 'ADVANCE_RECEIVED', 'PLANNING', 'READY', 'IN_PROGRESS',
    'COMPLETED', 'BALANCE_PENDING', 'CLOSED', 'CANCELLED',
    'YET_TO_START', 'ORDER_CLOSED', 'REJECTED'
  ) NOT NULL DEFAULT 'CONFIRMED';

-- Step 2: remap existing data
UPDATE `orders` SET `status` = CASE `status`
  WHEN 'CONFIRMED' THEN 'YET_TO_START'
  WHEN 'ADVANCE_PENDING' THEN 'YET_TO_START'
  WHEN 'ADVANCE_RECEIVED' THEN 'IN_PROGRESS'
  WHEN 'PLANNING' THEN 'IN_PROGRESS'
  WHEN 'READY' THEN 'IN_PROGRESS'
  WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'
  WHEN 'COMPLETED' THEN 'ORDER_CLOSED'
  WHEN 'BALANCE_PENDING' THEN 'ORDER_CLOSED'
  WHEN 'CLOSED' THEN 'ORDER_CLOSED'
  WHEN 'CANCELLED' THEN 'REJECTED'
  ELSE `status`
END;

-- Step 3: narrow
ALTER TABLE `orders`
  MODIFY `status` ENUM('YET_TO_START', 'IN_PROGRESS', 'ORDER_CLOSED', 'REJECTED') NOT NULL DEFAULT 'YET_TO_START';
