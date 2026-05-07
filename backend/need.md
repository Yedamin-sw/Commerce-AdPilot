# Backend 실행을 위한 추가 필요 사항 (need.md)

프로젝트를 실행하려 시도해본 결과, 현재 `backend/` 폴더를 정상적으로 기동하기 위해 해결해야 할 문제들과 추가로 필요한 항목을 정리합니다.

---

## 1. 치명적 (Critical) — 이 항목을 해결해야 서버가 아예 기동됩니다

### 1-1. `backend/api/product.py` 파일 누락
- `backend/main.py` 3번째 줄:
  ```python
  from backend.api import auth, generate, history, product
  ```
  에서 `product` 모듈을 import 하지만, 실제 `backend/api/` 폴더에는 `product.py` 파일이 존재하지 않습니다.
- 현재 `backend/api/` 안의 실제 파일: `auth.py`, `generate.py`, `history.py`, `loading.py` 뿐입니다.
- 결과: `uvicorn backend.main:app` 실행 시 `ModuleNotFoundError: No module named 'backend.api.product'` 발생.
- **필요 조치**: `backend/api/product.py` 파일을 새로 작성하여 `router = APIRouter()` 객체를 정의해야 함 (상품 관련 엔드포인트 구현 필요).

### 1-2. `backend/main.py` 파일이 중간에 끊겨 있음
- 파일이 아래처럼 중간에서 잘려 있습니다:
  ```python
  @app.get("/")
  def root():
      re      ← 여기서 파일 종료 (23번째 줄)
  ```
- `return` 문이 누락되어 있어, import 시점에는 문법 오류는 아니지만 루트 엔드포인트가 작동하지 않습니다.
- **필요 조치**: `root()` 함수의 구현 완성 필요 (예: `return {"message": "OK"}`).

### 1-3. `.env` 파일이 비어 있음
- 프로젝트 루트의 `.env` 파일이 0바이트로 존재합니다.
- `backend/database.py`에서 아래 환경변수가 **반드시** 필요합니다:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `SUPABASE_SERVICE_KEY`
- `backend/api/generate.py`에서 OpenAI 클라이언트가 사용하는 환경변수:
  - `OPENAI_API_KEY`
- 이 값이 없으면 `database.py` import 시점에 `KeyError`로 서버 기동 실패.
- **필요 조치**: `.env` 파일에 위 4개 키를 채워 넣고, `backend/main.py` 또는 실행 스크립트에서 `python-dotenv`로 로드 필요 (현재 코드에는 `load_dotenv()` 호출이 전혀 없음).

### 1-4. `requirements.txt` 14번째 줄에 깨진 문자(null byte) 포함
- `pip install -r requirements.txt` 실행 시:
  ```
  ERROR: Invalid requirement: '\x00\x00\x00\x00...': Expected package name
  (from line 14 of requirements.txt)
  ```
- 파일 끝에 공백/null 바이트가 섞여 있어 설치가 중단됩니다.
- **필요 조치**: `requirements.txt`에서 14번째 줄 공백/null 문자 정리.

---

## 2. 환경/설정 관련

### 2-1. Python 패키지 미설치
현재 sandbox 환경 기준 아래 패키지가 모두 설치되지 않은 상태입니다 (설치 필요):
- `fastapi`
- `uvicorn[standard]`
- `supabase`
- `openai`
- `pydantic`
- `python-multipart`
- `sqlalchemy`
- `alembic`

다음 패키지만 설치되어 있음: `pandas`, `openpyxl`, `python-dotenv`.

**실행 명령 예시**:
```bash
pip install -r requirements.txt
# 또는 개별 설치
pip install fastapi "uvicorn[standard]" supabase openai pydantic python-multipart sqlalchemy alembic python-dotenv
```

### 2-2. `__init__.py` 파일 부재
- `backend/`, `backend/api/`, `backend/middlewares/` 디렉터리에 `__init__.py` 파일이 없습니다.
- `from backend.api import ...` 같은 패키지 import 문이 동작하려면 각 디렉터리에 빈 `__init__.py` 파일을 두거나, Python 3 네임스페이스 패키지 방식을 확실히 이해하고 사용해야 합니다.
- **필요 조치**: 아래 3개의 빈 파일 추가 권장.
  - `backend/__init__.py`
  - `backend/api/__init__.py`
  - `backend/middlewares/__init__.py`

### 2-3. 실행 위치 명시 필요
- `backend.main:app`은 **프로젝트 루트**(`Commerce-AdPilot/`)에서 실행해야 합니다:
  ```bash
  cd Commerce-AdPilot
  uvicorn backend.main:app --reload --port 8000
  ```
- `backend/` 내부로 `cd` 후 실행하면 `backend.api` import가 실패합니다.
- **필요 조치**: README에 실행 디렉터리 명시.

### 2-4. `alembic.ini`에 DB 비밀번호가 평문 노출
- `alembic.ini` 89번째 줄에 Supabase DB URL과 비밀번호(`adpilotsupabase`)가 평문으로 하드코딩되어 있습니다.
- 저장소가 공개되어 있다면 **보안 사고**입니다.
- **필요 조치**: 해당 값은 `.env` 환경변수로 옮기고 `env.py`에서 읽어오도록 변경. 비밀번호는 즉시 로테이션 권장.

---

## 3. 미구현/빈 파일

### 3-1. `backend/api/history.py`
- POST `/api/history/`에 `# db에 저장해야됨` 주석만 있고 실제 DB 저장 로직 없음.
- Supabase 혹은 SQLAlchemy 모델을 통한 저장 구현 필요.

### 3-2. `backend/api/loading.py`
- 내용이 주석 2줄뿐 (`# 오류/로딩 상태 컴포넌트`, `# 모르겠음`).
- 라우터도 정의되어 있지 않아 사용되지 않는 파일. 제거하거나 구현해야 함.

### 3-3. `backend/middlewares/` 폴더
- 폴더만 있고 파일이 하나도 없음.
- 인증/로깅/에러 핸들링 등의 미들웨어 파일을 추가할 계획이라면 실제 파일 추가 필요.

### 3-4. `backend/README.md`
- 0바이트 빈 파일. 최소한의 실행법/환경변수 설명 문서화 권장.

---

## 4. 데이터베이스 / 마이그레이션

### 4-1. ORM 모델 부재
- `requirements.txt`에 `sqlalchemy`, `alembic`가 있지만 `backend/` 내부에 모델(`models.py`) 파일이 전혀 없음.
- `alembic`의 `env.py`가 참조할 `Base.metadata`가 정의된 파일이 없으면 마이그레이션 자동 생성 불가.
- **필요 조치**: `backend/models.py`(또는 `backend/db/models.py`) 추가 후 `alembic/env.py`에서 `target_metadata`로 연결.

### 4-2. `migrations/`, `alembic/` 두 개의 폴더 공존
- 루트에 `migrations/`와 `alembic/` 폴더가 모두 존재 (둘 다 Alembic 용인 것으로 보임).
- `alembic.ini`의 `script_location`은 `%(here)s/migrations` 로 지정되어 있음 → `alembic/` 폴더는 사용되지 않음.
- **필요 조치**: 둘 중 하나로 통합. 사용하지 않는 폴더는 삭제.

---

## 5. 테스트 관련

### 5-1. 테스트 코드/설정 없음
- `pytest` 등 테스트 프레임워크가 `requirements.txt`에 없음.
- `tests/` 폴더도 없음.
- **필요 조치** (선택):
  - `pip install pytest pytest-asyncio httpx`
  - `backend/tests/` 폴더와 기본 테스트 파일 작성
  - CI에서 `pytest` 자동 실행

---

## 6. 권장 실행 절차 (위 항목 해결 후)

```bash
# 1. 가상환경
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2. 의존성 설치
pip install -r requirements.txt

# 3. .env 파일 생성 (예시)
cat > .env <<'EOF'
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJhbGciOi...
SUPABASE_SERVICE_KEY=eyJhbGciOi...
OPENAI_API_KEY=sk-...
EOF

# 4. DB 마이그레이션 (모델 작성 후)
alembic upgrade head

# 5. 서버 기동 (프로젝트 루트에서)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# 6. Swagger 확인
# http://localhost:8000/docs
```

---

## 요약 체크리스트

- [ ] `backend/api/product.py` 생성 및 라우터 구현
- [ ] `backend/main.py`의 `root()` 함수 완성 (현재 중간 잘림)
- [ ] `.env` 파일에 `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY` 채워 넣기
- [ ] `main.py`(또는 진입점)에서 `load_dotenv()` 호출 추가
- [ ] `requirements.txt` 14번째 줄 null 바이트/공백 정리
- [ ] `backend/__init__.py`, `backend/api/__init__.py`, `backend/middlewares/__init__.py` 추가
- [ ] `alembic.ini`의 평문 DB 비밀번호 제거 → 환경변수화, 비밀번호 로테이션
- [ ] `history.py` DB 저장 로직 구현
- [ ] `loading.py` 삭제 또는 구현
- [ ] ORM 모델 파일(`models.py`) 작성
- [ ] `migrations/` vs `alembic/` 폴더 중복 정리
- [ ] 테스트 프레임워크(`pytest`) 도입 (선택)
- [ ] `backend/README.md` 작성
