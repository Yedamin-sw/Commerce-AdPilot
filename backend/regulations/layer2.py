"""Layer 2 — LLM 심의관 (의미 기반, Layer 1이 못 잡는 암시적 위반).

Layer 1(engine.py)은 키워드/정규식/필수문구만 본다. kr.yaml의 새 룰 대부분은
"허가사항을 벗어났는가", "객관적 근거가 있는가" 같은 판단이 필요한
detect.llm_check 질문만 갖고 있고 keywords/regex가 없어서 Layer 1은 그냥
지나친다. 이 모듈이 그 llm_check 질문들을 실제로 LLM에 물어서 위반 여부를 판정한다.

규칙 하나하나 따로 호출하지 않는다 — 국가의 llm_check 보유 규칙 전체를
system prompt 하나에 목록으로 넣고, 한 번의 호출로 전부 판정받는다
(요청 1건당 OpenAI 호출 1회만 추가됨).
"""

import json

from .loader import load_ruleset
from .schema import Rule, Violation

MODEL = "gpt-4o"


def checkable_rules(country: str = "KR", channel: str | None = None) -> list[Rule]:
    """llm_check 질문을 가진(=Layer 2 대상인) 활성 규칙만."""
    ruleset = load_ruleset(country)
    return [r for r in ruleset.active_rules(channel) if r.detect.llm_check]


def build_judge_prompt(rules: list[Rule]) -> str:
    lines = [
        "당신은 한국 식약처 기준의 의약품·건강기능식품 광고 심의관입니다.",
        "아래 광고 카피 한 건이 규칙 목록의 각 항목을 위반하는지 판단하세요.",
        "판단 원칙: 문구 하나만 떼어서 보지 말고, 광고 전체의 맥락과 "
        "보통의 주의력을 가진 일반 소비자가 받는 전체적·궁극적 인상을 함께 고려하세요.",
        "근거가 불명확하면 무리하게 위반으로 판정하지 말고 triggered=false로 두세요.",
        "",
        "규칙 목록:",
    ]
    for r in rules:
        lines.append(f"- [{r.id}] {r.description} → 질문: {r.detect.llm_check}")
    lines.append("")
    lines.append(
        "다음 JSON 형식으로만 응답하세요 (다른 설명 금지):\n"
        '{"results": ['
        '{"rule_id": "규칙 id", "triggered": true|false, "confidence": 0~1 사이 숫자, '
        '"evidence": "위반 근거가 된 카피 내 문구 (없으면 빈 문자열)", '
        '"reason": "판단 이유 한 줄", '
        '"suggestion": "위반이면 수정 제안 한 줄 (아니면 빈 문자열)"}, ...'
        ']}\n'
        "규칙 목록에 있는 모든 rule_id에 대해 빠짐없이 하나씩 응답하세요."
    )
    return "\n".join(lines)


def _parse_results(raw: str, rules_by_id: dict[str, Rule]) -> list[Violation]:
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []

    items = data.get("results") if isinstance(data, dict) else None
    if not isinstance(items, list):
        return []

    violations: list[Violation] = []
    for item in items:
        if not isinstance(item, dict) or not item.get("triggered"):
            continue
        rule = rules_by_id.get(item.get("rule_id"))
        if not rule:
            continue  # 모델이 목록에 없는 rule_id를 지어내면 무시
        evidence = (item.get("evidence") or "").strip()
        violations.append(Violation(
            rule_id=rule.id,
            category=rule.category,
            severity=rule.severity,
            matched_text=evidence or None,
            message=(item.get("reason") or "").strip() or rule.description,
            suggestion=(item.get("suggestion") or "").strip() or rule.fix_hint,
            source=rule.source,
        ))
    return violations


async def check_llm(
    text: str,
    country: str = "KR",
    channel: str | None = None,
    client=None,
) -> list[Violation]:
    """text를 Layer 2 대상 규칙 전체에 대조해 위반 목록을 반환.
    규칙이 없거나 텍스트가 비었으면 호출 없이 빈 목록. 실패해도 예외를 던지지 않고
    빈 목록을 반환한다 — Layer 2가 죽어도 Layer 1 결과까지 잃으면 안 되므로
    (호출부인 engine.check_full 에서 그렇게 감싸 쓴다)."""
    rules = checkable_rules(country, channel)
    if not rules or not (text or "").strip():
        return []

    if client is None:
        from backend.middlewares.openai import _create_client
        client = _create_client()

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": build_judge_prompt(rules)},
            {"role": "user", "content": f"광고 카피:\n{text}"},
        ],
        temperature=0,
        response_format={"type": "json_object"},
        max_tokens=3000,
    )
    raw = response.choices[0].message.content or "{}"
    rules_by_id = {r.id: r for r in rules}
    return _parse_results(raw, rules_by_id)
