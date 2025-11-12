
import os
import psycopg2
from psycopg2.extras import RealDictCursor


DATABASE_URL = os.getenv("DATABASE_URL")

def get_db():
    # если DATABASE_URL задан — парсим и подключаемся по нему
    if DATABASE_URL:

        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        conn.autocommit = True
        return conn

    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME", "dbForTask"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        cursor_factory=RealDictCursor
    )
    conn.autocommit = True
    return conn
