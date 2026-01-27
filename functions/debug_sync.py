
import os
from dotenv import load_dotenv
load_dotenv(".env.local")

from sp_api_sync import sync_amazon_data
import traceback

import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase with temp_key.json
if not firebase_admin._apps:
    try:
        key_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_key.json")
        if os.path.exists(key_path):
            print(f"Using service account key: {key_path}")
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred, {'projectId': 'amz-seller-hub'})
        else:
            print("Key not found!")
    except Exception as e:
        print(f"Init failed: {e}")

print("Attempting sync...")
try:
    sync_amazon_data()
    print("Sync Success!")
except Exception:
    traceback.print_exc()
