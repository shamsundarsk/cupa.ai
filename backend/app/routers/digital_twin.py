"""Digital Twin API routes."""

from fastapi import APIRouter, HTTPException
from app.models.schemas import TwinConnectRequest
from typing import Dict

router = APIRouter()

# Twin connections store
twin_connections: Dict[str, dict] = {}


@router.post("/connect")
async def connect_twin(request: TwinConnectRequest):
    """Connect digital twin to a simulation using its key."""
    simulation_key = request.simulation_key
    
    # Validate key format
    if not simulation_key.startswith("SIM-"):
        raise HTTPException(status_code=400, detail="Invalid simulation key format")

    twin_connections[simulation_key] = {
        "status": "connected",
        "simulation_key": simulation_key,
        "sync_enabled": True,
    }

    return {
        "status": "connected",
        "simulation_key": simulation_key,
        "websocket_url": f"/ws/twin/{simulation_key}",
        "message": "Digital twin connected. Use WebSocket for real-time sync.",
    }


@router.get("/state/{simulation_key}")
async def get_twin_state(simulation_key: str):
    """Get current digital twin state."""
    connection = twin_connections.get(simulation_key)
    if not connection:
        raise HTTPException(status_code=404, detail="Twin not connected")

    return {
        "simulation_key": simulation_key,
        "status": connection["status"],
        "sync_enabled": connection["sync_enabled"],
    }


@router.post("/sync/{simulation_key}")
async def trigger_sync(simulation_key: str):
    """Manually trigger a twin synchronization."""
    connection = twin_connections.get(simulation_key)
    if not connection:
        raise HTTPException(status_code=404, detail="Twin not connected")

    return {
        "status": "sync_triggered",
        "simulation_key": simulation_key,
    }


@router.delete("/disconnect/{simulation_key}")
async def disconnect_twin(simulation_key: str):
    """Disconnect digital twin from simulation."""
    if simulation_key in twin_connections:
        del twin_connections[simulation_key]
    return {"status": "disconnected"}
