# API Service

## Setup

### Prerequisites
- Python 3.8+
- PostgreSQL
- pip

### Installation

1. Install dependencies:
```

## Authentication

The API uses Ethereum wallet signatures for authentication. To make authenticated requests:

1. Sign the message: `we're going higherrrrrrr`
2. Format the Authorization header:
```
Authorization: Bearer <wallet_address>:<signature>
```

Some endpoints require the authenticated wallet to be the token creator. These endpoints will return:
- 403 Forbidden if the authenticated wallet is not the token creator
- 400 Bad Request if the token creator cannot be verified

Example using web3.js:
```javascript
const message = "we're going higherrrrrrr";
const signature = await web3.eth.personal.sign(message, address);
const authHeader = `Bearer ${address}:${signature}`;
```

## Database Migrations

### First Time Setup

1. Initialize migrations:
```bash
flask db init
```

2. Create initial migration:
```bash
flask db migrate -m "Initial migration"
```

3. Apply migration:
```bash
flask db upgrade
```

### Making Changes

1. After modifying models, create a new migration:
```bash
flask db migrate -m "Description of changes"
```

2. Review the generated migration in `migrations/versions/`

3. Apply the migration:
```bash
flask db upgrade
```

### Rollback Changes

To undo the last migration:
```bash
flask db downgrade
```

### Migration Commands

- Show current migration version:
```bash
flask db current
```

- Show migration history:
```bash
flask db history
```

- Show pending migrations:
```bash
flask db show
```

## API Endpoints

### Token Management
- `GET /api/token/<address>` - Get token details
- `POST /api/token` - Create or update token (auth + creator required)
- `GET /api/token/<address>/creator` - Get verified token creator
- `GET /api/tokens` - List all tokens with pagination

### Request Format for POST /api/token
```json
{
  "address": "0x...",  // Required
  "twitter_url": "https://twitter.com/...",  // Optional
  "telegram_url": "https://t.me/...",  // Optional
  "website": "https://..."  // Optional
}
```

### Response Codes
- 200: Successful update
- 201: Successful creation
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden (not token creator)
- 404: Not found
- 500: Server error