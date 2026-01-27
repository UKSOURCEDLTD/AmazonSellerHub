import sys
import os
from dotenv import load_dotenv

# Add current dir to path to find 'functions'
sys.path.append(os.getcwd())

# Load environment variables
load_dotenv(".env.local")

from functions.sp_api_sync import sync_amazon_data

if __name__ == "__main__":
    print("Running sync manually...")
    try:
        sync_amazon_data()
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")
