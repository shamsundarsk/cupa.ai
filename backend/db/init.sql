-- Porygon Industrial OS Database Schema
-- PostgreSQL + TimescaleDB

-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'operator',
    organization VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Factories table
CREATE TABLE IF NOT EXISTS factories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(50) NOT NULL,
    layout VARCHAR(50) DEFAULT 'medium',
    description TEXT,
    status VARCHAR(50) DEFAULT 'configured',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Lines
CREATE TABLE IF NOT EXISTS production_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    production_line_id UUID REFERENCES production_lines(id),
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}',
    position JSONB DEFAULT '{"x": 0, "y": 0}',
    connections UUID[] DEFAULT '{}',
    state VARCHAR(50) DEFAULT 'idle',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Machine Telemetry (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS machine_telemetry (
    time TIMESTAMPTZ NOT NULL,
    machine_id VARCHAR(100) NOT NULL,
    temperature DOUBLE PRECISION,
    rpm DOUBLE PRECISION,
    pressure DOUBLE PRECISION,
    throughput DOUBLE PRECISION,
    energy_consumption DOUBLE PRECISION,
    machine_state VARCHAR(50),
    failure_probability DOUBLE PRECISION,
    maintenance_score DOUBLE PRECISION,
    material_quantity DOUBLE PRECISION,
    efficiency_score DOUBLE PRECISION,
    sensor_health DOUBLE PRECISION,
    vibration DOUBLE PRECISION
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('machine_telemetry', 'time', if_not_exists => TRUE);

-- Create index for fast machine lookups
CREATE INDEX IF NOT EXISTS idx_telemetry_machine_time 
    ON machine_telemetry (machine_id, time DESC);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    key VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    tick_rate INTEGER DEFAULT 1000,
    config JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital Twins table
CREATE TABLE IF NOT EXISTS digital_twins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id),
    factory_id UUID REFERENCES factories(id),
    status VARCHAR(50) DEFAULT 'disconnected',
    last_sync TIMESTAMPTZ,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Reports table
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technician Deployments
CREATE TABLE IF NOT EXISTS technician_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES users(id),
    factory_id UUID REFERENCES factories(id),
    status VARCHAR(50) DEFAULT 'pending',
    deployment_config JSONB DEFAULT '{}',
    deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Continuous aggregates for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    machine_id,
    AVG(temperature) as avg_temperature,
    AVG(efficiency_score) as avg_efficiency,
    AVG(energy_consumption) as avg_energy,
    MAX(failure_probability) as max_failure_prob,
    COUNT(*) as data_points
FROM machine_telemetry
GROUP BY bucket, machine_id
WITH NO DATA;

-- Refresh policy
SELECT add_continuous_aggregate_policy('telemetry_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);
