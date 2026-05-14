# Porygon Industrial OS

Full-scale industrial intelligence platform combining industrial machine simulation, real-time digital twins, industrial protocol connectivity, AI-powered analytics, and 3D machine visualization.

## Architecture

```
├── frontend/          # Next.js + React Three Fiber
├── backend/           # FastAPI + WebSockets + MQTT
├── docker-compose.yml # Full stack orchestration
└── docs/              # Documentation
```

## Supported Industries

- **Battery Recycling** — Full plant simulation from intake to packaging
- **Apparel & Textile** — Complete textile manufacturing workflow

## Quick Start

```bash
# Install dependencies
npm install

# Start backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Start frontend
cd frontend && npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + React |
| UI | Tailwind CSS |
| 3D | Three.js + React Three Fiber |
| State | Zustand |
| Backend | FastAPI |
| Real-Time | WebSockets |
| MQTT | EMQX |
| Database | PostgreSQL + TimescaleDB |
| AI | Python + scikit-learn |
| Containers | Docker |
