# ThermalTrace AI — Satellite-Based Industrial Thermal Anomaly Intelligence Platform

> **Smart India Hackathon Problem Statement SIH26162**  
> *Classification of Industrial Fires vs Other Thermal/Heat Sources using Satellite Data*

ThermalTrace AI is a production-grade geospatial intelligence platform designed to ingest real satellite thermal anomaly observations (NASA FIRMS VIIRS NOAA-20 / NOAA-21 NRT) and combine them with spatial, temporal, land-cover, and industrial infrastructure context to distinguish industrial fires from persistent gas flares, wildfires, crop burning, and unclassified heat anomalies.

---

## 🛑 Critical Non-Negotiable Principle

**Real Data When Available. Calculated Data When Derivable. Unknown When Evidence Is Insufficient. Never Fake Certainty.**

The platform strictly prohibits fabricated, hardcoded, or random operational numbers (hotspot counts, FRP values, distances, satellite names, alerts, or classifications). If data is absent, the system displays `"Data unavailable"`, `"Awaiting data"`, or `"Insufficient evidence for classification"`.

---

## 🏗️ System Architecture

```text
ThermalTrace AI/
├── backend/                  # FastAPI + SQLAlchemy (PostgreSQL/PostGIS & SQLite fallback)
│   ├── app/
│   │   ├── api/routers/      # REST API endpoints (health, sync, hotspots, industrial, analytics, alerts)
│   │   ├── core/             # Configuration & security
│   │   ├── database/         # SQLAlchemy ORM models & session
│   │   ├── geospatial/       # Geodesic distance, clustering & land-cover rules
│   │   ├── ingestion/        # NASA FIRMS API client & SHA-256 deduplication
│   │   ├── ml/               # Evidence Engine, temporal baseline & ML pipeline
│   │   ├── workers/          # Synchronization worker & seeder
│   │   └── data/             # Verified Indian industrial infrastructure registry
│   ├── tests/                # Pytest test suite (13/13 passing)
│   ├── pytest.ini            # Pytest configuration
│   └── requirements.txt
├── frontend/                 # React + TypeScript + Vite + Tailwind CSS + Leaflet + Recharts
│   ├── src/
│   │   ├── components/       # MapView, HotspotDrawer, StatsCards, EvidenceBadge, Navbar, Sidebar
│   │   ├── pages/            # Dashboard, Explorer, Temporal, Industrial, Review, Alerts, Analytics
│   │   ├── services/         # Axios API client
│   │   └── types/            # TypeScript data interfaces
│   └── vite.config.ts
├── docker-compose.yml        # PostGIS 16 + FastAPI + Frontend container stack
├── pytest.ini                # Repository root test configuration
└── README.md
```

---

## ⚡ Quick Start

### 1. Environment Setup
Create a `.env` file in `backend/`:
```bash
NASA_FIRMS_MAP_KEY=your_free_nasa_firms_map_key_here
DATABASE_URL=sqlite:///./thermaltrace.db
HOST=0.0.0.0
PORT=8000
```
> Obtain a free NASA FIRMS MAP_KEY at: [https://firms.modaps.eosdis.nasa.gov/api/map_key/](https://firms.modaps.eosdis.nasa.gov/api/map_key/)

### 2. Backend Installation & Execution
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Installation & Execution
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Interface: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing

Run the complete test suite from `backend/`:
```bash
python -m pytest tests -v
```

Verify Pydantic V2 compliance with zero deprecation errors:
```bash
python -m pytest tests -W error::pydantic.warnings.PydanticDeprecatedSince20
```

---

## 🐳 Docker Deployment

Launch the complete container stack (PostGIS + FastAPI + React):
```bash
docker-compose up --build
```

---

## 📜 Problem Statement & Attribution

- **Problem Statement ID**: SIH26162
- **Primary Data Source**: NASA FIRMS Near Real-Time active fire data (VIIRS NOAA-20 & NOAA-21)
- **Infrastructure Registry**: OpenStreetMap & Global Energy Infrastructure Registry
