ALTER TABLE wallet_balance_history 
ADD CONSTRAINT unique_wallet_timewindow 
EXCLUDE USING btree (
  wallet_address WITH =,
  created_at WITH =
) WHERE (
  created_at > NOW() - INTERVAL '1 hour'
); 