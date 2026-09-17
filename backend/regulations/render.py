"""룰셋 -> system prompt 에 주입할 '필수 준수사항' 텍스트 블록.

generate.py build_prompt 의 하드코딩된 '의약품 광고 필수 준수사항' 블록을
render_rules(country, channel) 결과로 교체하기 위한 것.
"""

from .loader import load_ruleset


def _examples(rule) -> str:
    """규칙에서 사람이 읽을 예시 표현을 뽑아 '(예: ...)' 형태로."""
    samples = list(rule.detect.keywords) or list(rule.detect.require_any_of)
    if not samples:
        samples = [p.replace("\\s*", " ").replace("\\b", "") for p in rule.detect.regex]
    samples = [s for s in samples if s][:6]
    return f" (예: {', '.join(samples)})" if samples else ""


def render_rules(country: str = "KR", channel: str | None = None) -> str:
    """해당 국가/채널의 규제 요약 블록을 문자열로 반환."""
    rs = load_ruleset(country)
    rules = rs.active_rules(channel)

    prohibited = [r for r in rules if r.category == "prohibited_claim"]
    exaggeration = [r for r in rules if r.category == "exaggeration"]
    mandatory = [r for r in rules if r.category == "mandatory_statement"]
    other = [r for r in rules if r.category not in
             ("prohibited_claim", "exaggeration", "mandatory_statement")]

    lines: list[str] = []
    lines.append(f"광고 표현 필수 준수사항 [{rs.country} · v{rs.version or 'n/a'}]")
    if rs.source:
        lines.append(f"근거: {rs.source}")

    if prohibited:
        lines.append("\n■ 금지 표현 — 사용 시 심의 반려")
        for r in prohibited:
            lines.append(f"  - {r.description}{_examples(r)}")

    if exaggeration:
        lines.append("\n■ 과장·단정 표현 금지")
        for r in exaggeration:
            lines.append(f"  - {r.description}{_examples(r)}")

    if mandatory:
        lines.append("\n■ 반드시 포함할 안내 문구")
        for r in mandatory:
            need = " / ".join(r.detect.require_any_of[:4])
            lines.append(f"  - {r.description}" + (f" (다음 중 하나 포함: {need})" if need else ""))

    if other:
        lines.append("\n■ 기타 주의")
        for r in other:
            lines.append(f"  - {r.description}{_examples(r)}")

    return "\n".join(lines)


if __name__ == "__main__":
    import sys

    print(render_rules(sys.argv[1] if len(sys.argv) > 1 else "KR",
                       sys.argv[2] if len(sys.argv) > 2 else None))
