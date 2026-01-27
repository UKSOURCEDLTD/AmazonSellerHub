import os
import requests
from dotenv import load_dotenv
import json

load_dotenv(".env.local")

LWA_ENDPOINT = "https://api.amazon.com/auth/o2/token"
SP_API_ENDPOINT = "https://sellingpartnerapi-na.amazon.com"

def get_lwa_access_token(client_id, client_secret, refresh_token):
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret
    }
    response = requests.post(LWA_ENDPOINT, data=payload)
    response.raise_for_status()
    return response.json()["access_token"]

def debug_order(order_id):
    client_id = os.environ.get("LWA_CLIENT_ID")
    client_secret = os.environ.get("LWA_CLIENT_SECRET")
    refresh_token = os.environ.get("SP_API_REFRESH_TOKEN")

    print(f"--- Debugging Order: {order_id} ---")
    access_token = get_lwa_access_token(client_id, client_secret, refresh_token)

    # 1. Fetch Order Details
    print(f"1. Fetching Order Info...")
    url_order = f"{SP_API_ENDPOINT}/orders/v0/orders/{order_id}"
    headers = {"x-amz-access-token": access_token}
    res_order = requests.get(url_order, headers=headers)
    print(f"Order Status: {res_order.status_code}")
    print(json.dumps(res_order.json(), indent=2))

    # 2. Fetch Order Items
    print(f"\n2. Fetching Order Items...")
    url_items = f"{SP_API_ENDPOINT}/orders/v0/orders/{order_id}/orderItems"
    res_items = requests.get(url_items, headers=headers)
    print(f"Items Status: {res_items.status_code}")
    print(json.dumps(res_items.json(), indent=2))

if __name__ == "__main__":
    # Problematic Shipped Order with "No items"
    debug_order("114-9990146-3271416")
    
    # Pending Order with $0.00
    # details from screenshot: 113-9186886-7398626
    debug_order("113-9186886-7398626")
