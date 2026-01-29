# Project Setup and Execution Guide

This guide provides instructions on how to set up the environment, install dependencies, and run both the Backend and Frontend applications for this project.

## Prerequisites

Ensure you have the following installed on your system:

- **Python** (3.8 or higher)
- **Node.js** (18 or higher) & **npm**

---

## 1. Backend Setup (FastAPI)

The backend code is in the `backend` directory, but we run it from the **Root** directory to handle imports correctly.

### Step 1: Open Terminal in Project Root

Ensure you are in: `f:\MS AI School\3rd_PJ_2\LABY_chatbot\LABY_Agent_chatbot_app`

### Step 2: Create a Virtual Environment (venv)

**Windows:**

```powershell
python -m venv venv
```

**macOS / Linux:**

```bash
python3 -m venv venv
```

### Step 3: Activate the Virtual Environment

**Windows (PowerShell):**

```powershell
.\venv\Scripts\Activate
```

**Windows (Cmd):**

```cmd
.\venv\Scripts\activate.bat
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

### Step 4: Install Dependencies

Install packages referencing the file in the backend folder:

```bash
pip install -r requirements.txt
```

### Step 5: Run the Backend Server

Run the module from the root:

```bash
uvicorn backend.main:app --reload
```

- The API will be available at: `http://localhost:8000`

* Interactive API Docs: `http://localhost:8000/docs`

---

## 2. Frontend Setup (Next.js)

The frontend is located in the `chemical-sample-dashboard` directory.

### Step 1: Navigate to the frontend directory

Open a **new** terminal window (keep the backend running in the first one) and move to the frontend folder:

```bash
cd chemical-sample-dashboard
```

### Step 2: Install Dependencies

Install the necessary Node.js packages:

```bash
npm install
```

_Note: If you prefer using pnpm and have it installed, you can run `pnpm install` instead._

### Step 3: Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

- The application will be accessible at: `http://localhost:3000`

---

## Summary of Running Commands

| Application  | Terminal   | Directory                    | Command                     | URL                     |
| :----------- | :--------- | :--------------------------- | :-------------------------- | :---------------------- |
| **Backend**  | Terminal 1 | `backend/`                   | `uvicorn main:app --reload` | `http://localhost:8000` |
| **Frontend** | Terminal 2 | `chemical-sample-dashboard/` | `npm run dev`               | `http://localhost:3000` |
