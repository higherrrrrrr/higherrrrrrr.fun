import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    API_KEY = os.getenv('API_KEY')
    AUTH_TOKEN = "albertishigher$123$"
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
    HIGHLIGHTED_TOKENS = os.getenv('HIGHLIGHTED_TOKENS', '').split(',')

