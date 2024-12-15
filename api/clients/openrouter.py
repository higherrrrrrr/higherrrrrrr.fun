from openai import AsyncOpenAI
from config import Config
from functools import lru_cache

class OpenRouterClient:
    def __init__(self, api_key):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            default_headers={
                "HTTP-Referer": "https://higherrrrrrr.fun",  # Required by OpenRouter
            }
        )

    async def chat_completion(self, messages, model="anthropic/claude-3-sonnet-20240229"):
        """
        Send a chat completion request to OpenRouter using OpenAI's client
        
        Args:
            messages (list): List of message objects with role and content
            model (str): Model identifier to use
        
        Returns:
            ChatCompletion: OpenAI-style chat completion response
        """
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages
        )
        return response

@lru_cache()
def get_openrouter_client():
    """
    Get or create a global OpenRouter client instance.
    Uses lru_cache to ensure only one instance is created.
    
    Returns:
        OpenRouterClient: A configured OpenRouter client instance
    
    Raises:
        ValueError: If OPENROUTER_API_KEY is not configured
    """
    if not Config.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY must be configured")
        
    return OpenRouterClient(Config.OPENROUTER_API_KEY)