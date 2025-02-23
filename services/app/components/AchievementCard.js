import React from 'react';

export function AchievementCard({ achievement }) {
  const { 
    achievement_name, 
    achievement_icon, 
    achievement_description,
    achievement_count,
    token_symbol 
  } = achievement;

  return (
    <div className="achievement-card">
      <div className="achievement-header">
        <span className="achievement-icon">{achievement_icon}</span>
        <span className="achievement-name">
          {achievement_name}
          {achievement_count > 1 && (
            <span className="achievement-count">x{achievement_count}</span>
          )}
        </span>
      </div>
      <div className="achievement-description">
        {achievement_description}
        {token_symbol && <span className="token-symbol">({token_symbol})</span>}
      </div>
    </div>
  );
} 