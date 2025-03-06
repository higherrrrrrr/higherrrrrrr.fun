-- services/app/migrations/004_update_trades_table.sql
-- Add realized_pnl column to existing trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_pnl NUMERIC DEFAULT 0;