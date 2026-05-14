"""
AI Analytics Engine
Anomaly detection, predictive maintenance, and optimization recommendations.
"""

import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random


class AIAnalyticsEngine:
    """AI-powered analytics for industrial telemetry data."""

    def __init__(self):
        self.telemetry_history: Dict[str, List[dict]] = {}
        self.anomaly_thresholds = {
            "temperature": {"warning": 90, "critical": 120},
            "vibration": {"warning": 15, "critical": 25},
            "pressure": {"warning": 8, "critical": 12},
            "efficiency": {"warning": 60, "critical": 40},
            "failure_probability": {"warning": 40, "critical": 70},
        }

    def ingest_telemetry(self, machine_id: str, data: dict):
        """Store telemetry for analysis."""
        if machine_id not in self.telemetry_history:
            self.telemetry_history[machine_id] = []
        self.telemetry_history[machine_id].append(data)
        # Keep last 1000 points
        self.telemetry_history[machine_id] = self.telemetry_history[machine_id][-1000:]

    def detect_anomalies(self, machine_id: str) -> List[dict]:
        """Detect anomalies in machine telemetry."""
        history = self.telemetry_history.get(machine_id, [])
        if len(history) < 10:
            return []

        anomalies = []
        latest = history[-1]

        # Temperature anomaly
        if latest.get("temperature", 0) > self.anomaly_thresholds["temperature"]["critical"]:
            anomalies.append({
                "type": "overheating",
                "severity": "critical",
                "confidence": 0.95,
                "value": latest["temperature"],
                "threshold": self.anomaly_thresholds["temperature"]["critical"],
                "description": f"Temperature at {latest['temperature']:.1f}°C exceeds critical threshold",
                "recommended_action": "Immediate shutdown and cooling system inspection",
            })
        elif latest.get("temperature", 0) > self.anomaly_thresholds["temperature"]["warning"]:
            anomalies.append({
                "type": "high_temperature",
                "severity": "warning",
                "confidence": 0.85,
                "value": latest["temperature"],
                "threshold": self.anomaly_thresholds["temperature"]["warning"],
                "description": f"Temperature at {latest['temperature']:.1f}°C approaching critical level",
                "recommended_action": "Reduce load and monitor cooling system",
            })

        # Vibration anomaly
        if latest.get("vibration", 0) > self.anomaly_thresholds["vibration"]["critical"]:
            anomalies.append({
                "type": "abnormal_vibration",
                "severity": "critical",
                "confidence": 0.92,
                "value": latest["vibration"],
                "threshold": self.anomaly_thresholds["vibration"]["critical"],
                "description": f"Vibration at {latest['vibration']:.1f} mm/s indicates mechanical failure",
                "recommended_action": "Stop machine immediately, inspect bearings and alignment",
            })

        # Pressure anomaly
        if latest.get("pressure", 0) > self.anomaly_thresholds["pressure"]["critical"]:
            anomalies.append({
                "type": "pressure_anomaly",
                "severity": "critical",
                "confidence": 0.90,
                "value": latest["pressure"],
                "threshold": self.anomaly_thresholds["pressure"]["critical"],
                "description": f"Pressure at {latest['pressure']:.1f} bar exceeds safety limit",
                "recommended_action": "Activate pressure relief, reduce input flow",
            })

        # Efficiency drop (using trend analysis)
        if len(history) >= 20:
            recent_eff = [h.get("efficiency_score", 90) for h in history[-20:]]
            eff_trend = recent_eff[-1] - recent_eff[0]
            if eff_trend < -15:
                anomalies.append({
                    "type": "production_slowdown",
                    "severity": "warning",
                    "confidence": 0.78,
                    "value": recent_eff[-1],
                    "threshold": None,
                    "description": f"Efficiency dropped {abs(eff_trend):.0f}% over recent period",
                    "recommended_action": "Check for material blockage or component degradation",
                })

        return anomalies

    def predict_maintenance(self, machine_id: str) -> List[dict]:
        """Predict maintenance needs based on wear patterns."""
        history = self.telemetry_history.get(machine_id, [])
        if len(history) < 30:
            return []

        predictions = []

        # Analyze wear trend
        wear_values = [100 - h.get("maintenance_score", 90) for h in history[-30:]]
        if len(wear_values) >= 2:
            wear_rate = (wear_values[-1] - wear_values[0]) / len(wear_values)
            current_wear = wear_values[-1]

            if wear_rate > 0 and current_wear > 50:
                # Predict when wear reaches 90%
                remaining = (90 - current_wear) / max(wear_rate, 0.001)
                failure_hours = remaining * (1 / 3600)  # Convert ticks to hours approx

                predictions.append({
                    "component": "primary_wear_component",
                    "current_wear": round(current_wear, 1),
                    "wear_rate": round(wear_rate, 4),
                    "predicted_failure_hours": round(max(1, failure_hours), 1),
                    "confidence": min(0.95, 0.6 + current_wear / 200),
                    "recommended_action": "Schedule replacement within predicted timeframe",
                })

        # Vibration-based bearing prediction
        vibration_values = [h.get("vibration", 2) for h in history[-30:]]
        avg_vibration = np.mean(vibration_values)
        if avg_vibration > 10:
            predictions.append({
                "component": "bearings",
                "current_wear": round(min(100, avg_vibration * 4), 1),
                "wear_rate": round(np.std(vibration_values), 3),
                "predicted_failure_hours": round(max(1, (25 - avg_vibration) * 10), 1),
                "confidence": 0.82,
                "recommended_action": "Inspect and replace bearings",
            })

        return predictions

    def get_recommendations(self, machine_id: str, machine_name: str) -> List[dict]:
        """Generate AI-powered optimization recommendations."""
        history = self.telemetry_history.get(machine_id, [])
        if not history:
            return []

        recommendations = []
        latest = history[-1]

        # Energy optimization
        energy = latest.get("energy_consumption", 0)
        efficiency = latest.get("efficiency_score", 90)
        if energy > 50 and efficiency < 80:
            recommendations.append({
                "id": f"rec_energy_{machine_id}",
                "type": "energy",
                "priority": "medium",
                "title": "Energy Optimization Available",
                "description": f"{machine_name} consuming {energy:.1f} kW at {efficiency:.0f}% efficiency. "
                              f"Load balancing could reduce consumption by 10-15%.",
                "machine_id": machine_id,
                "estimated_impact": "Estimated $200-500/month savings",
            })

        # Throughput optimization
        throughput = latest.get("throughput", 0)
        if efficiency > 85 and throughput < 500:
            recommendations.append({
                "id": f"rec_throughput_{machine_id}",
                "type": "throughput",
                "priority": "low",
                "title": "Throughput Increase Possible",
                "description": f"{machine_name} running efficiently at {efficiency:.0f}%. "
                              f"Parameters can be adjusted to increase throughput by 10-20%.",
                "machine_id": machine_id,
                "estimated_impact": "Potential 15% production increase",
            })

        # Maintenance scheduling
        failure_prob = latest.get("failure_probability", 0)
        if failure_prob > 30:
            recommendations.append({
                "id": f"rec_maint_{machine_id}",
                "type": "maintenance",
                "priority": "high" if failure_prob > 50 else "medium",
                "title": "Preventive Maintenance Recommended",
                "description": f"{machine_name} failure probability at {failure_prob:.0f}%. "
                              f"Schedule maintenance to prevent unplanned downtime.",
                "machine_id": machine_id,
                "estimated_impact": "Avoid 4-8 hours unplanned downtime",
            })

        return recommendations


# Singleton instance
ai_engine = AIAnalyticsEngine()
