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
