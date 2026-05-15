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

  // Read API key at request time — avoids Next.js build-time dead-code elimination.
  // Supports both OpenAI and Groq (OpenAI-compatible API).
  const apiKey = process.env['OPENAI_API_KEY'] || process.env['GROQ_API_KEY'] || ''
  const model = process.env['OPENAI_MODEL'] || process.env['GROQ_MODEL'] || 'llama-3.3-70b-versatile'
  const baseUrl = process.env['AI_BASE_URL'] || (
    process.env['GROQ_API_KEY'] ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1'
  )

  try {
    const { data, source } = await generateIndustry({ name, requirements, machineCount }, apiKey, model, baseUrl)
    return NextResponse.json({ industry: data, source })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
