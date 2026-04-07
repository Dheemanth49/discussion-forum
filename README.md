# Discussion Forum System 

This project is a full-stack discussion forum featuring an AI embedding service. It has been organized into three main folders for easier deployment and management.

## Project Structure
- **/backend**: Java Spring Boot application (Maven)
- **/frontend**: React.js application (Vite/Tailwind)
- **/embeddingservice**: Python AI embedding service for semantic search
- **/.env.example**: Example environment variables for the system

---

## Prerequisites
- **Node.js** (v18+)
- **Java** (JDK 17+)
- **Python** (3.8+)
- **PostgreSQL** (with `pgvector` extension enabled)

## Environment Setup
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update the `.env` file with your database credentials and secret keys.

---

## How to Run (Development)

### 1. Database
Ensure your PostgreSQL server is running and the `pgvector` extension is installed on your database.

### 2. Python Embedding Service
Open a terminal in the `./embeddingservice` directory and run:
```bash
pip install -r requirements.txt
python app.py
```

### 3. Backend
Open a terminal in the `./backend` directory and run:
```bash
mvn spring-boot:run
```

### 4. Frontend
Open a terminal in the `./frontend` directory and run:
```bash
npm install
npm run dev
```

---
