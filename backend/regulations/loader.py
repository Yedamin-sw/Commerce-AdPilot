"""rulesets/<country>.yaml 을 읽어 Ruleset 으로 파싱하고 메모리에 캐시한다.

런타임은 PDF 를 절대 읽지 않는다. PDF -> 룰셋 추출은 오프라인 1회 작업이고
(raw/ 참고), 서버는 여기서 만들어진 YAML 만 사용한다.

두 가지 YAML 형태를 지원한다:
  1) 기존 평평한 형태 (us.yaml, eu.yaml, kr.yaml 초안) — 최상위에 `rules: [...]`
  2) 문서 기반 중첩 형태 (kr.yaml) — 식약처 가이드라인 원문을 섹션별로 구조화한 것.
     최상위에 `rules` 키가 없고, `drug_advertising.prohibited_rules`,
     `health_functional_food.review_criteria` 처럼 여러 섹션에 규칙이 흩어져 있다.
     이 형태는 severity 가 원문에 없어서(= 우리가 정의해야 함) `_flatten_nested_rules`
     가 카테고리 기준으로 severity 를 매긴다. 원문 자체엔 키워드 목록이 없어서
     대부분의 노드는 `detect.llm_check` 질문만 갖고 있고, 이런 노드는 Layer 2
     (layer2.py, LLM 심의관)만 실제로 검사한다. 다만 일부 노드는 이후 사람이
     `detect.keywords`/`regex`/`require_any_of`를 직접 채워 넣어서 Layer 1
     (키워드/정규식, engine.py)도 같이 잡을 수 있게 했다 — 두 방식은 배타적이지 않고
     한 규칙에 공존 가능(예: DRUG-017): Layer1이 먼저 빠르게 잡고, 놓치면 Layer2가
     의미 기반으로 다시 본다.
"""

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from .schema import Detect, Rule, Ruleset

RULESETS_DIR = Path(__file__).parent / "rulesets"

# 새 kr.yaml 처럼 규칙이 아닌 보조 정보를 담은 최상위 키 — 순회 시 건너뜀
_NON_RULE_TOP_KEYS = {"input_schema", "result_schema", "scoring_policy", "sources", "country"}

# 개별 항목 판정이 아니라 "전체적으로 판단하라"는 심의관용 메타 원칙 — 체크 대상 규칙이 아님
_EXCLUDED_CATEGORIES = {"judgment_principle", "legal_status"}

# 원문(식약처 가이드라인)에는 severity/점수 체계가 없다 — 서비스가 정의해야 한다고 문서 자체가 명시.
# 아래는 카테고리 이름으로 유추한 우리 쪽 판단(초안)이며, 매핑 안 된 나머지는 전부 "major" 기본값.
_SEVERITY_OVERRIDE = {
    "false_or_exaggerated": "critical",
    "disease_implication": "critical",
    "absolute_claim": "critical",
    "safety_overclaim": "critical",
    "consumer_deception": "critical",
    "misuse_abuse": "critical",
    "child_safety": "critical",
    "endangered_species": "critical",
}


def _resolve_source(source_id: str | None, sources_by_id: dict[str, dict]) -> str | None:
    if not source_id:
        return None
    src = sources_by_id.get(source_id)
    if not src:
        return source_id  # 매핑 실패 시 id 라도 남김 (근거 추적 가능하도록)
    label = src.get("name", "")
    meta = ", ".join(p for p in [src.get("issuer"), src.get("date")] if p)
    return f"{label} ({meta})" if meta else label


def _flatten_nested_rules(data: dict[str, Any]) -> list[Rule]:
    """중첩된 kr.yaml 트리를 순회하며 id+category+detect.llm_check 를 가진
    노드만 골라 평평한 Rule 목록으로 만든다."""
    sources_by_id = {
        s["id"]: s for s in (data.get("sources") or []) if isinstance(s, dict) and "id" in s
    }
    rules: list[Rule] = []

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            if "id" in node and "category" in node:
                detect_raw = node.get("detect")
                detect_raw = detect_raw if isinstance(detect_raw, dict) else {}
                llm_check = detect_raw.get("llm_check")
                keywords = detect_raw.get("keywords") or []
                regex = detect_raw.get("regex") or []
                require_any_of = detect_raw.get("require_any_of") or []
                category = node.get("category")
                # llm_check 뿐 아니라 keywords/regex/require_any_of 중 하나라도 있으면
                # 체크 가능한 규칙 — 예전엔 llm_check 없는 노드(예: 광고 표시 의무)가
                # 통째로 드롭됐었음.
                has_detect = bool(llm_check or keywords or regex or require_any_of)
                if has_detect and category not in _EXCLUDED_CATEGORIES:
                    rules.append(Rule(
                        id=node["id"],
                        category=category,
                        severity=_SEVERITY_OVERRIDE.get(category, "major"),
                        description=(node.get("description") or "").strip(),
                        detect=Detect(
                            keywords=list(keywords),
                            regex=list(regex),
                            require_any_of=list(require_any_of),
                            llm_check=llm_check.strip() if llm_check else None,
                        ),
                        source=_resolve_source(node.get("source"), sources_by_id),
                        active=True,
                    ))
            for key, value in node.items():
                if key in _NON_RULE_TOP_KEYS:
                    continue
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(data)
    return rules

# 프론트 토글이 KR/EN 처럼 들어와도 받아주기 위한 별칭
_ALIASES = {
    "kr": "kr", "ko": "kr", "korea": "kr", "한국": "kr",
    "us": "us", "en": "us", "usa": "us", "america": "us", "미국": "us",
    "eu": "eu", "europe": "eu", "유럽": "eu",
}


def _normalize(country: str) -> str:
    code = (country or "KR").strip().lower()
    return _ALIASES.get(code, code)


@lru_cache(maxsize=None)
def load_ruleset(country: str) -> Ruleset:
    """국가 코드에 해당하는 룰셋을 반환. 캐시되므로 반복 호출은 무료."""
    code = _normalize(country)
    path = RULESETS_DIR / f"{code}.yaml"
    if not path.exists():
        raise FileNotFoundError(
            f"규제 룰셋이 없습니다: {path.name} "
            f"(가능한 국가: {', '.join(available_countries()) or '없음'})"
        )
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}

    if "rules" in data:
        return Ruleset.model_validate(data)  # 기존 평평한 형태 (us.yaml, eu.yaml 등)

    # 새 중첩 형태 (kr.yaml) — 트리를 평탄화해서 Ruleset 으로 감싼다.
    sources = data.get("sources") or []
    return Ruleset(
        country=data.get("country", code.upper()),
        version=data.get("version", ""),
        source="; ".join(s.get("name", "") for s in sources if isinstance(s, dict)),
        rules=_flatten_nested_rules(data),
    )


def available_countries() -> list[str]:
    """rulesets/ 에 존재하는 국가 코드 목록 (대문자)."""
    if not RULESETS_DIR.exists():
        return []
    return sorted(p.stem.upper() for p in RULESETS_DIR.glob("*.yaml"))


def reload_rulesets() -> None:
    """YAML 을 수정한 뒤 서버 재시작 없이 반영하고 싶을 때 호출."""
    load_ruleset.cache_clear()
