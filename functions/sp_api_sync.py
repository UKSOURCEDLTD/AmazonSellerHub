import os
import time
import requests
import json
import gzip
import io
import random
from datetime import datetime, timedelta
from firebase_admin import firestore

# Amazon SP-API Constants
LWA_ENDPOINT = "https://api.amazon.com/auth/o2/token"
SP_API_ENDPOINT = "https://sellingpartnerapi-na.amazon.com"

def sync_amazon_data():
    """
    Core logic to fetch data from Amazon SP-API.
    Saves to Firestore, iterating through all configured seller accounts.
    """
    print("Starting SP-API Sync Process (Real Data Mode)...")
    db = firestore.client()
    accounts_ref = db.collection('seller_accounts')
    accounts = list(accounts_ref.stream())

    if not accounts:
        print("No seller accounts found. Please add an account in Settings.")
        return

    print(f"Found {len(accounts)} seller accounts in Firestore.")

    # 0. Process Hidden Default Account from Env Vars
    env_client_id = os.environ.get("LWA_CLIENT_ID")
    env_client_secret = os.environ.get("LWA_CLIENT_SECRET")
    env_refresh_token = os.environ.get("SP_API_REFRESH_TOKEN")

    if all([env_client_id, env_client_secret, env_refresh_token]):
        print(f"--- Processing Hidden Default Account (from .env) ---")
        try:
            # Authenticate
            access_token = get_lwa_access_token(env_client_id, env_client_secret, env_refresh_token)
            print(f"Successfully authenticated for Hidden Default Account.")
            
            # Sync for default marketplaces (Assuming US/UK for this hidden one based on previous context)
            # Or just US. Let's do US and UK to be safe as per original mock defaults.
            default_marketplaces = ['US', 'UK']
            
            marketplace_id_map = {
                'US': 'ATVPDKIKX0DER',
                'UK': 'A1F83G8C2ARO7P'
            }

            for mp in default_marketplaces:
                print(f"  >> Syncing Marketplace: {mp}")
                mp_id = marketplace_id_map.get(mp)
                
                # We need a stable ID for the hidden account so it updates the same docs
                hidden_account_id = "default_hidden_account"
                
                try:
                    sync_inventory_from_api(access_token, hidden_account_id, mp_id, mp)
                except Exception as e:
                    print(f"    Inventory Sync Failed: {e}")

                try:
                    sync_orders_from_api(access_token, hidden_account_id, mp_id, mp)
                except Exception as e:
                    print(f"    Orders Sync Failed: {e}")

        except Exception as e:
             print(f"Hidden Default Account Sync Failed: {e}")

    for acc_snap in accounts:
        account = acc_snap.to_dict()
        account_id = acc_snap.id
        account_name = account.get('name', 'Unknown')
        marketplaces = account.get('marketplaces', ['US']) 
        
        print(f"--- Processing Account: {account_name} ({account_id}) ---")

        # 1. Retrieve Secrets from the Firestore Document
        client_id = account.get("client_id")
        client_secret = account.get("client_secret")
        refresh_token = account.get("refresh_token")
        
        access_token = None
        if all([client_id, client_secret, refresh_token]):
            # 2. Authenticate
            try:
                access_token = get_lwa_access_token(client_id, client_secret, refresh_token)
                print(f"Successfully authenticated for {account_name}.")
            except Exception as e:
                print(f"Authentication Failed for {account_name}: {e}")
                print("Skipping this account.")
                continue
        else:
            print(f"Missing credentials for {account_name}. Skipping. Please update in Settings.")
            continue

        for marketplace in marketplaces:
            print(f"  >> Syncing Marketplace: {marketplace}")
            
            # Map marketplace string to ID (Simplified for NA/EU common ones)
            # US: ATVPDKIKX0DER, UK: A1F83G8C2ARO7P
            # For this MVP, we might assume US endpoint or handle mapping.
            # Using basic map for demo:
            marketplace_id_map = {
                'US': 'ATVPDKIKX0DER',
                'UK': 'A1F83G8C2ARO7P',
                'CA': 'A2EUQ1WTGCTBG2',
                'DE': 'A1PA6795UKMFR9'
            }
            mp_id = marketplace_id_map.get(marketplace, 'ATVPDKIKX0DER')

            # 3. Sync Inventory
            try:
                sync_inventory_from_api(access_token, account_id, mp_id, marketplace)
            except Exception as e:
                print(f"    Inventory Sync Failed: {e}")

            # 4. Sync Orders
            try:
                sync_orders_from_api(access_token, account_id, mp_id, marketplace)
            except Exception as e:
                print(f"    Orders Sync Failed: {e}")

def sync_inventory_from_api(access_token, account_id, marketplace_id, marketplace_code):
    print(f"    Fetching Inventory via API ({marketplace_code})...")
    
    # Endpoint: FBA Inventory Summaries (v1)
    # https://developer-docs.amazon.com/sp-api/docs/fba-inventory-api-v1-reference#getinventorysummaries
    
    url = f"{SP_API_ENDPOINT}/fba/inventory/v1/summaries"
    headers = {"x-amz-access-token": access_token}
    params = {
        "details": "true",
        "granularityType": "Marketplace",
        "granularityId": marketplace_id,
        "marketplaceIds": marketplace_id
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        raise Exception(f"API Error {response.status_code}: {response.text}")
        
    data = response.json()
    inventory_summaries = data.get('payload', {}).get('inventorySummaries', [])
    
    products = []
    for item in inventory_summaries:
        sku = item.get('sellerSku')
        asin = item.get('asin')
        title = item.get('productName', 'Unknown Product')
        
        # Calculate sellable quantity
        inv_details = item.get('inventoryDetails', {})
        fulfillable = inv_details.get('fulfillableQuantity', 0)
        
        products.append({
            "id": f"{account_id}_{marketplace_code}_{sku}",
            "sku": sku,
            "asin": asin,
            "title": title,
            "stock_level": fulfillable,
            "currency": "USD", # Defaulting, simplified
            "status": "Healthy" if fulfillable > 0 else "OutOfStock",
            "accountId": account_id,
            "marketplaceId": marketplace_code,
            "updated_at": firestore.SERVER_TIMESTAMP
        })

    # Save to Firestore
    if products:
        db = firestore.client()
        batch = db.batch()
        collection_ref = db.collection('inventory')
        
        count = 0
        for p in products:
            doc_ref = collection_ref.document(p['id'])
            # IMPORTANT: merge=True to preserve COGS
            batch.set(doc_ref, p, merge=True)
            count += 1
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()
        
        if count % 400 != 0:
            batch.commit()
            
        print(f"    ✅ SYNCED: {len(products)} inventory items from API")
    else:
        print("    No inventory found in API response.")

def sync_orders_from_api(access_token, account_id, marketplace_id, marketplace_code):
    print(f"    Fetching Orders via API ({marketplace_code})...")
    
    # Endpoint: Orders v0
    url = f"{SP_API_ENDPOINT}/orders/v0/orders"
    headers = {"x-amz-access-token": access_token}
    
    created_after = (datetime.utcnow() - timedelta(days=30)).isoformat()
    
    params = {
        "MarketplaceIds": marketplace_id,
        "CreatedAfter": created_after,
        "OrderStatuses": "Shipped,Unshipped,PartiallyShipped,Pending" 
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        raise Exception(f"API Error {response.status_code}: {response.text}")
        
    orders_data = response.json().get('payload', {}).get('Orders', [])
    
    orders_to_save = []
    
    for order in orders_data:
        amazon_order_id = order.get('AmazonOrderId')
        status = order.get('OrderStatus')
        total_info = order.get('OrderTotal', {})
        total_amount = float(total_info.get('Amount', 0.0)) if total_info else 0.0
        currency = total_info.get('CurrencyCode', 'USD')
        
        # Simplified fees estimation (15%) since API doesn't give fees in Orders endpoint (need Finances API)
        estimated_fees = total_amount * 0.15 
        
        # Fetch Order Items (for SKUs)
        # Note: In a loop this is slow (N+1), but OK for MVP sync
        # items = fetch_order_items(access_token, amazon_order_id) 
        # Skipping item fetch for deep detail to save API quota/time in this turn, 
        # but we need SKUs for COGS. Let's do a quick fetch or mock the item structure if needed.
        # For real COGS we NEED the SKU.
        
        try:
            items = fetch_order_items(access_token, amazon_order_id)
        except:
            items = []

        orders_to_save.append({
            "id": amazon_order_id,
            "amazon_order_id": amazon_order_id,
            "accountId": account_id,
            "marketplaceId": marketplace_code,
            "purchase_date": order.get('PurchaseDate'),
            "order_status": status,
            "order_total": total_amount,
            "currency": currency,
            "items": items,
            "estimated_fees": estimated_fees,
            "estimated_proceeds": total_amount - estimated_fees,
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        
        # Rate limit protection (simplified)
        time.sleep(0.5)

    # Save to Firestore
    if orders_to_save:
        db = firestore.client()
        batch = db.batch()
        collection_ref = db.collection('orders')
        
        count = 0
        for o in orders_to_save:
            doc_ref = collection_ref.document(o['id'])
            batch.set(doc_ref, o)
            count += 1
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()
                
        if count % 400 != 0:
            batch.commit()
            
        print(f"    ✅ SYNCED: {len(orders_to_save)} orders from API")

def fetch_order_items(access_token, amazon_order_id):
    url = f"{SP_API_ENDPOINT}/orders/v0/orders/{amazon_order_id}/orderItems"
    headers = {"x-amz-access-token": access_token}
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        items_data = response.json().get('payload', {}).get('OrderItems', [])
        clean_items = []
        for item in items_data:
            clean_items.append({
                "sku": item.get('SellerSKU'),
                "title": item.get('Title'),
                "quantity": item.get('QuantityOrdered', 0),
                "item_price": float(item.get('ItemPrice', {}).get('Amount', 0)) if item.get('ItemPrice') else 0
            })
        return clean_items
    return []

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
