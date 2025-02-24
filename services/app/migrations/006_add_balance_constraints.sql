BEGIN;

-- Create function to check time window
CREATE OR REPLACE FUNCTION check_wallet_timewindow()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM wallet_balance_history 
    WHERE wallet_address = NEW.wallet_address 
    AND created_at = NEW.created_at
    AND created_at > (CURRENT_TIMESTAMP - INTERVAL '1 hour')
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Duplicate wallet balance entry within time window';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER enforce_wallet_timewindow
  BEFORE INSERT OR UPDATE ON wallet_balance_history
  FOR EACH ROW
  EXECUTE FUNCTION check_wallet_timewindow();

COMMIT; 