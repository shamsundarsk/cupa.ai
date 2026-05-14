import { NextResponse } from 'next/server'

/**
 * Same-origin proxy: the browser fetches /api/state from this app, and we
 * forward to the main dashboard server-side. Reading MAIN_APP_URL at runtime
 * (not NEXT_PUBLIC_*) means the upstream URL can change without rebuilding
 * the client bundle.
 *
 * Defaults to the docker service name "frontend" so the proxy works out of
 * the box on docker-compose. Override with MAIN_APP_URL for other layouts.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UPSTREAM = process.env.MAIN_APP_URL || 'http://frontend:3000'

const EMPTY_STATE = {
  machines: [],
  telemetryData: {},
  selectedIndustry: null,
  simulation: { status: 'idle', key: null, startTime: null, tickRate: 1000 },
  customIndustries: [],
}

export async function GET() {
  try {
    const res = await fetch(`${UPSTREAM}/api/state`, { cache: 'no-store' })
    if (!res.ok) {
      // Upstream up but unhappy — return an empty default so the twin UI
      // doesn't flap into the connection-error screen.
      return NextResponse.json(EMPTY_STATE, { status: 200 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    // Upstream unreachable — log server-side and return an empty default.
    console.error('[twin /api/state] proxy error:', err)
    return NextResponse.json(EMPTY_STATE, { status: 200 })
  }
}
