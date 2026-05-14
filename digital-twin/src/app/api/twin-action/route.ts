import { NextResponse } from 'next/server'

/**
 * Same-origin proxy for the cross-app command channel. Forwards the POST
 * body unchanged to the main dashboard's /api/twin-action endpoint.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UPSTREAM = process.env.MAIN_APP_URL || 'http://frontend:3000'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const res = await fetch(`${UPSTREAM}/api/twin-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
      },
    })
  } catch (err) {
    console.error('[twin /api/twin-action] proxy error:', err)
    return NextResponse.json(
      { ok: false, error: 'upstream-unavailable' },
      { status: 502 }
    )
  }
}
