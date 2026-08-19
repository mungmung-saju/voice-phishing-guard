# VoiceGuard (Vite + React + Capacitor)

Simple & Private Security — 보이스피싱/스미싱 수동 검사 웹/Android 앱

## 웹 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 이 열립니다.

## Android (Capacitor)

```bash
npm run build
npx cap sync android
npx cap open android
```

또는 한 번에:

```bash
npm run cap:android
```

Android Studio에서 에뮬레이터/실기기로 Run 하세요.

## API Key

`.env` 예시:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...          # 웹 개발 서버 프록시용
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...    # Capacitor Android 빌드용
```

- 웹(`npm run dev`): Vite 프록시(`/api/analyze`)로 호출 → 키가 브라우저에 노출되지 않음
- Android: CapacitorHttp로 Anthropic 직접 호출 → `VITE_` 키가 앱 번들에 포함됨 (배포 시 주의)
