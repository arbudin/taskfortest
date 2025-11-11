#-*- coding: utf-8 -*-

import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


DATABASE_URL = "postgresql://postgres@localhost:5432/dbForTask"

def get_db():
    conn = psycopg2.connect(
        dbname='dbForTask',
        user='postgres',
        password='',
        host='localhost',
        cursor_factory=RealDictCursor)

    conn.autocommit = True
    return conn

# DATABASE_URL = "postgresql://postgres@localhost:5432/dbForTask"
#
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()