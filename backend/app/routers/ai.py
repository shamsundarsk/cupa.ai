"""AI Analytics API routes."""

from fastapi import APIRouter, HTTPException
from app.services.ai_engine import ai_engine
from typing import List

router = APIRouter()


@router.get("/anomalies/{machine_id}")
async def detect_anomalies(machine_id: str):
    """Detect anomalies for a specific machine."""
    anomalies = ai_engine.detect_anomalies(machine_id)
    return {
        "machine_id": machine_id,
        "anomaly_count": len(anomalies),
        "anomalies": anomalies,
    }


@router.get("/maintenance/{machine_id}")
async def predict_maintenance(machine_id: str):
    """Get predictive maintenance predictions for a machine."""
    predictions = ai_engine.predict_maintenance(machine_id)
    return {
        "machine_id": machine_id,
        "prediction_count": len(predictions),
        "predictions": predictions,
    }


@router.get("/recommendations/{machine_id}")
async def get_recommendations(machine_id: str, machine_name: str = "Machine"):
    """Get AI-powered recommendations for a machine."""
    recommendations = ai_engine.get_recommendations(machine_id, machine_name)
    return {
        "machine_id": machine_id,
        "recommendation_count": len(recommendations),
        "recommendations": recommendations,
    }


@router.get("/health-score/{machine_id}")
async def get_health_score(machine_id: str):
    """Calculate overall machine health score."""
    history = ai_engine.telemetry_history.get(machine_id, [])
    if not history:
        return {"machine_id": machine_id, "health_score": None, "message": "No data available"}

    latest = history[-1]
    
    # Composite health score
    temp_score = max(0, 100 - max(0, latest.get("temperature", 25) - 60) * 2)
    eff_score = latest.get("efficiency_score", 90)
    fail_score = 100 - latest.get("failure_probability", 0)
    maint_score = latest.get("maintenance_score", 90)
    vib_score = max(0, 100 - latest.get("vibration", 2) * 4)

    health_score = (temp_score * 0.2 + eff_score * 0.25 + fail_score * 0.25 + 
                   maint_score * 0.15 + vib_score * 0.15)

    return {
        "machine_id": machine_id,
        "health_score": round(health_score, 1),
        "components": {
            "temperature": round(temp_score, 1),
            "efficiency": round(eff_score, 1),
            "failure_risk": round(fail_score, 1),
            "maintenance": round(maint_score, 1),
            "vibration": round(vib_score, 1),
        },
    }


@router.get("/factory-kpis")
async def get_factory_kpis():
    """Get factory-wide KPIs from AI analysis."""
    all_machines = ai_engine.telemetry_history
    
    if not all_machines:
        return {"status": "no_data", "kpis": {}}

    total_energy = 0
    total_throughput = 0
    avg_efficiency = 0
    machine_count = 0
    critical_count = 0

    for machine_id, history in all_machines.items():
        if history:
            latest = history[-1]
            total_energy += latest.get("energy_consumption", 0)
            total_throughput += latest.get("throughput", 0)
            avg_efficiency += latest.get("efficiency_score", 0)
            machine_count += 1
            if latest.get("failure_probability", 0) > 70:
                critical_count += 1

    avg_efficiency = avg_efficiency / max(machine_count, 1)

    return {
        "kpis": {
            "total_energy_consumption": round(total_energy, 2),
            "total_throughput": round(total_throughput, 2),
            "average_efficiency": round(avg_efficiency, 1),
            "active_machines": machine_count,
            "critical_machines": critical_count,
            "overall_health": round(avg_efficiency * 0.7 + (100 - critical_count / max(machine_count, 1) * 100) * 0.3, 1),
        },
    }
