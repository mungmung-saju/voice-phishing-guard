import { useMemo, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { analyzeMessage } from './analyze'

function riskMeta(score) {
  if (score >= 70) {
    return { label: '위험', className: 'text-coral border-coral/45 bg-coral/15' }
  }
  if (score >= 40) {
    return { label: '주의', className: 'text-amber border-amber/45 bg-amber/15' }
  }
  return { label: '낮음', className: 'text-emerald border-emerald/45 bg-emerald/15' }
}

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${h}:${m}`
}

function PowerStatus({ active }) {
  return (
    <div
      aria-hidden="true"
      className={`power-toggle relative mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full transition-all duration-500 ease-out ${
        active
          ? 'bg-emerald/10 ring-1 ring-emerald/35 shadow-[0_0_40px_rgba(46,229,157,0.22)]'
          : 'bg-surface-2 ring-1 ring-border shadow-none'
      }`}
    >
      <span
        className={`absolute inset-[10px] rounded-full border transition-all duration-500 ${
          active
            ? 'border-emerald/25 bg-[radial-gradient(circle_at_50%_40%,rgba(46,229,157,0.18),transparent_65%)]'
            : 'border-border/80 bg-[radial-gradient(circle_at_50%_40%,rgba(138,151,168,0.08),transparent_65%)]'
        }`}
      />
      <span
        className={`relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-full border transition-all duration-500 ${
          active
            ? 'border-emerald/50 bg-surface text-emerald shadow-[inset_0_0_20px_rgba(46,229,157,0.15)]'
            : 'border-border bg-bg text-muted'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-8 w-8 transition-all duration-500 ${active ? 'scale-105' : 'scale-100 opacity-80'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path strokeLinecap="round" d="M12 3.5v8" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.2 6.8a6.8 6.8 0 108.6 0"
          />
        </svg>
      </span>
      {active && <span className="power-ring" />}
    </div>
  )
}

function ToggleSwitch({ active, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? '실시간 감지 끄기' : '실시간 감지 켜기'}
      onClick={onToggle}
      className={`toggle-switch relative mt-4 inline-flex h-12 w-[132px] shrink-0 items-center rounded-full border px-1.5 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        active
          ? 'border-emerald/50 bg-emerald shadow-[0_0_24px_rgba(46,229,157,0.35)] focus-visible:ring-emerald'
          : 'border-border bg-surface-2 shadow-none focus-visible:ring-muted'
      }`}
    >
      <span
        className={`pointer-events-none absolute inset-0 flex items-center justify-between px-4 text-[11px] font-bold tracking-[0.14em] transition-opacity duration-300 ${
          active ? 'text-bg/80' : 'text-muted'
        }`}
      >
        <span className={`transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
          ON
        </span>
        <span className={`transition-opacity duration-300 ${active ? 'opacity-0' : 'opacity-100'}`}>
          OFF
        </span>
      </span>

      <span
        className={`toggle-knob relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          active ? 'translate-x-[76px]' : 'translate-x-0'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full transition-colors duration-300 ${
            active ? 'bg-emerald' : 'bg-muted'
          }`}
        />
      </span>
    </button>
  )
}

export default function App() {
  const [protectionActive, setProtectionActive] = useState(true)
  const [input, setInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])

  const statusText = useMemo(() => {
    if (!protectionActive) return '실시간 감지 중단됨'
    if (analyzing) return 'Claude로 위험도 분석 중…'
    return '실시간 감지 작동 중'
  }, [protectionActive, analyzing])

  function toggleProtection() {
    setProtectionActive((prev) => {
      const next = !prev
      if (!next) {
        setError('')
        setAnalyzing(false)
      }
      return next
    })
  }

  async function analyze() {
    if (!protectionActive) {
      setError('실시간 감지가 꺼져 있습니다. 상단 스위치를 켜주세요.')
      return
    }

    const message = input.trim()
    if (!message) {
      setError('분석할 문자를 입력해주세요.')
      return
    }

    setAnalyzing(true)
    setError('')

    try {
      const data = await analyzeMessage(message)

      setResults((prev) => [
        {
          id: `${Date.now()}`,
          message: data.message,
          riskScore: data.risk_score,
          reason: data.reason,
          detectedAt: new Date(),
        },
        ...prev,
      ])
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-[2rem] font-bold tracking-tight text-text">
          VoiceGuard
        </h1>
        <p className="mt-1 text-sm text-muted">Simple & Private Security</p>

        <div
          className={`mt-6 rounded-2xl border px-5 py-6 transition-all duration-500 ${
            protectionActive
              ? 'border-emerald/25 bg-surface shadow-[0_0_0_1px_rgba(46,229,157,0.04)]'
              : 'border-border bg-surface'
          }`}
        >
          <PowerStatus active={protectionActive} />

          <div className="mt-4 flex flex-col items-center text-center">
            <ToggleSwitch active={protectionActive} onToggle={toggleProtection} />

            <div className="mt-4 flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${
                  protectionActive ? 'animate-pulse-dot bg-emerald' : 'bg-muted/70'
                }`}
              />
              <p
                className={`font-display text-lg font-semibold tracking-tight transition-colors duration-500 ${
                  protectionActive ? 'text-emerald' : 'text-muted'
                }`}
              >
                {statusText}
              </p>
              {protectionActive && analyzing && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue/30 border-t-blue" />
              )}
            </div>

            <p
              className={`mt-2 text-[12.5px] leading-relaxed transition-colors duration-500 ${
                protectionActive ? 'text-muted' : 'text-amber/90'
              }`}
            >
              {protectionActive
                ? '보호가 켜져 있습니다. 의심 문자를 바로 검사할 수 있습니다.'
                : '보호 기능이 꺼져 있습니다. 감지를 다시 시작하려면 스위치를 켜주세요.'}
            </p>
          </div>
        </div>
      </header>

      <div
        className="animate-fade-up mt-4 flex items-start gap-2.5 rounded-xl border border-blue/25 bg-blue/10 px-3.5 py-3"
        style={{ animationDelay: '80ms' }}
      >
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-[18px] w-[18px] shrink-0 text-blue"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V7a4.5 4.5 0 10-9 0v3.5M6.75 10.5h10.5v8.25a1.5 1.5 0 01-1.5 1.5H8.25a1.5 1.5 0 01-1.5-1.5V10.5z"
          />
        </svg>
        <p className="text-[12.5px] font-medium leading-relaxed text-text">
          개인정보는 서버에 저장되지 않고 로컬에서 안전하게 처리됩니다
        </p>
      </div>

      <main className="mt-5 flex-1">
        {results.length === 0 ? (
          <div
            className="animate-fade-up flex h-full min-h-52 flex-col items-center justify-center text-center"
            style={{ animationDelay: '120ms' }}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-muted">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3l7 3v5c0 4.5-2.8 7.7-7 9-4.2-1.3-7-4.5-7-9V6l7-3z"
                />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-muted">아직 분석 결과가 없습니다</p>
            <p className="mt-1.5 text-xs text-muted/70">
              {protectionActive
                ? '의심되는 문자 내용을 아래에 붙여넣어 검사하세요'
                : '상단 스위치를 켜면 수동 검사를 사용할 수 있습니다'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {results.map((item, index) => {
              const meta = riskMeta(item.riskScore)
              return (
                <li
                  key={item.id}
                  className="animate-fade-up rounded-2xl border bg-surface p-3.5"
                  style={{
                    animationDelay: `${index * 40}ms`,
                    borderColor:
                      item.riskScore >= 70 ? 'rgba(229, 115, 115, 0.35)' : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-semibold text-text">수동 입력</p>
                    <span
                      className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold ${meta.className}`}
                    >
                      {meta.label} {item.riskScore}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">
                    {item.message}
                  </p>
                  <p
                    className={`mt-2 text-[12.5px] font-medium leading-snug ${
                      item.riskScore >= 70
                        ? 'text-coral'
                        : item.riskScore >= 40
                          ? 'text-amber'
                          : 'text-emerald'
                    }`}
                  >
                    {item.reason}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted/70">
                    {formatTime(item.detectedAt)} · 수동
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <section
        className={`animate-fade-up sticky bottom-0 mt-6 -mx-5 border-t px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6 transition-all duration-500 ${
          protectionActive
            ? 'border-border bg-surface/95'
            : 'border-border/70 bg-surface/80'
        }`}
        style={{ animationDelay: '160ms' }}
      >
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p
            className={`text-sm font-semibold transition-colors duration-500 ${
              protectionActive ? 'text-text' : 'text-muted'
            }`}
          >
            수동 검사
          </p>
          {!protectionActive && (
            <span className="rounded-md bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber">
              보호 꺼짐
            </span>
          )}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          disabled={!protectionActive || analyzing}
          placeholder={
            protectionActive
              ? '의심되는 문자 내용을 붙여넣으세요…'
              : '실시간 감지가 꺼져 있어 입력할 수 없습니다'
          }
          className="w-full resize-none rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-blue disabled:cursor-not-allowed disabled:opacity-45"
        />
        {error && <p className="mt-2 text-xs text-coral">{error}</p>}
        {!protectionActive && !error && (
          <p className="mt-2 text-xs text-amber/90">
            보호 기능이 꺼져 있습니다. 스위치를 켜면 검사를 다시 사용할 수 있습니다.
          </p>
        )}
        <button
          type="button"
          onClick={analyze}
          disabled={!protectionActive || analyzing}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue text-[15px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted disabled:opacity-80"
        >
          {!protectionActive ? (
            '감지 중단됨'
          ) : analyzing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              분석 중…
            </>
          ) : (
            '분석하기'
          )}
        </button>
      </section>
      <Analytics />
    </div>
  )
}
