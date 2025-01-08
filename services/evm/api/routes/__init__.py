# routes/__init__.py
from flask import Blueprint
from .auth import require_auth
from .trading import trading
from .tokens import tokens

# Register all blueprints here with their prefixes
blueprints = [
    (trading, '/api'),
    (tokens, '/api')
]