import psycopg2
from dotenv import load_dotenv
import os


load_dotenv()
def get_connection():
    database_url = os.environ.get('DATABASE_URL') or os.environ.get('EMBEDDING_DATABASE_URL')
    if not database_url:
        raise RuntimeError("DATABASE_URL or EMBEDDING_DATABASE_URL must be set")

    connection = psycopg2.connect(database_url)
    return connection
