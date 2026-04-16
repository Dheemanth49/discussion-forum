import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def get_connection():
    database_url = os.environ.get('DATABASE_URL') or os.environ.get('EMBEDDING_DATABASE_URL')
    if not database_url:
        raise RuntimeError("DATABASE_URL or EMBEDDING_DATABASE_URL must be set")

    # Fix JDBC URL if provided
    # Standard: postgresql://user:pass@host:port/dbname
    if database_url.startswith("jdbc:postgresql://"):
        database_url = database_url.replace("jdbc:postgresql://", "postgresql://")
    
    # Remove JDBC-specific query parameters like ?prepareThreshold=0
    # because psycopg2 doesn't recognize them.
    if "?" in database_url:
        database_url = database_url.split("?")[0]

    # Force SSL for Supabase connections
    try:
        # We explicitly set sslmode='require' for Supabase
        return psycopg2.connect(database_url, sslmode='require', connect_timeout=10)
    except Exception as e:
        print(f"Connection with sslmode=require failed: {e}")
        # Fallback to the URL as-is
        return psycopg2.connect(database_url, connect_timeout=10)
