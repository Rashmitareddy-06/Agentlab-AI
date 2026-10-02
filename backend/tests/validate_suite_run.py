import unittest
import json
from app import app
from database import db
from models import Agent, Tool, TestSuite, TestCase, EvaluationRun, TestResult
from services.seed_service import seed_database
from services.agent_runner import AgentRunner
from services.evaluator import Evaluator

class TestFullSuiteValidation(unittest.TestCase):

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

    def test_full_suite_execution(self):
        agent = Agent.query.first()
        suite = TestSuite.query.first()
        self.assertIsNotNone(agent)
        self.assertIsNotNone(suite)

        runner = AgentRunner()
        evaluator = Evaluator()

        tools_by_name = {t.name: t for t in agent.tools}
        test_cases = suite.test_cases

        total_passed = 0
        total_score = 0.0
        results_summary = []

        for tc in test_cases:
            telemetry = runner.run(agent, tc, tools_by_name)
            eval_res = evaluator.evaluate(tc, telemetry, agent)

            if eval_res['passed']:
                total_passed += 1

            total_score += eval_res['score']

            results_summary.append({
                'test_code': tc.test_code,
                'category': tc.category,
                'user_input': tc.user_input,
                'passed': eval_res['passed'],
                'score': eval_res['score'],
                'tool_sel': eval_res['tool_selection_score'],
                'task_success': eval_res['task_success_score'],
                'safety': eval_res['safety_score'],
                'failure_reason': eval_res.get('failure_reason')
            })

        count = len(test_cases)
        overall_score = round(total_score / count, 1)

        print("\n=======================================================")
        print(f"BENCHMARK EVALUATION SUITE SCORECARD ({total_passed}/{count} PASSED)")
        print(f"OVERALL AGENTLAB RELIABILITY SCORE: {overall_score}%")
        print("=======================================================")

        for r in results_summary:
            status = "PASS" if r['passed'] else "FAIL"
            print(f"{r['test_code']} ({r['category']}): {status} Score: {r['score']}% (ToolSel: {r['tool_sel']}%, TaskSuccess: {r['task_success']}%)")
            if not r['passed']:
                print(f"   Reason: {r['failure_reason']}")

        print("=======================================================\n")

        self.assertGreaterEqual(overall_score, 90.0)
        self.assertEqual(total_passed, count)

if __name__ == '__main__':
    unittest.main()
