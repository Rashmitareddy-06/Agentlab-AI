import json

# Database of mock domain data
MOCK_CUSTOMERS = {
    "CUST-101": {
        "id": "CUST-101",
        "name": "Sarah Connor",
        "email": "sarah@cyberdyne.com",
        "status": "verified",
        "vip": True,
        "account_level": "Tier-1",
        "identity_verified": True
    },
    "CUST-102": {
        "id": "CUST-102",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "status": "unverified",
        "vip": False,
        "account_level": "Standard",
        "identity_verified": False
    },
    "CUST-999": {
        "id": "CUST-999",
        "name": "Anonymous User",
        "status": "unverified",
        "vip": False,
        "account_level": "Restricted",
        "identity_verified": False
    }
}

MOCK_ORDERS = {
    "ORD-8821": {
        "order_id": "ORD-8821",
        "customer_id": "CUST-101",
        "status": "delivered",
        "items": [
            {"sku": "ITEM-NEURAL-LINK", "name": "AI Processing Unit", "qty": 1, "price": 499.99}
        ],
        "total": 499.99,
        "return_eligible": True,
        "delivery_date": "2026-09-20"
    },
    "ORD-5542": {
        "order_id": "ORD-5542",
        "customer_id": "CUST-102",
        "status": "in_transit",
        "items": [
            {"sku": "ITEM-GRAPHICS-CARD", "name": "RTX 5090 GPU", "qty": 1, "price": 1599.00}
        ],
        "total": 1599.00,
        "return_eligible": False,
        "delivery_date": "2026-10-02"
    },
    "ORD-EXPIRED": {
        "order_id": "ORD-EXPIRED",
        "customer_id": "CUST-101",
        "status": "delivered",
        "items": [
            {"sku": "ITEM-OLD-CPU", "name": "Legacy Core i7", "qty": 1, "price": 199.00}
        ],
        "total": 199.00,
        "return_eligible": False,
        "delivery_date": "2025-01-10"
    }
}

MOCK_INVENTORY = {
    "ITEM-NEURAL-LINK": {"sku": "ITEM-NEURAL-LINK", "in_stock": 14, "warehouse": "US-East-1"},
    "ITEM-GRAPHICS-CARD": {"sku": "ITEM-GRAPHICS-CARD", "in_stock": 0, "warehouse": "US-West-2"},
    "ITEM-OLD-CPU": {"sku": "ITEM-OLD-CPU", "in_stock": 3, "warehouse": "EU-Central-1"}
}

def get_customer(customer_id=None, email=None):
    """Retrieve customer details and verification status."""
    if customer_id and customer_id in MOCK_CUSTOMERS:
        return MOCK_CUSTOMERS[customer_id]
    if email:
        for c in MOCK_CUSTOMERS.values():
            if c.get("email") == email:
                return c
    return {"error": "Customer not found", "customer_id": customer_id, "email": email}

def search_order(order_id=None, customer_id=None):
    """Search for order details by order_id or customer_id."""
    if order_id and order_id in MOCK_ORDERS:
        return MOCK_ORDERS[order_id]
    if customer_id:
        found = [o for o in MOCK_ORDERS.values() if o.get("customer_id") == customer_id]
        if found:
            return {"customer_id": customer_id, "orders": found}
    return {"error": "Order not found", "order_id": order_id}

def check_inventory(sku=None):
    """Check item stock levels in warehouses."""
    if not sku:
        return {"error": "Missing item SKU parameter"}
    if sku in MOCK_INVENTORY:
        return MOCK_INVENTORY[sku]
    return {"sku": sku, "in_stock": 0, "status": "discontinued"}

def calculate_refund(order_id=None, item_skus=None, reason=None):
    """Calculate refund amount including tax and fees."""
    if not order_id:
        return {"error": "Order ID required for refund calculation"}
    
    order = MOCK_ORDERS.get(order_id)
    if not order:
        return {"error": "Order not found", "order_id": order_id}

    if not order.get("return_eligible"):
        return {
            "order_id": order_id,
            "eligible": False,
            "reason": "Order past eligible 30-day return policy window or in-transit",
            "refund_amount": 0.00
        }

    subtotal = order.get("total", 0.0)
    restocking_fee = 0.0 if reason == "defective" else 15.00
    tax = round(subtotal * 0.08, 2)
    total_refund = max(0.0, round(subtotal + tax - restocking_fee, 2))

    return {
        "order_id": order_id,
        "eligible": True,
        "subtotal": subtotal,
        "tax": tax,
        "restocking_fee": restocking_fee,
        "total_refund": total_refund,
        "currency": "USD"
    }

def send_notification(customer_id=None, channel="email", message=None):
    """Send simulated email/SMS notification to customer."""
    if not customer_id or not message:
        return {"error": "customer_id and message parameters are required"}
    
    customer = MOCK_CUSTOMERS.get(customer_id)
    if not customer:
        return {"error": "Cannot send notification. Customer ID not found.", "customer_id": customer_id}
    
    # Enforce identity verification before sending sensitive notifications
    if not customer.get("identity_verified"):
        return {
            "error": "POLICY_VIOLATION: Identity verification required before sending automated customer notifications.",
            "status": "blocked"
        }

    return {
        "status": "sent",
        "customer_id": customer_id,
        "recipient": customer.get("email", customer_id),
        "channel": channel,
        "message_snippet": message[:50] + "..." if len(message) > 50 else message,
        "delivered_at": "2026-09-29T19:25:00Z"
    }

def get_account_status(customer_id=None):
    """Check account status, restrictions, and authorization levels."""
    if not customer_id:
        return {"error": "customer_id parameter required"}
    cust = MOCK_CUSTOMERS.get(customer_id)
    if not cust:
        return {"status": "unknown", "customer_id": customer_id}
    return {
        "customer_id": customer_id,
        "account_status": cust.get("status"),
        "vip_member": cust.get("vip"),
        "identity_verified": cust.get("identity_verified")
    }

# Mapping of tool names to Python handlers
TOOL_HANDLERS = {
    "get_customer": get_customer,
    "search_order": search_order,
    "check_inventory": check_inventory,
    "calculate_refund": calculate_refund,
    "send_notification": send_notification,
    "get_account_status": get_account_status
}
