"""
WebSocket Connection Manager
Handles real-time connections for telemetry streaming and digital twin sync.
"""

from fastapi import WebSocket
from typing import Dict, List, Set
import json


class ConnectionManager:
    """Manages WebSocket connections grouped by simulation key."""

    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # ws_id -> machine_ids

    async def connect(self, websocket: WebSocket, simulation_key: str):
        await websocket.accept()
        if simulation_key not in self.connections:
            self.connections[simulation_key] = []
        self.connections[simulation_key].append(websocket)

    def disconnect(self, websocket: WebSocket, simulation_key: str):
        if simulation_key in self.connections:
            self.connections[simulation_key] = [
                ws for ws in self.connections[simulation_key] if ws != websocket
            ]
            if not self.connections[simulation_key]:
                del self.connections[simulation_key]

    async def subscribe(self, websocket: WebSocket, simulation_key: str, machine_ids: List[str]):
        ws_id = id(websocket)
        self.subscriptions[str(ws_id)] = set(machine_ids)

    async def broadcast(self, simulation_key: str, message: dict):
        """Broadcast message to all connections for a simulation key."""
        connections = self.connections.get(simulation_key, [])
        disconnected = []

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        # Clean up disconnected
        for ws in disconnected:
            self.disconnect(ws, simulation_key)

    async def send_to(self, websocket: WebSocket, message: dict):
        """Send message to a specific connection."""
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    def active_count(self) -> int:
        return sum(len(conns) for conns in self.connections.values())
