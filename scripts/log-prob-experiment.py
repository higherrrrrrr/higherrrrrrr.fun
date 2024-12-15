from openai import OpenAI
import json

# Initialize OpenAI client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key='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',
    default_headers={
        "HTTP-Referer": "https://higherrrrrrr.fun",
    }
)

# Text to analyze
text = "quick brown fox jumped over the fence"

# Make the completion request with logprobs
response = client.completions.create(
    model="anthropic/claude-3-opus-20240229",  # or any other model you prefer
    prompt=text,
    max_tokens=0,  # We don't need any new tokens, just analyzing the prompt
    echo=True,  # This will return the prompt with logprobs
    logprobs=True
)

# Print the log probabilities
print("Log probabilities for each token:")
for token, logprob in zip(response.choices[0].logprobs.tokens, response.choices[0].logprobs.token_logprobs):
    print(f"Token: {token:20} Log Probability: {logprob}")

# Save results to a file
with open('logprob_results.json', 'w') as f:
    json.dump({
        'tokens': response.choices[0].logprobs.tokens,
        'logprobs': response.choices[0].logprobs.token_logprobs
    }, f, indent=2) 