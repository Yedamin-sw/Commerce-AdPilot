"""국가별 광고 규제 룰셋 로딩 · 렌더링 · Layer 1 검증.

사용 예:
    from backend.regulations import render_rules, check

    # 생성 전: system prompt 에 주입할 준수사항 블록
    block = render_rules("KR", channel="instagram")

    # 생성 후: 결정론적 규칙 검사
    report = check(generated_text, country="KR", channel="instagram")
    if not report.passed:
        ...  # 교정 루프
"""

from .schema import ComplianceReport, Detect, Rule, Ruleset, Violation
from .loader import available_countries, load_ruleset, reload_rulesets
from .render import render_rules
from .engine import SEVERITY_WEIGHT, check, check_full
from .repair import build_repair_instructions

__all__ = [
    "ComplianceReport",
    "Detect",
    "Rule",
    "Ruleset",
    "Violation",
    "available_countries",
    "load_ruleset",
    "reload_rulesets",
    "render_rules",
    "check",
    "check_full",
    "SEVERITY_WEIGHT",
    "build_repair_instructions",
]
