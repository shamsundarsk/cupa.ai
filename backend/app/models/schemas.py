"""
Pydantic schemas for the Porygon Industrial OS API.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class Industry(str, Enum):
    BATTERY_RECYCLING = "battery_recycling"
    APPAREL_TEXTILE = "apparel_textile"


class MachineState(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    WARNING = "warning"
    CRITICAL = "critical"
    MAINTENANCE = "maintenance"


class AlertType(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class UserRole(str, Enum):
    ADMIN = "admin"
    FACTORY_OWNER = "factory_owner"
    PLANT_MANAGER = "plant_manager"
    TECHNICIAN = "technician"
    OPERATOR = "operator"


# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole = UserRole.OPERATOR
    organization: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    organization: Optional[str] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Factory ──────────────────────────────────────────────────────────────────

class FactoryCreate(BaseModel):
    name: str
    industry: Industry
    layout: str = "medium"
    description: Optional[str] = None


class FactoryResponse(BaseModel):
    id: str
    name: str
    industry: Industry
    layout: str
    machine_count: int = 0
    status: str = "configured"
    created_at: datetime


# ─── Machine ──────────────────────────────────────────────────────────────────

class MachineCreate(BaseModel):
    factory_id: str
    type: str
    name: str
    parameters: Dict[str, float] = {}
    position: Dict[str, float] = {"x": 0, "y": 0}


class MachineResponse(BaseModel):
    id: str
    factory_id: str
    type: str
    name: str
    parameters: Dict[str, float]
    position: Dict[str, float]
    connections: List[str] = []
    state: MachineState = MachineState.IDLE


# ─── Telemetry ────────────────────────────────────────────────────────────────

class TelemetryPoint(BaseModel):
    machine_id: str
    timestamp: Optional[datetime] = None
    temperature: float
    rpm: float
    pressure: float
    throughput: float
    energy_consumption: float
    machine_state: str
    failure_probability: float
    maintenance_score: float
    material_quantity: float
    efficiency_score: float
    sensor_health: float
    vibration: float


class TelemetryQuery(BaseModel):
    machine_id: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    limit: int = 100


# ─── Simulation ───────────────────────────────────────────────────────────────

class SimulationCreate(BaseModel):
    factory_id: str
    tick_rate: int = 1000  # ms
    machines: List[str] = []  # machine IDs


class SimulationResponse(BaseModel):
    id: str
    factory_id: str
    key: str  # Unique simulation key (e.g., SIM-BATT-82912-X92)
    status: str
    tick_rate: int
    machine_count: int
    started_at: Optional[datetime] = None
    created_at: datetime


class SimulationCommand(BaseModel):
    command: str  # start, stop, pause, resume
    parameters: Optional[Dict] = None


# ─── AI ───────────────────────────────────────────────────────────────────────

class AnomalyDetection(BaseModel):
    machine_id: str
    anomaly_type: str
    severity: str
    confidence: float
    description: str
    timestamp: datetime
    recommended_action: str


class PredictiveMaintenance(BaseModel):
    machine_id: str
    component: str
    predicted_failure_date: datetime
    confidence: float
    current_wear: float
    recommended_action: str


class AIRecommendation(BaseModel):
    id: str
    type: str  # maintenance, energy, production, throughput
    priority: str  # high, medium, low
    title: str
    description: str
    machine_id: str
    estimated_impact: str
    timestamp: datetime


# ─── Digital Twin ─────────────────────────────────────────────────────────────

class TwinConnectRequest(BaseModel):
    simulation_key: str


class TwinState(BaseModel):
    simulation_key: str
    factory_layout: Dict
    machines: List[Dict]
    telemetry: Dict[str, TelemetryPoint]
    connections: List[Dict]


# ─── Alert ────────────────────────────────────────────────────────────────────

class AlertResponse(BaseModel):
    id: str
    machine_id: str
    machine_name: str
    type: AlertType
    category: str
    message: str
    timestamp: datetime
    acknowledged: bool = False


# ─── MQTT ─────────────────────────────────────────────────────────────────────

class MQTTConfig(BaseModel):
    host: str = "localhost"
    port: int = 1883
    topic_prefix: str = "factory"
    username: Optional[str] = None
    password: Optional[str] = None
