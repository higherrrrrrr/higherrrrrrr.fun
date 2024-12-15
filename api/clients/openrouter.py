from openai import OpenAI
from config import Config
from functools import lru_cache

class OpenRouterClient:
    def __init__(self, api_key):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            default_headers={
                "HTTP-Referer": "https://higherrrrrrr.fun",  # Required by OpenRouter
            }
        )

    def chat_completion(self, messages, model="anthropic/claude-3-sonnet-20240229"):
        """
        Send a chat completion request to OpenRouter using OpenAI's client
        
        Args:
            messages (list): List of message objects with role and content
            model (str): Model identifier to use
        
        Returns:
            ChatCompletion: OpenAI-style chat completion response
        """
        response = self.client.chat.completions.create(
            model=model,
            messages=messages
        )
        return response

    def generate_example_tweet(self, ai_character, model="anthropic/claude-3-sonnet-20240229"):
        """
        Generate an example tweet based on provided character configuration
        
        Args:
            ai_character (dict): Character configuration
            model (str): Model identifier to use
            
        Returns:
            str: Generated tweet
        """
        prompt_parts = [
            f"You are {ai_character.get('name', 'an AI character')}.",
            "\nBiography:",
            *[f"- {bio}" for bio in ai_character.get('bio', '').split('\n') if bio],
            "\nBackground & Lore:",
            *[f"- {lore}" for lore in ai_character.get('lore', '').split('\n') if lore],
            "\nExample Interactions:",
        ]

        # Add message examples
        for example in ai_character.get('messageExamples', []):
            if example and len(example) >= 2:
                prompt_parts.extend([
                    f"\nUser: {example[0].get('content', {}).get('text', '')}",
                    f"Response: {example[1].get('content', {}).get('text', '')}"
                ])

        prompt_parts.extend([
            "\nTopics you discuss:",
            *[f"- {topic}" for topic in ai_character.get('topics', []) if topic],
            "\nPersonality Traits:",
            *[f"- {adj}" for adj in ai_character.get('adjectives', []) if adj],
            "\nWriting Style:",
            "General style:",
            *[f"- {style}" for style in ai_character.get('style', {}).get('all', []) if style],
            "Post style:",
            *[f"- {style}" for style in ai_character.get('style', {}).get('post', []) if style],
            "\nExample Posts:",
            *[f"- {post}" for post in ai_character.get('post_examples', []) if post]
        ])

        prompt_parts.extend([
                "\nGenerate a new example tweet that matches your character's voice and topics.",
                "IMPORTANT: Keep the response under 280 characters.",
                "ONLY respond as the character with no additional content around it. Only use the character's voice in your response.",
                "Do not include hashtags or @mentions unless they are essential to the message.",
                "The tweet should be about one of your typical topics and demonstrate your personality."
            ])

        messages = [
            {"role": "system", "content": "\n".join(prompt_parts)},
            {"role": "user", "content": "Generate an example tweet about one of your typical topics."}
        ]

        
        response = self.chat_completion(messages, model)
        return response.choices[0].message.content

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