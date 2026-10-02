import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "ThermalTrace AI"
    PROJECT_SUBTITLE: str = "Satellite-Based Industrial Thermal Anomaly Intelligence Platform"
    PROBLEM_STATEMENT_ID: str = "SIH26162"
    VERSION: str = "1.0.0"
    
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    
    # NASA FIRMS API
    NASA_FIRMS_MAP_KEY: str = ""
    NASA_FIRMS_BASE_URL: str = "https://firms.modaps.eosdis.nasa.gov/api"
    DEFAULT_COUNTRY_CODE: str = "IND"
    DEFAULT_DATASETS: List[str] = ["VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"]
    
    # Database
    DATABASE_URL: str = "sqlite:///./thermaltrace.db"
    
    # Synchronization Worker
    SYNC_INTERVAL_MINUTES: int = 30
    AUTO_SYNC_ON_STARTUP: bool = False
    
    # Security / Auth
    JWT_SECRET: str = "thermaltrace_dev_secret_key_2026_sih26162"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    # SMTP / External Email Delivery Configuration
    SMTP_HOST: Union[str, None] = None
    SMTP_PORT: int = 587
    SMTP_USER: Union[str, None] = None
    SMTP_PASSWORD: Union[str, None] = None
    SMTP_FROM_EMAIL: Union[str, None] = None
    SMTP_TLS: bool = True

    model_config = SettingsConfigDict(env_file=[str(ENV_FILE), ".env"], extra="ignore")

settings = Settings()

