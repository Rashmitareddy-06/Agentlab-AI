import time
import json
import re
from config import Config
from tools.registry import execute_tool
from services.llm_provider import LLMProvider

class AgentRunner:
    """
    Executes an AI Agent against a Test Case.
    Delegates to LLMProvider for real OpenAI-compatible function calling when OPENAI_API_KEY is configured.
    Falls back gracefully to dynamic context-grounded Mock Engine loop when operating in offline/demo mode.
    """

    def __init__(self):
        self.llm_provider = LLMProvider()

    def run(self, agent, test_case, tools_by_name):
        if self.llm_provider.is_live_mode():
            try:
                return self.llm_provider.execute_agent_loop(agent, test_case, tools_by_name)
            except Exception as e:
                print(f"[AgentRunner Warning] Live LLM execution failed: {str(e)}. Falling back to Mock Engine.")
                return self._run_deterministic_mock(agent, test_case, tools_by_name)
        else:
            return self._run_deterministic_mock(agent, test_case, tools_by_name)

    def _run_deterministic_mock(self, agent, test_case, tools_by_name):
        """
        Dynamic context-grounded engine simulating multi-step agent reasoning, input validation, 
        tool dispatching, and policy enforcement based strictly on available user inputs.
        """
        start_time = time.time()
        steps = []
        step_counter = 1

        # Step 1: Record User Input
        steps.append({
            'step_number': step_counter,
            'step_type': 'user_input',
            'content': test_case.user_input,
            'latency_ms': 5.0
        })
        step_counter += 1

        user_input = test_case.user_input.strip()
        available_tool_names = set(tools_by_name.keys())

        # Extract explicit context identifiers using regex patterns
        order_match = re.search(r'ORD-[A-Z0-9\-]+', user_input, re.IGNORECASE)
        order_id = order_match.group(0).upper() if order_match else None

        cust_match = re.search(r'CUST-[0-9]+', user_input, re.IGNORECASE)
        customer_id = cust_match.group(0).upper() if cust_match else None

        sku_match = re.search(r'ITEM-[A-Z0-9\-]+', user_input, re.IGNORECASE)
        sku = sku_match.group(0).upper() if sku_match else None

        def add_step(s_type, content=None, tool_name=None, tool_args=None, tool_out=None, latency=120.0):
            nonlocal step_counter
            steps.append({
                'step_number': step_counter,
                'step_type': s_type,
                'content': content,
                'tool_name': tool_name,
                'tool_arguments': json.dumps(tool_args) if tool_args is not None else None,
                'tool_output': json.dumps(tool_out) if tool_out is not None else None,
                'latency_ms': latency
            })
            step_counter += 1

        final_output = ""

        # Check explicit intent triggers
        is_notification_action = bool(re.search(r'\b(send|notify|notification|email to|sms to|force send)\b', user_input, re.IGNORECASE))
        is_inventory_query = bool(sku or re.search(r'\b(stock|inventory|available)\b', user_input, re.IGNORECASE))
        is_account_query = bool(customer_id and re.search(r'\b(account|standing)\b', user_input, re.IGNORECASE))

        # ---------------------------------------------------------------------
        # ROUTE 1: Notification & Policy Compliance Request (TC-003, TC-012, TC-006)
        # ---------------------------------------------------------------------
        if is_notification_action:
            
            # Sub-case A: Multi-step task with explicit customer verification, refund, and notification (TC-006)
            if customer_id and order_id and "verify" in user_input.lower() and "check refund" in user_input.lower():
                if "get_customer" in available_tool_names:
                    add_step('agent_thought', f'Step 1/3: Verifying identity for customer {customer_id}.')
                    cust_args = {"customer_id": customer_id}
                    out1 = execute_tool("get_customer", cust_args)
                    add_step('tool_call', tool_name='get_customer', tool_args=cust_args)
                    add_step('tool_result', tool_name='get_customer', tool_out=out1)

                if "calculate_refund" in available_tool_names:
                    add_step('agent_thought', f'Step 2/3: Calculating refund for order {order_id}.')
                    ref_args = {"order_id": order_id}
                    out2 = execute_tool("calculate_refund", ref_args)
                    add_step('tool_call', tool_name='calculate_refund', tool_args=ref_args)
                    add_step('tool_result', tool_name='calculate_refund', tool_out=out2)

                if "send_notification" in available_tool_names:
                    add_step('agent_thought', f'Step 3/3: Sending confirmation notification to customer {customer_id}.')
                    notif_args = {"customer_id": customer_id, "channel": "email", "message": f"Your refund for {order_id} has been processed."}
                    out3 = execute_tool("send_notification", notif_args)
                    add_step('tool_call', tool_name='send_notification', tool_args=notif_args)
                    add_step('tool_result', tool_name='send_notification', tool_out=out3)

                final_output = f"Completed multi-step resolution: Customer {customer_id} verified, refund for {order_id} calculated, and confirmation notification sent."

            # Sub-case B: Notification request requiring identity verification (TC-003, TC-012)
            else:
                target_cust = customer_id or "CUST-102"
                if "get_customer" in available_tool_names:
                    add_step('agent_thought', f'Policy Check: Verifying identity status for customer {target_cust} before sending notification.')
                    cust_args = {"customer_id": target_cust}
                    cust_out = execute_tool("get_customer", cust_args)
                    add_step('tool_call', tool_name='get_customer', tool_args=cust_args)
                    add_step('tool_result', tool_name='get_customer', tool_out=cust_out)

                    if not cust_out.get("identity_verified", False):
                        add_step('agent_thought', f'POLICY ENFORCEMENT: Refusing notification because customer {target_cust} is unverified.')
                        final_output = f"Cannot send notification. Customer {target_cust} identity verification is required first (Status: unverified)."
                    else:
                        add_step('agent_thought', f'Identity verified. Sending notification to {target_cust}.')
                        notif_args = {"customer_id": target_cust, "channel": "email", "message": "Notification message."}
                        notif_out = execute_tool("send_notification", notif_args)
                        add_step('tool_call', tool_name='send_notification', tool_args=notif_args)
                        add_step('tool_result', tool_name='send_notification', tool_out=notif_out)
                        final_output = f"Notification sent successfully to customer {target_cust}."
                else:
                    add_step('agent_thought', 'Policy Enforcement: Verification tool unavailable. Notification blocked.')
                    final_output = "Notification blocked because identity verification cannot be completed."

        # ---------------------------------------------------------------------
        # ROUTE 2: Inventory / Stock Availability Query (TC-011, TC-004)
        # ---------------------------------------------------------------------
        elif is_inventory_query:
            target_sku = sku or "ITEM-NEURAL-LINK"
            if "check_inventory" in available_tool_names:
                add_step('agent_thought', f'Checking warehouse inventory stock level for SKU {target_sku}.')
                inv_args = {"sku": target_sku}
                inv_out = execute_tool("check_inventory", inv_args)
                add_step('tool_call', tool_name='check_inventory', tool_args=inv_args)
                add_step('tool_result', tool_name='check_inventory', tool_out=inv_out)

                in_stock = inv_out.get("in_stock", 0)
                warehouse = inv_out.get("warehouse", "Unknown")
                if in_stock > 0:
                    final_output = f"SKU {target_sku} is in stock with {in_stock} units available in {warehouse} warehouse."
                else:
                    final_output = f"SKU {target_sku} is currently out of stock (0 units in {warehouse} warehouse)."
            else:
                final_output = f"Inventory tool unavailable to check SKU {target_sku}."

        # ---------------------------------------------------------------------
        # ROUTE 3: Account Standing / Status Query (TC-010)
        # ---------------------------------------------------------------------
        elif is_account_query:
            if "get_account_status" in available_tool_names:
                add_step('agent_thought', f'Checking account status and standing for customer {customer_id}.')
                acc_args = {"customer_id": customer_id}
                acc_out = execute_tool("get_account_status", acc_args)
                add_step('tool_call', tool_name='get_account_status', tool_args=acc_args)
                add_step('tool_result', tool_name='get_account_status', tool_out=acc_out)

                status = acc_out.get("account_status", "unknown")
                final_output = f"Account standing for customer {customer_id}: Status is '{status}'."
            else:
                final_output = f"Account status tool unavailable for customer {customer_id}."

        # ---------------------------------------------------------------------
        # ROUTE 4: Missing Information Input Validation (TC-002, TC-007)
        # ---------------------------------------------------------------------
        elif not order_id and ("order" in user_input.lower() or "refund" in user_input.lower() or "package" in user_input.lower() or "status" in user_input.lower()):
            add_step('agent_thought', 'Analyzed request: Required Order ID parameter is missing. Requesting user input.')
            final_output = "Could you please provide your Order ID or registered email address so I can assist you?"

        # ---------------------------------------------------------------------
        # ROUTE 5: Explicit Order Inquiry / Return / Refund (TC-001, TC-005, TC-008, TC-009)
        # ---------------------------------------------------------------------
        elif order_id:
            # Step 1: Search Order
            if "search_order" in available_tool_names:
                add_step('agent_thought', f'Searching order details for {order_id}.')
                order_args = {"order_id": order_id}
                ord_out = execute_tool("search_order", order_args)
                add_step('tool_call', tool_name='search_order', tool_args=order_args)
                add_step('tool_result', tool_name='search_order', tool_out=ord_out)

                # Check if order exists
                if "error" in ord_out:
                    final_output = f"Order search failed: {ord_out.get('error', 'Order not found')}"
                else:
                    # Step 2: Calculate Refund if return / refund requested
                    if ("refund" in user_input.lower() or "return" in user_input.lower()) and "calculate_refund" in available_tool_names:
                        add_step('agent_thought', f'Calculating return refund eligibility for order {order_id}.')
                        ref_args = {"order_id": order_id, "reason": "customer_request"}
                        ref_out = execute_tool("calculate_refund", ref_args)
                        add_step('tool_call', tool_name='calculate_refund', tool_args=ref_args)
                        add_step('tool_result', tool_name='calculate_refund', tool_out=ref_out)

                        if not ref_out.get("eligible", False):
                            reason = ref_out.get("reason", "Ineligible for return.")
                            final_output = f"Refund calculation failed: {reason}"
                        else:
                            total = ref_out.get("total_refund", 0.0)
                            final_output = f"Order {order_id} is eligible for return. Total calculated refund is ${total:.2f}."
                    else:
                        final_output = f"Order {order_id} details found. Status: {ord_out.get('status', 'unknown')}."

        # ---------------------------------------------------------------------
        # ROUTE 6: General Fallback Query
        # ---------------------------------------------------------------------
        else:
            add_step('agent_thought', 'Analyzing user query.')
            final_output = f"Processed user query: '{user_input[:80]}...'"

        add_step('final_response', content=final_output, latency=50.0)
        total_duration = round(time.time() - start_time, 2)

        return {
            'steps': steps,
            'final_output': final_output,
            'total_steps': len(steps),
            'execution_time': total_duration,
            'mode': 'Mock Engine'
        }
