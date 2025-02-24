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

-- Create IMMUTABLE function for URL validation using substring operations
CREATE OR REPLACE FUNCTION is_valid_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- NULL URLs are valid
  IF url IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check basic URL structure without regex
  RETURN (
    (SUBSTRING(LOWER(url) FROM 1 FOR 7) = 'http://' OR 
     SUBSTRING(LOWER(url) FROM 1 FOR 8) = 'https://') AND
    LENGTH(url) > 8 AND
    POSITION(' ' IN url) = 0
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION is_valid_twitter_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- NULL URLs are valid
  IF url IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check Twitter URL structure without regex
  RETURN (
    (SUBSTRING(LOWER(url) FROM 1 FOR 20) = 'https://twitter.com/' OR
     SUBSTRING(LOWER(url) FROM 1 FOR 19) = 'http://twitter.com/') AND
    LENGTH(url) > 20 AND
    POSITION(' ' IN url) = 0
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Ensure token_info has proper constraints using IMMUTABLE functions
ALTER TABLE token_info
ADD CONSTRAINT valid_urls 
CHECK (
  is_valid_url(icon_url) AND
  is_valid_url(website_url) AND
  is_valid_twitter_url(twitter_url)
);

COMMIT; 