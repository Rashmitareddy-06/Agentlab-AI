from database import db
from datetime import datetime

class AgentTool(db.Model):
    __tablename__ = 'agent_tools'
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('agents.id'), nullable=False)
    tool_id = db.Column(db.Integer, db.ForeignKey('tools.id'), nullable=False)

class Agent(db.Model):
    __tablename__ = 'agents'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    system_instructions = db.Column(db.Text, nullable=False)
    model = db.Column(db.String(60), default='gpt-4o-mini')
    temperature = db.Column(db.Float, default=0.2)
    max_steps = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tools = db.relationship('Tool', secondary='agent_tools', backref=db.backref('agents', lazy='dynamic'))
    test_suites = db.relationship('TestSuite', backref='agent', lazy=True, cascade="all, delete-orphan")
    evaluation_runs = db.relationship('EvaluationRun', backref='agent', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'system_instructions': self.system_instructions,
            'model': self.model,
            'temperature': self.temperature,
            'max_steps': self.max_steps,
            'tools': [tool.to_dict() for tool in self.tools],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
