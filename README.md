# VoiceGuard (Vite + React)

Simple & Private Security — 보이스피싱/스미싱 수동 검사 웹앱

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 이 열립니다.

Claude API Key는 `.env`의 `ANTHROPIC_API_KEY`로 관리되며, Vite 개발 서버 프록시(`/api/analyze`)를 통해 호출됩니다. 키는 브라우저 번들에 포함되지 않습니다.
