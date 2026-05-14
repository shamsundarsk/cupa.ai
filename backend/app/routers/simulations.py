"""Simulation management API routes."""

from fastapi import APIRouter, HTTPException
from app.models.schemas import SimulationCreate, SimulationResponse, SimulationCommand
from datetime import datetime
from typing import List
import uuid
import random
import string

router = APIRouter()

# In-memory store
simulations_db: dict = {}


def generate_simulation_key(industry: str = "battery") -> str:
    """Generate unique simulation key like SIM-BATT-82912-X92."""
    prefix = "BATT" if "batt" in industry.lower() else "TEXT"
    num = str(random.randint(10000, 99999))
    suffix = random.choice(string.ascii_uppercase) + str(random.randint(10, 99))
    return f"SIM-{prefix}-{num}-{suffix}"


@router.post("/", response_model=SimulationResponse)
async def create_simulation(sim: SimulationCreate):
    """Create a new simulation instance."""
    sim_id = str(uuid.uuid4())
    sim_key = generate_simulation_key()

    sim_data = {
        "id": sim_id,
        "factory_id": sim.factory_id,
        "key": sim_key,
        "status": "created",
        "tick_rate": sim.tick_rate,
        "machine_count": len(sim.machines),
        "machines": sim.machines,
        "started_at": None,
        "created_at": datetime.utcnow(),
    }
    simulations_db[sim_id] = sim_data
    return SimulationResponse(**{k: v for k, v in sim_data.items() if k != "machines"})


@router.get("/", response_model=List[SimulationResponse])
async def list_simulations():
    """List all simulations."""
    return [
        SimulationResponse(**{k: v for k, v in s.items() if k != "machines"})
        for s in simulations_db.values()
    ]


@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(simulation_id: str):
    """Get simulation details."""
    sim = simulations_db.get(simulation_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return SimulationResponse(**{k: v for k, v in sim.items() if k != "machines"})


@router.get("/key/{simulation_key}")
async def get_simulation_by_key(simulation_key: str):
    """Get simulation by its unique key."""
    for sim in simulations_db.values():
        if sim["key"] == simulation_key:
            return SimulationResponse(**{k: v for k, v in sim.items() if k != "machines"})
    raise HTTPException(status_code=404, detail="Simulation not found")


@router.post("/{simulation_id}/command")
async def simulation_command(simulation_id: str, cmd: SimulationCommand):
    """Send command to simulation (start, stop, pause)."""
    sim = simulations_db.get(simulation_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")

    if cmd.command == "start":
        sim["status"] = "running"
        sim["started_at"] = datetime.utcnow()
    elif cmd.command == "stop":
        sim["status"] = "stopped"
    elif cmd.command == "pause":
        sim["status"] = "paused"
    elif cmd.command == "resume":
        sim["status"] = "running"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown command: {cmd.command}")

    return {"status": sim["status"], "key": sim["key"]}


@router.delete("/{simulation_id}")
async def delete_simulation(simulation_id: str):
    """Delete a simulation."""
    if simulation_id not in simulations_db:
        raise HTTPException(status_code=404, detail="Simulation not found")
    del simulations_db[simulation_id]
    return {"status": "deleted"}
