import sys
import os
import json
from dotenv import load_dotenv

# Add current dir to path
sys.path.append(os.getcwd())

load_dotenv(".env.local")

from functions.sp_api_sync import sync_pricing_from_api, load_json, save_json, get_lwa_access_token

def run_pricing_sync():
    print("Running Targeted Pricing Sync...")
    
    # Auth
    env_client_id = os.environ.get("LWA_CLIENT_ID")
    env_client_secret = os.environ.get("LWA_CLIENT_SECRET")
    env_refresh_token = os.environ.get("SP_API_REFRESH_TOKEN")
    
    if not all([env_client_id, env_client_secret, env_refresh_token]):
        print("Missing Auth Env Vars")
        return

    try:
        access_token = get_lwa_access_token(env_client_id, env_client_secret, env_refresh_token)
        print("Authenticated.")
        
        # Load Inventory
        inventory = load_json("inventory.json")
        print(f"Loaded {len(inventory)} items.")
        
        asins = list(set([item['asin'] for item in inventory if item.get('asin')]))
        mp_id = "ATVPDKIKX0DER" # US Default
        
        if asins:
            print(f"Syncing prices for {len(asins)} unique ASINs...")
            asin_prices = sync_pricing_from_api(access_token, mp_id, asins)
            
            # Enrich
            updated_count = 0
            for item in inventory:
                asin = item.get('asin')
                if asin in asin_prices:
                    price_val = asin_prices[asin]
                    item['price'] = price_val
                    
                    # Estimate Fees (15%)
                    fees_est = price_val * 0.15
                    proceeds_est = price_val - fees_est
                    
                    item['estimated_fees'] = round(fees_est, 2)
                    item['estimated_proceeds'] = round(proceeds_est, 2)
                    updated_count += 1
            
            save_json("inventory.json", inventory)
            print(f"Updated {updated_count} items with pricing data.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_pricing_sync()
