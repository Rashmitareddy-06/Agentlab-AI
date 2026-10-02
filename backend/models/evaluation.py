from database import db
from datetime import datetime
import json

class EvaluationRun(db.Model):
    __tablename__ = 'evaluation_runs'
    id = db.Column(db.Integer, primary_key=True)
    suite_id = db.Column(db.Integer, db.ForeignKey('test_suites.id'), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey('agents.id'), nullable=False)
    status = db.Column(db.String(40), default='completed') # completed, running, failed
    overall_score = db.Column(db.Float, default=0.0)
    task_success_rate = db.Column(db.Float, default=0.0)
    tool_accuracy_score = db.Column(db.Float, default=0.0)
    instruction_score = db.Column(db.Float, default=0.0)
    safety_score = db.Column(db.Float, default=0.0)
    groundedness_score = db.Column(db.Float, default=0.0)
    efficiency_score = db.Column(db.Float, default=0.0)
    avg_steps = db.Column(db.Float, default=0.0)
    avg_latency = db.Column(db.Float, default=0.0)
    total_tests = db.Column(db.Integer, default=0)
    passed_tests = db.Column(db.Integer, default=0)
    failed_tests = db.Column(db.Integer, default=0)
    mode = db.Column(db.String(40), default='Mock Engine') # Mock Engine or OpenAI API
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    results = db.relationship('TestResult', backref='evaluation_run', lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_results=False):
        res = {
            'id': self.id,
            'suite_id': self.suite_id,
            'agent_id': self.agent_id,
            'agent_name': self.agent.name if self.agent else 'Unknown Agent',
            'suite_name': self.test_suite.name if self.test_suite else 'Unknown Suite',
            'status': self.status,
            'overall_score': round(self.overall_score, 1),
            'task_success_rate': round(self.task_success_rate, 1),
            'tool_accuracy_score': round(self.tool_accuracy_score, 1),
            'instruction_score': round(self.instruction_score, 1),
            'safety_score': round(self.safety_score, 1),
            'groundedness_score': round(self.groundedness_score, 1),
            'efficiency_score': round(self.efficiency_score, 1),
            'avg_steps': round(self.avg_steps, 2),
            'avg_latency': round(self.avg_latency, 2),
            'total_tests': self.total_tests,
            'passed_tests': self.passed_tests,
            'failed_tests': self.failed_tests,
            'mode': self.mode,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_results:
            res['results'] = [r.to_dict(include_steps=True) for r in self.results]
        return res

class TestResult(db.Model):
    __tablename__ = 'test_results'
    id = db.Column(db.Integer, primary_key=True)
    run_id = db.Column(db.Integer, db.ForeignKey('evaluation_runs.id'), nullable=False)
    test_case_id = db.Column(db.Integer, db.ForeignKey('test_cases.id'), nullable=False)
    passed = db.Column(db.Boolean, default=False)
    score = db.Column(db.Float, default=0.0)
    
    # Detailed failure diagnostics
    failure_reason = db.Column(db.Text, nullable=True) # Short summary of failure
    failure_cause = db.Column(db.Text, nullable=True)  # Root cause taxonomy
    suggestion = db.Column(db.Text, nullable=True)     # Recommended instruction or tool change

    # Breakdown metrics (0-100)
    task_success_score = db.Column(db.Float, default=0.0)
    tool_selection_score = db.Column(db.Float, default=0.0)
    tool_arg_score = db.Column(db.Float, default=0.0)
    instruction_score = db.Column(db.Float, default=0.0)
    safety_score = db.Column(db.Float, default=0.0)
    groundedness_score = db.Column(db.Float, default=0.0)
    efficiency_score = db.Column(db.Float, default=0.0)

    # Execution telemetry
    final_output = db.Column(db.Text, nullable=True)
    total_steps = db.Column(db.Integer, default=0)
    execution_time = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    test_case = db.relationship('TestCase', backref='results')
    execution_steps = db.relationship('ExecutionStep', backref='test_result', lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_steps=True):
        res = {
            'id': self.id,
            'run_id': self.run_id,
            'test_case_id': self.test_case_id,
            'test_case': self.test_case.to_dict() if self.test_case else None,
            'passed': self.passed,
            'score': round(self.score, 1),
            'failure_reason': self.failure_reason,
            'failure_cause': self.failure_cause,
            'suggestion': self.suggestion,
            'task_success_score': round(self.task_success_score, 1),
            'tool_selection_score': round(self.tool_selection_score, 1),
            'tool_arg_score': round(self.tool_arg_score, 1),
            'instruction_score': round(self.instruction_score, 1),
            'safety_score': round(self.safety_score, 1),
            'groundedness_score': round(self.groundedness_score, 1),
            'efficiency_score': round(self.efficiency_score, 1),
            'final_output': self.final_output,
            'total_steps': self.total_steps,
            'execution_time': round(self.execution_time, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_steps:
            res['execution_steps'] = [step.to_dict() for step in sorted(self.execution_steps, key=lambda s: s.step_number)]
        return res

class ExecutionStep(db.Model):
    __tablename__ = 'execution_steps'
    id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, db.ForeignKey('test_results.id'), nullable=False)
    step_number = db.Column(db.Integer, nullable=False)
    step_type = db.Column(db.String(40), nullable=False) # user_input, agent_thought, tool_call, tool_result, final_response, error
    content = db.Column(db.Text, nullable=True) # Text or JSON representation of payload
    tool_name = db.Column(db.String(80), nullable=True)
    tool_arguments = db.Column(db.Text, nullable=True) # JSON
    tool_output = db.Column(db.Text, nullable=True)    # JSON
    latency_ms = db.Column(db.Float, default=0.0)

    def to_dict(self):
        t_args = None
        if self.tool_arguments:
            try:
                t_args = json.loads(self.tool_arguments) if isinstance(self.tool_arguments, str) else self.tool_arguments
            except Exception:
                t_args = self.tool_arguments

        t_out = None
        if self.tool_output:
            try:
                t_out = json.loads(self.tool_output) if isinstance(self.tool_output, str) else self.tool_output
            except Exception:
                t_out = self.tool_output

        return {
            'id': self.id,
            'step_number': self.step_number,
            'step_type': self.step_type,
            'content': self.content,
            'tool_name': self.tool_name,
            'tool_arguments': t_args,
            'tool_output': t_out,
            'latency_ms': round(self.latency_ms, 1)
        }
