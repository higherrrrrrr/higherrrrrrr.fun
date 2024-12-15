from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, String, JSON
from sqlalchemy.dialects.postgresql import JSONB

db = SQLAlchemy()

class Token(db.Model):
    __tablename__ = 'tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(42), unique=True, nullable=False)
    symbol = db.Column(db.String(255))
    name = db.Column(db.String(255))
    creator = db.Column(db.String(42))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    website = db.Column(db.String(255))
    twitter = db.Column(db.String(255))
    telegram = db.Column(db.String(255))
    description = db.Column(db.Text)
    warpcast_url = db.Column(db.String(255))
    character_prompt = db.Column(db.Text)
    warpcast_app_key = db.Column(db.Text)
    ai_character = db.Column(JSON, nullable=True)
    twitter_oauth_token = db.Column(db.String(255))
    twitter_oauth_secret = db.Column(db.String(255))
    twitter_user_id = db.Column(db.String(255))
    twitter_username = db.Column(db.String(255))
    temp_request_token = db.Column(db.String(255))
    
    @classmethod
    def create_if_not_exists(cls, address):
        """Get existing token or create new one"""
        token = cls.query.filter_by(address=address.lower()).first()
        if not token:
            token = cls(
                address=address,
                creator=address,  # Default to self as creator initially
            )
            db.session.add(token)
            db.session.commit()
        return token

    def __init__(self, address, creator, **kwargs):
        self.address = address.lower()
        self.creator = creator.lower()
        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_dict(self):
        return {
            'address': self.address,
            'creator': self.creator,
            'symbol': self.symbol,
            'name': self.name,
            'twitter': self.twitter,
            'telegram': self.telegram,
            'website': self.website,
            'description': self.description,
            'warpcast_url': self.warpcast_url,
            'character_prompt': self.character_prompt,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'ai_character': self.ai_character,
            'twitter_username': self.twitter_username,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 