# 서울 생활 가이드 RAG 챗봇 (Seoul Life Guide RAG)

서울 생활 가이드 PDF를 **벡터 DB(Chroma)**로 만들어두고, 사용자의 질문에 대해 관련 내용을 찾아 **한국어로 답변**해주는 RAG(Retrieval-Augmented Generation) 프로젝트입니다.

- **백엔드**: FastAPI + LangChain + Chroma + OpenAI
- **프론트엔드**: React + Vite (개발 중 `/ask`를 백엔드로 프록시)

---

## 주요 기능

- **PDF 기반 검색(RAG)**: `data/*.pdf`에서 관련 문서 조각을 찾아 답변 생성
- **질문 한국어 지원**: 질문은 한국어로 입력 → 검색 품질을 위해 **영어 검색어로 변환** 후 유사도 검색
- **출처 확인**: 답변에 사용된 **페이지/미리보기**를 함께 반환
- **API 제공**: `POST /ask`로 질의응답 가능 (프론트에서 호출)

---

## 프로젝트 구조(핵심 파일)

- `build_db.py`: `data` 폴더의 PDF를 읽어 **Chroma DB(`chroma_db/`)** 생성
- `ask_db.py`: 저장된 Chroma DB를 불러와 **질문 → 검색 → 답변 생성** 수행
- `app.py`: FastAPI 서버 (`/ask` 엔드포인트)
- `data/`: 원본 PDF를 넣는 폴더 (예: “서울 생활 가이드.pdf”)
- `chroma_db/`: 벡터 DB 저장 폴더 (자동 생성)
- `frontend/`: React/Vite 웹 UI

---

## 실행 준비 (처음 1회)

### 1) 필수 설치

- **Python 3.10+** 권장
- **Node.js 18+** 권장(프론트 실행 시)

### 2) OpenAI API 키 설정

이 프로젝트는 `.env`의 `OPENAI_API_KEY`를 사용합니다.

1. 루트 폴더에 `.env` 파일을 만들고 아래처럼 작성합니다.
2. 값은 본인 키로 채워주세요.

> 보안 주의: `.env`는 절대 커밋하지 마세요(이미 `.gitignore`에 포함되어 있습니다).

```bash
# .env
OPENAI_API_KEY=여기에_본인키
```

---

## 벡터 DB 만들기 (PDF → ChromaDB)

1) `data` 폴더에 PDF를 넣습니다.

- 예: `data/서울_생활_가이드.pdf`

2) 의존성 설치 후 DB를 생성합니다.

```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

python build_db.py
```

정상 실행되면 `chroma_db/` 폴더가 생성됩니다.

---

## 백엔드 실행 (FastAPI)

```bash
.\venv\Scripts\activate
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

- 헬스체크: `GET /`
- 질의응답: `POST /ask`

### `/ask` 요청 예시 (PowerShell)

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8000/ask" `
  -ContentType "application/json" `
  -Body '{"question":"서울에서 쓰레기는 어떻게 버려요?"}'
```

응답에는 보통 아래 값들이 포함됩니다.

- `answer`: 최종 답변(한국어)
- `search_query`: 검색을 위해 변환된 영어 검색어
- `sources`: 참고한 문서 조각(페이지/미리보기)

---

## 프론트엔드 실행 (React/Vite)

프론트는 개발 중에 `/ask`로 호출하면, Vite가 자동으로 `http://127.0.0.1:8000`으로 전달(프록시)하도록 설정되어 있습니다. (`frontend/vite.config.js`)

1) 먼저 **백엔드**를 실행해 둡니다.
2) 새 터미널에서 프론트를 실행합니다.

```bash
cd frontend
npm install
npm run dev
```

이후 브라우저에서 Vite가 안내하는 주소로 접속해 질문을 입력하면 됩니다.

---

## 자주 겪는 문제(트러블슈팅)

### `chroma_db 폴더가 없습니다...`

- 원인: 벡터 DB를 아직 만들지 않음
- 해결: `python build_db.py`를 먼저 실행하세요.

### `data 폴더 안에 PDF 파일이 없습니다.`

- 원인: `data/`에 PDF가 없음
- 해결: `data/`에 `*.pdf`를 넣고 다시 `python build_db.py` 실행

### OpenAI 관련 에러(인증 실패 등)

- 원인: `.env`의 `OPENAI_API_KEY`가 없거나 잘못됨
- 해결: `.env`를 확인하고, 키가 유효한지 점검하세요.

---

## 참고

- 이 프로젝트는 **문서에 없는 내용은 추측하지 않고** “제공된 문서에서 확인하기 어렵습니다.”라고 답하도록 설계되어 있습니다. (RAG의 기본 안전장치)
