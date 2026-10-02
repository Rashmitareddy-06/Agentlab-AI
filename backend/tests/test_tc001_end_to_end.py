import unittest
import json
from app import app
from database import db
from models import Agent, Tool, TestSuite, TestCase
from services.seed_service import seed_database
from services.agent_runner import AgentRunner
from services.evaluator import Evaluator

class TestTC001EndToEnd(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.ctx = app.app_context()
        self.ctx.push()
        db.create_all()
        seed_database()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_tc001_execution_trace(self):
        # Fetch pre-seeded demo agent and tools
        agent = Agent.query.first()
        tc001 = TestCase.query.filter_by(test_code="TC-001").first()

        self.assertIsNotNone(agent)
        self.assertIsNotNone(tc001)

        runner = AgentRunner()
        evaluator = Evaluator()

        tools_by_name = {t.name: t for t in agent.tools}
        telemetry = runner.run(agent, tc001, tools_by_name)

        # Print trace summary for verification
        print("\n--- TC-001 EXECUTION TRACE ---")
        print(f"Mode: {telemetry.get('mode')}")
        print(f"Total Steps: {telemetry.get('total_steps')}")
        print(f"Execution Time: {telemetry.get('execution_time')}s")
        print(f"Final Output: {telemetry.get('final_output')}")
        for s in telemetry['steps']:
            print(f" Step #{s['step_number']} [{s['step_type'].upper()}] - Tool: {s.get('tool_name')} Args: {s.get('tool_arguments')} Output: {s.get('tool_output')}")

        # Assert trace contains required execution steps
        step_types = [s['step_type'] for s in telemetry['steps']]
        self.assertIn('user_input', step_types)
        self.assertIn('tool_call', step_types)
        self.assertIn('tool_result', step_types)
        self.assertIn('final_response', step_types)

        # Evaluate trace
        eval_result = evaluator.evaluate(tc001, telemetry, agent)
        print("\n--- TC-001 EVALUATION RESULT ---")
        print(f"Passed: {eval_result['passed']}")
        print(f"Score: {eval_result['score']}%")
        print(f"Tool Selection Score: {eval_result['tool_selection_score']}%")
        print(f"Task Success Score: {eval_result['task_success_score']}%")

        self.assertTrue(eval_result['passed'])

if __name__ == '__main__':
    unittest.main()
