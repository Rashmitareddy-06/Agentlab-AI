import unittest
import json
from app import app
from database import db
from models import Agent, Tool, TestSuite, TestCase, EvaluationRun

class AgentLabBackendTestCase(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_dashboard_endpoint(self):
        res = self.client.get('/api/dashboard')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('stats', data)
        self.assertIn('agents', data)

    def test_agent_crud(self):
        # Create agent
        payload = {
            "name": "Custom Test Support Agent",
            "description": "Unit test agent",
            "system_instructions": "Verify identity first.",
            "model": "gpt-4o-mini",
            "temperature": 0.3,
            "max_steps": 4
        }
        res = self.client.post('/api/agents', json=payload)
        self.assertEqual(res.status_code, 201)
        created = res.get_json()
        self.assertEqual(created['name'], "Custom Test Support Agent")

        # Get list
        res = self.client.get('/api/agents')
        self.assertEqual(res.status_code, 200)
        agents = res.get_json()
        names = [a['name'] for a in agents]
        self.assertIn("Custom Test Support Agent", names)

    def test_test_suite_and_run(self):
        # Create agent
        agent_res = self.client.post('/api/agents', json={"name": "Eval Agent", "system_instructions": "Help user."})
        agent_id = agent_res.get_json()['id']

        # Create suite
        suite_res = self.client.post('/api/test-suites', json={"agent_id": agent_id, "name": "Eval Suite"})
        suite_id = suite_res.get_json()['id']

        # Generate cases
        gen_res = self.client.post(f'/api/test-suites/{suite_id}/generate', json={"count": 5})
        self.assertEqual(gen_res.status_code, 201)
        cases = gen_res.get_json()
        self.assertEqual(len(cases), 5)

        # Run evaluation
        run_res = self.client.post(f'/api/test-suites/{suite_id}/run')
        self.assertEqual(run_res.status_code, 200)
        run_data = run_res.get_json()
        self.assertEqual(run_data['total_tests'], 5)
        self.assertGreaterEqual(run_data['overall_score'], 0.0)

if __name__ == '__main__':
    unittest.main()
