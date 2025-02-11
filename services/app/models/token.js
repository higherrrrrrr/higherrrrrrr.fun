import pool from './db';

export class Token {
  constructor(data) {
    this.address = data.address?.toLowerCase();
    this.symbol = data.symbol;
    this.name = data.name;
    this.creator = data.creator?.toLowerCase();
    this.created_at = data.created_at;
    this.website = data.website;
    this.twitter = data.twitter;
    this.telegram = data.telegram;
    this.description = data.description;
    this.warpcast_url = data.warpcast_url;
    this.character_prompt = data.character_prompt;
    this.warpcast_app_key = data.warpcast_app_key;
    this.ai_character = data.ai_character;
    this.twitter_oauth_token = data.twitter_oauth_token;
    this.twitter_oauth_secret = data.twitter_oauth_secret;
    this.twitter_user_id = data.twitter_user_id;
    this.twitter_username = data.twitter_username;
    this.temp_request_token = data.temp_request_token;
  }

  toDict() {
    return {
      address: this.address,
      creator: this.creator,
      symbol: this.symbol,
      name: this.name,
      twitter: this.twitter,
      telegram: this.telegram,
      website: this.website,
      description: this.description,
      warpcast_url: this.warpcast_url,
      character_prompt: this.character_prompt,
      created_at: this.created_at?.toISOString(),
      ai_character: this.ai_character,
      twitter_username: this.twitter_username,
    };
  }

  static async createIfNotExists(address) {
    const client = await pool.connect();
    try {
      // Check if token exists
      const existingResult = await client.query(
        'SELECT * FROM tokens WHERE address = $1',
        [address.toLowerCase()]
      );

      if (existingResult.rows.length > 0) {
        return new Token(existingResult.rows[0]);
      }

      // Create new token
      const result = await client.query(
        'INSERT INTO tokens (address, created_at) VALUES ($1, NOW()) RETURNING *',
        [address.toLowerCase()]
      );

      return new Token(result.rows[0]);
    } finally {
      client.release();
    }
  }

  static async findByAddress(address) {
    const result = await pool.query(
      'SELECT * FROM tokens WHERE address = $1',
      [address.toLowerCase()]
    );
    return result.rows.length ? new Token(result.rows[0]) : null;
  }

  async save() {
    const fields = [
      'symbol', 'name', 'creator', 'website', 'twitter', 'telegram',
      'description', 'warpcast_url', 'character_prompt', 'warpcast_app_key',
      'ai_character', 'twitter_oauth_token', 'twitter_oauth_secret',
      'twitter_user_id', 'twitter_username', 'temp_request_token'
    ];

    const setClause = fields
      .map((field, i) => `${field} = $${i + 2}`)
      .join(', ');
    
    const values = fields.map(field => this[field]);

    const query = `
      UPDATE tokens 
      SET ${setClause}
      WHERE address = $1
      RETURNING *
    `;

    const result = await pool.query(query, [this.address, ...values]);
    Object.assign(this, result.rows[0]);
    return this;
  }
} 