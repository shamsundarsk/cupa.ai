import { NextResponse } from 'next/server'

/**
 * Cross-origin command channel.
 *
 * The digital-twin app (port 3001) cannot mutate the main app's Zustand
 * store directly, so it POSTs intents here. The intents are stored in a
 * tiny in-memory queue that the main app drains on its next tick — see
 * the StateSync component, which forwards the queue to the store and
 * applies side effects (alerts, hazard injection, etc.).
 *
 * Supported actions:
 *   - { type: 'inject_hazard' }
 *   - { type: 'reset_alerts' }
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface QueuedAction {
  id: string
  type: 'inject_hazard' | 'reset_alerts' | 'tune_machine'
  ts: number
  payload?: any
}

const queue: QueuedAction[] = []
const MAX_QUEUE = 32

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const type = body?.type
    if (type !== 'inject_hazard' && type !== 'reset_alerts' && type !== 'tune_machine') {
      return NextResponse.json({ error: 'Unsupported action type' }, { status: 400, headers: CORS })
    }
    const action: QueuedAction = {
      id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      ts: Date.now(),
      payload: body?.payload,
    }
    queue.push(action)
    while (queue.length > MAX_QUEUE) queue.shift()
    return NextResponse.json({ ok: true, id: action.id }, { headers: CORS })
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS })
  }
}

export async function GET() {
  // Drain the queue. The main app polls this endpoint and applies the
  // returned actions. After draining, the queue is cleared.
  const drained = queue.splice(0, queue.length)
  return NextResponse.json({ actions: drained }, { headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
