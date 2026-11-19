# Healthcare Predictor

## Project structure

- `frontend/` - React and Vite application
- `backend/` - FastAPI API, database models, and ML model training data
- `render.yaml` - Render backend deployment configuration
- `frontend/vercel.json` - Vercel frontend routing configuration

## Local development

Start the backend:

```powershell
cd backend
..\..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL`.

## Deployment

- Deploy `frontend/` as a Vercel project.
- Set `VITE_API_URL` in Vercel to the Render backend URL.
- Deploy `backend/` to Render using `render.yaml`.
- Set `CORS_ORIGINS` on Render to the Vercel frontend URL.
- Configure `TRAINING_DATA_PATH` in Render to point to a privately provided training CSV. Do not commit patient data. Without training data, deployment succeeds but prediction requests return an explicit model-unavailable error.
