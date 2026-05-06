import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  // 사용자가 입력하는 질문(textarea 값)
  const [question, setQuestion] = useState('')

  // 요청 중인지(로딩 상태)
  const [isLoading, setIsLoading] = useState(false)

  // 에러 메시지(있으면 화면에 보여줌)
  const [errorMessage, setErrorMessage] = useState('')

  // 백엔드 응답 전체를 그대로 저장(필요한 값: answer, search_query, sources)
  const [result, setResult] = useState(null)

  // 답변 화면에서 “참고문서”를 볼지 여부
  // 기본값은 false: 처음에는 답변만 보여주기
  const [isShowingSources, setIsShowingSources] = useState(false)

  // “서울 현재 시간”을 보여주기 위한 상태
  // 초보자 팁: 시간을 화면에 표시하려면, 시간이 바뀔 때마다 상태도 갱신되어야 합니다.
  const [now, setNow] = useState(() => new Date())

  // 버튼 비활성화 조건(질문이 비었거나, 이미 요청 중이면)
  const isAskDisabled = useMemo(() => {
    return isLoading || question.trim().length === 0
  }, [isLoading, question])

  // 1초마다 시간을 갱신해서 “시계”처럼 보이게 합니다.
  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(new Date())
    }, 1000)

    // 컴포넌트가 사라질 때(페이지 이동 등) 타이머를 정리합니다.
    return () => clearInterval(timerId)
  }, [])

  // 서울 시간으로 보기 좋게 포맷팅합니다.
  // timeZone: 'Asia/Seoul' 을 지정하면, PC 시간대가 달라도 “서울 시간”으로 보여줄 수 있어요.
  const seoulDateText = useMemo(() => {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).format(now)
  }, [now])

  const seoulTimeText = useMemo(() => {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now)
  }, [now])

  async function onAsk() {
    // 버튼을 막아도, 혹시 모르니 한 번 더 방어적으로 체크합니다.
    const trimmed = question.trim()
    if (!trimmed) return

    setIsLoading(true)
    setErrorMessage('')
    setResult(null)
    setIsShowingSources(false) // 새 질문을 하면 다시 “답변 보기”로 돌아가게

    try {
      // 핵심 포인트:
      // - 개발 중에는 Vite 프록시 덕분에 '/ask'로 호출할 수 있습니다.
      // - 백엔드가 이미 CORS 허용(*)이라면 프록시 없이도 동작할 수 있지만,
      //   초보자 입장에서는 프록시를 쓰면 주소가 단순해집니다.
      const response = await fetch('/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: trimmed }),
      })

      // fetch는 4xx/5xx여도 "에러를 던지지" 않으므로 직접 확인해야 합니다.
      if (!response.ok) {
        // 가능하면 서버에서 준 메시지를 같이 보여주기 위해 text를 읽습니다.
        const text = await response.text()
        throw new Error(
          `요청 실패 (HTTP ${response.status})${text ? `: ${text}` : ''}`,
        )
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setErrorMessage(err?.message || '알 수 없는 에러가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function onKeyDown(e) {
    // textarea에서는 엔터가 줄바꿈이 기본입니다.
    // 하지만 Ctrl+Enter(또는 Cmd+Enter)로 빠르게 질문하기를 지원합니다.
    const isEnter = e.key === 'Enter'
    const isSubmitShortcut = (e.ctrlKey || e.metaKey) && isEnter

    if (isSubmitShortcut) {
      e.preventDefault()
      onAsk()
    }
  }

  return (
    <div className="page">
      {/* 큰 소개 영역(Hero Section): 첫 인상/소개/CTA 버튼 */}
      <section className="hero" aria-label="서비스 소개">
        <div className="heroInner">
          <div className="heroText">
            <h1 className="heroTitle">서울 생활 가이드 RAG 챗봇</h1>
            <p className="heroSubtitle">
              서울 생활 가이드 PDF를 기반으로, 질문에 맞는 정보를 찾아
              <strong className="accentText"> 자연스러운 답변</strong>으로 정리해 드립니다.
            </p>

            <div className="heroHint">아래에서 질문을 입력해 보세요.</div>

            <div className="heroBadges" aria-label="서비스 키워드">
              <span className="pill">PDF 기반</span>
              <span className="pill">핵심 정보 검색</span>
              <span className="pill">빠른 답변</span>
            </div>
          </div>

          {/* 오른쪽 시계 카드: 그림 “안에 들어가는” 게 아니라, 한 영역을 차지하는 카드 */}
          <div className="heroVisual">
            <div className="clockCard">
              <div className="clockHeader">
                <span className="dot" aria-hidden="true" />
                <span className="clockLabel">서울 현재 시간</span>
              </div>
              <div className="clockValue">{seoulTimeText}</div>
              <div className="clockSub">{seoulDateText}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 섹션: “질문 입력” + “답변 결과”를 핵심 기능처럼 배치 */}
      <main className="main" id="ask">
        <div className="container">
          <section className="panel">
          <label className="label" htmlFor="question">
            질문 입력
          </label>

          <textarea
            id="question"
            className="textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="예) 서울에서 쓰레기는 어떻게 버려야 해?"
            rows={5}
            spellCheck={false}
          />

          <div className="actions">
            <button
              type="button"
              className="button"
              onClick={onAsk}
              disabled={isAskDisabled}
            >
              질문하기
            </button>
            <div className="hint">
              단축키: <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
            </div>
          </div>

          {isLoading && <div className="loading">답변 생성 중...</div>}

          {errorMessage && (
            <div className="error" role="alert">
              {errorMessage}
            </div>
          )}
          </section>

          <section className="panel">
          <h2 className="sectionTitle">답변</h2>

          {!isLoading && !errorMessage && !result && (
            <div className="empty">
              아직 결과가 없어요. 위에서 질문을 입력하고 “질문하기”를 눌러보세요.
            </div>
          )}

          {/* 답변/참고문서 전환 버튼 (결과가 있을 때만 보여주기) */}
          {result && (
            <div className="resultTabs" role="tablist" aria-label="결과 보기 방식">
              <button
                type="button"
                className={`tabButton ${!isShowingSources ? 'active' : ''}`}
                onClick={() => setIsShowingSources(false)}
                role="tab"
                aria-selected={!isShowingSources}
              >
                답변 보기
              </button>
              <button
                type="button"
                className={`tabButton ${isShowingSources ? 'active' : ''}`}
                onClick={() => setIsShowingSources(true)}
                role="tab"
                aria-selected={isShowingSources}
              >
                참고문서 확인하기
              </button>
            </div>
          )}

          {/* “검색어 변환 결과” 박스 (백엔드가 search_query를 준 경우에만 표시) */}
          {result?.search_query && (
            <div className="searchQueryBox">
              <div className="searchQueryTitle">검색어 변환 결과</div>
              <div className="searchQueryValue">{result.search_query}</div>
            </div>
          )}

          {/* 기본: 답변 보기 */}
          {!isShowingSources && result?.answer && <div className="answer">{result.answer}</div>}

          {/* 버튼을 눌렀을 때만 참고문서(sources) 표시 */}
          {isShowingSources && (
            <div className="sourcesBox">
              {Array.isArray(result?.sources) && result.sources.length > 0 ? (
                <div className="sourceCards">
                  {result.sources.map((src, idx) => (
                    <article className="sourceCard" key={`${src?.page ?? 'p'}-${idx}`}>
                      <div className="sourceCardTop">
                        <span className="sourceChip">
                          {src?.page !== undefined && src?.page !== null
                            ? `페이지 ${src.page}`
                            : '페이지 정보 없음'}
                        </span>
                        <span className="sourceIndex">#{idx + 1}</span>
                      </div>
                      <div className="sourcePreview">{src?.content || ''}</div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  이번 답변에는 참고문서 정보가 없어요.
                </div>
              )}
            </div>
          )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
