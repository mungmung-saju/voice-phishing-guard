import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const ANALYSIS_PROMPT =
  '다음 문장을 분석하여 보이스피싱/스미싱 위험도를 0~100 사이 숫자로 평가하고, ' +
  '위험 원인을 한 문장으로 요약하여 JSON 형태로 반환해줘. ' +
  '반환 포맷: {"risk_score": int, "reason": "string"}'

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

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

function claudeApiPlugin(apiKey) {
  return {
    name: 'claude-analyze-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }

        try {
          if (!apiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }))
            return
          }

          const { message } = await readBody(req)
          if (!message || !String(message).trim()) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '분석할 문자를 입력해주세요.' }))
            return
          }

          const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: 256,
              messages: [
                {
                  role: 'user',
                  content: `${ANALYSIS_PROMPT}\n\n분석할 문장:\n${message}`,
                },
              ],
            }),
          })

          const data = await anthropicRes.json()
          if (!anthropicRes.ok) {
            res.statusCode = anthropicRes.status
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: data?.error?.message || 'Claude API 호출에 실패했습니다.',
              }),
            )
            return
          }

          const text = data?.content?.[0]?.text
          if (!text) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Claude 응답이 비어 있습니다.' }))
            return
          }

          const parsed = parseAnalysisJson(text)
          const riskScore = Math.max(0, Math.min(100, Number(parsed.risk_score)))

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              risk_score: riskScore,
              reason: String(parsed.reason),
              message: String(message),
            }),
          )
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.',
            }),
          )
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY

  return {
    base: './',
    plugins: [react(), tailwindcss(), claudeApiPlugin(apiKey)],
    server: {
      port: 5173,
      open: true,
    },
  }
})
