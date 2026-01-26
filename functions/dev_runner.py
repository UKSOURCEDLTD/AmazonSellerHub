import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

# Load local environment vars
load_dotenv()

# Initialize Firebase (Attempting Default Creds)
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        'projectId': 'amazon-grid-hub', # Real Project ID
    })

from sp_api_sync import sync_amazon_data

if __name__ == "__main__":
    print("Running SP-API Sync Locally...")
    sync_amazon_data()
    print("Done.")
