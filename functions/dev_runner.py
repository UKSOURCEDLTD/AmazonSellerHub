import os
import json
from dotenv import load_dotenv
from flask import Flask, jsonify, send_file
from flask_cors import CORS
from sp_api_sync import sync_amazon_data, DATA_DIR

# Load local environment vars
load_dotenv(".env.local")

app = Flask(__name__)
CORS(app)

import threading

@app.route('/manual_amazon_sync', methods=['POST'])
def manual_sync():
    print("Received Manual Sync Request... Processing Synchronously.")
    try:
        sync_amazon_data()
        return jsonify({"status": "success", "message": "Sync completed successfully"}), 200
    except Exception as e:
        print(f"Sync failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/inventory', methods=['GET'])
def get_inventory():
    file_path = os.path.join(DATA_DIR, "inventory.json")
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify([])

@app.route('/orders', methods=['GET'])
def get_orders():
    file_path = os.path.join(DATA_DIR, "orders.json")
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify([])

@app.route('/shipments', methods=['GET'])
def get_shipments():
    file_path = os.path.join(DATA_DIR, "shipments.json")
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify([])

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "message": "Local Amazon Sync Server is running.",
        "endpoints": {
            "manual_sync": "/manual_amazon_sync [POST]",
            "inventory": "/inventory [GET]",
            "orders": "/orders [GET]"
        }
    }), 200

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 DOING LOCAL STARTUP...")
    print("   Running on: http://localhost:5001")
    print("   Manual Sync: http://localhost:5001/manual_amazon_sync")
    print("   Inventory:   http://localhost:5001/inventory")
    print("   Orders:      http://localhost:5001/orders")
    print("   Shipments:   http://localhost:5001/shipments")
    print("="*50 + "\n")
    app.run(port=5001, debug=True)
