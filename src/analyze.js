import { Capacitor, CapacitorHttp } from '@capacitor/core'

const ANALYSIS_PROMPT =
  '다음 문장을 분석하여 보이스피싱/스미싱 위험도를 0~100 사이 숫자로 평가하고, ' +
  '위험 원인을 한 문장으로 요약하여 JSON 형태로 반환해줘. ' +
  '반환 포맷: {"risk_score": int, "reason": "string"}'

function parseAnalysisJson(text) {
  let cleaned = text.trim()
  const fence = /```(?:json)?\s*([\s\S]*?)\s*```/
  const match = cleaned.match(fence)
  if (match) cleaned = match[1].trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('JSON 형식을 파싱할 수 없습니다.')
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1))
  if (parsed.risk_score === undefined || parsed.reason === undefined) {
    throw new Error('필수 필드(risk_score, reason)가 없습니다.')
  }
  return parsed
}

async function analyzeOnNative(message) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY가 설정되지 않았습니다.')
  }

  const response = await CapacitorHttp.post({
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    data: {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `${ANALYSIS_PROMPT}\n\n분석할 문장:\n${message}`,
        },
      ],
    },
  })

  if (response.status < 200 || response.status >= 300) {
    const errMsg =
      response.data?.error?.message ||
      (typeof response.data === 'string' ? response.data : null) ||
      'Claude API 호출에 실패했습니다.'
    throw new Error(errMsg)
  }

  const text = response.data?.content?.[0]?.text
  if (!text) throw new Error('Claude 응답이 비어 있습니다.')

  const parsed = parseAnalysisJson(text)
  return {
    message,
    risk_score: Math.max(0, Math.min(100, Number(parsed.risk_score))),
    reason: String(parsed.reason),
  }
}

async function analyzeOnWeb(message) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '분석에 실패했습니다.')
  }
  return data
}

export async function analyzeMessage(message) {
  if (Capacitor.isNativePlatform()) {
    return analyzeOnNative(message)
  }
  return analyzeOnWeb(message)
}
