-- The quotation's printed Date is now the quotation's own (editable) event date, pre-filled from
-- the enquiry when raised. Existing enquiry-sourced quotations stored their creation day, so
-- backfill them with the linked enquiry's event date to keep every printed document unchanged
-- (the old rendering preferred the enquiry's event date over the stored one).
UPDATE quotations q
JOIN enquiries e ON e.id = q.enquiry_id
SET q.quotation_date = e.event_date
WHERE e.event_date IS NOT NULL
  AND q.deleted_at IS NULL;
