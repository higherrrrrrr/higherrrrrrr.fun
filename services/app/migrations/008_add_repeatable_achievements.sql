-- Add completion_count to user_achievements
ALTER TABLE user_achievements 
ADD COLUMN completion_count INTEGER DEFAULT 1;

-- Add repeatable flag to achievement_types
ALTER TABLE achievement_types 
ADD COLUMN repeatable BOOLEAN DEFAULT FALSE; 