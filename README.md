# TempyMail 📧

A modern, production-ready temporary email web application built with FastAPI, React, Vite, and TailwindCSS. Powered by the Mail.tm API.

## Features
- **Auto-Generate Email**: Instantly get a temporary email address upon visiting.
- **Real-time Inbox**: Automatically polls your inbox every 5 seconds.
- **Modern UI**: Glassmorphism design, dark mode SaaS aesthetic, responsive for mobile.
- **Copy to Clipboard**: Quick copy button for your new email address.

## Architecture & Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Axios, Lucide React, date-fns.
- **Backend**: FastAPI (Python), HTTPX (async requests).
- **Email Provider**: Mail.tm API.

## Local Setup Instructions

### 1. Start the Backend (FastAPI)
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   > The backend will run on `http://localhost:8000`.

### 2. Start the Frontend (React + Vite)
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   > The frontend will run locally on `http://localhost:5173`.

## Deployment Instructions

### Deploying the Backend on Render
1. Create a new **Web Service** on Render and connect your GitHub repository.
2. Select the `backend` root directory.
3. Environment: Python 3
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Once deployed, note the frontend URL and add it to the CORS `allow_origins` in `main.py` if needed.

### Deploying the Frontend on Vercel
1. Import your project repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Vercel will auto-detect Vite. The build command (`npm run build`) and output directory (`dist`) will be pre-configured.
4. Add an Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-url-on-render.com/api`
5. Click **Deploy**.

Enjoy your private, fully functional temporary email service!
