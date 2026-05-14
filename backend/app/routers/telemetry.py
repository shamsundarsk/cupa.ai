"""Telemetry API routes."""

from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import TelemetryPoint
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# In-memory telemetry store (replace with TimescaleDB in production)
telemetry_store: dict = {}  # machine_id -> list of telemetry points


@router.post("/ingest")
async def ingest_telemetry(data: TelemetryPoint):
    """Ingest a telemetry data point."""
    machine_id = data.machine_id
    if machine_id not in telemetry_store:
        telemetry_store[machine_id] = []
    
    telemetry_store[machine_id].append(data.model_dump())
    # Keep last 10000 points per machine
    telemetry_store[machine_id] = telemetry_store[machine_id][-10000:]
    
    return {"status": "ingested", "machine_id": machine_id}


@router.post("/ingest/batch")
async def ingest_batch(data: List[TelemetryPoint]):
    """Ingest multiple telemetry points."""
    for point in data:
        machine_id = point.machine_id
        if machine_id not in telemetry_store:
            telemetry_store[machine_id] = []
        telemetry_store[machine_id].append(point.model_dump())
        telemetry_store[machine_id] = telemetry_store[machine_id][-10000:]
    
    return {"status": "ingested", "count": len(data)}


@router.get("/machine/{machine_id}")
async def get_machine_telemetry(
    machine_id: str,
    limit: int = Query(default=100, le=1000),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
):
    """Get telemetry data for a machine."""
    data = telemetry_store.get(machine_id, [])
    
    if start_time:
        data = [d for d in data if d["timestamp"] >= start_time]
    if end_time:
        data = [d for d in data if d["timestamp"] <= end_time]
    
    return {
        "machine_id": machine_id,
        "count": len(data[-limit:]),
        "data": data[-limit:],
    }


@router.get("/machine/{machine_id}/latest")
async def get_latest_telemetry(machine_id: str):
    """Get the latest telemetry point for a machine."""
    data = telemetry_store.get(machine_id, [])
    if not data:
        raise HTTPException(status_code=404, detail="No telemetry data found")
    return data[-1]


@router.get("/summary")
async def get_telemetry_summary():
    """Get summary of all machine telemetry."""
    summary = {}
    for machine_id, data in telemetry_store.items():
        if data:
            latest = data[-1]
            summary[machine_id] = {
                "latest_temperature": latest.get("temperature"),
                "latest_efficiency": latest.get("efficiency_score"),
                "latest_state": latest.get("machine_state"),
                "data_points": len(data),
            }
    return summary
