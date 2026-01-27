import os
from dotenv import load_dotenv
from sp_api_sync import get_lwa_access_token, sync_shipments_from_api

# Load env vars
load_dotenv(".env.local")

def debug_shipments():
    client_id = os.environ.get("LWA_CLIENT_ID")
    client_secret = os.environ.get("LWA_CLIENT_SECRET")
    refresh_token = os.environ.get("SP_API_REFRESH_TOKEN")

    if not all([client_id, client_secret, refresh_token]):
        print("Missing credentials in .env.local")
        return

    print("Authenticating...")
    try:
        access_token = get_lwa_access_token(client_id, client_secret, refresh_token)
    except Exception as e:
        print(f"Auth failed: {e}")
        return

    # default marketplaces from sync_amazon_data
    # US: ATVPDKIKX0DER
    # UK: A1F83G8C2ARO7P
    
    mp_id = 'ATVPDKIKX0DER' # Try US first
    print(f"Fetching shipments for US ({mp_id})...")
    
    try:
        shipments = sync_shipments_from_api(access_token, "debug_account", mp_id, "US")
        print(f"Found {len(shipments)} shipments.")
        for s in shipments:
            print(f" - {s['id']}: {s['status']} ({s['shipment_name']})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_shipments()
