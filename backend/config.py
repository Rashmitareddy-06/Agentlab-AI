import os
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'agentlab-dev-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(backend_dir, 'agentlab.db')}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

    @classmethod
    def get_openai_api_key(cls):
        return os.environ.get('OPENAI_API_KEY', '').strip()

    @classmethod
    def is_mock_mode(cls):
        return not bool(cls.get_openai_api_key())
