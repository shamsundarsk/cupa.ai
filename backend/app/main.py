"""
Porygon Industrial OS — Backend API
FastAPI application with WebSocket support, simulation engine, and AI analytics.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json

from app.routers import auth, factories, machines, simulations, telemetry, ai, digital_twin
from app.services.simulation_engine import SimulationManager
from app.services.websocket_manager import ConnectionManager


simulation_manager = SimulationManager()
ws_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown."""
    print("🏭 Porygon Industrial OS starting...")
    print("⚡ Simulation engine initialized")
    print("📡 WebSocket manager ready")
    yield
    print("🛑 Shutting down simulation engine...")
    await simulation_manager.stop_all()


app = FastAPI(
    title="Porygon Industrial OS",
    description="Enterprise-grade industrial intelligence platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(factories.router, prefix="/api/factories", tags=["Factories"])
app.include_router(machines.router, prefix="/api/machines", tags=["Machines"])
app.include_router(simulations.router, prefix="/api/simulations", tags=["Simulations"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Analytics"])
app.include_router(digital_twin.router, prefix="/api/twin", tags=["Digital Twin"])


@app.get("/")
async def root():
    return {
        "name": "Porygon Industrial OS",
        "version": "1.0.0",
        "status": "operational",
        "modules": [
            "authentication",
            "factory_management",
            "simulation_engine",
            "telemetry_ingestion",
            "ai_analytics",
            "digital_twin",
            "mqtt_integration",
            "websocket_streaming",
        ],
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "simulation_engine": simulation_manager.status(),
        "active_connections": ws_manager.active_count(),
    }


@app.websocket("/ws/telemetry/{simulation_key}")
async def websocket_telemetry(websocket: WebSocket, simulation_key: str):
    """WebSocket endpoint for real-time telemetry streaming."""
    await ws_manager.connect(websocket, simulation_key)
    try:
        while True:
            # Receive commands from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe":
                machine_ids = message.get("machines", [])
                await ws_manager.subscribe(websocket, simulation_key, machine_ids)
            
            elif message.get("type") == "command":
                command = message.get("command")
                if command == "start":
                    await simulation_manager.start_simulation(simulation_key, ws_manager)
                elif command == "stop":
                    await simulation_manager.stop_simulation(simulation_key)
                elif command == "pause":
                    await simulation_manager.pause_simulation(simulation_key)

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, simulation_key)


@app.websocket("/ws/twin/{simulation_key}")
async def websocket_digital_twin(websocket: WebSocket, simulation_key: str):
    """WebSocket endpoint for digital twin synchronization."""
    await ws_manager.connect(websocket, f"twin_{simulation_key}")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "sync_request":
                # Send current state of all machines
                state = simulation_manager.get_state(simulation_key)
                await websocket.send_json({
                    "type": "state_sync",
                    "data": state,
                })

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, f"twin_{simulation_key}")
