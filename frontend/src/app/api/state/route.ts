import { NextResponse } from 'next/server'

/**
 * Cross-origin shared state endpoint used by the digital-twin app (port 3001)
 * to read the current dashboard state from the main app (port 3000).
 *
 * State is held in module-level memory. With Next dev/HMR this can be wiped
 * between recompiles, so the route gracefully returns an empty default and
 * never throws — anything else triggers a 500 in the twin app and the user
 * sees a flood of errors.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface SharedState {
  machines: any[]
  telemetryData: Record<string, any>
  selectedIndustry: string | null
  simulation: any
  customIndustries?: any[]
}

const EMPTY_STATE: SharedState = {
  machines: [],
  telemetryData: {},
  selectedIndustry: null,
  simulation: { status: 'idle', key: null, startTime: null, tickRate: 1000 },
  customIndustries: [],
}

// Module-level cache; Next will reset this between cold starts.
let sharedState: SharedState = EMPTY_STATE

export async function GET() {
  try {
    return NextResponse.json(sharedState ?? EMPTY_STATE, { headers: CORS_HEADERS })
  } catch (e) {
    console.error('[api/state GET] error:', e)
    return NextResponse.json(EMPTY_STATE, { headers: CORS_HEADERS, status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SharedState>
    sharedState = {
      machines: Array.isArray(body?.machines) ? body.machines : [],
      telemetryData:
        body?.telemetryData && typeof body.telemetryData === 'object' ? body.telemetryData : {},
      selectedIndustry: typeof body?.selectedIndustry === 'string' ? body.selectedIndustry : null,
      simulation: body?.simulation ?? EMPTY_STATE.simulation,
      customIndustries: Array.isArray(body?.customIndustries) ? body.customIndustries : [],
    }
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS })
  } catch (e) {
    console.error('[api/state POST] error:', e)
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
