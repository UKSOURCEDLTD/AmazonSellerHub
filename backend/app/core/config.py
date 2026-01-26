import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AMZ SELLER HUB"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/amz_seller_hub")
    
    # SP-API
    LWA_APP_ID: str = os.getenv("LWA_APP_ID", "")
    LWA_CLIENT_SECRET: str = os.getenv("LWA_CLIENT_SECRET", "")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    class Config:
        case_sensitive = True

settings = Settings()
