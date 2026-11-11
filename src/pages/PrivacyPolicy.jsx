export default function PrivacyPolicy() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6">
      <header className="animate-fade-up">
        <p className="text-xs font-semibold tracking-[0.18em] text-emerald">PRIVACY POLICY</p>
        <h1 className="mt-2 font-display text-[1.75rem] font-bold tracking-tight text-text">
          보이스피싱 가드 개인정보처리방침
        </h1>
        <p className="mt-2 text-sm text-muted">시행일자: 2026년 11월 (앱 버전 1.0.4 기준)</p>
      </header>

      <main className="animate-fade-up mt-8 space-y-8 text-[14.5px] leading-relaxed text-text">
        <p className="text-muted">
          &apos;보이스피싱 가드&apos;(이하 &apos;본 앱&apos;)는 이용자의 개인정보를 중요하게 생각하며,
          관련 법령을 준수하고 아래와 같은 원칙에 따라 개인정보를 처리합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목 및 처리 방식">
          <p>
            본 앱은 사용자의 <strong>전화번호, 통화 기록(Call Log), SMS(문자 메시지), 연락처</strong>{' '}
            등 개인을 식별할 수 있는 어떠한 정보도 서버로 전송·수집·저장하지 않습니다.
          </p>
          <p>
            보이스피싱 의심 여부에 대한 안전 검사는 전적으로 <strong>기기 내(On-Device)</strong>에서만
            수행되며, 해당 검사 과정이나 결과는 외부 서버로 전송되지 않습니다.
          </p>
        </Section>

        <Section title="2. 수동 문자 분석 기능 안내">
          <p>
            이용자가 화면에 직접 입력(붙여넣기)한 문자 내용에 한해, 위험도 분석을 위해 일시적으로 AI
            분석 서비스에 전송될 수 있습니다. 이 경우에도 전화번호, 연락처 등 개인 식별 정보는 함께
            전송되지 않으며, 분석에 사용된 텍스트는 서버에 저장되지 않고 분석 결과 응답 후 즉시
            폐기됩니다.
          </p>
        </Section>

        <Section title="3. 민감 권한 사용 여부">
          <p>
            본 앱은 버전 1.0.4부터 통화 기록(Call Log), SMS 등 민감 권한을 모두 제거하였습니다. 앱
            구동에 반드시 필요한 최소한의 권한 외에는 어떠한 민감 권한도 요청하거나 사용하지 않습니다.
          </p>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          <p>본 앱은 이용자의 개인정보를 어떠한 경우에도 제3자에게 제공하지 않습니다.</p>
        </Section>

        <Section title="5. 개인정보 처리업무의 위탁">
          <p>본 앱은 개인정보 처리 업무를 외부 업체에 위탁하지 않습니다.</p>
        </Section>

        <Section title="6. 개인정보의 보유 및 파기">
          <p>
            본 앱은 개인을 식별할 수 있는 정보를 수집·저장하지 않으므로, 별도로 보유하거나 파기할
            개인정보가 존재하지 않습니다.
          </p>
        </Section>

        <Section title="7. 아동의 개인정보 보호">
          <p>본 앱은 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 의도적으로 수집하지 않습니다.</p>
        </Section>

        <Section title="8. 개인정보처리방침의 변경">
          <p>
            본 방침은 관련 법령, 정책 또는 서비스 내용 변경에 따라 수정될 수 있으며, 변경 시 본 페이지를
            통해 공지합니다.
          </p>
        </Section>

        <Section title="9. 문의처">
          <p>
            개인정보처리방침과 관련한 문의 사항은 아래 연락처로 문의해 주시기 바랍니다.
          </p>
          <ul className="list-inside list-disc space-y-1 text-muted">
            <li>앱 이름: 보이스피싱 가드</li>
            <li>
              개발자 이메일:{' '}
              <a className="text-blue underline" href="mailto:achromatic662@gmail.com">
                achromatic662@gmail.com
              </a>
            </li>
          </ul>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-[1.05rem] font-semibold text-text">{title}</h2>
      <div className="mt-2 space-y-2 text-muted [&_strong]:text-text">{children}</div>
    </section>
  )
}
