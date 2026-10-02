from database import db
from datetime import datetime
import json

class TestSuite(db.Model):
    __tablename__ = 'test_suites'
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('agents.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    test_cases = db.relationship('TestCase', backref='test_suite', lazy=True, cascade="all, delete-orphan")
    evaluation_runs = db.relationship('EvaluationRun', backref='test_suite', lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_cases=True):
        res = {
            'id': self.id,
            'agent_id': self.agent_id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'test_case_count': len(self.test_cases)
        }
        if include_cases:
            res['test_cases'] = [tc.to_dict() for tc in self.test_cases]
        return res

class TestCase(db.Model):
    __tablename__ = 'test_cases'
    id = db.Column(db.Integer, primary_key=True)
    suite_id = db.Column(db.Integer, db.ForeignKey('test_suites.id'), nullable=False)
    test_code = db.Column(db.String(40), nullable=False) # e.g. TC-001
    category = db.Column(db.String(60), nullable=False)   # e.g. Normal, Edge case, Policy violation
    user_input = db.Column(db.Text, nullable=False)
    expected_behaviour = db.Column(db.Text, nullable=False)
    expected_tools = db.Column(db.Text, nullable=True) # JSON list of tool names
    evaluation_criteria = db.Column(db.Text, nullable=True) # JSON dict of criteria rules
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        exp_tools = []
        if self.expected_tools:
            try:
                exp_tools = json.loads(self.expected_tools) if isinstance(self.expected_tools, str) else self.expected_tools
            except Exception:
                exp_tools = []

        eval_crit = {}
        if self.evaluation_criteria:
            try:
                eval_crit = json.loads(self.evaluation_criteria) if isinstance(self.evaluation_criteria, str) else self.evaluation_criteria
            except Exception:
                eval_crit = {}

        return {
            'id': self.id,
            'suite_id': self.suite_id,
            'test_code': self.test_code,
            'category': self.category,
            'user_input': self.user_input,
            'expected_behaviour': self.expected_behaviour,
            'expected_tools': exp_tools,
            'evaluation_criteria': eval_crit,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
