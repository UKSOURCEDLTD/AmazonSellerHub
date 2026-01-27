import os
import json
from dotenv import load_dotenv
from sp_api_sync import get_lwa_access_token, sync_shipments_from_api, save_json, load_json

load_dotenv(".env.local")

def debug_shipments():
    print("Debug: Syncing Shipments Only...")
    
    env_client_id = os.environ.get("LWA_CLIENT_ID")
    env_client_secret = os.environ.get("LWA_CLIENT_SECRET")
    env_refresh_token = os.environ.get("SP_API_REFRESH_TOKEN")

    if all([env_client_id, env_client_secret, env_refresh_token]):
        try:
            print("Authenticating...")
            access_token = get_lwa_access_token(env_client_id, env_client_secret, env_refresh_token)
            
            # Use US marketplace
            marketplace_id = 'ATVPDKIKX0DER'
            mp_code = 'US'
            account_id = "default_account_1"

            print("Fetching Shipments...")
            new_shipments = sync_shipments_from_api(access_token, account_id, marketplace_id, mp_code)
            
            # Merge with existing
            existing_shipments = load_json("shipments.json")
            shp_map = {item['id']: item for item in existing_shipments}
            for item in new_shipments:
                shp_map[item['id']] = item
            
            final_shipments = list(shp_map.values())
            save_json("shipments.json", final_shipments)
            
            print("Done! Check shipments.json")
            
            # Verify first shipment has items
            if final_shipments:
                print(f"Sample Shipment Items: {len(final_shipments[0].get('shipment_items', []))}")
                if final_shipments[0].get('shipment_items'):
                    print(f"First Item SKU: {final_shipments[0]['shipment_items'][0].get('sku')}")
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    debug_shipments()
