from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from concurrent.futures import ThreadPoolExecutor
from db import get_connection
import numpy as np
import logging
import os
import time
import torch

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
HOST = os.getenv("FLASK_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("FLASK_PORT", "7860")))
DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

# Limit PyTorch threads to reduce memory and CPU overhead
torch.set_num_threads(1)

print("Loading embedding model...")
model = SentenceTransformer("BAAI/bge-base-en-v1.5")
print("Model loaded successfully")

# Limit concurrent workers to prevent huge memory spikes 
executor = ThreadPoolExecutor(max_workers=2)


def embed_text(text: str):
    print("Generating embedding...")
    embedding = model.encode(
        text,
        normalize_embeddings=True
    )
    print("Embedding generated")
    return embedding.tolist()


def embed_post(post_id):
    print("--------------------------------------------------")
    print(f"Embedding task started for post_id: {post_id}")

    max_retries = 5
    retry_delay = 3  # seconds

    for attempt in range(max_retries):
        conn = None
        cursor = None
        try:
            print(f"Attempt {attempt + 1}: Connecting to database...")
            conn = get_connection()
            cursor = conn.cursor()
            print("Database connected")

            print(f"Fetching post content for {post_id}...")
            cursor.execute(
                "SELECT title, content FROM posts WHERE post_id = %s",
                (post_id,)
            )

            result = cursor.fetchone()

            if not result:
                print(f"Post {post_id} not found (yet). Retrying in {retry_delay}s...")
                if cursor: cursor.close()
                if conn: conn.close()
                time.sleep(retry_delay)
                continue

            print("Post found")
            title, content = result
            combined_text = f"{title} {content}"

            print(f"Generating embedding for text (length: {len(combined_text)})...")
            embedding = embed_text(combined_text)

            print("Updating embedding in database...")
            embedding_str = f"[{','.join(map(str, embedding))}]"
            
            cursor.execute(
                "UPDATE posts SET embedding = %s::vector, updated_at = NOW() WHERE post_id = %s",
                (embedding_str, post_id)
            )

            conn.commit()
            print(f"Embedding stored successfully for post {post_id}")
            return  # Success!

        except Exception as e:
            print(f"ERROR OCCURRED on attempt {attempt + 1}:")
            print(e)
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Embedding failed.")

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
            print(f"Attempt {attempt + 1} finished")

    print("--------------------------------------------------")


@app.route("/")
def home():
    print("Health check endpoint called")
    return jsonify({
        "status": "running",
        "service": "semantic embedding service"
    })


@app.route("/process_post/<post_id>", methods=["POST"])
def process_post(post_id):

    print(f"Received embedding request for post: {post_id}")

    executor.submit(embed_post, post_id)

    print("Task submitted to thread pool")

    return jsonify({
        "message": "embedding task submitted",
        "post_id": post_id
    })


@app.route("/generate_query_embedding", methods=["POST"])
def generate_query_embedding():

    print("Query embedding endpoint called")

    data = request.get_json()

    if not data or "query" not in data:
        print("Invalid query request")
        return jsonify({
            "error": "query field required"
        }), 400

    query = data["query"].strip()

    print("Query received:", query)

    if not query:
        return jsonify({
            "error": "query cannot be empty"
        }), 400


    embedding = embed_text(query)

    print("Query embedding completed")

    return jsonify({
        "query": query,
        "embedding": embedding
    })


if __name__ == "__main__":
    print("Starting Flask embedding server...")
    app.run(host=HOST, port=PORT, debug=DEBUG)
