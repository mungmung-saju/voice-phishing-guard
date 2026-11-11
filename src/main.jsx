import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import './index.css'

// 라우터 라이브러리 없이 경로만으로 분기합니다.
// '/privacy' (및 '/privacy/', '/privacy.html')로 접속 시 메인 랜딩으로
// 리다이렉트하지 않고 개인정보처리방침 페이지를 그대로 렌더링합니다.
const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
const isPrivacyRoute = pathname === '/privacy' || pathname === '/privacy.html'

createRoot(document.getElementById('root')).render(
  <StrictMode>{isPrivacyRoute ? <PrivacyPolicy /> : <App />}</StrictMode>,
)
