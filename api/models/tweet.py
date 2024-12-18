from sqlalchemy.dialects.postgresql import JSONB
from .token import db
from datetime import datetime

class Tweet(db.Model):
    __tablename__ = 'tweets'

    id = db.Column(db.Integer, primary_key=True)
    tweet_id = db.Column(db.String(255), unique=True, nullable=False)  # Twitter's tweet ID
    messages = db.Column(JSONB, nullable=False)  # Store the conversation/messages as JSON
    token_address = db.Column(db.String(42), db.ForeignKey('tokens.address'), nullable=False)
    model = db.Column(db.String(50), nullable=False)  # AI model used (e.g., 'llama-3', 'claude-3-sonnet', 'gpt-4')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    output = db.Column(db.Text, nullable=False)  # The generated tweet text
    in_reply_to = db.Column(db.String(255), nullable=True)  # ID of tweet being replied to, if any

    # Relationship to Token
    token = db.relationship('Token', backref=db.backref('tweets', lazy=True))

    def __repr__(self):
        return f'<Tweet {self.tweet_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'tweet_id': self.tweet_id,
            'messages': self.messages,
            'token_address': self.token_address,
            'model': self.model,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'output': self.output,
            'in_reply_to': self.in_reply_to
        } 