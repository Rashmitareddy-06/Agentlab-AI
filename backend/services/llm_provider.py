import time
import json
import os
from config import Config
from tools.registry import execute_tool

class LLMProvider:
    """
    OpenAI-Compatible LLM Provider Abstraction for Agent Execution.
    Executes real multi-step tool-calling agent loops using OpenAI-compatible API endpoints.
    Captures complete step telemetry (User prompt, Agent thoughts, Tool calls, Tool outputs, Latency, Errors).
    """

    @staticmethod
    def get_api_key():
        """Dynamically fetch OPENAI_API_KEY from environment."""
        key = os.environ.get('OPENAI_API_KEY', '').strip()
        if not key:
            # Fallback check Config
            key = (Config.OPENAI_API_KEY or '').strip()
        return key

    @staticmethod
    def is_live_mode():
        """Check if Live LLM mode is active."""
        key = LLMProvider.get_api_key()
        return bool(key)

    @staticmethod
    def get_base_url():
        """Optional custom OpenAI-compatible base URL e.g. for LiteLLM, Groq, Ollama, LM Studio."""
        return os.environ.get('OPENAI_BASE_URL') or os.environ.get('OPENAI_API_BASE') or None

    def execute_agent_loop(self, agent, test_case, tools_by_name):
        """
        Executes a real LLM function-calling loop against a test case.
        """
        from openai import OpenAI

        api_key = self.get_api_key()
        base_url = self.get_base_url()

        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url

        client = OpenAI(**client_kwargs)

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

        # Build tool definitions for OpenAI API
        openai_tools = []
        for t in tools_by_name.values():
            schema = t.input_schema
            if isinstance(schema, str):
                try:
                    schema = json.loads(schema)
                except Exception:
                    schema = {"type": "object", "properties": {}}

            openai_tools.append({
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": schema
                }
            })

        messages = [
            {"role": "system", "content": agent.system_instructions or "You are a helpful customer support agent."},
            {"role": "user", "content": test_case.user_input}
        ]

        max_steps = agent.max_steps or 5
        current_step = 0
        final_output = ""

        while current_step < max_steps:
            current_step += 1
            step_start = time.time()

            try:
                kwargs = {
                    "model": agent.model or "gpt-4o-mini",
                    "messages": messages,
                    "temperature": agent.temperature if agent.temperature is not None else 0.2
                }
                if openai_tools:
                    kwargs["tools"] = openai_tools

                response = client.chat.completions.create(**kwargs)
            except Exception as e:
                err_msg = f"LLM API Call Error: {str(e)}"
                steps.append({
                    'step_number': step_counter,
                    'step_type': 'error',
                    'content': err_msg,
                    'latency_ms': round((time.time() - step_start) * 1000, 1)
                })
                final_output = err_msg
                break

            choice = response.choices[0].message
            latency = round((time.time() - step_start) * 1000, 1)

            # Record thought if content text is provided
            if choice.content:
                steps.append({
                    'step_number': step_counter,
                    'step_type': 'agent_thought',
                    'content': choice.content,
                    'latency_ms': latency
                })
                step_counter += 1

            # Check if LLM requested tool calls
            if choice.tool_calls:
                # Format assistant message for continuation
                assistant_msg = {
                    "role": "assistant",
                    "content": choice.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        } for tc in choice.tool_calls
                    ]
                }
                messages.append(assistant_msg)

                for tc in choice.tool_calls:
                    fn_name = tc.function.name
                    raw_args = tc.function.arguments

                    try:
                        parsed_args = json.loads(raw_args)
                    except Exception:
                        parsed_args = {}

                    # Record Tool Call Step
                    steps.append({
                        'step_number': step_counter,
                        'step_type': 'tool_call',
                        'tool_name': fn_name,
                        'tool_arguments': json.dumps(parsed_args),
                        'latency_ms': 10.0
                    })
                    step_counter += 1

                    # Execute local backend tool handler
                    tool_start = time.time()
                    tool_obj = tools_by_name.get(fn_name)
                    handler_name = tool_obj.handler_name if tool_obj else fn_name
                    tool_res = execute_tool(handler_name, parsed_args)
                    tool_latency = round((time.time() - tool_start) * 1000, 1)

                    # Record Tool Result Step
                    steps.append({
                        'step_number': step_counter,
                        'step_type': 'tool_result',
                        'tool_name': fn_name,
                        'tool_output': json.dumps(tool_res),
                        'latency_ms': tool_latency
                    })
                    step_counter += 1

                    # Append tool result to LLM context
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(tool_res)
                    })
            else:
                # Final response reached
                final_output = choice.content or ""
                steps.append({
                    'step_number': step_counter,
                    'step_type': 'final_response',
                    'content': final_output,
                    'latency_ms': latency
                })
                break

        total_duration = round(time.time() - start_time, 2)
        return {
            'steps': steps,
            'final_output': final_output,
            'total_steps': len(steps),
            'execution_time': total_duration,
            'mode': 'LIVE (OpenAI)'
        }
