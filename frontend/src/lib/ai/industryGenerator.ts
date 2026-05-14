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
  'cog', 'factory', 'intake', 'conveyor', 'sorting', 'shredder', 'magnetic', 'separator',
  'chemical', 'beaker', 'filter', 'press', 'drying', 'storage', 'packaging', 'waste',
  'cutting', 'sewing', 'dyeing', 'boiler', 'heat', 'flame', 'washing', 'inspection',
  'mixer', 'mixing', 'reactor', 'oven', 'furnace', 'cooler', 'cooling', 'pump',
  'compressor', 'motor', 'robot', 'assembly', 'printing', 'laser', 'electric', 'power',
  'water', 'fabric', 'battery', 'quality',
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

const SYSTEM_PROMPT = `You are an industrial process engineer.

Given an INDUSTRY NAME and optional REQUIREMENTS from a domain expert, design a realistic production line as a JSON object describing the industry and the sequence of machines needed.

Output MUST match this exact JSON schema, with no surrounding prose:

{
  "id": string,                     // snake_case slug derived from the name, max 48 chars
  "name": string,                   // human-readable industry name
  "description": string,            // 1-2 sentences
  "features": string[],             // 4-6 short capability tags
  "machines": [
    {
      "type": string,               // unique snake_case id, prefixed with the industry slug
      "name": string,               // human-readable machine name
      "category": string,           // e.g. "Intake", "Processing", "Drying"
      "icon": string,               // ONE keyword from this allowed list: ${ALLOWED_ICON_HINTS.join(', ')}
      "description": string,        // 1 sentence
      "parameters": [
        {
          "key": string,            // snake_case
          "label": string,
          "unit": string,           // e.g. "°C", "rpm", "kg/h", "%"
          "min": number,
          "max": number,
          "default": number,        // must be between min and max
          "editable": boolean
        }
      ],                            // 4 to 8 parameters
      "outputs": string[]           // 3-5 short telemetry/output descriptors
    }
  ]                                 // 4 to 12 machines, ordered by production flow (intake first, packaging/output last)
}

Rules:
- Use realistic units and ranges grounded in real industrial equipment.
- "icon" MUST be exactly one keyword from the allowed list.
- Always include an intake/feeding stage first and a packaging/output stage last when applicable.
- Do not invent fields outside the schema.
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
