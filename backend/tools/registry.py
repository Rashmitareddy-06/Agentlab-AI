import json
from tools.mock_tools import TOOL_HANDLERS

DEFAULT_TOOLS = [
    {
        "name": "get_customer",
        "description": "Retrieve customer account profile, email, VIP status, and identity verification status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Customer ID e.g. CUST-101"},
                "email": {"type": "string", "description": "Customer email address"}
            }
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "email": {"type": "string"},
                "status": {"type": "string"},
                "identity_verified": {"type": "boolean"}
            }
        },
        "handler_name": "get_customer"
    },
    {
        "name": "search_order",
        "description": "Search for order details, purchased item SKUs, total cost, delivery date, and return eligibility.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "Order reference ID e.g. ORD-8821"},
                "customer_id": {"type": "string", "description": "Customer ID to list all orders"}
            }
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string"},
                "status": {"type": "string"},
                "items": {"type": "array"},
                "total": {"type": "number"},
                "return_eligible": {"type": "boolean"}
            }
        },
        "handler_name": "search_order"
    },
    {
        "name": "check_inventory",
        "description": "Check current warehouse inventory stock levels for an item SKU.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sku": {"type": "string", "description": "Item product SKU code e.g. ITEM-NEURAL-LINK"}
            },
            "required": ["sku"]
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "sku": {"type": "string"},
                "in_stock": {"type": "integer"},
                "warehouse": {"type": "string"}
            }
        },
        "handler_name": "check_inventory"
    },
    {
        "name": "calculate_refund",
        "description": "Calculate eligible refund amount including taxes and deduction fees for an order.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "Order ID to refund"},
                "reason": {"type": "string", "description": "Reason for refund e.g. defective, wrong_item, changed_mind"}
            },
            "required": ["order_id"]
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string"},
                "eligible": {"type": "boolean"},
                "total_refund": {"type": "number"}
            }
        },
        "handler_name": "calculate_refund"
    },
    {
        "name": "send_notification",
        "description": "Send email or SMS confirmation message to a customer. Requires identity verification beforehand.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Target customer ID"},
                "channel": {"type": "string", "enum": ["email", "sms"]},
                "message": {"type": "string", "description": "Body message text to send"}
            },
            "required": ["customer_id", "message"]
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "status": {"type": "string"},
                "recipient": {"type": "string"}
            }
        },
        "handler_name": "send_notification"
    },
    {
        "name": "get_account_status",
        "description": "Check account restrictions, VIP standing, and authorization status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Customer ID to inspect"}
            },
            "required": ["customer_id"]
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "account_status": {"type": "string"},
                "identity_verified": {"type": "boolean"}
            }
        },
        "handler_name": "get_account_status"
    }
]

def execute_tool(handler_name, kwargs):
    """Dynamically execute a tool by handler name with passed arguments."""
    handler = TOOL_HANDLERS.get(handler_name)
    if not handler:
        return {"error": f"Tool handler '{handler_name}' not registered"}
    try:
        return handler(**kwargs)
    except Exception as e:
        return {"error": f"Tool execution failed: {str(e)}"}
