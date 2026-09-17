# index/ — (미구현) Layer 2 근거 인용용 청크·벡터

지금은 **비어 있고, 만들지 않아도 된다.**

## 언제 필요해지나

Layer 2 (LLM 심의관) 가 판정 결과에 "근거 조문"을 인용해야 할 때만 필요하다.
그것도 다음 순서로 검토한다.

1. **1순위 — RAG 없이**: `rulesets/*.yaml` 의 `rule.source` / `rule.source_excerpt` 필드에
   근거 조문을 직접 박아두면 대부분 충분하다. 국가별 룰이 10~30개 수준이면 벡터 검색은 과하다.
2. **2순위 — 그래도 원문 검색이 필요하면**: `raw/` PDF 를 청크로 잘라 여기에 저장.
   - `chunks.jsonl` : `{id, country, source, page, text}`
   - `embeddings.npy` 또는 sqlite-vec / faiss 인덱스
   - Layer 2 가 `rule_id` 로 관련 청크 top-k 를 가져와 프롬프트에 붙인다.

## 규칙

- 런타임 로더(`loader.py`)는 이 폴더를 참조하지 않는다. 별도 모듈에서만 사용.
- 생성된 인덱스 산출물은 재현 가능하므로 git 에 넣지 않는 편이 좋다 (현재 `.gitkeep` 만 추적).
