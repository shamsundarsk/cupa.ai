import { MachineDefinition } from '@/types'

/**
 * Built-in machine catalog.
 *
 * `icon` is now a hint string passed through `resolveMachineIcon` so it works
 * uniformly for built-ins and AI-generated machines (no more emojis).
 */

export const BATTERY_RECYCLING_MACHINES: MachineDefinition[] = [
  {
    type: 'battery_intake_conveyor',
    name: 'Battery Intake Conveyor',
    industry: 'battery_recycling',
    category: 'Intake',
    icon: 'intake',
    parameters: [
      { key: 'intake_rate', label: 'Intake Rate', unit: 'kg/h', min: 100, max: 5000, default: 1000, editable: true },
      { key: 'conveyor_speed', label: 'Conveyor Speed', unit: 'm/min', min: 1, max: 30, default: 10, editable: true },
      { key: 'battery_weight', label: 'Battery Weight', unit: 'kg', min: 0.1, max: 50, default: 5, editable: false },
      { key: 'feed_quantity', label: 'Feed Quantity', unit: 'units/h', min: 10, max: 500, default: 100, editable: true },
      { key: 'sensor_temperature', label: 'Sensor Temperature', unit: '°C', min: 15, max: 80, default: 25, editable: false },
      { key: 'motor_load', label: 'Motor Load', unit: '%', min: 0, max: 100, default: 45, editable: false },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 50, default: 12, editable: false },
    ],
    outputs: ['Material throughput', 'Overload alerts', 'Heat generation', 'Conveyor efficiency', 'Downtime probability'],
  },
  {
    type: 'battery_shredder',
    name: 'Battery Shredder',
    industry: 'battery_recycling',
    category: 'Processing',
    icon: 'shredder',
    parameters: [
      { key: 'rpm', label: 'RPM', unit: 'rpm', min: 1000, max: 10000, default: 5000, editable: true },
      { key: 'motor_temperature', label: 'Motor Temperature', unit: '°C', min: 20, max: 150, default: 65, editable: false },
      { key: 'blade_wear', label: 'Blade Wear', unit: '%', min: 0, max: 100, default: 15, editable: false },
      { key: 'vibration', label: 'Vibration', unit: 'mm/s', min: 0, max: 50, default: 5, editable: false },
      { key: 'shredding_rate', label: 'Shredding Rate', unit: 'kg/h', min: 50, max: 3000, default: 800, editable: true },
      { key: 'material_density', label: 'Material Density', unit: 'kg/m³', min: 500, max: 5000, default: 2500, editable: true },
      { key: 'particle_size', label: 'Particle Size', unit: 'mm', min: 1, max: 50, default: 10, editable: true },
      { key: 'energy_usage', label: 'Energy Usage', unit: 'kW', min: 10, max: 200, default: 75, editable: false },
    ],
    outputs: ['Shredded material quantity', 'Machine efficiency', 'Failure prediction', 'Maintenance alerts'],
  },
  {
    type: 'magnetic_separator',
    name: 'Magnetic Separator',
    industry: 'battery_recycling',
    category: 'Separation',
    icon: 'magnetic',
    parameters: [
      { key: 'magnetic_field_strength', label: 'Field Strength', unit: 'T', min: 0.1, max: 2.0, default: 0.8, editable: true },
      { key: 'belt_speed', label: 'Belt Speed', unit: 'm/min', min: 1, max: 20, default: 8, editable: true },
      { key: 'separation_efficiency', label: 'Separation Efficiency', unit: '%', min: 50, max: 99, default: 92, editable: false },
      { key: 'material_feed_rate', label: 'Material Feed Rate', unit: 'kg/h', min: 50, max: 2000, default: 700, editable: false },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 5, max: 100, default: 35, editable: false },
      { key: 'temperature', label: 'Temperature', unit: '°C', min: 15, max: 60, default: 30, editable: false },
    ],
    outputs: ['Ferrous material output', 'Non-ferrous output', 'Separation purity', 'Energy efficiency'],
  },
  {
    type: 'heated_chemical_tank',
    name: 'Heated Chemical Tank',
    industry: 'battery_recycling',
    category: 'Chemical Processing',
    icon: 'chemical',
    parameters: [
      { key: 'tank_temperature', label: 'Tank Temperature', unit: '°C', min: 20, max: 200, default: 85, editable: true },
      { key: 'chemical_level', label: 'Chemical Level', unit: '%', min: 10, max: 100, default: 75, editable: false },
      { key: 'pressure', label: 'Pressure', unit: 'bar', min: 1, max: 10, default: 3, editable: true },
      { key: 'mixing_speed', label: 'Mixing Speed', unit: 'rpm', min: 10, max: 500, default: 120, editable: true },
      { key: 'chemical_concentration', label: 'Chemical Concentration', unit: '%', min: 5, max: 50, default: 25, editable: true },
      { key: 'heating_coil_power', label: 'Heating Coil Power', unit: 'kW', min: 5, max: 100, default: 45, editable: false },
      { key: 'tank_volume', label: 'Tank Volume', unit: 'L', min: 100, max: 10000, default: 2000, editable: true },
    ],
    outputs: ['Extraction quality', 'Heat efficiency', 'Chemical stability', 'Safety alerts'],
  },
  {
    type: 'filter_press',
    name: 'Filter Press System',
    industry: 'battery_recycling',
    category: 'Filtration',
    icon: 'press',
    parameters: [
      { key: 'pressure_level', label: 'Pressure Level', unit: 'bar', min: 1, max: 20, default: 8, editable: true },
      { key: 'slurry_input', label: 'Slurry Input', unit: 'L/h', min: 50, max: 2000, default: 500, editable: true },
      { key: 'filter_efficiency', label: 'Filter Efficiency', unit: '%', min: 60, max: 99, default: 88, editable: false },
      { key: 'moisture_content', label: 'Moisture Content', unit: '%', min: 5, max: 50, default: 20, editable: false },
      { key: 'hydraulic_pressure', label: 'Hydraulic Pressure', unit: 'bar', min: 5, max: 30, default: 15, editable: true },
      { key: 'filter_clogging', label: 'Filter Clogging', unit: '%', min: 0, max: 100, default: 10, editable: false },
    ],
    outputs: ['Filtration efficiency', 'Material recovery', 'Waste ratio', 'Maintenance alerts'],
  },
  {
    type: 'drying_unit',
    name: 'Drying Unit',
    industry: 'battery_recycling',
    category: 'Drying',
    icon: 'drying',
    parameters: [
      { key: 'drying_temperature', label: 'Drying Temperature', unit: '°C', min: 50, max: 300, default: 120, editable: true },
      { key: 'airflow_rate', label: 'Airflow Rate', unit: 'm³/h', min: 100, max: 5000, default: 1500, editable: true },
      { key: 'moisture_removal', label: 'Moisture Removal', unit: '%', min: 50, max: 99, default: 85, editable: false },
      { key: 'residence_time', label: 'Residence Time', unit: 'min', min: 5, max: 120, default: 30, editable: true },
      { key: 'energy_consumption', label: 'Energy Consumption', unit: 'kW', min: 10, max: 150, default: 60, editable: false },
    ],
    outputs: ['Dried material output', 'Energy efficiency', 'Moisture level', 'Temperature stability'],
  },
  {
    type: 'hazard_containment',
    name: 'Hazard Containment',
    industry: 'battery_recycling',
    category: 'Safety',
    icon: 'hazard',
    parameters: [
      { key: 'containment_capacity', label: 'Containment Capacity', unit: 'units', min: 5, max: 200, default: 50, editable: true },
      { key: 'cooling_power', label: 'Cooling Power', unit: 'kW', min: 5, max: 80, default: 30, editable: true },
      { key: 'inert_gas_pressure', label: 'Inert Gas Pressure', unit: 'bar', min: 0.5, max: 5, default: 1.5, editable: true },
      { key: 'sensor_temperature', label: 'Sensor Temperature', unit: '°C', min: 5, max: 90, default: 25, editable: false },
      { key: 'ventilation_rate', label: 'Ventilation Rate', unit: 'm³/h', min: 100, max: 4000, default: 1200, editable: true },
      { key: 'response_time', label: 'Response Time', unit: 's', min: 1, max: 30, default: 4, editable: false },
    ],
    outputs: ['Hazardous items isolated', 'Containment integrity', 'Gas detection', 'Cooling efficiency'],
  },
  {
    type: 'battery_sorting_machine',
    name: 'Battery Sorting Machine',
    industry: 'battery_recycling',
    category: 'Sorting',
    icon: 'sorting',
    parameters: [
      { key: 'sorting_speed', label: 'Sorting Speed', unit: 'units/min', min: 30, max: 1500, default: 600, editable: true },
      { key: 'detection_accuracy', label: 'Detection Accuracy', unit: '%', min: 80, max: 99.5, default: 96, editable: false },
      { key: 'vision_system_load', label: 'Vision System Load', unit: '%', min: 0, max: 100, default: 45, editable: false },
      { key: 'reject_rate', label: 'Reject Rate', unit: '%', min: 0, max: 25, default: 4, editable: false },
      { key: 'belt_speed', label: 'Belt Speed', unit: 'm/min', min: 1, max: 25, default: 8, editable: true },
    ],
    outputs: ['Sorted by chemistry', 'Reject pile', 'Detection accuracy', 'Throughput'],
  },
]

export const TEXTILE_MACHINES: MachineDefinition[] = [
  {
    type: 'fabric_cutting_machine',
    name: 'Fabric Cutting Machine',
    industry: 'apparel_textile',
    category: 'Cutting',
    icon: 'cutting',
    parameters: [
      { key: 'cutting_speed', label: 'Cutting Speed', unit: 'm/min', min: 1, max: 50, default: 15, editable: true },
      { key: 'blade_sharpness', label: 'Blade Sharpness', unit: '%', min: 10, max: 100, default: 90, editable: false },
      { key: 'fabric_tension', label: 'Fabric Tension', unit: 'N', min: 5, max: 200, default: 50, editable: true },
      { key: 'material_thickness', label: 'Material Thickness', unit: 'mm', min: 0.1, max: 20, default: 2, editable: true },
      { key: 'motor_load', label: 'Motor Load', unit: '%', min: 0, max: 100, default: 55, editable: false },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 30, default: 8, editable: false },
    ],
    outputs: ['Cutting accuracy', 'Material wastage', 'Production speed', 'Blade maintenance prediction'],
  },
  {
    type: 'textile_dyeing_machine',
    name: 'Textile Dyeing Machine',
    industry: 'apparel_textile',
    category: 'Dyeing',
    icon: 'dyeing',
    parameters: [
      { key: 'dye_temperature', label: 'Dye Temperature', unit: '°C', min: 30, max: 130, default: 80, editable: true },
      { key: 'chemical_concentration', label: 'Chemical Concentration', unit: '%', min: 1, max: 30, default: 10, editable: true },
      { key: 'water_level', label: 'Water Level', unit: '%', min: 20, max: 100, default: 75, editable: true },
      { key: 'rotation_speed', label: 'Rotation Speed', unit: 'rpm', min: 5, max: 100, default: 30, editable: true },
      { key: 'heating_load', label: 'Heating Load', unit: 'kW', min: 5, max: 80, default: 35, editable: false },
      { key: 'fabric_absorption', label: 'Fabric Absorption Rate', unit: '%', min: 30, max: 95, default: 70, editable: false },
    ],
    outputs: ['Dye consistency', 'Water usage', 'Energy efficiency', 'Temperature anomalies'],
  },
  {
    type: 'steam_boiler',
    name: 'Steam Boiler',
    industry: 'apparel_textile',
    category: 'Utilities',
    icon: 'boiler',
    parameters: [
      { key: 'steam_pressure', label: 'Steam Pressure', unit: 'bar', min: 1, max: 15, default: 6, editable: true },
      { key: 'boiler_temperature', label: 'Boiler Temperature', unit: '°C', min: 100, max: 250, default: 160, editable: false },
      { key: 'fuel_consumption', label: 'Fuel Consumption', unit: 'L/h', min: 5, max: 100, default: 30, editable: false },
      { key: 'water_level', label: 'Water Level', unit: '%', min: 20, max: 100, default: 80, editable: true },
      { key: 'safety_pressure', label: 'Safety Pressure Limit', unit: 'bar', min: 8, max: 20, default: 12, editable: true },
      { key: 'heat_output', label: 'Heat Output', unit: 'kW', min: 50, max: 500, default: 200, editable: false },
    ],
    outputs: ['Energy efficiency', 'Pressure alerts', 'Safety alerts', 'Steam performance'],
  },
  {
    type: 'industrial_sewing_machine',
    name: 'Industrial Sewing Machine',
    industry: 'apparel_textile',
    category: 'Assembly',
    icon: 'sewing',
    parameters: [
      { key: 'stitch_speed', label: 'Stitch Speed', unit: 'spm', min: 500, max: 8000, default: 3000, editable: true },
      { key: 'thread_tension', label: 'Thread Tension', unit: 'N', min: 0.5, max: 10, default: 3, editable: true },
      { key: 'needle_temperature', label: 'Needle Temperature', unit: '°C', min: 20, max: 80, default: 35, editable: false },
      { key: 'motor_load', label: 'Motor Load', unit: '%', min: 0, max: 100, default: 40, editable: false },
      { key: 'fabric_feed_rate', label: 'Fabric Feed Rate', unit: 'm/min', min: 0.5, max: 10, default: 3, editable: true },
    ],
    outputs: ['Stitch quality', 'Production rate', 'Thread consumption', 'Needle wear prediction'],
  },
  {
    type: 'heat_press_machine',
    name: 'Heat Press Machine',
    industry: 'apparel_textile',
    category: 'Finishing',
    icon: 'heat',
    parameters: [
      { key: 'press_temperature', label: 'Press Temperature', unit: '°C', min: 100, max: 250, default: 180, editable: true },
      { key: 'press_pressure', label: 'Press Pressure', unit: 'bar', min: 1, max: 10, default: 4, editable: true },
      { key: 'press_time', label: 'Press Time', unit: 's', min: 5, max: 60, default: 15, editable: true },
      { key: 'platen_uniformity', label: 'Platen Uniformity', unit: '%', min: 80, max: 100, default: 95, editable: false },
      { key: 'energy_consumption', label: 'Energy Consumption', unit: 'kW', min: 2, max: 20, default: 8, editable: false },
    ],
    outputs: ['Press quality', 'Temperature uniformity', 'Energy efficiency', 'Cycle time'],
  },
  {
    type: 'washing_unit',
    name: 'Washing Unit',
    industry: 'apparel_textile',
    category: 'Washing',
    icon: 'washing',
    parameters: [
      { key: 'water_temperature', label: 'Water Temperature', unit: '°C', min: 20, max: 90, default: 45, editable: true },
      { key: 'drum_speed', label: 'Drum Speed', unit: 'rpm', min: 10, max: 200, default: 60, editable: true },
      { key: 'water_consumption', label: 'Water Consumption', unit: 'L/cycle', min: 50, max: 500, default: 150, editable: false },
      { key: 'detergent_level', label: 'Detergent Level', unit: '%', min: 5, max: 30, default: 12, editable: true },
      { key: 'cycle_time', label: 'Cycle Time', unit: 'min', min: 10, max: 90, default: 35, editable: true },
    ],
    outputs: ['Wash quality', 'Water efficiency', 'Energy usage', 'Chemical balance'],
  },
  {
    type: 'quality_inspection',
    name: 'Quality Inspection',
    industry: 'apparel_textile',
    category: 'Quality',
    icon: 'inspection',
    parameters: [
      { key: 'inspection_speed', label: 'Inspection Speed', unit: 'units/h', min: 100, max: 5000, default: 1200, editable: true },
      { key: 'detection_threshold', label: 'Detection Threshold', unit: '%', min: 80, max: 99.5, default: 95, editable: true },
      { key: 'reject_rate', label: 'Reject Rate', unit: '%', min: 0, max: 30, default: 4, editable: false },
      { key: 'lighting_intensity', label: 'Lighting Intensity', unit: 'lux', min: 100, max: 5000, default: 1800, editable: true },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 25, default: 6, editable: false },
    ],
    outputs: ['Pass rate', 'Defect rate', 'Inspection accuracy'],
  },
]

export const ALL_MACHINES = [...BATTERY_RECYCLING_MACHINES, ...TEXTILE_MACHINES]

export const MACHINE_CONNECTIONS: Record<string, string[]> = {
  // Battery Recycling flow
  battery_intake_conveyor: ['battery_shredder', 'battery_sorting_machine'],
  battery_sorting_machine: ['battery_shredder'],
  battery_shredder: ['magnetic_separator'],
  magnetic_separator: ['heated_chemical_tank'],
  heated_chemical_tank: ['filter_press'],
  filter_press: ['drying_unit'],
  drying_unit: ['material_storage_tank', 'final_packaging_unit'],
  // Textile flow
  fabric_cutting_machine: ['industrial_sewing_machine', 'heat_press_machine'],
  textile_dyeing_machine: ['washing_unit'],
  washing_unit: ['drying_machine'],
  industrial_sewing_machine: ['heat_press_machine'],
  heat_press_machine: ['quality_inspection', 'packaging_unit'],
}

/** Built-in industry metadata used by the IndustrySelector. */
export interface BuiltInIndustryMeta {
  id: string
  name: string
  description: string
  icon: string
  features: string[]
  machineCount: number
  machines: MachineDefinition[]
}

export const BUILT_IN_INDUSTRIES: BuiltInIndustryMeta[] = [
  {
    id: 'battery_recycling',
    name: 'Battery Recycling',
    description: 'Full battery recycling plant — from intake to material recovery',
    icon: 'battery',
    features: ['Shredding', 'Chemical Processing', 'Magnetic Separation', 'Filtration', 'Drying'],
    machineCount: BATTERY_RECYCLING_MACHINES.length,
    machines: BATTERY_RECYCLING_MACHINES,
  },
  {
    id: 'apparel_textile',
    name: 'Apparel & Textile',
    description: 'Complete textile manufacturing — cutting, dyeing, sewing, finishing',
    icon: 'textile',
    features: ['Cutting', 'Dyeing', 'Sewing', 'Heat Press', 'Steam Processing'],
    machineCount: TEXTILE_MACHINES.length,
    machines: TEXTILE_MACHINES,
  },
]
