-- Remove fees column as it's no longer needed
ALTER TABLE trades DROP COLUMN IF EXISTS fees; 