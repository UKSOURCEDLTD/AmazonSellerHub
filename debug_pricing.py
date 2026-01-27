
import os
import json
import requests
from dotenv import load_dotenv
from functions.sp_api_sync import get_lwa_access_token, sign_request, SP_API_ENDPOINT

# Load env
load_dotenv(".env.local")

CLIENT_ID = os.getenv("LWA_CLIENT_ID")
CLIENT_SECRET = os.getenv("LWA_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("SP_API_REFRESH_TOKEN")

def debug_pricing():
    print("Getting Access Token...")
    access_token = get_lwa_access_token(CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)
    print(f"Token: {access_token[:10]}...")
    
    # ASIN: B01D3K0CCY (SP500)
    asins = ["B01D3K0CCY"]
    
    url = f"{SP_API_ENDPOINT}/products/pricing/v0/price"
    params = {
        "MarketplaceId": "ATVPDKIKX0DER", # US
        "ItemType": "Asin",
        "Asins": ",".join(asins)
    }
    
    print(f"Requesting {url} for {asins}...")
    headers = sign_request('GET', url, access_token, params=params)
    response = requests.get(url, headers=headers, params=params)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(response.text)

if __name__ == "__main__":
    debug_pricing()
