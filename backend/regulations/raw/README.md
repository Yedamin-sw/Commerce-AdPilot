# raw/ — 규제 원문 PDF 보관소

**런타임에서 읽지 않는다.** 여기 있는 PDF 는 다음 용도로만 쓴다.

1. `rulesets/*.yaml` 을 만들거나 갱신할 때의 근거 자료 (오프라인 1회 작업)
2. 감사(audit) — "이 룰이 어느 조문에서 나왔나" 추적
3. (나중에) `index/` 청크·임베딩 생성의 원본

## 파일 이름 규칙

```
<국가코드>_<법령/기관>_<주제>.pdf
예) kr_약사법_의약품광고.pdf
    kr_식약처_건강기능식품광고심의기준.pdf
    us_FDA_FTC_supplement_guidance.pdf
    eu_reg_1924_2006.pdf
```

## PDF → 룰셋 추출 절차 (수동, 반자동)

1. `pdfplumber` 또는 `pypdf` 로 텍스트 추출
2. LLM 에 "광고 표현 규칙을 JSON 으로 추출" 요청 (`schema.py` 의 Rule 스키마 형태로)
3. **사람이 검수** — 오탐/과탐, 근거 조문, severity 조정
4. `rulesets/<국가코드>.yaml` 에 확정 반영
5. `source_excerpt` 에 근거 조문 원문 일부를 넣어두면 Layer 2 인용에 재사용 가능

> 추출 스크립트(`scripts/extract_ruleset.py`)는 아직 없음. 지금은 `rulesets/kr.yaml` 처럼
> 손으로 작성한 룰로 시작하고, 룰이 안정된 뒤 자동화한다.

PDF 파일은 용량이 크고 저작권이 있을 수 있으므로 git 에 커밋할지 여부는 프로젝트 정책에 따른다.
(현재 `.gitkeep` 만 추적)
