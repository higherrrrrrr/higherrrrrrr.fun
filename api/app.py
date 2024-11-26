from flask import Flask, jsonify, url_for
from flask_cors import CORS
from routes import all_blueprints
from config import Config
import os

def create_app():
    app = Flask(__name__)
    CORS(app)

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
    for blueprint in all_blueprints:
        app.register_blueprint(blueprint, url_prefix='/api')

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

    return app

app = create_app()

if __name__ == '__main__':
    # Use PORT environment variable provided by Cloud Run
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)