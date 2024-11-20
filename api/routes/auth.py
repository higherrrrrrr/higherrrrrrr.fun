from functools import wraps
from flask import request, jsonify
from config import Config
from datetime import datetime
import pytz

def calculate_time_remaining():
    # Target time: November 22nd, 2024 at 3PM PST
    pst = pytz.timezone('America/Los_Angeles')
    target = datetime(2024, 11, 22, 15, 0, 0, tzinfo=pst)
    now = datetime.now(pst)

    # Calculate difference
    diff = target - now

    # Calculate days, hours, minutes
    days = diff.days
    hours = diff.seconds // 3600
    minutes = (diff.seconds % 3600) // 60

    return f"{days}d {hours}h {minutes}m"

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'message': f'The loyal shall be rewarded. {calculate_time_remaining()}. Pledge: https://higherrrrrrr.fun/pledge'
            }), 401

        try:
            # Simple bearer token check
            token_type, token = auth_header.split()
            if token_type.lower() != 'bearer' or token != Config.AUTH_TOKEN:
                raise ValueError('Invalid token')

            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'message': f'The loyal shall be rewarded. {calculate_time_remaining()}. Pledge: https://higherrrrrrr.fun/pledge'
            }), 401

    return decorated