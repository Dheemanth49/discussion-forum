import psycopg2
from dotenv import load_dotenv
import os


load_dotenv()
def get_connection():
    connection = psycopg2.connect(
        os.environ['DATABASE_URL']
    )
    return connection