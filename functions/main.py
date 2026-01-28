import os
from firebase_functions import https_fn, pubsub_fn, options
from firebase_admin import initialize_app, firestore
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from sp_api_sync import sync_amazon_data

# Initialize Firebase Admin
initialize_app()
db = firestore.client()

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Define Secrets
SECRETS = [
    "LWA_CLIENT_ID", 
    "LWA_CLIENT_SECRET", 
    "SP_API_REFRESH_TOKEN",
    "LWA_AWS_ACCESS_KEY",
    "LWA_AWS_SECRET_KEY"
]

app = Flask(__name__)
CORS(app)

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    try:
        docs = db.collection('inventory').stream()
        inventory = []
        for doc in docs:
            inventory.append(doc.to_dict())
        return jsonify(inventory), 200
    except Exception as e:
        logger.error(f"Error fetching inventory: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        docs = db.collection('orders').stream()
        orders = []
        for doc in docs:
            orders.append(doc.to_dict())
        return jsonify(orders), 200
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/shipments', methods=['GET'])
def get_shipments():
    try:
        docs = db.collection('shipments').stream()
        shipments = []
        for doc in docs:
            shipments.append(doc.to_dict())
        return jsonify(shipments), 200
    except Exception as e:
        logger.error(f"Error fetching shipments: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/manual_amazon_sync', methods=['POST'])
def manual_sync():
    try:
        logger.info("Starting Manual Amazon Sync (HTTP)...")
        # Ensure sp_api_sync uses the secrets which are injected as env vars
        sync_amazon_data()
        return jsonify({"message": "Sync completed successfully"}), 200
    except Exception as e:
        logger.error(f"Manual Sync Failed: {e}")
        return jsonify({"error": str(e)}), 500

@https_fn.on_request(secrets=SECRETS, timeout_sec=540, memory=options.MemoryOption.GB_1)
def api(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req):
        return app.full_dispatch_request()

@pubsub_fn.on_message_published(topic="daily-sync-topic", secrets=SECRETS, timeout_sec=540, memory=options.MemoryOption.GB_1)
def sync_amazon_data_scheduled_v2(event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    """
    Scheduled Trigger (via Pub/Sub format).
    """
    try:
        logger.info("Starting Scheduled Amazon Sync...")
        sync_amazon_data()
        logger.info("Scheduled Sync Completed.")
    except Exception as e:
        logger.error(f"Scheduled Sync Failed: {e}")

