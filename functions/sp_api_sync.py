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
RP_REPORTS_PATH = "/reports/2021-06-30/reports"

def sync_amazon_data():
    """
    Core logic to fetch data from Amazon SP-API.
    Saves to Firestore.
    """
    print("Starting SP-API Sync Process (Firestore Mode)...")
    
    # 1. Retrieve Secrets
    client_id = os.environ.get("LWA_CLIENT_ID")
    client_secret = os.environ.get("LWA_CLIENT_SECRET")
    refresh_token = os.environ.get("SP_API_REFRESH_TOKEN")
    
    access_token = None
    if all([client_id, client_secret, refresh_token]):
        # 2. Authenticate
        try:
            access_token = get_lwa_access_token(client_id, client_secret, refresh_token)
            print("Successfully authenticated with Amazon LWA.")
        except Exception as e:
            print(f"Authentication Failed: {e}")
            # Continue to syncing with Mock Data if auth fails
    else:
        print("Warning: Missing SP-API Secrets. Proceeding with Mock Data Generation.")

    # 3. Sync Inventory
    try:
        sync_inventory_to_firestore(access_token)
    except Exception as e:
        print(f"Inventory Sync Failed: {e}")

    # 4. Sync Orders
    try:
        sync_orders_to_firestore(access_token)
    except Exception as e:
        print(f"Orders Sync Failed: {e}")

def sync_inventory_to_firestore(access_token):
    print("Syncing Inventory to Firestore...")
    products = []
    
    if access_token:
        try:
            # Try to find a recent report first
            report_list = fetch_report_list(access_token, report_type="GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA")
            
            if report_list:
                # Process the latest report
                latest_report = report_list[0]
                print(f"Processing Inventory Report: {latest_report['reportId']}")
                
                doc_url = get_report_document_url(access_token, latest_report['reportDocumentId'])
                raw_csv = download_and_parse_report(doc_url)
                
                lines = raw_csv.split('\n')
                for line in lines[1:]:
                    if not line.strip(): continue
                    row = line.split('\t')
                    if len(row) < 4: continue
                    
                    sku = row[0]
                    asin = row[2]
                    title = row[3]
                    price = row[5] if len(row) > 5 else "0.00"
                    stock = row[10] if len(row) > 10 else "0"
                    
                    products.append({
                        "id": sku,
                        "sku": sku,
                        "asin": asin,
                        "title": title,
                        "stock_level": int(stock) if stock.isdigit() else 0,
                        "price": float(price) if price.replace('.','',1).isdigit() else 0.0,
                        "status": "Healthy" if (stock.isdigit() and int(stock) > 0) else "OutOfStock",
                        "updated_at": firestore.SERVER_TIMESTAMP
                    })
        except Exception as e:
            print(f"Failed to fetch live inventory: {e} - Falling back to mock")

    # Fallback to Mock Data if empty
    if not products:
        print("Using Mock Inventory Data...")
        products = [
            {"id": "SKU-001", "sku": "SKU-001", "asin": "B012345678", "title": "Wireless Mouse (Mock)", "stock_level": 45, "price": 19.99, "status": "Healthy", "updated_at": firestore.SERVER_TIMESTAMP},
            {"id": "SKU-002", "sku": "SKU-002", "asin": "B087654321", "title": "Gaming Keyboard (Mock)", "stock_level": 12, "price": 59.99, "status": "Healthy", "updated_at": firestore.SERVER_TIMESTAMP},
            {"id": "SKU-003", "sku": "SKU-003", "asin": "B099887766", "title": "USB-C Hub (Mock)", "stock_level": 0, "price": 29.99, "status": "OutOfStock", "updated_at": firestore.SERVER_TIMESTAMP},
        ]

    # Save to Firestore
    db = firestore.client()
    batch = db.batch()
    
    # Optional: Delete old documents or just overwrite. 
    # For now, we overwrite based on ID (SKU).
    collection_ref = db.collection('inventory')
    
    count = 0
    for p in products:
        doc_ref = collection_ref.document(p['id'])
        batch.set(doc_ref, p)
        count += 1
        if count % 400 == 0: # Batch limit is 500
            batch.commit()
            batch = db.batch()
            
    if count % 400 != 0:
        batch.commit()
        
    print(f"✅ SYNCED: {len(products)} products to Firestore collection 'inventory'")

def sync_orders_to_firestore(access_token):
    print("Syncing Orders to Firestore...")
    orders = []

    if access_token:
        try:
             # Try to fetch orders report
            report_list = fetch_report_list(access_token, report_type="GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL")
            
            if report_list:
                latest_report = report_list[0]
                print(f"Processing Orders Report: {latest_report['reportId']}")
                
                doc_url = get_report_document_url(access_token, latest_report['reportDocumentId'])
                raw_csv = download_and_parse_report(doc_url)
                
                lines = raw_csv.split('\n')
                headers = lines[0].split('\t')
                
                # Helper to find index by header name
                def get_idx(name):
                    try: return headers.index(name)
                    except: return -1

                idx_order_id = get_idx('amazon-order-id')
                idx_date = get_idx('purchase-date')
                idx_status = get_idx('order-status')
                idx_price = get_idx('item-price')
                idx_sku = get_idx('sku')
                idx_title = get_idx('product-name')
                idx_quantity = get_idx('quantity')
                idx_currency = get_idx('currency')

                order_map = {}

                for line in lines[1:]:
                    if not line.strip(): continue
                    row = line.split('\t')
                    if len(row) < 5: continue
                    
                    order_id = row[idx_order_id] if idx_order_id >= 0 else f"Unknown-{random.randint(1000,9999)}"
                    
                    if order_id not in order_map:
                        order_map[order_id] = {
                            "amazon_order_id": order_id,
                            "purchase_date": row[idx_date] if idx_date >= 0 else datetime.utcnow().isoformat(),
                            "order_status": row[idx_status] if idx_status >= 0 else "Shipped",
                            "order_total": 0.0,
                            "currency": row[idx_currency] if idx_currency >= 0 else "USD",
                            "items": [],
                            "estimated_fees": 0.0,
                            "estimated_proceeds": 0.0,
                            "updated_at": firestore.SERVER_TIMESTAMP
                        }
                    
                    item_price = float(row[idx_price]) if idx_price >= 0 and row[idx_price] else 0.0
                    order_map[order_id]["order_total"] += item_price
                    
                    # Estimate fees (~15% + $3.00 flat) - VERY ROUGH ESTIMATE
                    fees = (item_price * 0.15) + 3.00 if item_price > 0 else 0
                    order_map[order_id]["estimated_fees"] += fees
                    
                    order_map[order_id]["items"].append({
                        "sku": row[idx_sku] if idx_sku >= 0 else "",
                        "title": row[idx_title] if idx_title >= 0 else "",
                        "quantity": row[idx_quantity] if idx_quantity >= 0 else 1,
                        "item_price": item_price
                    })

                # Calculate proceeds
                for o in order_map.values():
                    o["estimated_proceeds"] = o["order_total"] - o["estimated_fees"]
                    o["order_total"] = round(o["order_total"], 2)
                    o["estimated_fees"] = round(o["estimated_fees"], 2)
                    o["estimated_proceeds"] = round(o["estimated_proceeds"], 2)
                    orders.append(o)
                    
        except Exception as e:
            print(f"Failed to fetch live orders: {e} - Falling back to mock")

    # Fallback to Mock Data
    if not orders:
        print("Using Mock Orders Data...")
        for i in range(15):
            total = random.uniform(20.0, 150.0)
            fees = (total * 0.15) + random.uniform(2.0, 5.0)
            proceeds = total - fees
            
            orders.append({
                "amazon_order_id": f"114-{random.randint(1000000,9999999)}-{random.randint(1000000,9999999)}",
                "purchase_date": (datetime.utcnow() - timedelta(days=random.randint(0, 10))).isoformat(),
                "order_status": random.choice(["Shipped", "Shipped", "Pending", "Canceled"]),
                "order_total": round(total, 2),
                "currency": "USD",
                "items": [
                    {
                        "sku": f"SKU-MOCK-{random.randint(1,5)}",
                        "title": f"Mock Product {random.randint(1,5)} - Superior Quality",
                        "quantity": 1,
                        "item_price": round(total, 2)
                    }
                ],
                "estimated_fees": round(fees, 2),
                "estimated_proceeds": round(proceeds, 2),
                "updated_at": firestore.SERVER_TIMESTAMP
            })
    
    # Save to Firestore
    db = firestore.client()
    batch = db.batch()
    collection_ref = db.collection('orders')
    
    count = 0
    for o in orders:
        doc_ref = collection_ref.document(o['amazon_order_id'])
        batch.set(doc_ref, o)
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
            
    if count % 400 != 0:
        batch.commit()
        
    print(f"✅ SYNCED: {len(orders)} orders to Firestore collection 'orders'")


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

def fetch_report_list(access_token, report_type):
    headers = {"x-amz-access-token": access_token}
    
    # ISO Format timestamps
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30) 
    
    params = {
        "reportTypes": report_type,
        "createdSince": start_date.isoformat(),
        "createdUntil": end_date.isoformat(),
        "pageSize": 10
    }
    
    response = requests.get(f"{SP_API_ENDPOINT}{RP_REPORTS_PATH}", headers=headers, params=params)
    response.raise_for_status()
    return response.json().get('reports', [])

def get_report_document_url(access_token, report_document_id):
    headers = {"x-amz-access-token": access_token}
    path = f"/reports/2021-06-30/documents/{report_document_id}"
    
    response = requests.get(f"{SP_API_ENDPOINT}{path}", headers=headers)
    response.raise_for_status()
    return response.json()['url']

def download_and_parse_report(url):
    response = requests.get(url)
    response.raise_for_status()
    
    content = response.content
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(content)) as f:
            text_data = f.read().decode('utf-8')
    except:
        text_data = response.text
        
    return text_data
