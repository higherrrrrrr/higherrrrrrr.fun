# routes/__init__.py
from flask import Blueprint
from .auth import require_auth
from .trading import trading

# Register all blueprints here
all_blueprints = [trading]