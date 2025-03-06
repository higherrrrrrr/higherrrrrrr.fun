-- This migration corrects existing positions by adjusting for token decimals
-- Only run this if you've already fixed new trades

-- Create a temporary function to adjust amounts based on token decimals
CREATE OR REPLACE FUNCTION adjust_by_decimals(amount NUMERIC, decimals INTEGER) 
RETURNS NUMERIC AS $$
BEGIN
  RETURN amount / POWER(10, decimals);
END;
$$ LANGUAGE plpgsql;

-- Update positions with corrected values
UPDATE positions 
SET quantity = adjust_by_decimals(quantity, token_decimals),
    avg_cost_basis = avg_cost_basis,
    total_cost_basis = adjust_by_decimals(total_cost_basis, token_decimals),
    unrealized_pnl = adjust_by_decimals(unrealized_pnl, token_decimals)
WHERE token_decimals > 0 
  AND quantity > 1000000;  -- Only fix positions that look suspiciously large

-- Clean up the temporary function
DROP FUNCTION adjust_by_decimals;

-- Add a comment to log this migration
COMMENT ON TABLE positions IS 'Positions table with corrected decimal handling as of migration 011'; 