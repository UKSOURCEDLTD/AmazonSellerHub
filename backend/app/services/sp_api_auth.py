import os
import time
import requests
from typing import Optional

class SPAPIAuthHandler:
    """
    Handles Login with Amazon (LWA) authentication for SP-API.
    Maintains and refreshes access tokens automatically.
    """
    
    LWA_ENDPOINT = "https://api.amazon.com/auth/o2/token"
    
    def __init__(self, client_id: str, client_secret: str, refresh_token: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.refresh_token = refresh_token
        self._access_token: Optional[str] = None
        self._token_expiry: float = 0
        
    def get_access_token(self) -> str:
        """Returns a valid access token, refreshing if necessary."""
        if self._is_token_valid():
            return self._access_token
            
        return self._refresh_access_token()
    
    def _is_token_valid(self) -> bool:
        """Checks if the current token is valid (with 5-minute buffer)."""
        if not self._access_token:
            return False
        return time.time() < (self._token_expiry - 300)
        
    def _refresh_access_token(self) -> str:
        """Exchanges refresh token for a new access token."""
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": self.refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        try:
            response = requests.post(self.LWA_ENDPOINT, data=payload)
            response.raise_for_status()
            data = response.json()
            
            self._access_token = data["access_token"]
            # Set expiry based on response (usually 3600 seconds)
            self._token_expiry = time.time() + data.get("expires_in", 3600)
            
            return self._access_token
        except requests.exceptions.RequestException as e:
            # In a real app, log this error properly
            print(f"Failed to refresh SP-API token: {e}")
            raise
