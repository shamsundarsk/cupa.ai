import { NextResponse } from 'next/server'

// This API route is called by the Digital Twin app (port 3001) to get the current state.
// Since localStorage is per-origin, we expose state via this endpoint.
// The actual state is stored client-side, so this route serves as a CORS-enabled proxy.
// The client will POST state here and GET it from the Digital Twin.

let sharedState: any = null

export async function GET() {
  return NextResponse.json(sharedState || { machines: [], telemetryData: {}, selectedIndustry: null }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    sharedState = body
    return NextResponse.json({ ok: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
