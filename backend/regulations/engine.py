"""Layer 1 — 결정론적 규칙 검사 (빠름 · 무료 · 설명가능).

키워드/정규식 매칭, 필수 문구 존재 여부만 본다.
암시적 위반(예: "면역력 걱정 끝" → 질병 예방 암시)은 여기서 못 잡으며,
그건 Layer 2 (LLM 심의관)의 몫이다 — detect.llm_check 항목이 그 입력이 된다.
"""

import re

from .loader import load_ruleset
from .schema import ComplianceReport, Violation

# 심각도별 감점 가중치
SEVERITY_WEIGHT = {"critical": 40, "major": 15, "minor": 3}


def _first_keyword(original: str, low: str, keywords: list[str]) -> str | None:
    for kw in keywords:
        k = kw.casefold()
        i = low.find(k)
        if i != -1:
            return original[i:i + len(kw)]
    return None


def _first_regex(original: str, patterns: list[str]) -> str | None:
    for p in patterns:
        try:
            m = re.search(p, original, re.IGNORECASE)
        except re.error:
            continue  # 잘못된 정규식은 조용히 건너뜀 (룰셋 검수 실수 방어)
        if m:
            return m.group(0)
    return None


def _score_and_pass(violations: list[Violation]) -> tuple[int, bool]:
    score = 100
    for v in violations:
        score -= SEVERITY_WEIGHT.get(v.severity, 5)
    score = max(0, min(100, score))
    passed = not any(v.severity in ("critical", "major") for v in violations)
    return score, passed


def check(
    text: str,
    country: str = "KR",
    channel: str | None = None,
    extra_banned: list[str] | None = None,
) -> ComplianceReport:
    """생성된 카피를 룰셋에 대조해 ComplianceReport 반환.

    extra_banned: 사용자가 입력한 '금지 표현' (generate.py 의 forbidden_words) 도 함께 검사.
    """
    ruleset = load_ruleset(country)
    original = text or ""
    low = original.casefold()
    violations: list[Violation] = []

    for rule in ruleset.active_rules(channel):
        det = rule.detect

        # require_any_of 가 있으면 "필수 문구 누락" 검사 — 과거엔 category가
        # 정확히 "mandatory_statement"일 때만 동작했지만, kr.yaml처럼 카테고리명이
        # 다양한 룰셋에서도 똑같이 동작하도록 require_any_of 유무로 판단한다.
        if det.require_any_of:
            needles = det.require_any_of
            if not any(n.casefold() in low for n in needles):
                violations.append(Violation(
                    rule_id=rule.id,
                    category=rule.category,
                    severity=rule.severity,
                    matched_text=None,
                    message=f"필수 안내 문구 없음 — {rule.description}",
                    suggestion=rule.fix_hint,
                    source=rule.source,
                ))
            continue

        # prohibited_claim / exaggeration / other
        hit = _first_keyword(original, low, det.keywords) or _first_regex(original, det.regex)
        if hit:
            violations.append(Violation(
                rule_id=rule.id,
                category=rule.category,
                severity=rule.severity,
                matched_text=hit,
                message=rule.description or f"{rule.id} 위반",
                suggestion=rule.fix_hint,
                source=rule.source,
            ))

    for word in (extra_banned or []):
        w = (word or "").strip()
        if w and w.casefold() in low:
            violations.append(Violation(
                rule_id="USER-FORBIDDEN",
                category="prohibited_claim",
                severity="major",
                matched_text=w,
                message=f"사용자 지정 금지 표현 사용: {w}",
                suggestion="해당 표현을 제거하거나 다른 표현으로 대체",
                source="사용자 입력",
            ))

    score, passed = _score_and_pass(violations)

    return ComplianceReport(
        country=ruleset.country,
        passed=passed,
        score=score,
        violations=violations,
        auto_fixed=False,
        checked_layers=["deterministic"],
    )


async def check_full(
    text: str,
    country: str = "KR",
    channel: str | None = None,
    extra_banned: list[str] | None = None,
    use_llm: bool = True,
) -> ComplianceReport:
    """Layer 1(check) + Layer 2(layer2.check_llm) 병합.

    use_llm=False 면 Layer 1만 돈다 (동기 check()와 동일한 결과, 다만 이쪽은
    비동기 함수라 await 필요). Layer 2가 실패해도(OPENAI_API_KEY 없음, 네트워크
    오류, JSON 파싱 실패 등) 예외를 삼키고 Layer 1 결과는 그대로 반환한다 —
    LLM 판정 실패가 결정론적 검사 결과까지 날리면 안 되므로.
    """
    report = check(text, country=country, channel=channel, extra_banned=extra_banned)
    if not use_llm:
        return report

    try:
        from .layer2 import check_llm
        llm_violations = await check_llm(text, country=country, channel=channel)
    except Exception:
        return report  # Layer 2 실패 — checked_layers는 deterministic만 (llm이 "돌았다"고 거짓 표시하면 안 됨)

    existing_ids = {v.rule_id for v in report.violations}
    merged = report.violations + [v for v in llm_violations if v.rule_id not in existing_ids]
    score, passed = _score_and_pass(merged)

    return ComplianceReport(
        country=report.country,
        passed=passed,
        score=score,
        violations=merged,
        auto_fixed=report.auto_fixed,
        checked_layers=["deterministic", "llm"],
    )


if __name__ == "__main__":
    import json
    import sys

    sample = (
        sys.argv[1] if len(sys.argv) > 1
        else "이 영양제는 관절염을 완치시켜 줍니다. 부작용이 전혀 없고 100% 효과를 보장합니다!"
    )
    country = sys.argv[2] if len(sys.argv) > 2 else "KR"
    report = check(sample, country=country)
    print(json.dumps(report.model_dump(), ensure_ascii=False, indent=2))
