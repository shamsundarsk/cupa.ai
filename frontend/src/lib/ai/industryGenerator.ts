import { MachineDefinition } from '@/types'

/** Inputs to the generator. */
export interface GenerateIndustryInput {
  name: string
  requirements?: string
  machineCount?: number
}

/** Schema returned by both AI and deterministic paths. */
export interface GeneratedIndustry {
  id: string
  name: string
  description: string
  features: string[]
  machines: MachineDefinition[]
}

const ALLOWED_ICON_HINTS = [
  // Universal
  'conveyor', 'intake', 'storage', 'packaging', 'inspection', 'sorting', 'cooling', 'heating', 'mixer', 'pump', 'compressor', 'motor', 'robot', 'cog',
  // Battery / Recycling / Chemical
  'shredder', 'magnetic', 'separator', 'filter', 'press', 'drying', 'chemical', 'beaker', 'reactor', 'waste',
  // Textile / Apparel
  'cutting', 'sewing', 'dyeing', 'boiler', 'fabric', 'washing', 'ironing', 'spinning', 'weaving',
  // Paper / Pulp
  'pulper', 'refiner', 'forming', 'press_paper', 'calender', 'reel', 'deinker',
  // Food & Beverage
  'oven', 'fryer', 'pasteurizer', 'fermenter', 'bottling', 'capper', 'labeler', 'extruder', 'kneader', 'cooker', 'freezer',
  // Metal Manufacturing
  'furnace', 'rolling_mill', 'forge', 'lathe', 'cnc', 'welder', 'grinder', 'casting', 'milling', 'stamping',
  // Pharmaceutical
  'granulator', 'tablet_press', 'coater', 'capsule_filler', 'autoclave', 'centrifuge', 'lyophilizer',
  // Plastics
  'injection_molder', 'blow_molder', 'thermoformer', 'pelletizer',
  // Electronics
  'pick_and_place', 'soldering', 'pcb_etch', 'laser', 'reflow_oven',
  // Power / Utilities
  'turbine', 'generator', 'transformer', 'cooling_tower',
  // Generic icons / fallback hints
  'factory', 'flame', 'water', 'electric', 'power', 'quality', 'battery', 'assembly', 'printing',
  'heat', 'mixing', 'cooler', 'hazard',
]

/* ────────────────────────────────────────────────────────────────────────────
 * Deterministic generator (used as fallback and as the "no API key" path)
 * ──────────────────────────────────────────────────────────────────────────── */

interface MachineTemplate {
  name: string
  category: string
  iconHint: string
  description: string
  outputs: string[]
  parameters: Array<{
    key: string
    label: string
    unit: string
    min: number
    max: number
    default: number
    editable: boolean
  }>
  /** Keywords that trigger inclusion when present in requirements/name. */
  triggers: string[]
  /** Always include? Used for ubiquitous stages like intake/packaging. */
  baseline?: 'intake' | 'process' | 'output'
}

const MACHINE_TEMPLATES: MachineTemplate[] = [
  // Universal stages
  {
    name: 'Material Intake Conveyor',
    category: 'Intake',
    iconHint: 'conveyor',
    description: 'Receives raw materials and feeds them into the production line.',
    outputs: ['Material throughput', 'Feed rate', 'Overload alerts'],
    triggers: ['intake', 'feed', 'input', 'conveyor', 'raw'],
    baseline: 'intake',
    parameters: [
      { key: 'feed_rate', label: 'Feed Rate', unit: 'kg/h', min: 100, max: 5000, default: 1000, editable: true },
      { key: 'belt_speed', label: 'Belt Speed', unit: 'm/min', min: 1, max: 30, default: 10, editable: true },
      { key: 'motor_load', label: 'Motor Load', unit: '%', min: 0, max: 100, default: 45, editable: false },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 50, default: 12, editable: false },
    ],
  },
  {
    name: 'Quality Inspection Station',
    category: 'Quality',
    iconHint: 'inspection',
    description: 'Automated quality control with vision and sensor checks.',
    outputs: ['Pass rate', 'Defect rate', 'Inspection accuracy'],
    triggers: ['quality', 'inspect', 'vision', 'check', 'qc'],
    parameters: [
      { key: 'inspection_speed', label: 'Inspection Speed', unit: 'units/h', min: 50, max: 5000, default: 800, editable: true },
      { key: 'detection_threshold', label: 'Detection Threshold', unit: '%', min: 80, max: 99, default: 95, editable: true },
      { key: 'reject_rate', label: 'Reject Rate', unit: '%', min: 0, max: 30, default: 4, editable: false },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 20, default: 5, editable: false },
    ],
  },
  {
    name: 'Final Packaging Unit',
    category: 'Output',
    iconHint: 'packaging',
    description: 'Packages finished goods for shipment.',
    outputs: ['Units packed', 'Cycle time', 'Material usage'],
    triggers: ['pack', 'box', 'ship', 'output', 'crate', 'wrap'],
    baseline: 'output',
    parameters: [
      { key: 'packaging_rate', label: 'Packaging Rate', unit: 'units/h', min: 50, max: 3000, default: 600, editable: true },
      { key: 'film_tension', label: 'Film Tension', unit: 'N', min: 5, max: 80, default: 25, editable: true },
      { key: 'sealing_temperature', label: 'Sealing Temperature', unit: '°C', min: 80, max: 200, default: 140, editable: true },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 30, default: 8, editable: false },
    ],
  },

  // Mechanical processing
  {
    name: 'Industrial Shredder',
    category: 'Processing',
    iconHint: 'shredder',
    description: 'Heavy-duty shredder reduces input material to a uniform particle size.',
    outputs: ['Shredded material', 'Particle distribution', 'Blade wear'],
    triggers: ['shred', 'crush', 'grind', 'pulver', 'mill'],
    parameters: [
      { key: 'rpm', label: 'RPM', unit: 'rpm', min: 500, max: 8000, default: 3000, editable: true },
      { key: 'particle_size', label: 'Particle Size', unit: 'mm', min: 1, max: 50, default: 10, editable: true },
      { key: 'throughput', label: 'Throughput', unit: 'kg/h', min: 100, max: 4000, default: 800, editable: true },
      { key: 'energy_usage', label: 'Energy Usage', unit: 'kW', min: 10, max: 200, default: 75, editable: false },
      { key: 'blade_wear', label: 'Blade Wear', unit: '%', min: 0, max: 100, default: 12, editable: false },
    ],
  },
  {
    name: 'Cutting Machine',
    category: 'Processing',
    iconHint: 'cutting',
    description: 'High-precision cutter for sheets, fabrics, or sized inputs.',
    outputs: ['Cutting accuracy', 'Material wastage', 'Production speed'],
    triggers: ['cut', 'slice', 'trim', 'shear', 'fabric'],
    parameters: [
      { key: 'cutting_speed', label: 'Cutting Speed', unit: 'm/min', min: 1, max: 50, default: 15, editable: true },
      { key: 'blade_sharpness', label: 'Blade Sharpness', unit: '%', min: 10, max: 100, default: 90, editable: false },
      { key: 'material_thickness', label: 'Material Thickness', unit: 'mm', min: 0.1, max: 20, default: 2, editable: true },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 30, default: 8, editable: false },
    ],
  },
  {
    name: 'Hydraulic Press',
    category: 'Forming',
    iconHint: 'press',
    description: 'Applies high pressure for compaction, forming, or filtering.',
    outputs: ['Cycle output', 'Force consistency', 'Hydraulic efficiency'],
    triggers: ['press', 'compact', 'form', 'stamp', 'baler'],
    parameters: [
      { key: 'pressure_level', label: 'Pressure Level', unit: 'bar', min: 1, max: 30, default: 12, editable: true },
      { key: 'cycle_time', label: 'Cycle Time', unit: 's', min: 5, max: 120, default: 25, editable: true },
      { key: 'hydraulic_pressure', label: 'Hydraulic Pressure', unit: 'bar', min: 5, max: 50, default: 22, editable: true },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 5, max: 100, default: 30, editable: false },
    ],
  },

  // Separation / filtration
  {
    name: 'Magnetic Separator',
    category: 'Separation',
    iconHint: 'magnetic',
    description: 'Separates ferrous and non-ferrous components with a calibrated magnetic field.',
    outputs: ['Ferrous output', 'Non-ferrous output', 'Separation purity'],
    triggers: ['magnet', 'metal', 'separate', 'sort', 'ferrous'],
    parameters: [
      { key: 'magnetic_field_strength', label: 'Field Strength', unit: 'T', min: 0.1, max: 2.0, default: 0.8, editable: true },
      { key: 'belt_speed', label: 'Belt Speed', unit: 'm/min', min: 1, max: 20, default: 8, editable: true },
      { key: 'separation_efficiency', label: 'Separation Efficiency', unit: '%', min: 50, max: 99, default: 92, editable: false },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 5, max: 100, default: 35, editable: false },
    ],
  },
  {
    name: 'Filter Press',
    category: 'Filtration',
    iconHint: 'filter',
    description: 'Filters slurries and liquids, recovering solids at high pressure.',
    outputs: ['Filtration efficiency', 'Material recovery', 'Waste ratio'],
    triggers: ['filter', 'filtrate', 'sieve', 'slurry'],
    parameters: [
      { key: 'pressure_level', label: 'Pressure Level', unit: 'bar', min: 1, max: 20, default: 8, editable: true },
      { key: 'slurry_input', label: 'Slurry Input', unit: 'L/h', min: 50, max: 2000, default: 500, editable: true },
      { key: 'filter_efficiency', label: 'Filter Efficiency', unit: '%', min: 60, max: 99, default: 88, editable: false },
      { key: 'filter_clogging', label: 'Filter Clogging', unit: '%', min: 0, max: 100, default: 10, editable: false },
    ],
  },

  // Thermal
  {
    name: 'Industrial Oven / Drying Unit',
    category: 'Drying',
    iconHint: 'drying',
    description: 'Removes moisture or applies controlled heat to product.',
    outputs: ['Dried output', 'Moisture removal', 'Energy efficiency'],
    triggers: ['dry', 'oven', 'bake', 'cure', 'evaporate', 'kiln'],
    parameters: [
      { key: 'drying_temperature', label: 'Drying Temperature', unit: '°C', min: 50, max: 350, default: 120, editable: true },
      { key: 'airflow_rate', label: 'Airflow Rate', unit: 'm³/h', min: 100, max: 5000, default: 1500, editable: true },
      { key: 'residence_time', label: 'Residence Time', unit: 'min', min: 5, max: 120, default: 30, editable: true },
      { key: 'energy_consumption', label: 'Energy Consumption', unit: 'kW', min: 10, max: 200, default: 60, editable: false },
    ],
  },
  {
    name: 'Heat Press',
    category: 'Finishing',
    iconHint: 'heat',
    description: 'Applies controlled heat and pressure for bonding or finishing.',
    outputs: ['Press quality', 'Temperature uniformity', 'Cycle time'],
    triggers: ['heat press', 'bond', 'lamin', 'finish', 'iron'],
    parameters: [
      { key: 'press_temperature', label: 'Press Temperature', unit: '°C', min: 80, max: 250, default: 180, editable: true },
      { key: 'press_pressure', label: 'Press Pressure', unit: 'bar', min: 1, max: 10, default: 4, editable: true },
      { key: 'press_time', label: 'Press Time', unit: 's', min: 5, max: 60, default: 15, editable: true },
      { key: 'energy_consumption', label: 'Energy Consumption', unit: 'kW', min: 2, max: 30, default: 8, editable: false },
    ],
  },
  {
    name: 'Steam Boiler',
    category: 'Utilities',
    iconHint: 'boiler',
    description: 'Generates steam for downstream thermal processes.',
    outputs: ['Energy output', 'Pressure stability', 'Safety alerts'],
    triggers: ['steam', 'boiler', 'utility', 'thermal'],
    parameters: [
      { key: 'steam_pressure', label: 'Steam Pressure', unit: 'bar', min: 1, max: 15, default: 6, editable: true },
      { key: 'boiler_temperature', label: 'Boiler Temperature', unit: '°C', min: 100, max: 250, default: 160, editable: false },
      { key: 'fuel_consumption', label: 'Fuel Consumption', unit: 'L/h', min: 5, max: 100, default: 30, editable: false },
      { key: 'safety_pressure', label: 'Safety Pressure Limit', unit: 'bar', min: 8, max: 20, default: 12, editable: true },
    ],
  },

  // Chemical / fluid
  {
    name: 'Heated Chemical Tank',
    category: 'Chemical Processing',
    iconHint: 'chemical',
    description: 'Heated, agitated reactor for chemical extraction or treatment.',
    outputs: ['Extraction quality', 'Heat efficiency', 'Chemical stability'],
    triggers: ['chemical', 'reactor', 'leach', 'react', 'acid', 'alkali'],
    parameters: [
      { key: 'tank_temperature', label: 'Tank Temperature', unit: '°C', min: 20, max: 250, default: 85, editable: true },
      { key: 'pressure', label: 'Pressure', unit: 'bar', min: 1, max: 10, default: 3, editable: true },
      { key: 'mixing_speed', label: 'Mixing Speed', unit: 'rpm', min: 10, max: 500, default: 120, editable: true },
      { key: 'tank_volume', label: 'Tank Volume', unit: 'L', min: 100, max: 10000, default: 2000, editable: true },
    ],
  },
  {
    name: 'Mixing Vessel',
    category: 'Mixing',
    iconHint: 'mixer',
    description: 'Industrial mixer for blending liquids, powders, or slurries.',
    outputs: ['Blend uniformity', 'Cycle time', 'Energy usage'],
    triggers: ['mix', 'blend', 'agit', 'stir'],
    parameters: [
      { key: 'rotation_speed', label: 'Rotation Speed', unit: 'rpm', min: 10, max: 500, default: 90, editable: true },
      { key: 'batch_size', label: 'Batch Size', unit: 'L', min: 50, max: 5000, default: 1000, editable: true },
      { key: 'mixing_time', label: 'Mixing Time', unit: 'min', min: 1, max: 120, default: 15, editable: true },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 2, max: 60, default: 18, editable: false },
    ],
  },
  {
    name: 'Washing Unit',
    category: 'Washing',
    iconHint: 'washing',
    description: 'Cleans inputs with controlled water and detergent cycles.',
    outputs: ['Wash quality', 'Water efficiency', 'Chemical balance'],
    triggers: ['wash', 'clean', 'rinse'],
    parameters: [
      { key: 'water_temperature', label: 'Water Temperature', unit: '°C', min: 20, max: 90, default: 45, editable: true },
      { key: 'drum_speed', label: 'Drum Speed', unit: 'rpm', min: 10, max: 200, default: 60, editable: true },
      { key: 'cycle_time', label: 'Cycle Time', unit: 'min', min: 10, max: 90, default: 35, editable: true },
      { key: 'detergent_level', label: 'Detergent Level', unit: '%', min: 5, max: 30, default: 12, editable: true },
    ],
  },

  // Assembly / advanced
  {
    name: 'Sewing / Assembly Station',
    category: 'Assembly',
    iconHint: 'sewing',
    description: 'Automated assembly station for stitching or joining parts.',
    outputs: ['Stitch quality', 'Production rate', 'Tool wear'],
    triggers: ['sew', 'stitch', 'assembl', 'joint', 'weld'],
    parameters: [
      { key: 'speed', label: 'Speed', unit: 'spm', min: 100, max: 8000, default: 3000, editable: true },
      { key: 'tension', label: 'Tension', unit: 'N', min: 0.5, max: 20, default: 3, editable: true },
      { key: 'feed_rate', label: 'Feed Rate', unit: 'm/min', min: 0.5, max: 10, default: 3, editable: true },
      { key: 'motor_load', label: 'Motor Load', unit: '%', min: 0, max: 100, default: 40, editable: false },
    ],
  },
  {
    name: 'Robotic Pick & Place',
    category: 'Automation',
    iconHint: 'robot',
    description: 'Articulated robot arm for high-speed pick & place operations.',
    outputs: ['Cycle rate', 'Positional accuracy', 'Tool wear'],
    triggers: ['robot', 'pick', 'place', 'arm', 'manipulator'],
    parameters: [
      { key: 'cycle_rate', label: 'Cycle Rate', unit: 'cycles/min', min: 10, max: 240, default: 90, editable: true },
      { key: 'positional_accuracy', label: 'Positional Accuracy', unit: 'mm', min: 0.05, max: 5, default: 0.3, editable: false },
      { key: 'motor_load', label: 'Motor Load', unit: '%', min: 0, max: 100, default: 50, editable: false },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 25, default: 7, editable: false },
    ],
  },
  {
    name: 'Storage Tank',
    category: 'Storage',
    iconHint: 'storage',
    description: 'Buffer tank for raw or intermediate liquids.',
    outputs: ['Fill level', 'Buffer capacity'],
    triggers: ['storage', 'tank', 'buffer', 'silo'],
    parameters: [
      { key: 'tank_volume', label: 'Tank Volume', unit: 'L', min: 100, max: 50000, default: 5000, editable: true },
      { key: 'fill_level', label: 'Fill Level', unit: '%', min: 0, max: 100, default: 60, editable: false },
      { key: 'pressure', label: 'Pressure', unit: 'bar', min: 0.5, max: 5, default: 1, editable: true },
    ],
  },

  // Food & Beverage
  {
    name: 'Industrial Oven / Cooker',
    category: 'Cooking',
    iconHint: 'oven',
    description: 'Heats, bakes, roasts, or cooks product at controlled temperature.',
    outputs: ['Product temperature', 'Cook uniformity', 'Energy efficiency'],
    triggers: ['oven', 'cook', 'bake', 'roast', 'chocolate', 'cocoa', 'confection', 'candy', 'food', 'bread', 'pastry', 'pizza'],
    parameters: [
      { key: 'oven_temperature', label: 'Oven Temperature', unit: '°C', min: 50, max: 350, default: 180, editable: true },
      { key: 'residence_time', label: 'Residence Time', unit: 'min', min: 1, max: 120, default: 20, editable: true },
      { key: 'airflow_rate', label: 'Airflow Rate', unit: 'm³/h', min: 100, max: 3000, default: 800, editable: true },
      { key: 'energy_consumption', label: 'Energy Consumption', unit: 'kW', min: 10, max: 200, default: 55, editable: false },
    ],
  },
  {
    name: 'Tempering / Cooling Tunnel',
    category: 'Tempering',
    iconHint: 'cooling',
    description: 'Precisely controls cooling rate for crystallization or setting.',
    outputs: ['Product temperature', 'Cooling rate', 'Crystal quality'],
    triggers: ['temper', 'cool', 'tunnel', 'chocolate', 'confection', 'candy', 'crystal', 'set', 'freeze', 'chill'],
    parameters: [
      { key: 'zone_temperature', label: 'Zone Temperature', unit: '°C', min: -20, max: 40, default: 12, editable: true },
      { key: 'belt_speed', label: 'Belt Speed', unit: 'm/min', min: 0.5, max: 10, default: 3, editable: true },
      { key: 'tunnel_length', label: 'Tunnel Length', unit: 'm', min: 3, max: 30, default: 12, editable: false },
      { key: 'cooling_power', label: 'Cooling Power', unit: 'kW', min: 5, max: 100, default: 35, editable: false },
    ],
  },
  {
    name: 'Fermenter / Bioreactor',
    category: 'Fermentation',
    iconHint: 'fermenter',
    description: 'Controlled biological fermentation for beverages, dairy, or bioprocessing.',
    outputs: ['pH level', 'CO₂ production', 'Batch progress'],
    triggers: ['ferment', 'brew', 'beer', 'wine', 'yogurt', 'dairy', 'yeast', 'bioreact', 'beverage', 'kombucha'],
    parameters: [
      { key: 'tank_temperature', label: 'Temperature', unit: '°C', min: 4, max: 45, default: 22, editable: true },
      { key: 'mixing_speed', label: 'Agitation Speed', unit: 'rpm', min: 5, max: 200, default: 40, editable: true },
      { key: 'tank_volume', label: 'Tank Volume', unit: 'L', min: 100, max: 50000, default: 5000, editable: true },
      { key: 'ph_level', label: 'pH Level', unit: 'pH', min: 2, max: 12, default: 4.5, editable: false },
    ],
  },
  {
    name: 'Bottling / Filling Line',
    category: 'Filling',
    iconHint: 'bottling',
    description: 'Fills containers (bottles, cans, pouches) at high speed.',
    outputs: ['Fill accuracy', 'Throughput', 'Waste rate'],
    triggers: ['bottle', 'fill', 'can', 'pour', 'dispens', 'liquid', 'beverage', 'juice', 'milk', 'water'],
    parameters: [
      { key: 'fill_speed', label: 'Fill Speed', unit: 'units/min', min: 10, max: 600, default: 120, editable: true },
      { key: 'fill_volume', label: 'Fill Volume', unit: 'mL', min: 50, max: 5000, default: 500, editable: true },
      { key: 'fill_accuracy', label: 'Fill Accuracy', unit: '%', min: 95, max: 99.9, default: 99.2, editable: false },
      { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 2, max: 30, default: 8, editable: false },
    ],
  },
  {
    name: 'Molder / Depositor',
    category: 'Forming',
    iconHint: 'forming',
    description: 'Deposits or molds product into final shape (chocolate molds, candy forms, etc.).',
    outputs: ['Mold fill rate', 'Reject rate', 'Cycle time'],
    triggers: ['mold', 'deposit', 'form', 'shape', 'chocolate', 'candy', 'confection', 'gummy', 'tablet'],
    parameters: [
      { key: 'cycle_rate', label: 'Cycle Rate', unit: 'cycles/min', min: 5, max: 120, default: 30, editable: true },
      { key: 'mold_temperature', label: 'Mold Temperature', unit: '°C', min: 5, max: 60, default: 18, editable: true },
      { key: 'deposit_weight', label: 'Deposit Weight', unit: 'g', min: 1, max: 500, default: 50, editable: true },
      { key: 'reject_rate', label: 'Reject Rate', unit: '%', min: 0, max: 10, default: 2, editable: false },
    ],
  },
  {
    name: 'Extruder',
    category: 'Extrusion',
    iconHint: 'extruder',
    description: 'Forces material through a die to create continuous shapes (pasta, snacks, plastics).',
    outputs: ['Extrusion rate', 'Die pressure', 'Product uniformity'],
    triggers: ['extrud', 'pasta', 'snack', 'noodle', 'pellet', 'plastic', 'pipe', 'profile', 'cereal'],
    parameters: [
      { key: 'screw_speed', label: 'Screw Speed', unit: 'rpm', min: 10, max: 500, default: 120, editable: true },
      { key: 'barrel_temperature', label: 'Barrel Temperature', unit: '°C', min: 40, max: 300, default: 160, editable: true },
      { key: 'die_pressure', label: 'Die Pressure', unit: 'bar', min: 5, max: 200, default: 60, editable: false },
      { key: 'throughput', label: 'Throughput', unit: 'kg/h', min: 50, max: 3000, default: 500, editable: true },
    ],
  },

  // Metal / CNC
  {
    name: 'CNC Machining Center',
    category: 'Machining',
    iconHint: 'cnc',
    description: 'Computer-controlled multi-axis machining for precision metal parts.',
    outputs: ['Part accuracy', 'Surface finish', 'Tool wear'],
    triggers: ['cnc', 'machin', 'metal', 'mill', 'turn', 'lathe', 'precision', 'aluminum', 'steel', 'titanium'],
    parameters: [
      { key: 'spindle_speed', label: 'Spindle Speed', unit: 'rpm', min: 500, max: 24000, default: 8000, editable: true },
      { key: 'feed_rate', label: 'Feed Rate', unit: 'mm/min', min: 50, max: 5000, default: 1200, editable: true },
      { key: 'depth_of_cut', label: 'Depth of Cut', unit: 'mm', min: 0.1, max: 10, default: 2, editable: true },
      { key: 'coolant_flow', label: 'Coolant Flow', unit: 'L/min', min: 1, max: 50, default: 12, editable: false },
    ],
  },
  {
    name: 'Industrial Furnace',
    category: 'Heat Treatment',
    iconHint: 'furnace',
    description: 'High-temperature furnace for melting, annealing, or heat treatment.',
    outputs: ['Chamber temperature', 'Energy efficiency', 'Batch status'],
    triggers: ['furnace', 'melt', 'anneal', 'heat treat', 'forge', 'cast', 'smelt', 'foundry', 'kiln', 'glass'],
    parameters: [
      { key: 'chamber_temperature', label: 'Chamber Temperature', unit: '°C', min: 200, max: 1800, default: 850, editable: true },
      { key: 'heating_rate', label: 'Heating Rate', unit: '°C/min', min: 1, max: 50, default: 10, editable: true },
      { key: 'atmosphere', label: 'Atmosphere O₂', unit: '%', min: 0, max: 21, default: 0.5, editable: true },
      { key: 'energy_consumption', label: 'Energy Consumption', unit: 'kW', min: 50, max: 2000, default: 350, editable: false },
    ],
  },
  {
    name: 'Welding Station',
    category: 'Joining',
    iconHint: 'welder',
    description: 'Automated or semi-automated welding for metal fabrication.',
    outputs: ['Weld quality', 'Deposition rate', 'Gas consumption'],
    triggers: ['weld', 'join', 'fabricat', 'mig', 'tig', 'arc', 'spot'],
    parameters: [
      { key: 'current', label: 'Welding Current', unit: 'A', min: 50, max: 500, default: 180, editable: true },
      { key: 'voltage', label: 'Arc Voltage', unit: 'V', min: 10, max: 40, default: 24, editable: true },
      { key: 'wire_feed_speed', label: 'Wire Feed Speed', unit: 'm/min', min: 1, max: 20, default: 8, editable: true },
      { key: 'gas_flow', label: 'Gas Flow', unit: 'L/min', min: 5, max: 30, default: 15, editable: false },
    ],
  },
]

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'machine'
}

export function generateIndustryDeterministic(input: GenerateIndustryInput): GeneratedIndustry {
  const haystack = `${input.name ?? ''} ${input.requirements ?? ''}`.toLowerCase()
  const target = Math.min(12, Math.max(4, input.machineCount ?? 6))

  // Score templates
  const scored = MACHINE_TEMPLATES.map((t) => {
    let score = 0
    for (const tr of t.triggers) if (haystack.includes(tr)) score += 2
    if (t.baseline === 'intake') score += 1
    if (t.baseline === 'output') score += 1
    return { t, score }
  })

  // Always include intake + output
  const picked: MachineTemplate[] = []
  const intake = scored.find((x) => x.t.baseline === 'intake')
  if (intake) picked.push(intake.t)

  // Mid-process: highest scoring non-baseline templates
  const middle = scored
    .filter((x) => !x.t.baseline)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t)

  for (const m of middle) {
    if (picked.length >= target - 1) break
    picked.push(m)
  }

  const output = scored.find((x) => x.t.baseline === 'output')
  if (output) picked.push(output.t)

  // Ensure at least 4 machines by topping up with generic processing options
  let i = 0
  while (picked.length < 4 && i < middle.length) {
    if (!picked.includes(middle[i])) picked.push(middle[i])
    i++
  }

  const industrySlug = slugify(input.name)
  const machines: MachineDefinition[] = picked.map((t, idx) => ({
    type: `${industrySlug}_${slugify(t.name)}_${idx}`,
    name: t.name,
    industry: industrySlug,
    category: t.category,
    icon: t.iconHint,
    description: t.description,
    parameters: t.parameters,
    outputs: t.outputs,
    aiGenerated: true,
  }))

  const features = Array.from(new Set(picked.map((p) => p.category))).slice(0, 6)

  return {
    id: industrySlug,
    name: input.name.trim() || 'Custom Industry',
    description:
      `AI-generated production line for ${input.name.trim() || 'a custom industry'}. ` +
      `Includes ${machines.length} suggested stages covering ${features.join(', ').toLowerCase()}.`,
    features,
    machines,
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * OpenAI-backed generator
 * ──────────────────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a senior industrial process engineer with deep expertise across ALL manufacturing sectors.

Given an INDUSTRY NAME and optional REQUIREMENTS from a domain expert, design a REALISTIC production line as a JSON object. The machines you propose MUST be the actual machines used in that specific industry — not generic placeholders. For example:
- "Chocolate manufacturing" → conche, tempering machine, enrober, molder, cooling tunnel, wrapping machine
- "Paper manufacturing" → pulper, refiner, headbox/forming section, press section, dryer section, calender, reel
- "Pharmaceutical" → granulator, fluid bed dryer, tablet press, coating pan, blister packer
- "Electronics assembly" → solder paste printer, pick-and-place, reflow oven, AOI inspection, wave soldering

Use real machine names, real parameter ranges, and real units from the actual industry. Include manufacturer-style specificity where possible (e.g., "Ball Mill" not just "Grinder", "Conche" not just "Mixer").

Output MUST match this exact JSON schema, with no surrounding prose:

{
  "id": string,                     // snake_case slug derived from the name, max 48 chars
  "name": string,                   // human-readable industry name
  "description": string,            // 1-2 sentences describing the production line
  "features": string[],             // 4-6 short capability tags
  "machines": [
    {
      "type": string,               // unique snake_case id, prefixed with the industry slug (e.g., "chocolate_conche_0")
      "name": string,               // human-readable machine name (be specific: "Conche" not "Mixer")
      "category": string,           // e.g. "Intake", "Processing", "Tempering", "Forming", "Packaging"
      "icon": string,               // ONE keyword from this allowed list: ${ALLOWED_ICON_HINTS.join(', ')}
      "description": string,        // 1 sentence describing what this machine does in this specific industry
      "parameters": [
        {
          "key": string,            // snake_case parameter key
          "label": string,          // human-readable label
          "unit": string,           // e.g. "°C", "rpm", "kg/h", "%", "bar"
          "min": number,
          "max": number,
          "default": number,        // must be between min and max, should be a realistic operating point
          "editable": boolean       // true for operator-adjustable params, false for read-only sensors
        }
      ],                            // 4 to 8 parameters per machine — include both control params and sensor readings
      "outputs": string[]           // 3-5 short telemetry/output descriptors
    }
  ]                                 // number of machines as specified in MACHINE COUNT TARGET, ordered by production flow
}

Rules:
- Use realistic units and ranges grounded in real industrial equipment for the SPECIFIC industry requested.
- "icon" MUST be exactly one keyword from the allowed list. Pick the SINGLE most appropriate icon. Prefer industry-specific icons (e.g., 'fermenter' for food/beverage, 'furnace' for metal, 'tablet_press' for pharma, 'pick_and_place' for electronics) over generic ones like 'cog'.
- The icon directly controls the 3D visualization of the machine in the digital twin — accuracy matters.
- Always include an intake/feeding stage first and a packaging/output stage last.
- Each machine must have a unique "type" field prefixed with the industry slug.
- Parameters should include at least 2 editable control parameters and 2 read-only sensor parameters per machine.
- Do not invent fields outside the schema.
- Do NOT use generic names like "Processing Unit" or "Machine A" — use the real industry-specific machine name.
`

interface OpenAIClient {
  generate: (input: GenerateIndustryInput) => Promise<GeneratedIndustry>
}

function makeOpenAIClient(apiKey: string): OpenAIClient {
  return {
    generate: async (input) => {
      const userPrompt = [
        `INDUSTRY NAME: ${input.name}`,
        input.requirements ? `REQUIREMENTS:\n${input.requirements}` : '',
        input.machineCount ? `MACHINE COUNT TARGET: ${input.machineCount}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`OpenAI request failed: ${res.status} ${txt.slice(0, 200)}`)
      }

      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content) throw new Error('OpenAI returned no content')

      const parsed = JSON.parse(content)
      return validateGenerated(parsed, input.name)
    },
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Validation
 * ──────────────────────────────────────────────────────────────────────────── */

function validateGenerated(raw: any, fallbackName: string): GeneratedIndustry {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid AI response shape')

  const id = typeof raw.id === 'string' && raw.id ? slugify(raw.id) : slugify(fallbackName)
  const name = typeof raw.name === 'string' && raw.name ? raw.name : fallbackName
  const description = typeof raw.description === 'string' ? raw.description : ''
  const features = Array.isArray(raw.features) ? raw.features.filter((f: any) => typeof f === 'string').slice(0, 6) : []

  if (!Array.isArray(raw.machines) || raw.machines.length === 0) {
    throw new Error('AI response missing machines array')
  }

  const allowed = new Set(ALLOWED_ICON_HINTS)
  const machines: MachineDefinition[] = raw.machines.slice(0, 12).map((m: any, idx: number) => {
    const machineName = typeof m.name === 'string' && m.name ? m.name : `Stage ${idx + 1}`
    const type = typeof m.type === 'string' && m.type ? slugify(m.type) : `${id}_${slugify(machineName)}_${idx}`
    const category = typeof m.category === 'string' && m.category ? m.category : 'Processing'
    const icon = typeof m.icon === 'string' && allowed.has(m.icon.toLowerCase())
      ? m.icon.toLowerCase()
      : 'cog'

    const params = Array.isArray(m.parameters) ? m.parameters : []
    const parameters = params
      .slice(0, 10)
      .map((p: any) => {
        const min = Number(p.min)
        const max = Number(p.max)
        const def = Number(p.default)
        return {
          key: typeof p.key === 'string' ? slugify(p.key) : 'param',
          label: typeof p.label === 'string' ? p.label : 'Parameter',
          unit: typeof p.unit === 'string' ? p.unit : '',
          min: Number.isFinite(min) ? min : 0,
          max: Number.isFinite(max) ? max : 100,
          default: Number.isFinite(def)
            ? Math.min(Math.max(def, Number.isFinite(min) ? min : 0), Number.isFinite(max) ? max : 100)
            : (Number.isFinite(min) && Number.isFinite(max) ? (min + max) / 2 : 50),
          editable: typeof p.editable === 'boolean' ? p.editable : true,
        }
      })
      .filter((p: any) => p.max > p.min)

    const outputs = Array.isArray(m.outputs)
      ? m.outputs.filter((o: any) => typeof o === 'string').slice(0, 6)
      : []

    return {
      type,
      name: machineName,
      industry: id,
      category,
      icon,
      description: typeof m.description === 'string' ? m.description : undefined,
      parameters: parameters.length ? parameters : [
        { key: 'throughput', label: 'Throughput', unit: 'kg/h', min: 100, max: 3000, default: 800, editable: true },
        { key: 'power_consumption', label: 'Power Consumption', unit: 'kW', min: 1, max: 100, default: 25, editable: false },
      ],
      outputs: outputs.length ? outputs : ['Throughput', 'Energy efficiency'],
      aiGenerated: true,
    }
  })

  return { id, name, description, features, machines }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Public entry point
 * ──────────────────────────────────────────────────────────────────────────── */

export async function generateIndustry(input: GenerateIndustryInput): Promise<{
  data: GeneratedIndustry
  source: 'openai' | 'deterministic'
}> {
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const client = makeOpenAIClient(apiKey)
      const data = await client.generate(input)
      return { data, source: 'openai' }
    } catch (e) {
      console.warn('[industryGenerator] OpenAI failed, falling back:', e)
    }
  }
  return { data: generateIndustryDeterministic(input), source: 'deterministic' }
}
