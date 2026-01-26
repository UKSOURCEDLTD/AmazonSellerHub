from firebase_functions import scheduler_fn, https_fn
from firebase_admin import initialize_app, firestore
import datetime
from sp_api_sync import sync_amazon_data  # Logic separated

initialize_app()

@scheduler_fn.on_schedule(
    schedule="every 4 hours",
    timezone="UTC",
    timeout_sec=540,
    memory=512,
    secrets=["LWA_CLIENT_ID", "LWA_CLIENT_SECRET", "SP_API_REFRESH_TOKEN"] # Secrets from Secret Manager
)
def amazon_sync_task(event: scheduler_fn.ScheduledEvent) -> None:
    """
    Scheduled task to sync Amazon Settlement Reports and Orders every 4 hours.
    """
    print(f"Starting Amazon Sync at {datetime.datetime.utcnow()}")
    
    try:
        # Pass secrets implicitly or retrieve explicitly inside the logic
        sync_amazon_data()
        print("Amazon Sync completed successfully.")
    except Exception as e:
        print(f"Amazon Sync failed: {str(e)}")
        # In real app, maybe send alert to Slack/Email
@https_fn.on_request(
    timeout_sec=540,
    memory=512,
    secrets=["LWA_CLIENT_ID", "LWA_CLIENT_SECRET", "SP_API_REFRESH_TOKEN"]
)
def manual_amazon_sync(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP trigger to manually sync Amazon data.
    """
    # Enable CORS
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return https_fn.Response('', status=204, headers=headers)

    headers = {'Access-Control-Allow-Origin': '*'}
    
    print(f"Starting Manual Amazon Sync at {datetime.datetime.utcnow()}")
    try:
        sync_amazon_data()
        return https_fn.Response("Sync completed successfully.", status=200, headers=headers)
    except Exception as e:
        print(f"Manual Sync failed: {str(e)}")
        return https_fn.Response(f"Sync failed: {str(e)}", status=500, headers=headers)
