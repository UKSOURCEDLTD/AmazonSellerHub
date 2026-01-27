import os
import time
import requests
import json
import gzip
import io
import random
import hmac
import hashlib
import urllib.parse
from datetime import datetime, timedelta

# Amazon SP-API Constants
LWA_ENDPOINT = "https://api.amazon.com/auth/o2/token"
SP_API_ENDPOINT = "https://sellingpartnerapi-na.amazon.com"

import firebase_admin
from firebase_admin import firestore

# Firestore Client
db = firestore.client()

def save_json(filename, data):
    """
    Saves data to Firestore.
    filename: Use 'inventory.json' -> collection 'inventory'
    """
    collection_name = filename.replace('.json', '')
    print(f"    Syncing {len(data)} records to Firestore collection '{collection_name}'...")
    
    batch = db.batch()
    batch_count = 0
    total_count = 0
    
    for item in data:
        # Use 'id' as document ID if available, otherwise auto-id
        doc_id = str(item.get('id')) if item.get('id') else None
        
        if doc_id:
            doc_ref = db.collection(collection_name).document(doc_id)
            batch.set(doc_ref, item, merge=True) # Merge allows updating fields without wiping
        else:
            doc_ref = db.collection(collection_name).document()
            batch.set(doc_ref, item, merge=True)
            
        batch_count += 1
        
        # Firestore batch limit is 500
        if batch_count >= 400:
            batch.commit()
            total_count += batch_count
            batch_count = 0
            batch = db.batch()
            # print(f"      Committed batch of 400...")

    if batch_count > 0:
        batch.commit()
        total_count += batch_count
    
    print(f"    Successfully synced {total_count} documents to {collection_name}.")

def load_json(filename):
    """
    Loads data from Firestore.
    WARNING: Loading ALL docs is expensive. Use with caution.
    For sync logic, we often need full current state to compare.
    """
    collection_name = filename.replace('.json', '')
    docs = db.collection(collection_name).stream()
    data = []
    for doc in docs:
        item = doc.to_dict()
        # Ensure ID is present
        if 'id' not in item:
            item['id'] = doc.id
        data.append(item)
    return data

# AWS Signature V4 Implementation
def sign_request(method, url, access_token, data=None, params=None):
    region = os.environ.get("SP_API_REGION", "us-east-1")
    service = "execute-api"
    host = "sellingpartnerapi-na.amazon.com"
    
    aws_access_key = os.environ.get("LWA_AWS_ACCESS_KEY")
    aws_secret_key = os.environ.get("LWA_AWS_SECRET_KEY")
    
    # In Cloud Functions with secrets, these might be available or passed differently.
    # Note: AWS Signature V4 requires AWS KEYS. 
    # Usually SP-API LWA exchange gives us an ACCESS TOKEN.
    # The SIGNING of the request (AWS4) requires an AWS Access/Secret Key related to the IAM User/Role.
    # *** CRITICAL FIX ***
    # If using mcp-server logic, the IAM User keys are static credentials.
    # These should ALSO be in Secret Manager if not already.
    # Assuming they are present as env vars for now.
    
    if not aws_access_key or not aws_secret_key:
        # Fallback for dev/testing if not in secrets yet, but warn
        # print("    WARNING: AWS Keys missing from env. Request signing will fail.")
        pass
    
    if not aws_access_key or not aws_secret_key:
        print("    WARNING: AWS Keys missing. Request will likely fail with 403.")
        return {}

    if params is None:
        params = {}
    
    # Date handling
    t = datetime.utcnow()
    amz_date = t.strftime('%Y%m%dT%H%M%SZ')
    date_stamp = t.strftime('%Y%m%d')

    # Canonical Request
    parsed_url = urllib.parse.urlparse(url)
    canonical_uri = parsed_url.path
    
    # Sort and encode params
    canonical_querystring = "&".join([
        f"{urllib.parse.quote(k, safe='-_.~')}={urllib.parse.quote(str(v), safe='-_.~')}"
        for k, v in sorted(params.items())
    ])
    
    # Payload hash
    payload = json.dumps(data) if data else ""
    payload_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    
    canonical_headers = f"host:{host}\nx-amz-access-token:{access_token}\nx-amz-date:{amz_date}\n"
    signed_headers = "host;x-amz-access-token;x-amz-date"
    
    canonical_request = '\n'.join([
        method,
        canonical_uri,
        canonical_querystring,
        canonical_headers,
        signed_headers,
        payload_hash
    ])
    
    # String to Sign
    algorithm = 'AWS4-HMAC-SHA256'
    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = '\n'.join([
        algorithm,
        amz_date,
        credential_scope,
        hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
    ])
    
    # Sign
    def sign(key, msg):
        return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

    k_date = sign(('AWS4' + aws_secret_key).encode('utf-8'), date_stamp)
    k_region = sign(k_date, region)
    k_service = sign(k_region, service)
    k_signing = sign(k_service, 'aws4_request')
    signature = hmac.new(k_signing, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
    
    authorization_header = (
        f"{algorithm} Credential={aws_access_key}/{credential_scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    
    return {
        'x-amz-access-token': access_token,
        'x-amz-date': amz_date,
        'Authorization': authorization_header,
        'Content-Type': 'application/json'
    }

def sync_amazon_data():
    """
    Core logic to fetch data from Amazon SP-API.
    Saves to local JSON files.
    """
    print("Starting SP-API Sync Process (Local JSON Mode)...")
    
    # Load existing data to append/merge
    existing_inventory = load_json("inventory.json")
    existing_orders = load_json("orders.json")
    # Data Integrity: Purge any existing orders that have no items (cleanup)
    existing_orders = [o for o in existing_orders if o.get('items') and len(o['items']) > 0]
    
    existing_shipments = load_json("shipments.json")
    
    # 0. Process Hidden Default Account from Env Vars
    # 0. Process Hidden Default Account from Env Vars (injected via Secrets)
    env_client_id = os.environ.get("LWA_CLIENT_ID")
    env_client_secret = os.environ.get("LWA_CLIENT_SECRET")
    env_refresh_token = os.environ.get("SP_API_REFRESH_TOKEN")

    if all([env_client_id, env_client_secret, env_refresh_token]):
        print(f"--- Processing Hidden Default Account (from .env) ---")
        try:
            # Authenticate
            access_token = get_lwa_access_token(env_client_id, env_client_secret, env_refresh_token)
            print(f"Successfully authenticated for Hidden Default Account.", flush=True)
            
            # Sync for default marketplaces (Assuming US for now)
            default_marketplaces = ['US']
            
            marketplace_id_map = {
                'US': 'ATVPDKIKX0DER',
                'UK': 'A1F83G8C2ARO7P'
            }

            for mp in default_marketplaces:
                print(f"  >> Syncing Marketplace: {mp}")
                mp_id = marketplace_id_map.get(mp)
                hidden_account_id = "default_account_1"
                
                try:
                    new_inv = sync_inventory_from_api(access_token, hidden_account_id, mp_id, mp)
                    # Simple merge: replace by ID
                    inv_map = {item['id']: item for item in existing_inventory}
                    for item in new_inv:
                        inv_map[item['id']] = item
                    
                    # Convert map back to list
                    existing_inventory = list(inv_map.values())
                    
                    # SAVE INTERMEDIATE: To ensure data is pushed even if later steps fail
                    save_json("inventory.json", existing_inventory)
                except Exception as e:
                    print(f"    Inventory Sync Failed: {e}")
                
                # Save immediately removed here as we saved above

                try:
                    new_shipments = sync_shipments_from_api(access_token, hidden_account_id, mp_id, mp)
                    # Simple merge
                    shp_map = {item['id']: item for item in existing_shipments}
                    for item in new_shipments:
                        shp_map[item['id']] = item
                    existing_shipments = list(shp_map.values())
                except Exception as e:
                    print(f"    Shipments Sync Failed: {e}")

                # --- NEW: Sync Set Prices via Listings Report (inc. OOS) ---
                try:
                    listing_prices = sync_all_listings_report(access_token, hidden_account_id, mp_id, mp)
                    
                    # Merge Listing Prices into Inventory first (baseline)
                    if listing_prices:
                        print(f"    Enriching inventory with {len(listing_prices)} listing prices...")
                        for item in existing_inventory:
                            sku = item.get('sku')
                            if sku in listing_prices:
                                price_val = listing_prices[sku]
                                if price_val > 0:
                                    item['price'] = price_val
                                    item['estimated_fees'] = round(price_val * 0.15, 2)
                                    item['estimated_proceeds'] = round(price_val * 0.85, 2)
                        save_json("inventory.json", existing_inventory)
                except Exception as e:
                    print(f"    Listings Report Sync Failed: {e}")

                # --- NEW: Sync Live Pricing (Buy Box / Active) ---
                try:
                    # Collect all ASINs
                    print("    Fetching Live Pricing...")
                    asins = list(set([item['asin'] for item in existing_inventory if item.get('asin')]))
                    
                    if asins:
                        asin_prices = sync_pricing_from_api(access_token, mp_id, asins)
                        
                        # Enrich Inventory (Update with live data if available)
                        for item in existing_inventory:
                            asin = item.get('asin')
                            if asin in asin_prices:
                                price_val = asin_prices[asin]
                                # Only overwrite if > 0 (Live price usually better if active)
                                if price_val > 0:
                                    item['price'] = price_val
                                    
                                    # Estimate Fees (Simple 15% rule for now as requested)
                                    fees_est = price_val * 0.15
                                    proceeds_est = price_val - fees_est
                                    
                                    item['estimated_fees'] = round(fees_est, 2)
                                    item['estimated_proceeds'] = round(proceeds_est, 2)
                            else:
                                # Keep existing (Listings Report) or default to 0
                                if 'price' not in item:
                                    item['price'] = 0
                                    item['estimated_fees'] = 0
                                    item['estimated_proceeds'] = 0
                        
                        save_json("inventory.json", existing_inventory)
                except Exception as e:
                     print(f"    Pricing Sync Failed: {e}")
                # -----------------------------------------

                try:
                    client_creds = {
                        "client_id": env_client_id,
                        "client_secret": env_client_secret,
                        "refresh_token": env_refresh_token
                    }
                    
                    # USE REPORTS API FOR LIFETIME SYNC
                    print("    >>> Switching to Reports API for Lifetime Order Sync...", flush=True)
                    new_orders = sync_lifetime_orders_via_report(access_token, hidden_account_id, mp_id, mp, client_creds)

                    ord_map = {item['id']: item for item in existing_orders}
                    for item in new_orders:
                        # Update or Add
                        ord_map[item['id']] = item
                    
                    existing_orders = list(ord_map.values())
                except Exception as e:
                    print(f"    Orders Sync Failed: {e}")

                # --- NEW: Calculate Last Sold Date & Fallback Price ---
                # Build map of SKU -> {date, price}
                print("    Calculating Last Sold Dates & Fallback Prices...")
                sku_last_prop = {}
                for order in existing_orders:
                    p_date = order.get('purchase_date')
                    if not p_date: continue
                    
                    for item in order.get('items', []):
                        sku = item.get('sku')
                        if not sku: continue
                        
                        qty = float(item.get('quantity', 0))
                        total_price = float(item.get('item_price', 0))
                        unit_price = (total_price / qty) if qty > 0 else 0
                        
                        # Keep the most recent data
                        if sku not in sku_last_prop or p_date > sku_last_prop[sku]['date']:
                            sku_last_prop[sku] = {
                                'date': p_date,
                                'price': unit_price
                            }
                
                # Enrich Inventory with Last Sold Date & Price Fallback
                for item in existing_inventory:
                    sku = item.get('sku')
                    last_data = sku_last_prop.get(sku)
                    
                    if last_data:
                        item['last_sold_date'] = last_data['date']
                        
                        # Fallback Price Logic: Use last sold price if current price is 0 (e.g. OOS)
                        current_price = item.get('price', 0)
                        if (current_price == 0 or current_price is None) and last_data['price'] > 0:
                            fallback_price = round(last_data['price'], 2)
                            item['price'] = fallback_price
                            
                            # Estimate Fees
                            fees_est = fallback_price * 0.15
                            proceeds_est = fallback_price - fees_est
                            
                            item['estimated_fees'] = round(fees_est, 2)
                            item['estimated_proceeds'] = round(proceeds_est, 2)
                
                # Save enriched inventory
                save_json("inventory.json", existing_inventory)
                # -------------------------------------

        except Exception as e:
             print(f"Hidden Default Account Sync Failed: {e}")

        except Exception as e:
             print(f"Hidden Default Account Sync Failed: {e}")

    # Save final results (Full sync)
    # Note: We saved inventory incrementally. Saving again ensures all merges are captured.
    save_json("inventory.json", existing_inventory)
    save_json("orders.json", existing_orders)
    save_json("shipments.json", existing_shipments)
    print("Sync Complete. Data saved to Firestore.")


def sync_inventory_from_api(access_token, account_id, marketplace_id, marketplace_code):
    print(f"    Fetching Inventory via API ({marketplace_code})...")
    
    url = f"{SP_API_ENDPOINT}/fba/inventory/v1/summaries"
    base_params = {
        "details": "true",
        "granularityType": "Marketplace",
        "granularityId": marketplace_id,
        "marketplaceIds": marketplace_id
    }
    
    all_products = []
    next_token = None
    
    while True:
        params = base_params.copy()
        if next_token:
            params["nextToken"] = next_token
            
        headers = sign_request('GET', url, access_token, params=params)
        
        try:
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code != 200:
                print(f"    API Error {response.status_code}: {response.text}")
                break
                
            data = response.json()
            payload = data.get('payload', {})
            inventory_summaries = payload.get('inventorySummaries', [])
            
            for item in inventory_summaries:
                sku = item.get('sellerSku')
                asin = item.get('asin')
                title = item.get('productName', 'Unknown Product')
                
                inv_details = item.get('inventoryDetails', {})
                fulfillable = inv_details.get('fulfillableQuantity', 0)
                
                safe_sku = sku.replace("/", "_").replace("\\", "_")
                doc_id = f"{account_id}_{marketplace_code}_{safe_sku}"

                all_products.append({
                    "id": doc_id,
                    "sku": sku,
                    "asin": asin,
                    "title": title,
                    "stock_level": fulfillable,
                    "currency": "USD",
                    "status": "Healthy" if fulfillable > 0 else "OutOfStock",
                    "accountId": account_id,
                    "marketplaceId": marketplace_code,
                    "updated_at": datetime.utcnow().isoformat()
                })
            
            next_token = data.get('pagination', {}).get('nextToken')
            if not next_token:
                break
                
            # Respect rate limits - brief pause between pages
            time.sleep(0.5)
            
        except Exception as e:
            print(f"    Exception during inventory fetch: {e}")
            break
    
    print(f"    Fetched total {len(all_products)} inventory items")
    return all_products

def sync_orders_from_api(access_token, account_id, marketplace_id, marketplace_code, client_creds=None):
    print(f"    Fetching Orders via API ({marketplace_code})...")
    
    url = f"{SP_API_ENDPOINT}/orders/v0/orders"
    # LIFETIME SYNC: Start from 2015
    last_updated_after = "2015-01-01T00:00:00Z"
    
    params = {
        "MarketplaceIds": marketplace_id,
        "LastUpdatedAfter": last_updated_after,
        "OrderStatuses": "Shipped,Unshipped,PartiallyShipped,Pending,Canceled" 
    }
    
    orders_to_save = []
    next_token = None
    
    # Store initial params to reuse/modify
    base_params = params.copy()

    while True:
        # Construct params for this request
        curr_params = base_params.copy()
        if next_token:
            # When NextToken is present, remove other filter params if required by API, 
            # but for SP-API usually appending NextToken to the request is enough.
            # However, some docs suggest passing ONLY NextToken. 
            # Safest is to keep filters + NextToken or follow specific API quirk. 
            # We will follow the Inventory pattern: keep base params + NextToken.
            curr_params["NextToken"] = next_token

        try:
            headers = sign_request('GET', url, access_token, params=curr_params)
            response = requests.get(url, headers=headers, params=curr_params)
            
            if response.status_code != 200:
                print(f"    API Error {response.status_code}: {response.text}")
                break
                
            payload = response.json().get('payload', {})
            orders_data = payload.get('Orders', [])
            
            if not orders_data:
                break
                
            print(f"    Processing page with {len(orders_data)} orders...")
            
            for order in orders_data:
                amazon_order_id = order.get('AmazonOrderId')
                status = order.get('OrderStatus')
                total_info = order.get('OrderTotal', {})
                total_amount = float(total_info.get('Amount', 0.0)) if total_info else 0.0
                currency = total_info.get('CurrencyCode', 'USD')
                estimated_fees = total_amount * 0.15 
                
                items = []
                # Fetch items for EVERY order (Time Consuming but necessary for SKUs)
                try:
                    # Reuse token if valid (though we are inside a loop, token management for items is separate)
                    items, _ = fetch_order_items(access_token, amazon_order_id, client_creds)
                except Exception as e:
                    print(f"    Failed to fetch items for {amazon_order_id}: {e}")
                    items = []

                if not items:
                    # If confirmed canceled or just no items, maybe skip or save empty?
                    # User wants Last Sold Date, which needs items. If no items, useless for that purpose.
                    continue

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
                    "fulfillment_channel": order.get('FulfillmentChannel', 'Unknown'),
                    "updated_at": datetime.utcnow().isoformat()
                })
                # Rate limit compliance for GetOrderItems
                time.sleep(0.5)

            # Check for next page
            next_token = payload.get('NextToken')
            if not next_token:
                break
            
            print("    Next page token found, continuing...")
            time.sleep(1.0) # Rate limit for GetOrders

        except Exception as e:
            print(f"    Exception during orders fetch loop: {e}")
            break

    print(f"    Fetched total {len(orders_to_save)} orders")
    return orders_to_save

def sync_shipments_from_api(access_token, account_id, marketplace_id, marketplace_code):
    print(f"    Fetching Shipments via API ({marketplace_code})...")
    
    url = f"{SP_API_ENDPOINT}/fba/inbound/v0/shipments"
    last_updated_after = (datetime.utcnow() - timedelta(days=365)).isoformat()
    last_updated_before = datetime.utcnow().isoformat()
    
    params = {
        "QueryType": "DATE_RANGE",
        "LastUpdatedAfter": last_updated_after,
        "LastUpdatedBefore": last_updated_before,
        "MarketplaceId": marketplace_id,
        "ShipmentStatusList": "WORKING,SHIPPED,RECEIVING,CANCELLED,DELETED,CLOSED,ERROR,IN_TRANSIT,DELIVERED,CHECKED_IN"
    }
    
    headers = sign_request('GET', url, access_token, params=params)
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        print(f"    Warning: API Error {response.status_code}: {response.text}")
        return []
        
    shipments_data = response.json().get('payload', {}).get('ShipmentData', [])
    shipments_to_save = []
    
    for shp in shipments_data:
        shipments_to_save.append({
            "id": shp.get('ShipmentId'),
            "shipment_name": shp.get('ShipmentName'),
            "destination": shp.get('DestinationFulfillmentCenterId', 'Unknown'),
            "status": shp.get('ShipmentStatus'),
            "items": 0,
            "date": shp.get('ShipmentId'),
            "created_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "carrier": "Unknown",
            "tracking": "Pending",
            "accountId": account_id,
            "marketplaceId": marketplace_code,
            "updated_at": datetime.utcnow().isoformat()
        })
        
    print(f"    Fetched {len(shipments_to_save)} shipments")
    
    # 2. Fetch items for each shipment
    print("    Fetching items for shipments...")
    for shp in shipments_to_save:
        shp_id = shp['id']
        try:
            items = fetch_shipment_items(access_token, shp_id)
            shp['shipment_items'] = items
            shp['items'] = sum(item['quantity_shipped'] for item in items) 
            # Note: 'items' field updated to be sum of quantity shipped
        except Exception as e:
            print(f"      Failed to fetch items for shipment {shp_id}: {e}")
            shp['shipment_items'] = []
            
    return shipments_to_save

def sync_pricing_from_api(access_token, marketplace_id, asins):
    """
    Fetches pricing for a list of ASINs using batch calls (max 20 per call).
    Returns a dict: { ASIN: Price_Float }
    """
    print(f"    Syncing prices for {len(asins)} ASINs...")
    
    url = f"{SP_API_ENDPOINT}/products/pricing/v0/price"
    asin_prices = {}
    
    # Process in chunks of 20
    chunk_size = 20
    for i in range(0, len(asins), chunk_size):
        chunk = asins[i : i + chunk_size]
        
        params = {
            "MarketplaceId": marketplace_id,
            "ItemType": "Asin",
            "Asins": ",".join(chunk)
        }
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                headers = sign_request('GET', url, access_token, params=params)
                response = requests.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    payload = response.json().get('payload', [])
                    for item in payload:
                        asin = item.get('ASIN')
                        # Get Buying Price
                        price = 0.0
                        product = item.get('Product', {})
                        offers = product.get('Offers', [])
                        
                        if offers:
                            first_offer = offers[0]
                            listing_price = first_offer.get('BuyingPrice', {}).get('ListingPrice', {})
                            price = float(listing_price.get('Amount', 0.0))
                        
                        if price > 0:
                            asin_prices[asin] = price
                    break # Success, move to next chunk
                    
                elif response.status_code == 429:
                    sleep_time = 2 * (attempt + 1)
                    print(f"      [429] Rate limit on pricing chunk {i}, retrying in {sleep_time}s...")
                    time.sleep(sleep_time)
                    continue
                else:
                    print(f"      Pricing API Error {response.status_code} for chunk {i}: {response.text}")
                    break
                    
            except Exception as e:
                print(f"      Exception fetching prices for chunk {i}: {e}")
                break
                
        # Base rate limit compliance
        time.sleep(2.0)
            
    print(f"    Fetched prices for {len(asin_prices)} / {len(asins)} items")
    return asin_prices

def fetch_shipment_items(access_token, shipment_id):
    """
    Fetches items for a specific inbound shipment.
    """
    # url = f"{SP_API_ENDPOINT}/fba/inbound/v0/shipments/{shipment_id}/items" # v0 is deprecated but often still works. v0 items might be cleaner.
    # Let's check documentation or assume v0 items endpoint.
    # Actually, the standard endpoint is /fba/inbound/v0/shipments/{shipmentId}/items
    
    url = f"{SP_API_ENDPOINT}/fba/inbound/v0/shipments/{shipment_id}/items"
    
    try:
        headers = sign_request('GET', url, access_token)
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            payload = response.json().get('payload', {})
            item_data = payload.get('ItemData', [])
            items = []
            for item in item_data:
                items.append({
                    "shipment_id": item.get('ShipmentId'),
                    "sku": item.get('SellerSKU'),
                    "fulfillment_network_sku": item.get('FulfillmentNetworkSKU'),
                    "quantity_shipped": item.get('QuantityShipped', 0),
                    "quantity_received": item.get('QuantityReceived', 0),
                    "quantity_in_case": item.get('QuantityInCase', 0),
                    "prep_details": item.get('PrepDetailsList', [])
                })
            return items
        else:
            print(f"      Error fetching items for {shipment_id}: {response.status_code} {response.text}")
            return []
    except Exception as e:
        print(f"      Exception fetching items for {shipment_id}: {e}")
        return []

def fetch_order_items(access_token, amazon_order_id, client_creds=None):
    url = f"{SP_API_ENDPOINT}/orders/v0/orders/{amazon_order_id}/orderItems"
    
    current_token = access_token
    new_token_result = None

    max_retries = 3
    for attempt in range(max_retries):
        headers = sign_request('GET', url, current_token)
        
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
            return clean_items, new_token_result
            
        elif response.status_code == 429:
            sleep_time = 2 * (attempt + 1)
            print(f"    [429] Throttled on items for {amazon_order_id}, retrying in {sleep_time}s...")
            time.sleep(sleep_time)
            continue
        
        elif (response.status_code == 403 or response.status_code == 401) and client_creds:
            print(f"    [{response.status_code}] Auth Error for {amazon_order_id}. Attempting Token Refresh...")
            try:
                new_token = get_lwa_access_token(client_creds['client_id'], client_creds['client_secret'], client_creds['refresh_token'])
                current_token = new_token
                new_token_result = new_token
                print("    Token Refreshed Successfully. Retrying...")
                continue
            except Exception as e:
                print(f"    Token Refresh Failed: {e}")
                return [], None
            
        else:
            print(f"    Error {response.status_code} fetching items for {amazon_order_id}: {response.text}")
            return [], None
            
    print(f"    Failed to fetch items for {amazon_order_id} after {max_retries} retries.")
    return [], None

def sync_pricing_from_api(access_token, marketplace_id, asins):
    """
    Fetches pricing for ASINs in batches of 20 using getPricing endpoint.
    Returns a dict: { 'ASIN': price_float }
    """
    url = f"{SP_API_ENDPOINT}/products/pricing/v0/price"
    price_map = {}
    
    # Batch ASINs (Limit 20)
    chunk_size = 20
    chunks = [asins[i:i + chunk_size] for i in range(0, len(asins), chunk_size)]
    
    # print(f"    [Pricing] Syncing {len(asins)} items in {len(chunks)} batches...")
    
    for chunk in chunks:
        params = {
            "MarketplaceId": marketplace_id,
            "ItemType": "Asin",
            "Asins": ",".join(chunk)
        }
        
        # Retry mechanism for batch
        max_retries = 3
        for attempt in range(max_retries):
            try:
                headers = sign_request('GET', url, access_token, params=params)
                response = requests.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    payload = response.json().get('payload', [])
                    for item in payload:
                        asin = item.get('ASIN')
                        product = item.get('Product', {})
                        
                        # Strategy: BuyingPrice -> RegularPrice -> Offers
                        price = 0
                        
                        offers = product.get('Offers', [])
                        if offers:
                            # 1. Try ListingPrice
                            price_data = offers[0].get('BuyingPrice', {}).get('ListingPrice', {})
                            price = price_data.get('Amount')
                            
                            # 2. Try RegularPrice if ListingPrice is missing
                            if not price:
                                price_data = offers[0].get('RegularPrice', {})
                                price = price_data.get('Amount')

                        if price:
                            price_map[asin] = float(price)
                    break # Success, exit retry loop
                    
                elif response.status_code == 429:
                    # Throttle
                    wait_time = 2 ** (attempt + 1)
                    print(f"    [Pricing] Throttled. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"    [Pricing] Batch failed: {response.status_code} {response.text}")
                    break # Fatal error for this batch
                    
            except Exception as e:
                print(f"    [Pricing] Error in batch attempt {attempt}: {e}")
                time.sleep(1)
        
        # Throttle between chunks
        time.sleep(0.5)
            
    return price_map

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


# --- REPORTS API IMPLEMENTATION ---

# --- REPORTS API IMPLEMENTATION ---

def sync_lifetime_orders_via_report(access_token, account_id, marketplace_id, marketplace_code, client_creds=None):
    """
    Fetches lifetime order history using the Reports API.
    Report Type: GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL
    Limits: 30-day range per report.
    Strategy: Loop from 2015 to Present in 30-day chunks.
    """
    print(f"    [Reports] Starting Lifetime Order Sync for {marketplace_code}...")

    # Define Full Range
    # We will use 2015.
    start_date = datetime(2015, 1, 1)
    end_date = datetime.utcnow() - timedelta(minutes=2) 
    
    report_type = "GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL"
    
    all_orders = []
    
    current_start = start_date
    
    # Token Management
    token_start_time = time.time()
    current_access_token = access_token

    while current_start < end_date:
        # Check Token Expiry (Refreshing every 45 mins to be safe)
        if client_creds and (time.time() - token_start_time) > 2700:
            print("    [Reports] Refreshing Access Token to prevent expiry...")
            try:
                current_access_token = get_lwa_access_token(
                    client_creds['client_id'], 
                    client_creds['client_secret'], 
                    client_creds['refresh_token']
                )
                token_start_time = time.time()
                print("    [Reports] Access Token Refreshed.")
            except Exception as e:
                print(f"    [Reports] Failed to refresh token: {e}. Continuing with old token.")

        current_end = current_start + timedelta(days=30)
        if current_end > end_date:
            current_end = end_date
            
        # Format dates ISO 8601
        start_str = current_start.strftime('%Y-%m-%dT%H:%M:%SZ')
        end_str = current_end.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        print(f"    [Reports] Processing Chunk: {start_str} to {end_str}")
        
        orders_batch = fetch_report_range(current_access_token, report_type, start_str, end_str, marketplace_id, account_id, marketplace_code)
        all_orders.extend(orders_batch)
        
        # Move to next chunk
        current_start = current_end
        
        # Simple rate limit for Report Creation (15 burst, 1 every 60s).
        # We might hit throttle if we go too fast.
        # Let's wait a bit.
        time.sleep(10) # Safe buffer

    print(f"    [Reports] Total Lifetime Orders Fetched: {len(all_orders)}")
    return all_orders

def fetch_report_range(access_token, report_type, start_time, end_time, marketplace_id, account_id, marketplace_code):
    print(f"      [Reports] Requesting report...")
    report_id = create_report(access_token, report_type, start_time, end_time, marketplace_id)
    
    if not report_id:
        print("      [Reports] Failed to create report for this chunk. Skipping.")
        return []

    # Poll for Completion
    print(f"      [Reports] Polling for Report ID: {report_id}...")
    document_id = None
    
    # Poll for up to 5 minutes
    start_poll = time.time()
    while (time.time() - start_poll) < 300:
        report_status, doc_id = get_report_status(access_token, report_id)
        
        if report_status == "DONE":
            document_id = doc_id
            break
        elif report_status == "CANCELLED":
            print("      [Reports] Report was CANCELLED.")
            break
        elif report_status == "FATAL":
            print("      [Reports] Report failed with FATAL error.")
            break
        
        # Optimization: Wait shorter initially?
        time.sleep(10)
        
    if not document_id:
        print("      [Reports] Timed out or failed to get Document ID.")
        return []

    # Download & Parse
    print(f"      [Reports] Downloading Document: {document_id}")
    report_content = get_report_document(access_token, document_id)
    
    if not report_content:
        return []

    # Parse CSV
    import csv
    try:
        text_content = report_content.decode('utf-8')
    except:
        text_content = report_content.decode('iso-8859-1')

    csv_reader = csv.DictReader(io.StringIO(text_content), delimiter='\t')
    
    orders = []
    
    for row in csv_reader:
        amz_order_id = row.get('amazon-order-id')
        if not amz_order_id: continue

        # Basic Fields
        status = row.get('order-status', 'Unknown')
        purchase_date = row.get('purchase-date')
        
        currency = row.get('currency', 'USD')
        sku = row.get('sku')
        title = row.get('product-name')
        
        try:
            qty = int(row.get('quantity-shipped', 0))
        except: 
            qty = 0
            
        try:
            item_price = float(row.get('item-price', 0.0))
        except:
            item_price = 0.0
            
        estimated_fees = item_price * 0.15
        estimated_proceeds = item_price - estimated_fees
        channel = row.get('fulfillment-channel', 'Unknown') 

        item_obj = {
            "sku": sku,
            "title": title,
            "quantity": qty,
            "item_price": item_price
        }

        existing_order = next((o for o in orders if o['id'] == amz_order_id), None)
        
        if existing_order:
            existing_order['items'].append(item_obj)
            existing_order['order_total'] += item_price
            existing_order['estimated_fees'] += estimated_fees
            existing_order['estimated_proceeds'] += estimated_proceeds
        else:
            orders.append({
                "id": amz_order_id,
                "amazon_order_id": amz_order_id,
                "accountId": account_id,
                "marketplaceId": marketplace_code,
                "purchase_date": purchase_date,
                "order_status": status,
                "order_total": item_price,
                "currency": currency,
                "items": [item_obj],
                "estimated_fees": estimated_fees,
                "estimated_proceeds": estimated_proceeds,
                "fulfillment_channel": "FBA" if channel == "AFN" else "FBM",
                "updated_at": datetime.utcnow().isoformat()
            })

    print(f"      [Reports] Processed {len(orders)} orders in chunk.")
    return orders

def create_report(access_token, report_type, start_time, end_time, marketplace_ids):
    url = f"{SP_API_ENDPOINT}/reports/2021-06-30/reports"
    
    body = {
        "reportType": report_type,
        "marketplaceIds": [marketplace_ids]
    }
    # Only add times if provided (snapshot reports fail if these are present)
    if start_time:
        body["dataStartTime"] = start_time
    if end_time:
        body["dataEndTime"] = end_time
    
    headers = sign_request('POST', url, access_token, data=body)
    try:
        response = requests.post(url, headers=headers, json=body)
        if response.status_code == 202: # Accepted
            return response.json().get('reportId')
        else:
            print(f"      Create Report Failed {response.status_code}: {response.text}")
            # Identify if it's a fatal error or just rate limit
            return None
    except Exception as e:
        print(f"      Exception Creating Report: {e}")
        return None

def sync_all_listings_report(access_token, account_id, marketplace_id, marketplace_code):
    """
    Fetches GET_MERCHANT_LISTINGS_ALL_DATA to get 'Your Price' for all items,
    including Inactive/OOS ones.
    """
    print(f"    [Reports] Requesting Listings Report (GET_MERCHANT_LISTINGS_ALL_DATA)...")
    report_type = "GET_MERCHANT_LISTINGS_ALL_DATA"
    
    # Snapshot report - no start/end time
    report_id = create_report(access_token, report_type, None, None, marketplace_id)
    
    if not report_id:
        print("    [Reports] Failed to create Listings Report.")
        return {}

    print(f"    [Reports] Polling for Report ID: {report_id}...")
    document_id = None
    
    # Poll (Wait up to 3 mins)
    start_poll = time.time()
    while (time.time() - start_poll) < 180:
        report_status, doc_id = get_report_status(access_token, report_id)
        if report_status == "DONE":
            document_id = doc_id
            break
        elif report_status in ["CANCELLED", "FATAL"]:
            print(f"    [Reports] Report ended with status: {report_status}")
            break
        time.sleep(10)
        
    if not document_id:
        print("    [Reports] Timed out waiting for Listings Report.")
        return {}

    # Download
    print(f"    [Reports] Downloading Document: {document_id}")
    report_content = get_report_document(access_token, document_id)
    if not report_content:
        return {}

    # Parse TSV
    import csv
    try:
        text_content = report_content.decode('utf-8')
    except:
        text_content = report_content.decode('iso-8859-1')
        
    # Headers in this report: seller-sku, asin1, item-name, price, quantity, status, etc.
    csv_reader = csv.DictReader(io.StringIO(text_content), delimiter='\t')
    
    sku_price_map = {}
    
    for row in csv_reader:
        sku = row.get('seller-sku')
        price_str = row.get('price')
        
        if sku and price_str:
            try:
                price = float(price_str)
                sku_price_map[sku] = price
            except:
                pass
                
    print(f"    [Reports] Fetched prices for {len(sku_price_map)} listings.")
    return sku_price_map

def get_report_status(access_token, report_id):
    url = f"{SP_API_ENDPOINT}/reports/2021-06-30/reports/{report_id}"
    
    headers = sign_request('GET', url, access_token)
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            status = data.get('processingStatus')
            doc_id = data.get('reportDocumentId')
            return status, doc_id
        else:
            print(f"      Get Report Status Failed {response.status_code}")
            return "ERROR", None
    except Exception as e:
        return "ERROR", None

def get_report_document(access_token, document_id):
    url = f"{SP_API_ENDPOINT}/reports/2021-06-30/documents/{document_id}"
    
    headers = sign_request('GET', url, access_token)
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            download_url = data.get('url')
            compression = data.get('compressionAlgorithm')
            
            # Download content
            # No auth needed for the download_url itself (usually signed S3 link)
            doc_resp = requests.get(download_url)
            
            content = doc_resp.content
            if compression == 'GZIP':
                content = gzip.decompress(content)
                
            return content
        else:
            print(f"      Get Document Info Failed {response.status_code}")
            return None
    except Exception as e:
        print(f"      Exception Downloading Document: {e}")
        return None

