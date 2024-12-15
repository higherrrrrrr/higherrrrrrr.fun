from flask import Flask, jsonify, url_for
from flask_cors import CORS
from routes import blueprints
from config import Config
import os
from routes.trading import get_eth_price
from models.token import db
from flask_migrate import Migrate
from routes.tokens import tokens
from routes.trading import trading
from routes.twitter import twitter

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object('config.Config')

    # Set up session secret key
    app.secret_key = Config.SECRET_KEY

    # Initialize SQLAlchemy
    db.init_app(app)

    # Initialize Flask-Migrate
    migrate = Migrate(app, db)

    # Create all database tables
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Database initialization error: {e}")

    # Root endpoint without authentication
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'status': 'online',
            'version': '1.0.0'
        })

    # Health check without authentication
    @app.route('/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy'}

    # Register blueprints
    for blueprint, url_prefix in blueprints:
        app.register_blueprint(blueprint, url_prefix=url_prefix)
    app.register_blueprint(twitter, url_prefix='/api')

    @app.route('/api/endpoints', methods=['GET'])
    def list_endpoints():
        endpoints = []
        for rule in app.url_map.iter_rules():
            # Skip the static endpoint
            if rule.endpoint != 'static':
                # Check if endpoint requires authentication
                requires_auth = (
                        rule.rule not in ['/', '/health', '/api/endpoints'] and
                        'static' not in rule.endpoint
                )

                endpoints.append({
                    'endpoint': rule.rule,
                    'methods': list(rule.methods - {'HEAD', 'OPTIONS'}),
                    'authentication': 'required' if requires_auth else 'none'
                })

        return jsonify({
            'endpoints': sorted(endpoints, key=lambda x: x['endpoint'])
        })

    @app.route('/eth/price', methods=['GET'])
    def eth_price():
        return get_eth_price()

    return app

app = create_app()

if __name__ == '__main__':
    # Use PORT environment variable provided by Cloud Run
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)