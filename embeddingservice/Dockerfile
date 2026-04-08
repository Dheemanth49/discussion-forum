FROM python:3.10-slim

WORKDIR /app

# Install system dependencies needed for psycopg2 compile
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install python-dotenv to satisfy import dotenv
RUN pip install --no-cache-dir -r requirements.txt python-dotenv

# Copy application code
COPY . .

# Let the platform know which port the app runs on
EXPOSE 7860

# Start the Flask server with gunicorn for production
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-7860} --workers 1 --threads 5 --timeout 120 main:app"]
