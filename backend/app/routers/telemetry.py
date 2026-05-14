"""Telemetry API routes — backed by TimescaleDB."""

from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import TelemetryPoint
from typing import List, Optional
import os
import asyncpg

router = APIRouter()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://porygon:porygon@postgres:5432/porygon_db"
)

_pool: Optional[asyncpg.Pool] = None


async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    return _pool


@router.post("/ingest")
async def ingest_telemetry(data: TelemetryPoint):
    """Ingest a single telemetry point into TimescaleDB."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO machine_telemetry (
                    time, machine_id, temperature, rpm, pressure, throughput,
                    energy_consumption, machine_state, failure_probability,
                    maintenance_score, material_quantity, efficiency_score,
                    sensor_health, vibration
                ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                """,
                data.machine_id, data.temperature, data.rpm, data.pressure,
                data.throughput, data.energy_consumption, data.machine_state,
                data.failure_probability, data.maintenance_score,
                data.material_quantity, data.efficiency_score,
                data.sensor_health, data.vibration,
            )
        return {"status": "ingested", "machine_id": data.machine_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/ingest/batch")
async def ingest_batch(data: List[TelemetryPoint]):
    """Ingest multiple telemetry points — used by the frontend simulator."""
    if not data:
        return {"status": "ingested", "count": 0}
    try:
        pool = await get_pool()
        rows = [
            (
                p.machine_id, p.temperature, p.rpm, p.pressure, p.throughput,
                p.energy_consumption, p.machine_state, p.failure_probability,
                p.maintenance_score, p.material_quantity, p.efficiency_score,
                p.sensor_health, p.vibration,
            )
            for p in data
        ]
        async with pool.acquire() as conn:
            await conn.executemany(
                """
                INSERT INTO machine_telemetry (
                    time, machine_id, temperature, rpm, pressure, throughput,
                    energy_consumption, machine_state, failure_probability,
                    maintenance_score, material_quantity, efficiency_score,
                    sensor_health, vibration
                ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                """,
                rows,
            )
        return {"status": "ingested", "count": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch ingestion failed: {str(e)}")


@router.get("/machine/{machine_id}")
async def get_machine_telemetry(
    machine_id: str,
    limit: int = Query(default=100, le=10000),
):
    """Get recent telemetry data for a machine from TimescaleDB."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT time, temperature, rpm, pressure, throughput,
                       energy_consumption, machine_state, failure_probability,
                       efficiency_score, vibration
                FROM machine_telemetry
                WHERE machine_id = $1
                ORDER BY time DESC
                LIMIT $2
                """,
                machine_id, limit,
            )
        return {
            "machine_id": machine_id,
            "count": len(rows),
            "data": [dict(r) for r in rows],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@router.get("/machine/{machine_id}/aggregates")
async def get_aggregates(machine_id: str, hours: int = 24):
    """Hourly aggregates via TimescaleDB continuous aggregate."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT bucket, avg_temperature, avg_efficiency, avg_energy,
                       max_failure_prob, data_points
                FROM telemetry_hourly
                WHERE machine_id = $1
                  AND bucket > NOW() - INTERVAL '{int(hours)} hours'
                ORDER BY bucket DESC
                """,
                machine_id,
            )
        return {"machine_id": machine_id, "data": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aggregate query failed: {str(e)}")


@router.get("/summary")
async def get_telemetry_summary():
    """Latest telemetry point per machine."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT DISTINCT ON (machine_id)
                    machine_id, time, temperature, efficiency_score, machine_state
                FROM machine_telemetry
                ORDER BY machine_id, time DESC
                """
            )
        return {"machines": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary query failed: {str(e)}")
