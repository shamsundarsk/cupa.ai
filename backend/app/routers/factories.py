"""Factory management API routes."""

from fastapi import APIRouter, HTTPException
from app.models.schemas import FactoryCreate, FactoryResponse
from datetime import datetime
from typing import List
import uuid

router = APIRouter()

# In-memory store
factories_db: dict = {}


@router.post("/", response_model=FactoryResponse)
async def create_factory(factory: FactoryCreate):
    """Create a new factory."""
    factory_id = str(uuid.uuid4())
    factory_data = {
        "id": factory_id,
        "name": factory.name,
        "industry": factory.industry,
        "layout": factory.layout,
        "description": factory.description,
        "machine_count": 0,
        "status": "configured",
        "created_at": datetime.utcnow(),
    }
    factories_db[factory_id] = factory_data
    return FactoryResponse(**factory_data)


@router.get("/", response_model=List[FactoryResponse])
async def list_factories():
    """List all factories."""
    return [FactoryResponse(**f) for f in factories_db.values()]


@router.get("/{factory_id}", response_model=FactoryResponse)
async def get_factory(factory_id: str):
    """Get factory details."""
    factory = factories_db.get(factory_id)
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    return FactoryResponse(**factory)


@router.delete("/{factory_id}")
async def delete_factory(factory_id: str):
    """Delete a factory."""
    if factory_id not in factories_db:
        raise HTTPException(status_code=404, detail="Factory not found")
    del factories_db[factory_id]
    return {"status": "deleted"}
