import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    API_KEY = os.getenv('API_KEY')
    AUTH_TOKEN = os.getenv('AUTH_TOKEN')
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
    HIGHLIGHTED_TOKEN = os.getenv('HIGHLIGHTED_TOKEN')
    RPC_URL = os.getenv('RPC_URL', 'https://mainnet.base.org')

