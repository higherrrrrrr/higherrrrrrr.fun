import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    API_KEY = os.getenv('API_KEY')
    AUTH_TOKEN = os.getenv('AUTH_TOKEN')
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
    HIGHLIGHTED_TOKENS = os.getenv('HIGHLIGHTED_TOKENS')
    RPC_URL = os.getenv('RPC_URL', 'https://mainnet.base.org')
    TOKENS_SUBGRAPH_URL = os.getenv('TOKENS_SUBGRAPH_URL', 'https://subgraph.satsuma-prod.com/2ed3e01ead05/carls-team/tokens/version/v0.0.1/api')
    DUNE_API_KEY = os.getenv('DUNE_API_KEY')
    TOKEN_BLACKLIST = os.getenv('TOKEN_BLACKLIST')
    BLACKLISTED_TOKENS = os.getenv('BLACKLISTED_TOKENS', '')
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres@localhost:5432/tokens_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OpenRouter API configuration
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
    TWITTER_API_KEY = os.getenv('TWITTER_API_KEY')
    TWITTER_API_SECRET = os.getenv('TWITTER_API_SECRET')
    TWITTER_CALLBACK_URL = os.getenv('TWITTER_CALLBACK_URL', 'https://alpha.higherrrrrrr.fun/twitter/callback')
    API_URL = os.getenv('API_URL', 'http://localhost:5000')

    SECRET_KEY = os.getenv('SECRET_KEY', 'asdlfgasdkjlhgasdfg')

    # Add this new config value
    JOBS_SECRET = os.getenv('JOBS_SECRET', 'albertisthecustestcorigeverrrrrr')

    # Cloud Tasks configuration
    CLOUD_TASKS_QUEUE = os.getenv('CLOUD_TASKS_QUEUE', 'token-processing-queue')
    CLOUD_TASKS_LOCATION = os.getenv('CLOUD_TASKS_LOCATION', 'us-central1')
    GOOGLE_CLOUD_PROJECT = os.getenv('GOOGLE_CLOUD_PROJECT', 'your-project-id')
    SERVICE_ACCOUNT_EMAIL = os.getenv('SERVICE_ACCOUNT_EMAIL')
    
    # The URL where Cloud Tasks will send requests to
    CLOUD_TASKS_HANDLER_URL = os.getenv(
        'CLOUD_TASKS_HANDLER_URL', 
        'https://api.higherrrrrrr.fun/api/jobs/handle-token'
    )


