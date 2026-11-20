# Healthcare Predictor

## Project structure

- `frontend/` - React and Vite application
- `backend/` - FastAPI API, database models, and ML model training data
- `render.yaml` - Render backend deployment configuration
- `frontend/vercel.json` - Vercel frontend routing configuration

## Local development

Copy `backend/.env.example` to `backend/.env` and set `ADMIN_USERNAME`, a generated
`ADMIN_PASSWORD_HASH`, and a random `JWT_SECRET` of at least 32 characters. From
the `backend/` directory, run `python auth.py` to generate a password hash; the
password is read without echoing it.

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
- Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and a randomly generated
  `JWT_SECRET` (at least 32 characters) as private Render environment variables.
  Do not commit credentials or password hashes. All patient, prediction, upload,
  and analytics routes require login; access tokens expire after 30 minutes.
- Base64-encode the approved trained `model.pkl` and upload the text as a Render
  Secret File named `model.pkl.b64`. `MODEL_BASE64_PATH` points to
  `/etc/secrets/model.pkl.b64`. Do not commit the model or patient CSV. Keep
  `TRAINING_DATA_PATH` unset unless an approved synthetic or de-identified
  training CSV is privately available.
- This model was trained on synthetic data for demonstration only. Its
  predictions are not clinically validated and must not guide patient care.

Patient and prediction list endpoints return at most 100 records per request and
support `offset`/`limit` pagination. CSV imports are limited to 5 MiB and 10,000
rows.

## Backend tests

```powershell
cd backend
python -m pip install -r requirements-dev.txt
python -m pytest -q
```
