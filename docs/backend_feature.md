# 백엔드 구현 기능 (Backend Feature)

## 1. 제품 정보 입력 API
- POST /api/product
- 입력: productName, category, features, targetCustomer, style
- MVP: 이미지 업로드 미지원(텍스트만)

## 2. 콘텐츠 생성 API
- POST /api/generate
- 타입: 광고(짧은/긴), 제품 설명, SNS 포스트, 해시태그
- OpenAI GPT 호출, 타임아웃 10초, 실패 재시도 옵션
- 반환: generationId, createdAt, generatedText

## 3. 콘텐츠 편집/저장 API
- PUT /api/history/{id} (수정 저장)
- GET /api/history (목록 조회)
- GET /api/history/{id} (상세 조회)

## 4. 사용자 계정 및 인증
- Supabase Auth 연동 (JWT 검증 미들웨어)
- POST /api/auth/signup, /api/auth/login, /api/auth/logout
- 사용자별 생성 이력 연결 (외래키)

## 5. 보안 및 비기능 요구
- 데이터 암호화: 사용자 데이터 및 생성 콘텐츠 암호화 저장
- GDPR 대응: 삭제 요청, 보존 정책
- API 키: 환경변수 관리, 로그 노출 금지
- 로깅/모니터링: 요청/오류/비용 추적

## 6. 기술 스택
- FastAPI + Python
- PostgreSQL + SQLAlchemy
- OpenAI GPT 또는 대체 모델
- Docker, AWS/GCP, CI/CD
