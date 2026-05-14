"""Machine management API routes."""

from fastapi import APIRouter, HTTPException
from app.models.schemas import MachineCreate, MachineResponse, MachineState
from typing import List
import uuid

router = APIRouter()

# In-memory store
machines_db: dict = {}


@router.post("/", response_model=MachineResponse)
async def create_machine(machine: MachineCreate):
    """Add a machine to a factory."""
    machine_id = str(uuid.uuid4())
    machine_data = {
        "id": machine_id,
        "factory_id": machine.factory_id,
        "type": machine.type,
        "name": machine.name,
        "parameters": machine.parameters,
        "position": machine.position,
        "connections": [],
        "state": MachineState.IDLE,
    }
    machines_db[machine_id] = machine_data
    return MachineResponse(**machine_data)


@router.get("/factory/{factory_id}", response_model=List[MachineResponse])
async def list_factory_machines(factory_id: str):
    """List all machines in a factory."""
    return [
        MachineResponse(**m)
        for m in machines_db.values()
        if m["factory_id"] == factory_id
    ]


@router.get("/{machine_id}", response_model=MachineResponse)
async def get_machine(machine_id: str):
    """Get machine details."""
    machine = machines_db.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return MachineResponse(**machine)


@router.put("/{machine_id}/parameters")
async def update_machine_parameters(machine_id: str, parameters: dict):
    """Update machine operating parameters."""
    machine = machines_db.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    machine["parameters"].update(parameters)
    return MachineResponse(**machine)


@router.post("/{machine_id}/connect/{target_id}")
async def connect_machines(machine_id: str, target_id: str):
    """Connect machine output to another machine's input."""
    source = machines_db.get(machine_id)
    target = machines_db.get(target_id)
    if not source or not target:
        raise HTTPException(status_code=404, detail="Machine not found")
    if target_id not in source["connections"]:
        source["connections"].append(target_id)
    return {"status": "connected", "source": machine_id, "target": target_id}


@router.delete("/{machine_id}")
async def delete_machine(machine_id: str):
    """Remove a machine."""
    if machine_id not in machines_db:
        raise HTTPException(status_code=404, detail="Machine not found")
    del machines_db[machine_id]
    return {"status": "deleted"}
