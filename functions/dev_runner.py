import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify
from flask_cors import CORS
from sp_api_sync import sync_amazon_data

# Load local environment vars
load_dotenv(".env.local")

# Initialize Firebase
if not firebase_admin._apps:
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': 'amz-seller-hub',
        })
    except Exception as e:
        print(f"Warning: Firebase Auth failed: {e}")
        print("Hint: Make sure you have set GOOGLE_APPLICATION_CREDENTIALS or ran 'gcloud auth application-default login'")

app = Flask(__name__)
CORS(app)

@app.route('/manual_amazon_sync', methods=['POST'])
def manual_sync():
    print("Received Manual Sync Request...")
    try:
        sync_amazon_data()
        return jsonify({"status": "success", "message": "Sync completed successfully"}), 200
    except Exception as e:
        print(f"Sync failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    print("Starting Local Dev Server for Functions on port 5001...")
    print("Endpoint: http://localhost:5001/manual_amazon_sync")
    app.run(port=5001, debug=True)
