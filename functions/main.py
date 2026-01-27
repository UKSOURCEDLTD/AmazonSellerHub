import os
from firebase_functions import https_fn, pubsub_fn, options
from firebase_admin import initialize_app, firestore
import logging

# Initialize Firebase Admin
initialize_app()

# Import sync logic from sp_api_sync
# Note: sp_api_sync must be refactored to use Firestore instead of local JSON
from sp_api_sync import sync_amazon_data

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Define Secrets
# Define Secrets
SECRETS = [
    "LWA_CLIENT_ID", 
    "LWA_CLIENT_SECRET", 
    "SP_API_REFRESH_TOKEN",
    "LWA_AWS_ACCESS_KEY",
    "LWA_AWS_SECRET_KEY"
]

@https_fn.on_request(secrets=SECRETS, timeout_sec=540, memory_options=options.MemoryOption.GB_1)
def sync_amazon_data_http(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Trigger for manual sync.
    """
    try:
        logger.info("Starting Manual Amazon Sync (HTTP)...")
        # In Cloud Functions, secrets are available as env vars
        sync_amazon_data()
        return https_fn.Response("Sync completed successfully via HTTP trigger.", status=200)
    except Exception as e:
        logger.error(f"Manual Sync Failed: {e}")
        return https_fn.Response(f"Sync failed: {str(e)}", status=500)

@pubsub_fn.on_message_published(topic="daily-sync-topic", secrets=SECRETS, timeout_sec=540, memory_options=options.MemoryOption.GB_1)
def sync_amazon_data_scheduled(event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    """
    Scheduled Trigger (via Pub/Sub format).
    """
    try:
        logger.info("Starting Scheduled Amazon Sync...")
        sync_amazon_data()
        logger.info("Scheduled Sync Completed.")
    except Exception as e:
        logger.error(f"Scheduled Sync Failed: {e}")
