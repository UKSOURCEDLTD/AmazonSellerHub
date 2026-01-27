import sys
import os

# Add functions dir to path
sys.path.append(os.path.join(os.getcwd(), 'functions'))

from sp_api_sync import sync_amazon_data
from dotenv import load_dotenv

load_dotenv(".env.local")

print("Running Manual Sync Verification...")
sync_amazon_data()
print("Manual Sync Verification Done.")
