from database import db
from datetime import datetime
import json

class Tool(db.Model):
    __tablename__ = 'tools'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
    input_schema = db.Column(db.Text, nullable=False)   # JSON string
    output_schema = db.Column(db.Text, nullable=False)  # JSON string
    handler_name = db.Column(db.String(80), nullable=False) # Name of function in mock_tools.py
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'input_schema': json.loads(self.input_schema) if isinstance(self.input_schema, str) else self.input_schema,
            'output_schema': json.loads(self.output_schema) if isinstance(self.output_schema, str) else self.output_schema,
            'handler_name': self.handler_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
