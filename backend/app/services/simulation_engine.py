"""
Industrial Simulation Engine
Generates realistic machine telemetry based on physics-based models.
"""

import asyncio
import random
import math
import time
from typing import Dict, Optional, Any
from dataclasses import dataclass, field


@dataclass
class MachineSimState:
    temperature: float = 25.0
    rpm: float = 0.0
    pressure: float = 1.0
    throughput: float = 0.0
    energy_consumption: float = 0.0
    efficiency: float = 90.0
    failure_probability: float = 2.0
    vibration: float = 2.0
    wear_level: float = 5.0
    material_flow: float = 0.0
    uptime: float = 0.0


class SimulationInstance:
    """A single running simulation with multiple machines."""

    def __init__(self, simulation_key: str, machines: list, tick_rate: int = 1000):
        self.key = simulation_key
        self.machines = machines
        self.tick_rate = tick_rate / 1000.0  # Convert to seconds
        self.running = False
        self.states: Dict[str, MachineSimState] = {}
        self.task: Optional[asyncio.Task] = None
        self._initialize_states()

    def _initialize_states(self):
        for machine in self.machines:
            machine_id = machine.get("id", f"machine_{random.randint(1000, 9999)}")
            self.states[machine_id] = MachineSimState(
                temperature=25 + random.uniform(0, 10),
                efficiency=85 + random.uniform(0, 10),
                failure_probability=random.uniform(1, 5),
                wear_level=random.uniform(5, 20),
            )

    async def start(self, broadcast_callback):
        """Start the simulation loop."""
        self.running = True
        self.task = asyncio.create_task(self._run_loop(broadcast_callback))

    async def stop(self):
        """Stop the simulation."""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

    async def _run_loop(self, broadcast_callback):
        """Main simulation loop."""
        while self.running:
            telemetry_batch = {}

            for machine in self.machines:
                machine_id = machine.get("id")
                machine_type = machine.get("type", "generic")
                params = machine.get("parameters", {})

                state = self.states.get(machine_id)
                if not state:
                    continue

                # Simulate based on machine type
                updated_state = self._simulate(machine_type, params, state)
                self.states[machine_id] = updated_state

                # Build telemetry payload
                telemetry_batch[machine_id] = {
                    "machine_id": machine_id,
                    "timestamp": time.time(),
                    "temperature": round(updated_state.temperature, 2),
                    "rpm": round(updated_state.rpm, 1),
                    "pressure": round(updated_state.pressure, 3),
                    "throughput": round(updated_state.throughput, 2),
                    "energy_consumption": round(updated_state.energy_consumption, 2),
                    "machine_state": self._get_state_label(updated_state),
                    "failure_probability": round(updated_state.failure_probability, 1),
                    "maintenance_score": round(100 - updated_state.wear_level, 1),
                    "material_quantity": round(updated_state.material_flow, 2),
                    "efficiency_score": round(updated_state.efficiency, 1),
                    "sensor_health": round(95 + random.uniform(0, 5), 1),
                    "vibration": round(updated_state.vibration, 2),
                }

            # Broadcast to connected clients
            await broadcast_callback(self.key, telemetry_batch)
            await asyncio.sleep(self.tick_rate)

    def _simulate(self, machine_type: str, params: dict, state: MachineSimState) -> MachineSimState:
        """Route simulation to appropriate model."""
        state.uptime += self.tick_rate

        if machine_type == "battery_shredder":
            return self._sim_shredder(params, state)
        elif machine_type == "heated_chemical_tank":
            return self._sim_chemical_tank(params, state)
        elif machine_type == "filter_press":
            return self._sim_filter_press(params, state)
        elif machine_type == "steam_boiler":
            return self._sim_boiler(params, state)
        elif machine_type == "textile_dyeing_machine":
            return self._sim_dyeing(params, state)
        elif machine_type == "fabric_cutting_machine":
            return self._sim_cutting(params, state)
        else:
            return self._sim_generic(params, state)

    def _sim_shredder(self, params: dict, state: MachineSimState) -> MachineSimState:
        rpm = params.get("rpm", 5000)
        target_temp = 40 + (rpm / 10000) * 80

        state.temperature += (target_temp - state.temperature) * 0.1 + random.uniform(-1, 1)
        state.rpm = rpm + random.uniform(-50, 50)
        state.wear_level = min(100, state.wear_level + 0.01 + (0.05 if rpm > 7000 else 0))
        state.vibration = 2 + state.wear_level * 0.3 + random.uniform(-1, 1)
        state.efficiency = max(40, 95 - state.wear_level * 0.5)
        state.energy_consumption = 30 + (rpm / 10000) * 100 + random.uniform(-3, 3)
        state.throughput = params.get("shredding_rate", 800) * (state.efficiency / 100)
        state.material_flow = state.throughput
        state.pressure = 1 + random.uniform(0, 0.5)

        if rpm > 7000:
            state.failure_probability = min(95, state.failure_probability + 0.3)
        if state.temperature > 100:
            state.failure_probability = min(95, state.failure_probability + 0.5)

        return state

    def _sim_chemical_tank(self, params: dict, state: MachineSimState) -> MachineSimState:
        target_temp = params.get("tank_temperature", 85)
        pressure = params.get("pressure", 3)

        state.temperature += (target_temp - state.temperature) * 0.05 + random.uniform(-0.5, 0.5)
        state.pressure = pressure + random.uniform(-0.2, 0.2)
        state.rpm = params.get("mixing_speed", 120)

        temp_eff = 90 if 70 < state.temperature < 100 else 70
        state.efficiency = temp_eff + random.uniform(-3, 3)
        state.energy_consumption = params.get("heating_coil_power", 45) + random.uniform(-3, 3)
        state.throughput = params.get("tank_volume", 2000) * 0.01 * (state.efficiency / 100)
        state.material_flow = state.throughput
        state.vibration = 1 + random.uniform(0, 2)

        if state.temperature > 150:
            state.failure_probability = min(90, state.failure_probability + 1)

        return state

    def _sim_filter_press(self, params: dict, state: MachineSimState) -> MachineSimState:
        pressure = params.get("pressure_level", 8)

        state.pressure = pressure + random.uniform(-0.5, 0.5)
        state.temperature = 30 + random.uniform(-3, 3)
        state.wear_level = min(100, state.wear_level + 0.02)
        state.efficiency = max(50, 95 - state.wear_level * 0.4)
        state.energy_consumption = 15 + pressure * 2 + random.uniform(-2, 2)
        state.throughput = params.get("slurry_input", 500) * (state.efficiency / 100)
        state.material_flow = state.throughput * 0.85
        state.rpm = 0
        state.vibration = 1 + random.uniform(0, 1)

        if state.wear_level > 70:
            state.failure_probability = min(80, state.failure_probability + 0.3)

        return state

    def _sim_boiler(self, params: dict, state: MachineSimState) -> MachineSimState:
        target_pressure = params.get("steam_pressure", 6)
        safety_limit = params.get("safety_pressure", 12)

        state.pressure = target_pressure + random.uniform(-0.3, 0.3)
        state.temperature = 100 + state.pressure * 15 + random.uniform(-3, 3)
        state.energy_consumption = params.get("fuel_consumption", 30) * 0.8 + random.uniform(-3, 3)
        state.efficiency = 85 + random.uniform(-5, 5)
        state.throughput = params.get("heat_output", 200) * (state.efficiency / 100)
        state.rpm = 0
        state.vibration = 2 + random.uniform(0, 3)
        state.material_flow = state.throughput

        if state.pressure > safety_limit * 0.8:
            state.failure_probability = min(90, state.failure_probability + 0.5)

        return state

    def _sim_dyeing(self, params: dict, state: MachineSimState) -> MachineSimState:
        target_temp = params.get("dye_temperature", 80)

        state.temperature += (target_temp - state.temperature) * 0.08 + random.uniform(-1, 1)
        state.rpm = params.get("rotation_speed", 30) + random.uniform(-3, 3)
        state.pressure = 1 + random.uniform(0, 0.3)
        state.energy_consumption = params.get("heating_load", 35) + random.uniform(-2, 2)
        state.efficiency = 80 + random.uniform(-5, 5)
        state.throughput = 50 + state.efficiency * 0.5
        state.material_flow = state.throughput
        state.vibration = 1 + random.uniform(0, 2)

        if state.temperature > 120:
            state.failure_probability = min(70, state.failure_probability + 0.3)

        return state

    def _sim_cutting(self, params: dict, state: MachineSimState) -> MachineSimState:
        speed = params.get("cutting_speed", 15)

        state.temperature = 25 + speed * 1.5 + random.uniform(-2, 2)
        state.rpm = speed * 100 + random.uniform(-30, 30)
        state.wear_level = min(100, state.wear_level + 0.015)
        state.efficiency = max(60, 95 - state.wear_level * 0.3)
        state.energy_consumption = params.get("power_consumption", 8) + speed * 0.3 + random.uniform(-1, 1)
        state.throughput = speed * (state.efficiency / 100) * 10
        state.material_flow = state.throughput
        state.pressure = 1
        state.vibration = 2 + state.wear_level * 0.1 + random.uniform(-1, 1)

        return state

    def _sim_generic(self, params: dict, state: MachineSimState) -> MachineSimState:
        state.temperature = max(20, min(120, state.temperature + random.uniform(-2, 2)))
        state.rpm = 1000 + random.uniform(-100, 100)
        state.pressure = 1 + random.uniform(0, 2)
        state.efficiency = max(60, min(99, state.efficiency + random.uniform(-2, 2)))
        state.energy_consumption = 20 + random.uniform(-5, 5)
        state.throughput = 100 + random.uniform(-10, 10)
        state.material_flow = state.throughput
        state.vibration = 2 + random.uniform(0, 3)
        state.wear_level = min(100, state.wear_level + 0.01)
        return state

    def _get_state_label(self, state: MachineSimState) -> str:
        if state.failure_probability > 70:
            return "critical"
        if state.failure_probability > 40 or state.temperature > 100:
            return "warning"
        if state.efficiency < 50:
            return "degraded"
        return "running"

    def get_current_state(self) -> dict:
        """Get current state of all machines."""
        return {
            machine_id: {
                "temperature": state.temperature,
                "rpm": state.rpm,
                "pressure": state.pressure,
                "throughput": state.throughput,
                "energy_consumption": state.energy_consumption,
                "efficiency": state.efficiency,
                "failure_probability": state.failure_probability,
                "vibration": state.vibration,
                "wear_level": state.wear_level,
                "state": self._get_state_label(state),
            }
            for machine_id, state in self.states.items()
        }


class SimulationManager:
    """Manages multiple simulation instances."""

    def __init__(self):
        self.simulations: Dict[str, SimulationInstance] = {}

    def status(self) -> dict:
        return {
            "active_simulations": len([s for s in self.simulations.values() if s.running]),
            "total_simulations": len(self.simulations),
        }

    def create_simulation(self, key: str, machines: list, tick_rate: int = 1000) -> SimulationInstance:
        sim = SimulationInstance(key, machines, tick_rate)
        self.simulations[key] = sim
        return sim

    async def start_simulation(self, key: str, ws_manager) -> bool:
        sim = self.simulations.get(key)
        if not sim:
            return False

        async def broadcast(sim_key, telemetry_batch):
            await ws_manager.broadcast(sim_key, {
                "type": "telemetry",
                "data": telemetry_batch,
            })

        await sim.start(broadcast)
        return True

    async def stop_simulation(self, key: str) -> bool:
        sim = self.simulations.get(key)
        if not sim:
            return False
        await sim.stop()
        return True

    async def pause_simulation(self, key: str) -> bool:
        sim = self.simulations.get(key)
        if not sim:
            return False
        sim.running = False
        return True

    def get_state(self, key: str) -> dict:
        sim = self.simulations.get(key)
        if not sim:
            return {}
        return sim.get_current_state()

    async def stop_all(self):
        for sim in self.simulations.values():
            await sim.stop()
