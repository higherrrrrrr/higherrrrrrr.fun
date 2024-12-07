from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Token(db.Model):
    __tablename__ = 'tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(42), unique=True, nullable=False)
    twitter_url = db.Column(db.String(255))
    telegram_url = db.Column(db.String(255))
    website = db.Column(db.String(255))
    creator = db.Column(db.String(42), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, address, creator, twitter_url=None, telegram_url=None, website=None):
        self.address = address.lower()
        self.creator = creator.lower()
        self.twitter_url = twitter_url
        self.telegram_url = telegram_url
        self.website = website

    def to_dict(self):
        return {
            'address': self.address,
            'creator': self.creator,
            'twitter_url': self.twitter_url,
            'telegram_url': self.telegram_url,
            'website': self.website,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 