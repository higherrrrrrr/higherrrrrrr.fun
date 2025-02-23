BEGIN;

ALTER TABLE token_info
ADD COLUMN icon_url VARCHAR(255),
ADD COLUMN website_url VARCHAR(255),
ADD COLUMN twitter_url VARCHAR(255),
ADD COLUMN description TEXT,
ADD COLUMN tags TEXT[],
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Index for performance on token searches
CREATE INDEX idx_token_tags ON token_info USING GIN (tags);
CREATE INDEX idx_token_metadata ON token_info USING GIN (metadata);

-- Ensure token_info has proper constraints
ALTER TABLE token_info
ADD CONSTRAINT valid_urls 
CHECK (
  (icon_url IS NULL OR icon_url ~ '^https?://.*$') AND
  (website_url IS NULL OR website_url ~ '^https?://.*$') AND
  (twitter_url IS NULL OR twitter_url ~ '^https?://twitter\.com/.*$')
);

COMMIT; 