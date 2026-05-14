import { NextResponse } from 'next/server'
import { generateIndustry, GenerateIndustryInput } from '@/lib/ai/industryGenerator'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: GenerateIndustryInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = (body?.name || '').toString().trim()
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Industry name is required (min 2 chars).' }, { status: 400 })
  }

  // Cap requirement length to avoid abuse / accidental huge prompts.
  const requirements = (body?.requirements || '').toString().slice(0, 2000) || undefined
  const machineCount =
    typeof body?.machineCount === 'number' && body.machineCount > 0
      ? Math.min(12, Math.floor(body.machineCount))
      : undefined

  try {
    const { data, source } = await generateIndustry({ name, requirements, machineCount })
    return NextResponse.json({ industry: data, source })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
