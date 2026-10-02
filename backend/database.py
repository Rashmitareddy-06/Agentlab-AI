from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        # Import models so SQLAlchemy registers them
        from models import agent, tool, test_suite, evaluation
        db.create_all()
