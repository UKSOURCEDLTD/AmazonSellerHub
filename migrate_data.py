import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin (uses default credentials or prompts if not set)
# For local migration, we might need a service account if default auth isn't set up.
# However, if 'gcloud auth application-default login' was run, it works automatically.
try:
    firebase_admin.initialize_app()
except ValueError:
    # Already initialized
    pass

db = firestore.client()

DATA_DIR = os.path.join(os.path.dirname(__file__), "functions", "data")

def migrate_collection(filename, collection_name):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"File {path} not found. Skipping {collection_name}.")
        return

    with open(path, 'r') as f:
        data = json.load(f)

    if not data:
        print(f"File {filename} is empty.")
        return

    print(f"Migrating {len(data)} records from {filename} to '{collection_name}'...")
    
    batch = db.batch()
    count = 0
    total = 0
    
    for item in data:
        doc_id = str(item.get('id')) if item.get('id') else None
        
        if doc_id:
            doc_ref = db.collection(collection_name).document(doc_id)
        else:
            doc_ref = db.collection(collection_name).document()
            
        batch.set(doc_ref, item, merge=True)
        count += 1
        
        if count >= 400:
            batch.commit()
            print(f"  Committed batch of {count}...")
            count = 0
            batch = db.batch()
            
    if count > 0:
        batch.commit()
        
    print(f"Successfully migrated {collection_name}.")

if __name__ == "__main__":
    print("Starting Data Migration (Local JSON -> Firestore)...")
    migrate_collection("inventory.json", "inventory")
    migrate_collection("orders.json", "orders")
    migrate_collection("shipments.json", "shipments")
    print("Migration Complete.")
