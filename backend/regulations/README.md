# backend/regulations — 국가별 광고 규제 룰셋

PDF 를 매 요청에 넣지 않는다. **오프라인 1회**로 구조화된 룰셋(YAML)을 만들어 두고,
런타임은 그 YAML 만 읽는다.

```
regulations/
  raw/        # 원본 PDF — 런타임 미사용, 룰셋 작성/감사용 (README 참고)
  rulesets/   # kr.yaml, us.yaml, eu.yaml — 실제로 로딩되는 룰
  index/      # (미구현) Layer 2 근거 인용용 청크·벡터
  schema.py   # 룰셋/검증결과 pydantic 모델
  loader.py   # rulesets/*.yaml 로딩 + 캐시
  render.py   # 룰셋 -> system prompt 주입용 '준수사항' 텍스트
  engine.py   # Layer 1 결정론적 규칙 검사 -> ComplianceReport
```

## 빠른 사용

```python
from backend.regulations import render_rules, check

# 1) 생성 전 — system prompt 에 주입
block = render_rules("KR", channel="instagram")

# 2) 생성 후 — 결정론적 검사
report = check(generated_text, country="KR", channel="instagram",
               extra_banned=["완치", "부작용 없음"])   # 사용자 금지어도 같이 검사

report.passed      # critical/major 0건이면 True
report.score       # 100 - 가중 감점
report.violations  # [{rule_id, category, severity, matched_text, message, suggestion, source}]
```

## CLI 로 확인

```bash
cd backend
python -m backend.regulations.render KR instagram
python -m backend.regulations.engine "관절염을 완치시켜 줍니다. 부작용이 전혀 없어요!" KR
```

## 검증 2단계 구조

| 레이어 | 위치 | 방식 | 잡는 것 |
|--------|------|------|---------|
| Layer 1 | `engine.check()` | 키워드 / 정규식 / 필수문구 | 명시적 위반 ("완치", "100%", 상담문구 누락) |
| Layer 2 | *(미구현)* | LLM 심의관, `detect.llm_check` 를 질문으로 | 암시적 위반 ("면역력 걱정 끝" → 질병예방 암시) |

## 룰셋 스키마 (rulesets/*.yaml)

```yaml
country: KR
version: "2025-01"
source: "약사법 제68조 ..."
rules:
  - id: KR-DISEASE-CLAIM
    category: prohibited_claim      # prohibited_claim | exaggeration | mandatory_statement | other
    severity: critical             # critical | major | minor
    description: "질병 치료·예방 표방 금지"
    detect:
      keywords: ["완치", "치료"]           # 부분 문자열 (대소문자 무시)
      regex: ['100\s*%']                   # 정규식 (IGNORECASE)
      require_any_of: ["약사와 상담"]      # mandatory_statement 전용: 이 중 하나 없으면 위반
      llm_check: "이 문구가 ...?"          # Layer 2 판정용 질문 (Layer 1 은 무시)
    fix_hint: "효능은 식약처 인정 범위로만"
    source: "약사법 제68조"
    source_excerpt: "..."                  # 근거 조문 원문 일부 (Layer 2 인용용)
    channels: ["instagram", "facebook"]   # 비면 전 채널, 채우면 해당 채널만
    active: true
```

## ⚠️ 주의

`rulesets/*.yaml` 의 현재 룰은 **손으로 만든 초안(heuristic)**이다.
실제 서비스 적용 전 법무 / 약사 / 광고심의 담당의 검수가 필요하다.

## 아직 안 한 것 (다른 파일 수정 필요 — 별도 승인 후)

- `generate.py build_prompt` 의 하드코딩된 "의약품 광고 필수 준수사항" 블록을
  `render_rules(country, channel)` 로 교체
- `POST /api/compliance/validate` 라우터 + `main.py` 등록
- Layer 2 (LLM 심의관), 자동 교정 루프
- `requirements.txt` 에 `pyyaml` 명시 (현재 venv 에는 설치돼 있음)
- PDF → 룰셋 추출 스크립트 (`scripts/extract_ruleset.py`)
