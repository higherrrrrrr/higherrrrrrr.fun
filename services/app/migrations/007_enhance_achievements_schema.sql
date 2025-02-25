-- Enhance achievement_types table to include new fields
ALTER TABLE achievement_types
ADD COLUMN IF NOT EXISTS trigger_action VARCHAR(50),
ADD COLUMN IF NOT EXISTS reward_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(18,8),
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Rename column if it's called 'progress' and not already 'current_value'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'achievement_progress' 
    AND column_name = 'progress'
  ) THEN
    ALTER TABLE achievement_progress RENAME COLUMN progress TO current_value;
  END IF;
END $$;

-- Add last_updated if not exists
ALTER TABLE achievement_progress
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Ensure user_achievements has completed and completed_at fields
ALTER TABLE user_achievements
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_achievement_types_active ON achievement_types(active);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_value ON achievement_progress(current_value);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);

-- Update existing rows to have sensible defaults
UPDATE achievement_types 
SET active = TRUE, 
    trigger_action = CASE 
      WHEN id LIKE '%TRADER%' THEN 'TRADE'
      WHEN id LIKE '%BUYER%' THEN 'PURCHASE'
      WHEN id LIKE '%WHALE%' THEN 'DEPOSIT'
      WHEN id LIKE '%HANDS%' THEN 'HOLDING_DURATION'
      ELSE 'GENERAL'
    END
WHERE trigger_action IS NULL; 