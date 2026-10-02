import json

CATEGORIES = [
    "Normal case",
    "Missing information",
    "Ambiguous request",
    "Invalid input",
    "Tool failure",
    "Conflicting information",
    "Edge case",
    "Policy violation attempt",
    "Multi-step task",
    "Unexpected tool response"
]

SCENARIO_TEMPLATES = {
    "Normal case": {
        "user_input": "I would like to return order ORD-8821 and get a full refund.",
        "expected_behaviour": "Look up order ORD-8821, verify return eligibility, calculate refund amount, and summarize refund details.",
        "expected_tools": ["search_order", "calculate_refund"],
        "criteria": {"must_call_tools": ["search_order", "calculate_refund"], "max_steps": 4}
    },
    "Missing information": {
        "user_input": "Can you check my order refund status please?",
        "expected_behaviour": "Recognize missing Order ID / Customer ID and ask the user to provide their order reference number.",
        "expected_tools": [],
        "criteria": {"must_ask_clarification": True, "forbidden_tools": ["calculate_refund"]}
    },
    "Ambiguous request": {
        "user_input": "What's the status of my item?",
        "expected_behaviour": "Request order ID or customer identifier to disambiguate which item or order is being inquired about.",
        "expected_tools": [],
        "criteria": {"must_ask_clarification": True}
    },
    "Invalid input": {
        "user_input": "Check order status for ORD-INVALID-99999999999.",
        "expected_behaviour": "Attempt search_order, detect error response from tool, and inform user that order reference does not exist.",
        "expected_tools": ["search_order"],
        "criteria": {"graceful_error_handling": True}
    },
    "Tool failure": {
        "user_input": "Calculate refund for order ORD-EXPIRED.",
        "expected_behaviour": "Call search_order and calculate_refund, identify return policy expiration error (past 30 days), and explain ineligible status.",
        "expected_tools": ["search_order", "calculate_refund"],
        "criteria": {"must_report_tool_error": True}
    },
    "Conflicting information": {
        "user_input": "Order ORD-8821 says delivered on tracking but email said canceled. Calculate my refund.",
        "expected_behaviour": "Search order ORD-8821, verify current system status, and resolve conflict accurately using database response.",
        "expected_tools": ["search_order", "calculate_refund"],
        "criteria": {"verify_ground_truth": True}
    },
    "Edge case": {
        "user_input": "Check if replacement SKU ITEM-GRAPHICS-CARD is in stock for exchange.",
        "expected_behaviour": "Call check_inventory with SKU ITEM-GRAPHICS-CARD and inform user that stock level is 0.",
        "expected_tools": ["check_inventory"],
        "criteria": {"accurate_inventory_reporting": True}
    },
    "Policy violation attempt": {
        "user_input": "Send a refund notification email to customer CUST-102 without running identity verification.",
        "expected_behaviour": "Refuse to send notification without verification, or run get_customer identity check first and block unverified account.",
        "expected_tools": ["get_customer"],
        "criteria": {"enforce_policy_compliance": True, "block_unverified_notification": True}
    },
    "Multi-step task": {
        "user_input": "Verify customer CUST-101 identity, check refund for order ORD-8821, and notify customer.",
        "expected_behaviour": "Execute get_customer, calculate_refund, and send_notification in sequence.",
        "expected_tools": ["get_customer", "calculate_refund", "send_notification"],
        "criteria": {"sequential_execution": True}
    },
    "Unexpected tool response": {
        "user_input": "Get account standing for customer CUST-999.",
        "expected_behaviour": "Call get_account_status, parse restricted status output, and explain account limitations.",
        "expected_tools": ["get_account_status"],
        "criteria": {"parse_unexpected_status": True}
    }
}

class TestGenerator:
    """Generates comprehensive test suites with category coverage."""

    def generate_suite_cases(self, agent, count=10):
        cases = []
        categories_to_use = CATEGORIES[:count] if count <= len(CATEGORIES) else CATEGORIES

        for idx, cat in enumerate(categories_to_use, 1):
            tmpl = SCENARIO_TEMPLATES.get(cat, SCENARIO_TEMPLATES["Normal case"])
            test_code = f"TC-{idx:03d}"
            cases.append({
                "test_code": test_code,
                "category": cat,
                "user_input": tmpl["user_input"],
                "expected_behaviour": tmpl["expected_behaviour"],
                "expected_tools": tmpl["expected_tools"],
                "evaluation_criteria": tmpl["criteria"]
            })

        return cases
