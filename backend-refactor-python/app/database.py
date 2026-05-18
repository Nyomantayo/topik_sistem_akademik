import pathlib
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

from .config import settings

# ── SQLAlchemy engine ─────────────────────────────────────────────────────────
DATABASE_URL = (
    f"mysql+pymysql://{settings.db_user}:{settings.db_pass}"
    f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    "?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_recycle=300,
    pool_pre_ping=True,
    pool_timeout=30,
    connect_args={
        "connect_timeout": 15,
        "read_timeout":    30,
        "write_timeout":   30,
    },
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a DB session and closes it on teardown."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migration() -> None:
    """
    Baca 001_init.sql dan jalankan setiap statement satu per satu.
    Statement CREATE DATABASE dan USE di-skip karena Railway sudah menyediakan DB.
    Aman dijalankan berulang kali (IF NOT EXISTS / INSERT IGNORE).
    """
    sql_path = pathlib.Path(__file__).parent.parent / "migrations" / "001_init.sql"
    sql = sql_path.read_text(encoding="utf-8")

    statements = sql.split(";")
    executed = 0

    with engine.begin() as conn:
        for stmt in statements:
            stmt = stmt.strip()
            if not stmt:
                continue

            # Skip if all non-empty lines are comments
            lines = stmt.splitlines()
            has_code = any(
                line.strip() and not line.strip().startswith("--")
                for line in lines
            )
            if not has_code:
                continue

            # Strip leading comment lines to check prefix
            upper = stmt.upper().strip()
            while upper.startswith("--"):
                idx = upper.find("\n")
                if idx == -1:
                    upper = ""
                    break
                upper = upper[idx + 1:].strip()

            if not upper:
                continue

            # Skip DB-level statements — Railway already provides the DB
            if upper.startswith("CREATE DATABASE") or upper.startswith("USE "):
                continue

            try:
                conn.execute(text(stmt))
                executed += 1
            except Exception as e:
                print(f"⚠️  Migration warning: {e}")

    print(f"✅ Database migration selesai ({executed} statements executed)")
