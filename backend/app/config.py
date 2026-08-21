from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ApplePoint"
    secret_key: str = "change-this-to-a-long-random-secret"
    access_token_minutes: int = 720
    database_url: str = "sqlite:///./applepoint.db"
    frontend_origins: str = "http://localhost:5173"
    low_stock_default: int = 3
    upload_dir: str = "uploads"

    # Authentication is handled by Firebase through this FastAPI backend.
    # No Gmail/SMTP username, password, or Google App Password is required.
    auth_provider: str = "firebase"
    firebase_web_api_key: str = ""
    firebase_timeout_seconds: int = 20
    verification_resend_cooldown_seconds: int = 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def origins(self) -> list[str]:
        return [x.strip() for x in self.frontend_origins.split(",") if x.strip()]


settings = Settings()
