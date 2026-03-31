import os

API_KEY = os.environ.get('API_KEY', 'secret-token')


def authenticate(req):
    """Simple authentication node: expects header X-API-KEY or JSON api_key"""
    # check header first
    key = req.headers.get('X-API-KEY') or (req.json or {}).get('api_key') if hasattr(req, 'json') else None
    meta = {'method_checked': 'header/json', 'expected_api_key': API_KEY}
    if key == API_KEY:
        return True, meta
    return False, {'error': 'invalid_api_key'}
