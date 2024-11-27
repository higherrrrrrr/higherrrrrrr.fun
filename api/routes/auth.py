from functools import wraps
from flask import request, jsonify
from config import Config

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Pass through all requests without checking auth
        return f(*args, **kwargs)
    return decorated