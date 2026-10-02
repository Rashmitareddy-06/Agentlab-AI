from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import time

from config import Config
from database import db, init_db
from models.agent import Agent, AgentTool
from models.tool import Tool
from models.test_suite import TestSuite, TestCase
from models.evaluation import EvaluationRun, TestResult, ExecutionStep
from services.seed_service import seed_database
from services.agent_runner import AgentRunner
from services.evaluator import Evaluator
from services.test_generator import TestGenerator
from services.regression_service import RegressionService
from services.llm_provider import LLMProvider

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
init_db(app)

with app.app_context():
    seed_database()

# Helper error response
def error_response(msg, code=400):
    return jsonify({"error": msg}), code

# -------------------------------------------------------------------
# DASHBOARD API
# -------------------------------------------------------------------
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    total_agents = Agent.query.count()
    total_suites = TestSuite.query.count()
    total_evaluations = EvaluationRun.query.count()

    latest_runs = EvaluationRun.query.order_by(EvaluationRun.created_at.desc()).limit(5).all()

    overall_scores = [r.overall_score for r in latest_runs] if latest_runs else [0.0]
    avg_reliability = sum(overall_scores) / len(overall_scores) if overall_scores else 0.0

    all_passed = sum(r.passed_tests for r in latest_runs) if latest_runs else 0
    all_tests = sum(r.total_tests for r in latest_runs) if latest_runs else 1
    pass_rate = (all_passed / max(1, all_tests)) * 100.0

    recent_failures = TestResult.query.filter_by(passed=False).order_by(TestResult.created_at.desc()).limit(5).all()

    agents = Agent.query.all()

    return jsonify({
        "stats": {
            "total_agents": total_agents,
            "total_suites": total_suites,
            "total_evaluations": total_evaluations,
            "pass_rate": round(pass_rate, 1),
            "avg_reliability": round(avg_reliability, 1),
            "is_mock_mode": Config.is_mock_mode()
        },
        "agents": [a.to_dict() for a in agents],
        "latest_runs": [r.to_dict() for r in latest_runs],
        "recent_failures": [f.to_dict(include_steps=False) for f in recent_failures]
    })

# -------------------------------------------------------------------
# AGENTS API
# -------------------------------------------------------------------
@app.route('/api/agents', methods=['GET'])
def get_agents():
    agents = Agent.query.order_by(Agent.created_at.desc()).all()
    return jsonify([a.to_dict() for a in agents])

@app.route('/api/agents/<int:agent_id>', methods=['GET'])
def get_agent(agent_id):
    agent = Agent.query.get(agent_id)
    if not agent:
        return error_response("Agent not found", 404)
    return jsonify(agent.to_dict())

@app.route('/api/agents', methods=['POST'])
def create_agent():
    data = request.json or {}
    name = data.get('name')
    if not name:
        return error_response("Agent name is required")

    agent = Agent(
        name=name,
        description=data.get('description', ''),
        system_instructions=data.get('system_instructions', 'You are an AI assistant.'),
        model=data.get('model', 'gpt-4o-mini'),
        temperature=float(data.get('temperature', 0.2)),
        max_steps=int(data.get('max_steps', 5))
    )
    db.session.add(agent)
    db.session.flush()

    # Tool linkages
    tool_ids = data.get('tool_ids', [])
    for tid in tool_ids:
        tool = Tool.query.get(tid)
        if tool:
            at = AgentTool(agent_id=agent.id, tool_id=tool.id)
            db.session.add(at)

    db.session.commit()
    return jsonify(agent.to_dict()), 201

@app.route('/api/agents/<int:agent_id>', methods=['PUT'])
def update_agent(agent_id):
    agent = Agent.query.get(agent_id)
    if not agent:
        return error_response("Agent not found", 404)

    data = request.json or {}
    agent.name = data.get('name', agent.name)
    agent.description = data.get('description', agent.description)
    agent.system_instructions = data.get('system_instructions', agent.system_instructions)
    agent.model = data.get('model', agent.model)
    agent.temperature = float(data.get('temperature', agent.temperature))
    agent.max_steps = int(data.get('max_steps', agent.max_steps))

    if 'tool_ids' in data:
        AgentTool.query.filter_by(agent_id=agent.id).delete()
        for tid in data['tool_ids']:
            tool = Tool.query.get(tid)
            if tool:
                at = AgentTool(agent_id=agent.id, tool_id=tool.id)
                db.session.add(at)

    db.session.commit()
    return jsonify(agent.to_dict())

@app.route('/api/agents/<int:agent_id>', methods=['DELETE'])
def delete_agent(agent_id):
    agent = Agent.query.get(agent_id)
    if not agent:
        return error_response("Agent not found", 404)
    db.session.delete(agent)
    db.session.commit()
    return jsonify({"message": f"Agent {agent_id} deleted successfully"})

# -------------------------------------------------------------------
# TOOLS API
# -------------------------------------------------------------------
@app.route('/api/tools', methods=['GET'])
def get_tools():
    tools = Tool.query.all()
    return jsonify([t.to_dict() for t in tools])

# -------------------------------------------------------------------
# TEST SUITES API
# -------------------------------------------------------------------
@app.route('/api/test-suites', methods=['GET'])
def get_test_suites():
    suites = TestSuite.query.order_by(TestSuite.created_at.desc()).all()
    return jsonify([s.to_dict(include_cases=True) for s in suites])

@app.route('/api/test-suites/<int:suite_id>', methods=['GET'])
def get_test_suite(suite_id):
    suite = TestSuite.query.get(suite_id)
    if not suite:
        return error_response("Test suite not found", 404)
    return jsonify(suite.to_dict(include_cases=True))

@app.route('/api/test-suites', methods=['POST'])
def create_test_suite():
    data = request.json or {}
    agent_id = data.get('agent_id')
    name = data.get('name')
    if not agent_id or not name:
        return error_response("agent_id and suite name are required")

    suite = TestSuite(
        agent_id=agent_id,
        name=name,
        description=data.get('description', '')
    )
    db.session.add(suite)
    db.session.commit()
    return jsonify(suite.to_dict()), 201

@app.route('/api/test-suites/<int:suite_id>/cases', methods=['POST'])
def add_test_case(suite_id):
    suite = TestSuite.query.get(suite_id)
    if not suite:
        return error_response("Test suite not found", 404)

    data = request.json or {}
    tc = TestCase(
        suite_id=suite.id,
        test_code=data.get('test_code', f"TC-{(len(suite.test_cases)+1):03d}"),
        category=data.get('category', 'Normal case'),
        user_input=data.get('user_input', ''),
        expected_behaviour=data.get('expected_behaviour', ''),
        expected_tools=json.dumps(data.get('expected_tools', [])),
        evaluation_criteria=json.dumps(data.get('evaluation_criteria', {}))
    )
    db.session.add(tc)
    db.session.commit()
    return jsonify(tc.to_dict()), 201

@app.route('/api/test-suites/<int:suite_id>/generate', methods=['POST'])
def generate_test_cases(suite_id):
    suite = TestSuite.query.get(suite_id)
    if not suite:
        return error_response("Test suite not found", 404)

    count = int((request.json or {}).get('count', 10))
    generator = TestGenerator()
    new_cases_data = generator.generate_suite_cases(suite.agent, count=count)

    created = []
    for c_data in new_cases_data:
        tc = TestCase(
            suite_id=suite.id,
            test_code=c_data['test_code'],
            category=c_data['category'],
            user_input=c_data['user_input'],
            expected_behaviour=c_data['expected_behaviour'],
            expected_tools=json.dumps(c_data['expected_tools']),
            evaluation_criteria=json.dumps(c_data['evaluation_criteria'])
        )
        db.session.add(tc)
        created.append(tc)

    db.session.commit()
    return jsonify([c.to_dict() for c in created]), 201

# -------------------------------------------------------------------
# EVALUATION EXECUTION API
# -------------------------------------------------------------------
@app.route('/api/test-suites/<int:suite_id>/run', methods=['POST'])
def run_evaluation(suite_id):
    suite = TestSuite.query.get(suite_id)
    if not suite:
        return error_response("Test suite not found", 404)

    agent = suite.agent
    if not agent:
        return error_response("Associated agent not found", 404)

    runner = AgentRunner()
    evaluator = Evaluator()

    is_live = LLMProvider.is_live_mode()
    run_mode = f"LIVE ({agent.model})" if is_live else "Mock Engine"

    run = EvaluationRun(
        suite_id=suite.id,
        agent_id=agent.id,
        status="running",
        mode=run_mode
    )
    db.session.add(run)
    db.session.flush()

    tools_by_name = {t.name: t for t in agent.tools}
    test_cases = suite.test_cases

    total_passed = 0
    total_score = 0.0
    total_task_success = 0.0
    total_tool_acc = 0.0
    total_instr = 0.0
    total_safety = 0.0
    total_groundedness = 0.0
    total_eff = 0.0
    sum_steps = 0
    sum_latency = 0.0

    for tc in test_cases:
        telemetry = runner.run(agent, tc, tools_by_name)
        eval_res = evaluator.evaluate(tc, telemetry, agent)

        if eval_res['passed']:
            total_passed += 1

        total_score += eval_res['score']
        total_task_success += eval_res['task_success_score']
        total_tool_acc += eval_res['tool_selection_score']
        total_instr += eval_res['instruction_score']
        total_safety += eval_res['safety_score']
        total_groundedness += eval_res['groundedness_score']
        total_eff += eval_res['efficiency_score']
        sum_steps += telemetry['total_steps']
        sum_latency += telemetry['execution_time']

        test_res = TestResult(
            run_id=run.id,
            test_case_id=tc.id,
            passed=eval_res['passed'],
            score=eval_res['score'],
            failure_reason=eval_res['failure_reason'],
            failure_cause=eval_res['failure_cause'],
            suggestion=eval_res['suggestion'],
            task_success_score=eval_res['task_success_score'],
            tool_selection_score=eval_res['tool_selection_score'],
            tool_arg_score=eval_res['tool_arg_score'],
            instruction_score=eval_res['instruction_score'],
            safety_score=eval_res['safety_score'],
            groundedness_score=eval_res['groundedness_score'],
            efficiency_score=eval_res['efficiency_score'],
            final_output=telemetry['final_output'],
            total_steps=telemetry['total_steps'],
            execution_time=telemetry['execution_time']
        )
        db.session.add(test_res)
        db.session.flush()

        for step in telemetry['steps']:
            es = ExecutionStep(
                result_id=test_res.id,
                step_number=step['step_number'],
                step_type=step['step_type'],
                content=step.get('content'),
                tool_name=step.get('tool_name'),
                tool_arguments=step.get('tool_arguments'),
                tool_output=step.get('tool_output'),
                latency_ms=step.get('latency_ms', 50.0)
            )
            db.session.add(es)

    count = len(test_cases) if test_cases else 1
    run.status = "completed"
    run.total_tests = len(test_cases)
    run.passed_tests = total_passed
    run.failed_tests = len(test_cases) - total_passed
    run.overall_score = total_score / count
    run.task_success_rate = total_task_success / count
    run.tool_accuracy_score = total_tool_acc / count
    run.instruction_score = total_instr / count
    run.safety_score = total_safety / count
    run.groundedness_score = total_groundedness / count
    run.efficiency_score = total_eff / count
    run.avg_steps = sum_steps / count
    run.avg_latency = sum_latency / count

    db.session.commit()
    return jsonify(run.to_dict(include_results=True)), 200

# -------------------------------------------------------------------
# EVALUATIONS & TRACES API
# -------------------------------------------------------------------
@app.route('/api/evaluations', methods=['GET'])
def get_evaluations():
    runs = EvaluationRun.query.order_by(EvaluationRun.created_at.desc()).all()
    return jsonify([r.to_dict() for r in runs])

@app.route('/api/evaluations/<int:run_id>', methods=['GET'])
def get_evaluation(run_id):
    run = EvaluationRun.query.get(run_id)
    if not run:
        return error_response("Evaluation run not found", 404)
    return jsonify(run.to_dict(include_results=True))

@app.route('/api/evaluations/<int:run_id>/trace', methods=['GET'])
def get_evaluation_trace(run_id):
    run = EvaluationRun.query.get(run_id)
    if not run:
        return error_response("Evaluation run not found", 404)
    return jsonify(run.to_dict(include_results=True))

# -------------------------------------------------------------------
# REGRESSION COMPARISON API
# -------------------------------------------------------------------
@app.route('/api/evaluations/compare', methods=['POST'])
def compare_evaluations():
    data = request.json or {}
    base_id = data.get('base_run_id')
    current_id = data.get('current_run_id')

    if not base_id or not current_id:
        return error_response("base_run_id and current_run_id are required")

    base_run = EvaluationRun.query.get(base_id)
    current_run = EvaluationRun.query.get(current_id)

    if not base_run or not current_run:
        return error_response("One or both evaluation runs not found", 404)

    reg_service = RegressionService()
    diff = reg_service.compare_runs(base_run, current_run)
    return jsonify(diff)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting AgentLab Backend Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
