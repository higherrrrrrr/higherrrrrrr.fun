INSERT INTO achievement_types (id, name, description, icon, target_value, target_type) VALUES
  ('EARLY_BUYER', 'Early Buyer', 'Bought within 24 hours of token launch', '🌟', 24, 'HOURS'),
  ('PIONEER', 'Pioneer', 'Among first 100 holders', '🚀', 100, 'HOLDERS'),
  ('HIGH_LIQUIDITY_TRADER', 'Liquidity Master', 'Traded a high-volume token', '💧', 100000, 'VOLUME'),
  ('ACTIVE_TRADER', 'Active Trader', '10+ trades in 30 days', '🔥', 10, 'TRADES'),
  ('WHALE', 'Whale', '$10k+ trading volume in 30 days', '🐋', 10000, 'VOLUME'),
  ('VOLATILITY_MASTER', 'Volatility Master', 'Traded during high volatility', '📊', 20, 'VOLATILITY'),
  ('DIAMOND_HANDS', 'Diamond Hands', 'Held token for 30+ days', '💎', 30, 'DAYS'),
  ('FREQUENT_TRADER', 'Frequent Trader', '5+ trades in 7 days', '⚡', 5, 'TRADES')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    target_value = EXCLUDED.target_value,
    target_type = EXCLUDED.target_type; 