import { NextResponse } from 'next/server'

/**
 * Liveness probe used by docker-compose healthcheck and by the reverse
 * proxy if you wire one up. Always returns 200 — if the Next.js server
 * can answer at all, the container is alive.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ ok: true, service: 'digital-twin' })
}
