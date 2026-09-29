# NWIS - Nearby Wells Intelligence System (Phases 1 & 2 Prototype)

This is a prototype AI/ML-enabled decision-support platform for drilling engineers, developed for SIH 26121 (Oil India Limited). 

**IMPORTANT DISCLAIMER:** This is a prototype using synthetic/public demonstration data. None of the data in this system is real Oil India Limited data.

## Project Structure

- `/backend`: Python FastAPI backend with SQLite database, FAISS Vector Store, and PyPDF parsing.
- `/frontend`: React + TypeScript + Vite frontend

## Prerequisites

- Python 3.9+ (Python 3.14 compatible)
- Node.js 18+

## How to Run

### 1. Start the Backend API

The backend uses FastAPI and SQLAlchemy. On the first run, it will automatically create the SQLite database (`nwis_prototype.db`), seed it with synthetic well and historical event data, and initialize the FAISS vector index for semantic search.

Open a terminal and run:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python run.py
```
*(If you bypass the virtual environment, you can directly run `.\venv\Scripts\python.exe run.py`)*

The backend API will be available at: **http://localhost:8000**
API Documentation (Swagger UI): **http://localhost:8000/docs**

### 2. Generate Synthetic PDFs (Phase 2)

To test the RAG/Historical Memory system, you can generate synthetic PDF drilling reports:

```powershell
cd backend
.\venv\Scripts\python.exe app\generate_pdfs.py
```
This will place sample PDF files in `backend/sample_reports/` which you can upload in the UI.

### 3. Start the Frontend UI

The frontend is a React application built with Vite and Tailwind CSS.

Open a new terminal and run:

```powershell
cd frontend
npm install   # If not already installed
npm run dev
```

The frontend application will be available at: **http://localhost:5173**

## Database Setup & Sample Data Generation

You do not need to manually run any database setup scripts. When you start the backend server for the first time using `run.py`, it will automatically:
1. Create all necessary tables, including Phase 2 tables for Documents, Chunks, and Entities.
2. Check if the database is empty.
3. If empty, generate 15 synthetic wells (centered around Assam: ~27.0N, 95.0E), 5 formations, 120 historical events, and risk prediction mappings.
4. Initialize the live drilling simulator.

## Environment Variables

Currently, the application runs out-of-the-box without requiring complex environment variable configuration. 
- **Backend**: Uses a local SQLite database by default (`sqlite:///./nwis_prototype.db`).
- **Frontend**: API Base URL is configured in `frontend/src/services/api.ts` to point to `http://localhost:8000/api`.
