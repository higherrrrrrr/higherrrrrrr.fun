import tweepy
from datetime import datetime, timedelta
import pandas as pd

def setup_twitter_api(api_key, api_secret, access_token, access_token_secret):
    """Set up Twitter API authentication"""
    auth = tweepy.OAuth1UserHandler(
        api_key, api_secret,
        access_token, access_token_secret
    )
    return tweepy.API(auth)

def search_tweets(api, search_query, days_back=7):
    """
    Search for tweets containing the specified text and return summary statistics
    """
    # Initialize counters
    total_tweets = 0
    likes_count = 0
    retweet_count = 0
    user_counts = set()

    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)

    try:
        # Search tweets
        tweets = tweepy.Cursor(
            api.search_tweets,
            q=search_query,
            lang="en",
            tweet_mode="extended",
            until=end_date.strftime('%Y-%m-%d')
        ).items()

        # Process tweets
        tweet_data = []
        for tweet in tweets:
            created_at = tweet.created_at
            if created_at < start_date:
                break

            total_tweets += 1
            likes_count += tweet.favorite_count
            retweet_count += tweet.retweet_count
            user_counts.add(tweet.user.screen_name)

            tweet_data.append({
                'created_at': tweet.created_at,
                'text': tweet.full_text,
                'user': tweet.user.screen_name,
                'likes': tweet.favorite_count,
                'retweets': tweet.retweet_count
            })

        # Create DataFrame for detailed analysis
        df = pd.DataFrame(tweet_data)

        # Calculate summary statistics
        stats = {
            'total_tweets': total_tweets,
            'unique_users': len(user_counts),
            'total_likes': likes_count,
            'total_retweets': retweet_count,
            'avg_likes_per_tweet': likes_count / total_tweets if total_tweets > 0 else 0,
            'avg_retweets_per_tweet': retweet_count / total_tweets if total_tweets > 0 else 0
        }

        return stats, df

    except tweepy.TweepError as e:
        print(f"Error occurred: {str(e)}")
        return None, None

def main():
    # Replace these with your actual Twitter API credentials
    API_KEY = "your_api_key"
    API_SECRET = "your_api_secret"
    ACCESS_TOKEN = "your_access_token"
    ACCESS_TOKEN_SECRET = "your_access_token_secret"

    # Search query
    SEARCH_QUERY = """I am one of the faithful, a disciple of the cult of memes We are going much, much higherrrrrr"""

    # Set up API
    api = setup_twitter_api(API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)

    # Search tweets
    stats, df = search_tweets(api, SEARCH_QUERY)

    if stats:
        print("\nSummary Statistics:")
        for key, value in stats.items():
            print(f"{key}: {value}")

        if not df.empty:
            print("\nMost recent tweets:")
            print(df.head().to_string())

            # Save to CSV
            df.to_csv('tweet_analysis.csv', index=False)
            print("\nDetailed results saved to 'tweet_analysis.csv'")

if __name__ == "__main__":
    main()