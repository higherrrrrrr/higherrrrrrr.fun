# Higher Social API

A Flask-based API service for managing social media automation for tokens on Base network, featuring Twitter integration and AI-powered tweet generation.

## Prerequisites

- Python 3.11
- PostgreSQL
- pip
- virtualenv

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Create and activate a virtual environment:
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
OPENROUTER_API_KEY=your_openrouter_api_key
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
```

## Database Setup

1. Create the PostgreSQL database:
```sql
createdb tokens_db
```

2. Initialize the database migrations:
```bash
flask db upgrade
```

## Running the Application

1. Start the development server:
```bash
flask run
```

2. For production deployment:
```bash
gunicorn --bind 0.0.0.0:5000 app:app
```

## Docker Deployment

1. Build the Docker image:
```bash
docker build -t higher-social-api .
```

2. Run the container:
```bash
docker run -p 5000:5000 --env-file .env higher-social-api
```

## API Authentication

The API uses Ethereum wallet signatures for authentication. To make authenticated requests:

1. Sign the message: `we're going higherrrrrrr`
2. Include in Authorization header:
```
Authorization: Bearer <wallet_address>:<signature>
```

## API Endpoints

### Token Management
- `GET /api/token/<address>` - Get token details
- `POST /api/token` - Create/update token (auth required)
- `GET /api/token/<address>/creator` - Get verified token creator
- `GET /api/tokens` - List all tokens with pagination

### Twitter Integration
- `POST /api/twitter/connect/<token_address>` - Start Twitter OAuth flow
- `GET /api/twitter/callback` - OAuth callback handler
- `POST /api/twitter/complete` - Complete Twitter connection
- `POST /api/twitter/disconnect/<address>` - Remove Twitter connection

### Job Management
- `POST /api/jobs/handle-token/<address>` - Process token's social media tasks
- `POST /api/jobs/tweet/<address>` - Generate and post a tweet
- `GET /api/jobs/tweet/get/<tweet_id>` - Get tweet details

## Development

### Database Migrations

Create a new migration:
```bash
flask db migrate -m "Description of changes"
```

Apply migrations:
```bash
flask db upgrade
```

Rollback migrations:
```bash
flask db downgrade
```

### Environment Variables

Essential environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENROUTER_API_KEY`: API key for OpenRouter AI services
- `TWITTER_API_KEY`: Twitter API key
- `TWITTER_API_SECRET`: Twitter API secret
- `CLOUD_TASKS_QUEUE`: Google Cloud Tasks queue name
- `GOOGLE_CLOUD_PROJECT`: Google Cloud project ID
- `SERVICE_ACCOUNT_EMAIL`: Google Cloud service account email

## Testing

Run tests with:
```bash
python -m pytest
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

WAGMI (MIT-Compatible)