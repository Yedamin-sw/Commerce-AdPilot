# 백엔드 서버 실행 방법

---

## 사전 준비

- Python 3.10 이상
- 프로젝트 루트 디렉터리 기준으로 명령어를 실행해야 합니다  
  (`Commerce-AdPilot/` 폴더 안에서 실행)

---

## 1단계 — 패키지 설치

처음 한 번만 실행하면 됩니다.

```bash
pip install -r requirements.txt
```

---

## 2단계 — 환경변수 설정

프로젝트 루트(`Commerce-AdPilot/`)에 `.env` 파일을 만들고 아래 내용을 채웁니다.

```
OPENAI_API_KEY=여기에_OpenAI_키_입력
SUPABASE_URL=여기에_Supabase_프로젝트_URL_입력
SUPABASE_KEY=여기에_Supabase_anon_key_입력
SUPABASE_SERVICE_KEY=여기에_Supabase_service_role_key_입력
```

> **Supabase 키 찾는 방법**  
> Supabase 대시보드 → 프로젝트 선택 → Settings → API  
> - `URL` → `SUPABASE_URL`  
> - `anon public` → `SUPABASE_KEY`  
> - `service_role` → `SUPABASE_SERVICE_KEY`

> ⚠️ `.env` 파일은 절대 GitHub에 올리지 마세요. `.gitignore`에 포함되어 있습니다.

---

## 3단계 — 서버 실행

```bash
uvicorn main:app --reload
```

실행 후 터미널에 아래 메시지가 뜨면 정상입니다.

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

브라우저에서 `http://localhost:8000` 접속 시 아래 응답이 오면 서버가 정상 동작 중입니다.

```json
{"message": "The server is running.."}
```

---

## API 문서 자동 확인 (Swagger)

서버 실행 중에 브라우저에서 아래 주소로 접속하면 모든 API를 직접 테스트해볼 수 있습니다.

```
http://localhost:8000/docs
```

---

## 포트 충돌 시

8000번 포트가 이미 사용 중이라면 다른 포트로 실행합니다.

```bash
uvicorn main:app --reload --port 8001
```

이 경우 프론트엔드의 API 주소도 `http://localhost:8001`로 변경해야 합니다.

---

## 자주 발생하는 오류

| 오류 메시지 | 원인 | 해결 방법 |
|------------|------|----------|
| `KeyError: 'SUPABASE_URL'` | `.env` 파일이 없거나 키가 비어있음 | `.env` 파일 내용 확인 |
| `ModuleNotFoundError` | 패키지 미설치 | `pip install -r requirements.txt` 재실행 |
| `Address already in use` | 8000 포트 사용 중 | `--port 8001` 옵션 추가 |
| `Cannot import name ...` | Python 버전 문제 또는 패키지 충돌 | Python 3.10 이상인지 확인 |

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `main.py` | 서버 진입점, 라우터 등록 위치 |
| `backend/api/auth.py` | 로그인/회원가입 API |
| `backend/api/generate.py` | 광고 문구 생성 API |
| `backend/api/history.py` | 생성 이력 조회/저장 API |
| `backend/api/product.py` | 상품 등록/조회 API |
| `backend/generate.md` | generate API 상세 사용법 |
