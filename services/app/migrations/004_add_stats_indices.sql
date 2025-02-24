CREATE INDEX idx_user_achievements_wallet_type 
ON user_achievements(wallet, achievement_type);

CREATE INDEX idx_achievement_progress_wallet_volume_trades 
ON achievement_progress(wallet_address, trade_volume, trade_count); 