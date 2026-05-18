import os
from urllib.parse import urlparse


class Settings:
    def __init__(self):
        # Port — Railway provides PORT, fallback to APP_PORT then 8000
        self.app_port: int = int(os.getenv("PORT") or os.getenv("APP_PORT") or 8000)
        self.app_env: str = os.getenv("APP_ENV", "development")

        # Database defaults
        self.db_host: str = os.getenv("DB_HOST", "localhost")
        self.db_port: int = int(os.getenv("DB_PORT", "3306"))
        self.db_user: str = os.getenv("DB_USER", "root")
        self.db_pass: str = os.getenv("DB_PASS", "")
        self.db_name: str = os.getenv("DB_NAME", "krs_db")

        # Parse MYSQL_URL if present (Railway injects this)
        mysql_url = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL", "")
        if mysql_url:
            try:
                parsed = urlparse(mysql_url)
                self.db_host = parsed.hostname or self.db_host
                self.db_port = parsed.port or self.db_port
                self.db_user = parsed.username or self.db_user
                self.db_pass = parsed.password or self.db_pass
                self.db_name = (parsed.path or "").lstrip("/") or self.db_name
                print("📡 Using MYSQL_URL from Railway")
            except Exception as e:
                print(f"⚠️  Failed to parse MYSQL_URL: {e}")

        # Redis defaults
        self.redis_host: str = os.getenv("REDIS_HOST", "localhost")
        self.redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
        self.redis_pass: str = os.getenv("REDIS_PASS", "")

        # Parse REDIS_URL if present (Railway injects this)
        redis_url = os.getenv("REDIS_URL", "")
        if redis_url:
            try:
                parsed = urlparse(redis_url)
                self.redis_host = parsed.hostname or self.redis_host
                self.redis_port = parsed.port or self.redis_port
                self.redis_pass = parsed.password or self.redis_pass
                print("📡 Using REDIS_URL from Railway")
            except Exception as e:
                print(f"⚠️  Failed to parse REDIS_URL: {e}")

        # JWT
        self.jwt_secret: str = os.getenv("JWT_SECRET", "default-secret")
        self.jwt_expiry: int = int(os.getenv("JWT_EXPIRY", "24"))

        # CORS — supports comma-separated origins
        self.cors_origin: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origin.split(",") if o.strip()]


# Load .env file for local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

settings = Settings()
